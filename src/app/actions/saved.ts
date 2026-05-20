"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

type SaveTarget = "POST" | "LISTING" | "EVENT" | "BUSINESS" | "SERVICE";
type RecentlyViewedTarget = "MARKETPLACE" | "BUSINESS" | "SERVICE";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function toggleSavedItemAction(targetType: SaveTarget, targetId: string) {
  const userId = await requireUserId();

  switch (targetType) {
    case "POST": {
      const where = { userId_postId: { userId, postId: targetId } };
      const existing = await db.savedPost.findUnique({ where });
      if (existing) await db.savedPost.delete({ where });
      else await db.savedPost.create({ data: { userId, postId: targetId } });
      break;
    }
    case "LISTING": {
      const where = { userId_listingId: { userId, listingId: targetId } };
      const existing = await db.savedMarketplaceListing.findUnique({ where });
      if (existing) await db.savedMarketplaceListing.delete({ where });
      else await db.savedMarketplaceListing.create({ data: { userId, listingId: targetId } });
      break;
    }
    case "EVENT": {
      const where = { userId_eventId: { userId, eventId: targetId } };
      const existing = await db.savedEvent.findUnique({ where });
      if (existing) await db.savedEvent.delete({ where });
      else await db.savedEvent.create({ data: { userId, eventId: targetId } });
      break;
    }
    case "BUSINESS": {
      const where = { userId_businessId: { userId, businessId: targetId } };
      const existing = await db.savedBusiness.findUnique({ where });
      if (existing) await db.savedBusiness.delete({ where });
      else await db.savedBusiness.create({ data: { userId, businessId: targetId } });
      break;
    }
    case "SERVICE": {
      const where = { userId_serviceId: { userId, serviceId: targetId } };
      const existing = await db.savedService.findUnique({ where });
      if (existing) await db.savedService.delete({ where });
      else await db.savedService.create({ data: { userId, serviceId: targetId } });
      break;
    }
  }

  revalidatePath("/saved");
  revalidatePath("/feed");
  revalidatePath("/marketplace");

  return { success: true };
}

export async function recordRecentlyViewedAction(targetType: RecentlyViewedTarget, targetId: string) {
  const userId = await requireUserId();

  await db.recentlyViewed.deleteMany({
    where: {
      userId,
      targetType,
      targetId,
    },
  });

  await db.recentlyViewed.create({
    data: {
      userId,
      targetType,
      targetId,
    },
  });

  const staleItems = await db.recentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    skip: 30,
    select: { id: true },
  });

  if (staleItems.length > 0) {
    await db.recentlyViewed.deleteMany({
      where: {
        id: { in: staleItems.map((item) => item.id) },
      },
    });
  }

  revalidatePath("/saved");
  return { success: true };
}
