"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendMulticastNotification, sendSingleNotification } from "@/lib/fcm";

/**
 * Triggers an emergency SOS broadcast to the entire local neighborhood.
 */
export async function triggerEmergencySOSAction(data: {
  title: string;
  description: string;
  category: "MEDICAL" | "BLOOD_DONATION" | "MISSING_PERSON" | "SAFETY_ALERT" | "ACCIDENT" | "WOMEN_SAFETY" | "NATURAL_DISASTER";
  latitude?: number;
  longitude?: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.locationId) {
    throw new Error("Location not set. Complete onboarding first.");
  }

  // 1. Create the Emergency SOS Entry
  const sos = await db.emergencySOS.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      status: "ACTIVE",
      authorId: userId,
      locationId: user.locationId,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    },
  });

  // 2. Cross-post automatically into the main community feed
  await db.post.create({
    data: {
      authorId: userId,
      content: `⚠️ EMERGENCY [${data.category}]: ${data.title}\n\n${data.description}`,
      postType: "EMERGENCY",
      emergencyCat: data.category,
      locationId: user.locationId,
      societyId: user.societyId || undefined,
      moderationStatus: "APPROVED", // emergencies bypass spam filters for safety
    },
  });

  // 3. Send notifications to all residents in the location pincode
  const localNeighbors = await db.user.findMany({
    where: {
      locationId: user.locationId,
      id: { not: userId }, // exclude self
    },
    select: { id: true, fcmToken: true },
  });

  const notificationData = localNeighbors.map((neighbor) => ({
    userId: neighbor.id,
    type: "EMERGENCY_ALERT" as any,
    title: `🚨 EMERGENCY: ${data.category}`,
    body: `${user.name || "A neighbor"} is requesting urgent help: ${data.title}`,
    payload: { sosId: sos.id },
  }));

  if (notificationData.length > 0) {
    await db.notification.createMany({
      data: notificationData,
    });
  }

  // 4. Send FCM push notifications to neighbors with tokens
  const fcmTokens = localNeighbors
    .map(n => n.fcmToken)
    .filter((token): token is string => token !== null);

  if (fcmTokens.length > 0) {
    await sendMulticastNotification(fcmTokens, {
      title: `🚨 EMERGENCY: ${data.category}`,
      body: `${user.name || "A neighbor"} needs urgent help: ${data.title}`,
      data: { sosId: sos.id }
    });
  }

  revalidatePath("/emergency");
  revalidatePath("/feed");
  return { success: true, sosId: sos.id };
}

/**
 * Registers the current user as a responder volunteer for an active SOS.
 */
export async function volunteerForSOSAction(sosId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existingVolunteer = await db.emergencyVolunteer.findUnique({
    where: {
      sosId_userId: {
        sosId,
        userId,
      },
    },
  });

  if (existingVolunteer) {
    throw new Error("You are already registered as a volunteer responder for this SOS.");
  }

  const volunteer = await db.emergencyVolunteer.create({
    data: {
      sosId,
      userId,
    },
  });

  // Reward points / boost trust score for emergency response
  const user = await db.user.update({
    where: { id: userId },
    data: {
      trustScore: { increment: 50 },
      points: { increment: 100 },
      badges: {
        push: "EMERGENCY_HERO",
      },
    },
  });

  // Notify the SOS creator
  const sos = await db.emergencySOS.findUnique({
    where: { id: sosId },
    include: { author: { select: { fcmToken: true } } },
  });

  if (sos && sos.authorId !== userId) {
    await db.notification.create({
      data: {
        userId: sos.authorId,
        type: "EMERGENCY_ALERT",
        title: "Volunteer Responder En-Route!",
        body: `${user.name || "A neighbor"} has volunteered to respond to your SOS: "${sos.title}"`,
      },
    });

    // Send FCM push notification to SOS creator
    if (sos.author.fcmToken) {
      await sendSingleNotification(sos.author.fcmToken, {
        title: "Volunteer En-Route!",
        body: `${user.name || "A neighbor"} is responding to your SOS`,
        data: { sosId }
      });
    }
  }

  revalidatePath("/emergency");
  return { success: true };
}

/**
 * Posts an official update in the Emergency crisis timeline.
 */
export async function addEmergencyUpdateAction(sosId: string, content: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const update = await db.emergencyUpdate.create({
    data: {
      sosId,
      authorId: userId,
      content,
    },
  });

  revalidatePath("/emergency");
  return { success: true, update };
}

/**
 * Resolves an active emergency.
 */
export async function resolveEmergencySOSAction(sosId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const sos = await db.emergencySOS.findUnique({
    where: { id: sosId },
  });

  if (!sos) throw new Error("Emergency not found.");
  if (sos.authorId !== userId) throw new Error("Unauthorized.");

  await db.emergencySOS.update({
    where: { id: sosId },
    data: { status: "RESOLVED" },
  });

  revalidatePath("/emergency");
  revalidatePath("/feed");
  return { success: true };
}
