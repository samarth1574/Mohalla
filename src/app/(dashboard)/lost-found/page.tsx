import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LostAndFoundClient } from "./lost-found-client";

export default async function LostAndFoundPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.locationId) {
    redirect("/onboarding");
  }

  // Fetch lost & found reports in the user's location area
  const items = await db.lostAndFound.findMany({
    where: {
      locationId: user.locationId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          societyName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <LostAndFoundClient
      currentUserId={userId}
      items={items}
    />
  );
}
