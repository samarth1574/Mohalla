import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SocietiesClient } from "./societies-client";

export default async function SocietiesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      location: true,
    },
  });

  if (!user || !user.locationId || !user.location) {
    redirect("/onboarding");
  }

  let societyDetails: any = null;
  let chatGroup: any = null;
  let pendingRequests: any[] = [];
  let otherSocieties: any[] = [];

  // Case 1: User has selected a society
  if (user.societyId) {
    societyDetails = await db.society.findUnique({
      where: { id: user.societyId },
      include: {
        admins: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            avatar: true,
            trustScore: true,
            residentVerified: true,
          },
        },
        announcements: {
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
        },
      },
    });

    // Check if user is admin
    const isAdmin = societyDetails?.admins.some((adm: any) => adm.id === userId);

    if (isAdmin) {
      pendingRequests = await db.societyVerificationRequest.findMany({
        where: {
          societyId: user.societyId,
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

    // Load society chat group and recent messages
    chatGroup = await db.chatGroup.findFirst({
      where: { societyId: user.societyId },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 50,
        },
      },
    });
  } else {
    // Case 2: User hasn't joined a society yet. Fetch list of available ones in their pincode
    otherSocieties = await db.society.findMany({
      where: {
        location: {
          pincode: user.location.pincode,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  }

  // Check if they have an active verification request
  const activeVerificationRequest = await db.societyVerificationRequest.findFirst({
    where: {
      userId,
      status: "PENDING",
    },
  });

  return (
    <SocietiesClient
      currentUser={{
        id: user.id,
        name: user.name || "Resident",
        avatar: user.avatar || "",
        societyId: user.societyId,
        societyVerified: user.societyVerified,
        isAdmin: societyDetails?.admins.some((adm: any) => adm.id === userId) || false,
      }}
      societyDetails={societyDetails}
      chatGroup={chatGroup}
      pendingRequests={pendingRequests}
      otherSocieties={otherSocieties}
      hasActiveRequest={!!activeVerificationRequest}
    />
  );
}
