import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { HeatmapClient } from "./heatmap-client";

export default async function HeatmapPage() {
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

  // Fetch geographic points of interest to show on Mapbox Heatmap
  // Requirements: 1.8 - Query active EmergencySOS records with non-null coordinates,
  // Society records with location data, and available MarketplaceListing records
  
  // 1. Active SOS locations with non-null coordinates
  const activeSOS = await db.emergencySOS.findMany({
    where: {
      locationId: user.locationId,
      status: "ACTIVE",
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      title: true,
      category: true,
      latitude: true,
      longitude: true,
    },
  });

  // 2. Societies in the user's location
  const societies = await db.society.findMany({
    where: {
      locationId: user.locationId,
    },
    include: {
      location: {
        select: {
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  // 3. Available marketplace listings in the user's location
  const listings = await db.marketplaceListing.findMany({
    where: {
      locationId: user.locationId,
      status: "AVAILABLE",
    },
    include: {
      location: {
        select: {
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  // Transform and merge into unified HeatmapPoint[] array
  // Maps to the Point interface expected by HeatmapClient (type, lat, lng)
  const points = [
    ...activeSOS.map((sos) => ({
      id: sos.id,
      type: "emergency",
      title: `🚨 ${sos.category}: ${sos.title}`,
      lat: sos.latitude!,
      lng: sos.longitude!,
    })),
    ...societies.map((soc) => ({
      id: soc.id,
      type: "society",
      title: `🏢 Society: ${soc.name}`,
      lat: soc.location.latitude,
      lng: soc.location.longitude,
    })),
    ...listings.map((item) => ({
      id: item.id,
      type: "marketplace",
      title: `🛍️ Sale: ${item.title} (₹${item.price})`,
      lat: item.location.latitude,
      lng: item.location.longitude,
    })),
  ];

  return (
    <HeatmapClient
      center={{
        lat: user.location.latitude,
        lng: user.location.longitude,
        area: user.location.area,
        pincode: user.location.pincode,
      }}
      points={points}
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""}
    />
  );
}
