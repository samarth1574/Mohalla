import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { EmergencyClient } from "./emergency-client";

export default async function EmergencyPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.locationId) {
    redirect("/onboarding");
  }

  // Fetch active and resolved emergency broadcasts
  const emergencies = await db.emergencySOS.findMany({
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
          trustScore: true,
        },
      },
      volunteers: {
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
              trustScore: true,
            },
          },
        },
      },
      updates: {
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: [
      { status: "asc" }, // ACTIVE (A) before RESOLVED (R)
      { createdAt: "desc" },
    ],
  });

  return (
    <EmergencyClient
      currentUserId={userId}
      emergencies={emergencies}
    />
  );
}
