"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function markNotificationReadAction(notificationId: string) {
  const userId = await requireUserId();

  await db.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
    },
  });

  revalidatePath("/notifications");
  revalidatePath("/feed");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const userId = await requireUserId();

  await db.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  revalidatePath("/notifications");
  revalidatePath("/feed");
  return { success: true };
}
