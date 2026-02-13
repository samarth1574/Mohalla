const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export interface GeocodedLocation {
  country: string;
  state: string;
  city: string;
  area: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

/**
 * Searches for addresses/places in India using Mapbox Geocoding API.
 */
export async function searchAddress(query: string): Promise<any[]> {
  if (!MAPBOX_ACCESS_TOKEN) {
    console.warn("Missing MAPBOX_ACCESS_TOKEN env variable");
    return [];
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=IN&limit=5`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error("Geocoding search failed:", error);
    return [];
  }
}

/**
 * Reverse geocodes coordinates (lng, lat) to address details using Mapbox Geocoding API.
 */
export async function reverseGeocode(lng: number, lat: number): Promise<any | null> {
  if (!MAPBOX_ACCESS_TOKEN) {
    console.warn("Missing MAPBOX_ACCESS_TOKEN env variable");
    return null;
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=IN`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features?.[0] || null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}

/**
 * Parses Mapbox features object into a structured GeocodedLocation.
 */
export function parseMapboxFeature(feature: any): GeocodedLocation {
  const context = feature.context || [];
  const coords = feature.geometry?.coordinates || [0, 0];

  // Helper to extract specific context types from Mapbox context
  const getContextVal = (idPrefix: string): string => {
    const item = context.find((c: any) => c.id.startsWith(idPrefix));
    return item ? item.text : "";
  };

  const pincode = getContextVal("postcode") || "";
  const state = getContextVal("region") || "";
  const city = getContextVal("place") || getContextVal("district") || "";
  const area = feature.text || getContextVal("locality") || getContextVal("neighborhood") || "";

  return {
    country: "India",
    state,
    city,
    area,
    pincode,
    latitude: coords[1],
    longitude: coords[0],
  };
}
