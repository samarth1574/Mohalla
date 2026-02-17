"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function loginAsMockUser(
  id: string,
  name: string,
  email: string,
  role: "USER" | "MODERATOR" | "ADMIN",
  societyName: string
) {
  try {
    // Ensure we have a default location in the database
    let location = await db.location.findFirst({
      where: { area: "Indiranagar" }
    });

    if (!location) {
      location = await db.location.create({
        data: {
          state: "Karnataka",
          city: "Bengaluru",
          area: "Indiranagar",
          pincode: "560038",
          latitude: 12.9716,
          longitude: 77.6412
        }
      });
    }

    // Upsert the user into the database so all user profile pages work
    await db.user.upsert({
      where: { id },
      update: {
        email,
        name,
        role,
        locationId: location.id,
        societyName,
        emailVerified: true,
        phoneVerified: true,
        societyVerified: true,
        residentVerified: true,
      },
      create: {
        id,
        email,
        name,
        role,
        locationId: location.id,
        societyName,
        emailVerified: true,
        phoneVerified: true,
        societyVerified: true,
        residentVerified: true,
        trustScore: 100,
        points: 45,
        badges: ["TRUSTED_NEIGHBOR", "HELPFUL_MEMBER"],
      }
    });

    // Set the cookie to persist authentication state
    const cookieStore = await cookies();
    cookieStore.set("mohalla_mock_user_id", id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: false, // Allow client component access if needed
    });

    return { success: true };
  } catch (error) {
    console.error("[Mock Auth] Login error:", error);
    return { success: false, error: String(error) };
  }
}

export async function logoutMockUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("mohalla_mock_user_id");
    return { success: true };
  } catch (error) {
    console.error("[Mock Auth] Logout error:", error);
    return { success: false, error: String(error) };
  }
}
