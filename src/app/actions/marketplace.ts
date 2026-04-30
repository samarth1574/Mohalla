"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { evaluateMarketplaceListing, moderateContent } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

/**
 * Creates a new marketplace listing (with Gemini scam scan).
 */
export async function createMarketplaceListingAction(data: {
  title: string;
  description: string;
  price: number;
  condition: string; // NEW, LIKE_NEW, GOOD, FAIR
  listingType: "BUY" | "SELL" | "RENT" | "EXCHANGE";
  category: string; // ELECTRONICS, VEHICLES, FURNITURE, BOOKS, FASHION, APPLIANCES, RENTALS, JOBS, SERVICES, OTHER
  mediaUrls?: string[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.locationId) {
    throw new Error("Location not set. Please complete onboarding first.");
  }

  // 1. Run Gemini Scam / Fraud Detection
  const scamScan = await evaluateMarketplaceListing(data.title, data.description, data.price);

  // 2. Create Listing
  const listing = await db.marketplaceListing.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      condition: data.condition,
      listingType: data.listingType,
      category: data.category as any,
      mediaUrls: data.mediaUrls || [],
      sellerId: userId,
      locationId: user.locationId,
      moderationStatus: scamScan.status,
      moderationReason: scamScan.reason,
    },
  });

  revalidatePath("/marketplace");
  return { 
    success: true, 
    listingId: listing.id, 
    scamFlagged: scamScan.status === "FLAGGED_SCAM",
    reason: scamScan.reason 
  };
}

/**
 * Toggles saving a listing to user's saved items.
 */
export async function toggleSaveListingAction(listingId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existingSave = await db.savedMarketplaceListing.findUnique({
    where: {
      userId_listingId: {
        userId,
        listingId,
      },
    },
  });

  if (existingSave) {
    await db.savedMarketplaceListing.delete({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });
  } else {
    await db.savedMarketplaceListing.create({
      data: {
        userId,
        listingId,
      },
    });
  }

  revalidatePath("/marketplace");
  return { success: true };
}

/**
 * Deletes a marketplace listing.
 */
export async function deleteMarketplaceListingAction(listingId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const listing = await db.marketplaceListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) throw new Error("Listing not found.");
  if (listing.sellerId !== userId) throw new Error("Unauthorized.");

  await db.marketplaceListing.delete({
    where: { id: listingId },
  });

  revalidatePath("/marketplace");
  return { success: true };
}

/**
 * Creates a local job listing on the jobs board.
 */
export async function createJobListingAction(data: {
  title: string;
  description: string;
  category: string; // Internship, Driver, Tutor, Maid, Part-time
  salary?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.locationId) {
    throw new Error("Location not set. Please complete onboarding first.");
  }

  // AI Moderation check
  const moderation = await moderateContent(`${data.title} ${data.description}`);
  if (moderation.status === "FLAGGED_TOXIC") {
    throw new Error(`Content blocked: ${moderation.reason}`);
  }

  const job = await db.jobListing.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      salary: data.salary || null,
      employerId: userId,
      locationId: user.locationId,
    },
  });

  revalidatePath("/jobs");
  return { success: true, jobId: job.id };
}

/**
 * Submits an application for a job.
 */
export async function applyForJobAction(data: {
  jobId: string;
  coverLetter?: string;
  resumeUrl?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existingApplication = await db.jobApplication.findFirst({
    where: {
      jobId: data.jobId,
      applicantId: userId,
    },
  });

  if (existingApplication) {
    throw new Error("You have already applied for this job.");
  }

  const application = await db.jobApplication.create({
    data: {
      jobId: data.jobId,
      applicantId: userId,
      coverLetter: data.coverLetter || null,
      resumeUrl: data.resumeUrl || null,
    },
  });

  // Notify the employer
  const job = await db.jobListing.findUnique({
    where: { id: data.jobId },
    select: { employerId: true, title: true },
  });

  if (job) {
    await db.notification.create({
      data: {
        userId: job.employerId,
        type: "MARKETPLACE_INQUIRY",
        title: "New Job Application!",
        body: `Someone applied for your job opening: "${job.title}"`,
      },
    });
  }

  revalidatePath("/jobs");
  return { success: true, applicationId: application.id };
}
