"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { moderateContent } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

/**
 * Creates a new community helper request.
 */
export async function createCommunityRequestAction(data: {
  title: string;
  description: string;
  category: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.locationId) {
    throw new Error("Location not set. Please complete onboarding first.");
  }

  // AI Moderation
  const moderation = await moderateContent(`${data.title} ${data.description}`);
  if (moderation.status === "FLAGGED_TOXIC") {
    throw new Error(`Content blocked: ${moderation.reason}`);
  }

  const request = await db.communityRequest.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      authorId: userId,
      locationId: user.locationId,
      status: "OPEN",
    },
  });

  revalidatePath("/requests");
  return { success: true, request };
}

/**
 * Marks a community request as resolved.
 */
export async function resolveCommunityRequestAction(requestId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const request = await db.communityRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("Request not found");
  if (request.authorId !== userId) throw new Error("Unauthorized");

  await db.communityRequest.update({
    where: { id: requestId },
    data: { status: "RESOLVED" },
  });

  revalidatePath("/requests");
  return { success: true };
}

/**
 * Comments on a community request.
 */
export async function commentOnRequestAction(requestId: string, content: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // AI Moderation
  const moderation = await moderateContent(content);
  if (moderation.status === "FLAGGED_TOXIC") {
    throw new Error(`Comment blocked: ${moderation.reason}`);
  }

  const comment = await db.requestComment.create({
    data: {
      requestId,
      authorId: userId,
      content,
    },
  });

  // Notify request author if commenting on their request
  const request = await db.communityRequest.findUnique({
    where: { id: requestId },
    select: { authorId: true, title: true },
  });

  if (request && request.authorId !== userId) {
    await db.notification.create({
      data: {
        userId: request.authorId,
        type: "COMMENT",
        title: "New reply to your request",
        body: `Someone replied to: "${request.title}"`,
      },
    });
  }

  revalidatePath("/requests");
  return { success: true, comment };
}

/**
 * Creates a lost or found item alert.
 */
export async function createLostAndFoundAction(data: {
  title: string;
  description: string;
  imageUrl?: string;
  type: string; // LOST or FOUND
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.locationId) {
    throw new Error("Location not set. Please complete onboarding first.");
  }

  // AI Moderation
  const moderation = await moderateContent(`${data.title} ${data.description}`);
  if (moderation.status === "FLAGGED_TOXIC") {
    throw new Error(`Content blocked: ${moderation.reason}`);
  }

  const item = await db.lostAndFound.create({
    data: {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl || null,
      type: data.type,
      authorId: userId,
      locationId: user.locationId,
      status: "ACTIVE",
    },
  });

  revalidatePath("/lost-found");
  return { success: true, item };
}

/**
 * Resolves a lost & found item.
 */
export async function resolveLostAndFoundAction(itemId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const item = await db.lostAndFound.findUnique({
    where: { id: itemId },
  });

  if (!item) throw new Error("Item not found");
  if (item.authorId !== userId) throw new Error("Unauthorized");

  await db.lostAndFound.update({
    where: { id: itemId },
    data: { status: "RESOLVED" },
  });

  revalidatePath("/lost-found");
  return { success: true };
}
