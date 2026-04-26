import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MarketplaceClient } from "./marketplace-client";

export default async function MarketplacePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.locationId) {
    redirect("/onboarding");
  }

  // Fetch listings for the location that are NOT flagged as scams or toxic
  const listings = await db.marketplaceListing.findMany({
    where: {
      locationId: user.locationId,
      moderationStatus: {
        notIn: ["FLAGGED_SCAM", "QUARANTINED"],
      },
    },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
          trustScore: true,
          residentVerified: true,
        },
      },
      savedBy: {
        select: {
          userId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <MarketplaceClient
      currentUserId={userId}
      listings={listings.map((item) => ({
        ...item,
        isSaved: item.savedBy.some((s) => s.userId === userId),
      }))}
    />
  );
}
