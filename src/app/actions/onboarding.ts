"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { searchAddress, parseMapboxFeature, GeocodedLocation } from "@/lib/location";

/**
 * Searches for location suggestions.
 */
export async function searchLocationsAction(query: string) {
  if (!query || query.length < 3) return [];
  const features = await searchAddress(query);
  return features.map((f) => ({
    id: f.id,
    placeName: f.place_name,
    locationData: parseMapboxFeature(f),
  }));
}

/**
 * Completes the user onboarding process.
 */
export async function completeOnboardingAction(data: {
  name: string;
  bio: string;
  avatar?: string;
  location: GeocodedLocation;
  societyId?: string;
  societyName?: string;
  createNewSociety?: boolean;
  societyDescription?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: Please sign in to complete onboarding.");
  }

  // 1. Find or create the Location in our database
  let dbLocation = await db.location.findFirst({
    where: {
      pincode: data.location.pincode,
      area: data.location.area,
      city: data.location.city,
    },
  });

  if (!dbLocation) {
    dbLocation = await db.location.create({
      data: {
        country: data.location.country,
        state: data.location.state,
        city: data.location.city,
        area: data.location.area,
        pincode: data.location.pincode,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      },
    });
  }

  let finalSocietyId: string | null = null;
  let finalSocietyName: string | null = null;

  // 2. Handle Society Logic
  if (data.createNewSociety && data.societyName) {
    // Create new society
    const newSociety = await db.society.create({
      data: {
        name: data.societyName,
        description: data.societyDescription || `Society for residents of ${data.societyName}`,
        locationId: dbLocation.id,
        createdById: userId,
        admins: {
          connect: { id: userId },
        },
        members: {
          connect: { id: userId },
        },
      },
    });
    
    // Create standard society chat group
    await db.chatGroup.create({
      data: {
        name: `${data.societyName} Announcements`,
        societyId: newSociety.id,
        locationId: dbLocation.id,
        members: {
          create: {
            userId: userId,
          }
        }
      }
    });

    finalSocietyId = newSociety.id;
    finalSocietyName = data.societyName;
  } else if (data.societyId) {
    // Join existing society (Creates pending verification request)
    const existingSociety = await db.society.findUnique({
      where: { id: data.societyId },
    });

    if (existingSociety) {
      finalSocietyId = existingSociety.id;
      finalSocietyName = existingSociety.name;

      // Create a Verification Request
      await db.societyVerificationRequest.create({
        data: {
          societyId: existingSociety.id,
          userId: userId,
          status: "PENDING",
        },
      });
    }
  }

  // 3. Update the User profile
  await db.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      bio: data.bio,
      avatar: data.avatar || undefined,
      locationId: dbLocation.id,
      societyId: finalSocietyId,
      societyName: finalSocietyName,
      // The user gets "EMAIL_VERIFIED" automatically since they authenticated
      emailVerified: true,
      // If they created the society, they are society-verified immediately
      societyVerified: data.createNewSociety ? true : false,
      residentVerified: data.createNewSociety ? true : false,
      trustScore: data.createNewSociety ? 140 : 100, // higher trust for creators
    },
  });

  return { success: true, societyId: finalSocietyId };
}

/**
 * Fetch existing societies in a given location (for dropdown select).
 */
export async function getSocietiesInLocation(pincode: string) {
  return db.society.findMany({
    where: {
      location: {
        pincode: pincode,
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });
}
