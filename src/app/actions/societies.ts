"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Checks if a user is an admin of the specified society.
 */
async function checkIsSocietyAdmin(userId: string, societyId: string) {
  const society = await db.society.findFirst({
    where: {
      id: societyId,
      admins: {
        some: { id: userId },
      },
    },
  });
  return !!society;
}

/**
 * Submits a verification request to join a society.
 */
export async function joinSocietyAction(societyId: string, documentUrl?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existingRequest = await db.societyVerificationRequest.findFirst({
    where: {
      societyId,
      userId,
    },
  });

  if (existingRequest) {
    if (existingRequest.status === "APPROVED") {
      return { success: true, message: "Already a verified member of this society." };
    }
    // Update existing request
    await db.societyVerificationRequest.update({
      where: { id: existingRequest.id },
      data: {
        documentUrl,
        status: "PENDING",
      },
    });
  } else {
    // Create new request
    await db.societyVerificationRequest.create({
      data: {
        societyId,
        userId,
        documentUrl,
        status: "PENDING",
      },
    });
  }

  // Update user's target society (but not verified status yet)
  const society = await db.society.findUnique({
    where: { id: societyId },
  });
  
  if (society) {
    await db.user.update({
      where: { id: userId },
      data: {
        societyId,
        societyName: society.name,
        societyVerified: false,
        residentVerified: false,
      },
    });
  }

  revalidatePath("/societies");
  return { success: true, message: "Verification request submitted successfully." };
}

/**
 * Approves a verification request (Admin only).
 */
export async function approveVerificationRequestAction(requestId: string) {
  const { userId: adminId } = await auth();
  if (!adminId) throw new Error("Unauthorized");

  const request = await db.societyVerificationRequest.findUnique({
    where: { id: requestId },
    include: { society: true },
  });

  if (!request) throw new Error("Verification request not found.");

  const isAdmin = await checkIsSocietyAdmin(adminId, request.societyId);
  if (!isAdmin) throw new Error("Unauthorized: Only society admins can approve verification requests.");

  // Update request status
  await db.societyVerificationRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED" },
  });

  // Connect user to society members and update status
  await db.user.update({
    where: { id: request.userId },
    data: {
      societyVerified: true,
      residentVerified: true,
      trustScore: {
        increment: 30, // reward verified status
      },
      society: {
        connect: { id: request.societyId },
      },
    },
  });

  // Create standard notification for the user
  await db.notification.create({
    data: {
      userId: request.userId,
      type: "GROUP_ACTIVITY",
      title: "Residency Verified!",
      body: `Congratulations! Your residency verification for ${request.society.name} has been approved.`,
    },
  });

  revalidatePath("/societies");
  return { success: true };
}

/**
 * Rejects a verification request (Admin only).
 */
export async function rejectVerificationRequestAction(requestId: string, reason?: string) {
  const { userId: adminId } = await auth();
  if (!adminId) throw new Error("Unauthorized");

  const request = await db.societyVerificationRequest.findUnique({
    where: { id: requestId },
    include: { society: true },
  });

  if (!request) throw new Error("Verification request not found.");

  const isAdmin = await checkIsSocietyAdmin(adminId, request.societyId);
  if (!isAdmin) throw new Error("Unauthorized: Only society admins can reject requests.");

  // Update request status
  await db.societyVerificationRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });

  // Notify user
  await db.notification.create({
    data: {
      userId: request.userId,
      type: "GROUP_ACTIVITY",
      title: "Residency Verification Rejected",
      body: `Your residency verification request for ${request.society.name} was rejected. ${
        reason ? `Reason: ${reason}` : ""
      }`,
    },
  });

  revalidatePath("/societies");
  return { success: true };
}

/**
 * Creates a society announcement (Admin only).
 */
export async function createSocietyAnnouncementAction(societyId: string, title: string, content: string) {
  const { userId: adminId } = await auth();
  if (!adminId) throw new Error("Unauthorized");

  const isAdmin = await checkIsSocietyAdmin(adminId, societyId);
  if (!isAdmin) throw new Error("Unauthorized: Only admins can post announcements.");

  const announcement = await db.societyAnnouncement.create({
    data: {
      societyId,
      authorId: adminId,
      title,
      content,
    },
  });

  // Fetch all society members to send in-app notifications
  const society = await db.society.findUnique({
    where: { id: societyId },
    include: {
      members: {
        select: { id: true },
      },
    },
  });

  if (society) {
    const notificationData = society.members
      .filter((m) => m.id !== adminId)
      .map((member) => ({
        userId: member.id,
        type: "GROUP_ACTIVITY" as const,
        title: `Announcement: ${title}`,
        body: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
      }));

    if (notificationData.length > 0) {
      await db.notification.createMany({
        data: notificationData,
      });
    }
  }

  revalidatePath("/societies");
  return { success: true, announcement };
}

/**
 * Fetches verification requests for a society (Admin only).
 */
export async function getPendingRequestsAction(societyId: string) {
  const { userId: adminId } = await auth();
  if (!adminId) throw new Error("Unauthorized");

  const isAdmin = await checkIsSocietyAdmin(adminId, societyId);
  if (!isAdmin) throw new Error("Unauthorized: Only admins can view pending verification requests.");

  return db.societyVerificationRequest.findMany({
    where: {
      societyId,
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Sends a message in the society real-time chat room.
 */
export async function sendChatMessageAction(groupId: string, content: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const message = await db.message.create({
    data: {
      groupId,
      senderId: userId,
      content,
    },
    include: {
      sender: {
        select: {
          name: true,
          avatar: true,
        },
      },
    },
  });

  revalidatePath("/societies");
  return { success: true, message };
}
