import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RequestsClient } from "./requests-client";

export default async function RequestsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.locationId) {
    redirect("/onboarding");
  }

  // Fetch all open/resolved community requests in the user's location
  const requests = await db.communityRequest.findMany({
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
      comments: {
        include: {
          author: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <RequestsClient
      currentUserId={userId}
      requests={requests}
    />
  );
}
