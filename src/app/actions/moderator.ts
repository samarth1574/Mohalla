"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Checks if the caller is an admin or moderator.
 */
async function checkIsModeratorOrAdmin(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN" || user?.role === "MODERATOR";
}

/**
 * Updates a content item's moderation status.
 */
export async function updateContentModerationStatusAction(data: {
  targetType: "POST" | "LISTING";
  targetId: string;
  status: "APPROVED" | "QUARANTINED" | "FLAGGED_TOXIC" | "FLAGGED_SPAM" | "FLAGGED_SCAM";
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const isMod = await checkIsModeratorOrAdmin(userId);
  if (!isMod) throw new Error("Unauthorized: Only moderators can update content review status.");

  if (data.targetType === "POST") {
    await db.post.update({
      where: { id: data.targetId },
      data: { moderationStatus: data.status },
    });
  } else if (data.targetType === "LISTING") {
    await db.marketplaceListing.update({
      where: { id: data.targetId },
      data: { moderationStatus: data.status },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/feed");
  revalidatePath("/marketplace");
  return { success: true };
}

/**
 * Resolves or dismisses a report filed by a resident.
 */
export async function resolveReportAction(reportId: string, action: "DISMISS" | "RESOLVE") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const isMod = await checkIsModeratorOrAdmin(userId);
  if (!isMod) throw new Error("Unauthorized: Only moderators can resolve reports.");

  await db.report.update({
    where: { id: reportId },
    data: { status: action === "RESOLVE" ? "RESOLVED" : "DISMISSED" },
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Creates a report against content.
 */
export async function createReportAction(data: {
  reportedUserId?: string;
  targetType: string;
  targetId: string;
  reason: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const report = await db.report.create({
    data: {
      reporterId: userId,
      reportedUserId: data.reportedUserId || null,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      status: "PENDING",
    },
  });

  revalidatePath("/admin");
  return { success: true, reportId: report.id };
}
