import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { JobsClient } from "./jobs-client";

export default async function JobsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.locationId) {
    redirect("/onboarding");
  }

  // Fetch jobs in the local pincode/area
  const jobs = await db.jobListing.findMany({
    where: {
      locationId: user.locationId,
    },
    include: {
      employer: {
        select: {
          id: true,
          name: true,
          avatar: true,
          societyName: true,
        },
      },
      applications: {
        include: {
          applicant: {
            select: {
              name: true,
              avatar: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <JobsClient
      currentUserId={userId}
      jobs={jobs}
    />
  );
}
