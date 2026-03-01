import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FeedClient } from "./feed-client";

export default async function FeedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch full user data including location
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      location: true,
      society: true,
    },
  });

  if (!user || !user.locationId) {
    redirect("/onboarding");
  }

  // Fetch all posts in the user's pincode / location
  // We include user details, upvotes, comments, poll options and votes
  const posts = await db.post.findMany({
    where: {
      locationId: user.locationId,
      // Only show posts that are not quarantined or toxic
      moderationStatus: {
        notIn: ["QUARANTINED", "FLAGGED_TOXIC"],
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          societyName: true,
          residentVerified: true,
          trustScore: true,
        },
      },
      upvotes: {
        select: {
          userId: true,
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
      pollOptions: {
        include: {
          votes: {
            select: {
              userId: true,
            },
          },
        },
      },
      society: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch active Emergency SOS alerts in the location
  const activeSOS = await db.emergencySOS.findMany({
    where: {
      locationId: user.locationId,
      status: "ACTIVE",
    },
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
  });

  // Fetch verified society announcements
  let announcements: any[] = [];
  if (user.societyId) {
    announcements = await db.societyAnnouncement.findMany({
      where: {
        societyId: user.societyId,
      },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });
  }

  return (
    <FeedClient
      currentUser={{
        id: user.id,
        name: user.name || "Resident",
        avatar: user.avatar || "",
        societyId: user.societyId || null,
        societyName: user.societyName || null,
        societyVerified: user.societyVerified,
        locationArea: user.location?.area || "Neighborhood",
      }}
      posts={posts.map(post => ({
        ...post,
        upvotesCount: post.upvotes.length,
        hasUpvoted: post.upvotes.some(v => v.userId === user.id),
      }))}
      activeSOS={activeSOS}
      announcements={announcements}
    />
  );
}
