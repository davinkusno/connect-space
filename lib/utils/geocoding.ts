/**
 * Geocoding Utilities
 * Provides functions to convert text addresses to coordinates (forward geocoding)
 * and coordinates to addresses (reverse geocoding)
 */

import { StandardizedLocation } from "@/types/location";

export interface GeocodeResult {
  success: boolean;
  data?: StandardizedLocation;
  error?: string;
}

/**
 * Forward geocode: Convert a text address/city to coordinates
 * Uses Nominatim (OpenStreetMap) API with English language
 * @param address - The address or city name to geocode
 * @returns GeocodeResult with StandardizedLocation or error
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult> {
  if (!address || address.trim().length < 2) {
    return {
      success: false,
      error: "Address must be at least 2 characters",
    };
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        `format=json` +
        `&q=${encodeURIComponent(address.trim())}` +
        `&limit=1` +
        `&addressdetails=1` +
        `&accept-language=en`, // Force English for consistency
      {
        headers: {
          "User-Agent": "ConnectSpace/1.0",
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      console.error(`[Geocoding] API error: ${response.status}`);
      return {
        success: false,
        error: "Geocoding service unavailable",
      };
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Location not found",
      };
    }

    const result = data[0];

    // Extract city from address components
    const addressComponents = result.address || {};
    const city =
      addressComponents.city ||
      addressComponents.town ||
      addressComponents.village ||
      addressComponents.municipality ||
      addressComponents.county ||
      result.name ||
      "";

    if (!city) {
      return {
        success: false,
        error: "Could not determine city name",
      };
    }

    // Build StandardizedLocation
    const location: StandardizedLocation = {
      city: city,
      placeId: result.place_id?.toString() || "",
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name || "",
      fullAddress: result.display_name || address,
      country: addressComponents.country || "",
    };

    return {
      success: true,
      data: location,
    };
  } catch (error) {
    console.error("[Geocoding] Error:", error);
    return {
      success: false,
      error: "Failed to geocode address",
    };
  }
}

/**
 * Reverse geocode: Convert coordinates to address
 * Uses Nominatim (OpenStreetMap) API with English language
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns GeocodeResult with StandardizedLocation or error
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodeResult> {
  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    return {
      success: false,
      error: "Invalid coordinates",
    };
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
        `format=json` +
        `&lat=${lat}` +
        `&lon=${lon}` +
        `&addressdetails=1` +
        `&accept-language=en`, // Force English for consistency
      {
        headers: {
          "User-Agent": "ConnectSpace/1.0",
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      console.error(`[Reverse Geocoding] API error: ${response.status}`);
      return {
        success: false,
        error: "Reverse geocoding service unavailable",
      };
    }

    const data = await response.json();

    if (!data || !data.address) {
      return {
        success: false,
        error: "No address found for coordinates",
      };
    }

    // Extract city from address components
    const addressComponents = data.address;
    const city =
      addressComponents.city ||
      addressComponents.town ||
      addressComponents.village ||
      addressComponents.municipality ||
      addressComponents.county ||
      "";

    if (!city) {
      return {
        success: false,
        error: "Could not determine city name",
      };
    }

    // Build StandardizedLocation
    const location: StandardizedLocation = {
      city: city,
      placeId: data.place_id?.toString() || "",
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon),
      displayName: data.display_name || "",
      fullAddress: data.display_name || "",
      country: addressComponents.country || "",
    };

    return {
      success: true,
      data: location,
    };
  } catch (error) {
    console.error("[Reverse Geocoding] Error:", error);
    return {
      success: false,
      error: "Failed to reverse geocode coordinates",
    };
  }
}

/**
 * Validate and enrich location data
 * If location is just a string or missing coordinates, geocode it
 * @param location - The location data (string or partial object)
 * @returns GeocodeResult with complete StandardizedLocation or error
 */
export async function validateAndEnrichLocation(
  location: string | Partial<StandardizedLocation> | null | undefined
): Promise<GeocodeResult> {
  if (!location) {
    return {
      success: false,
      error: "No location provided",
    };
  }

  // If it's a plain string, geocode it
  if (typeof location === "string") {
    return await geocodeAddress(location);
  }

  // If it's an object but missing coordinates, geocode the city/address
  if (!location.lat || !location.lon || isNaN(location.lat) || isNaN(location.lon)) {
    const addressToGeocode = location.fullAddress || location.city || location.displayName;
    
    if (!addressToGeocode) {
      return {
        success: false,
        error: "No valid address or city to geocode",
      };
    }

    return await geocodeAddress(addressToGeocode);
  }

  // If it has valid coordinates, validate it has all required fields
  if (!location.city || !location.city.trim()) {
    // Use reverse geocoding to get city name
    return await reverseGeocode(location.lat, location.lon);
  }

  // Location is complete, return it as StandardizedLocation
  const completeLocation: StandardizedLocation = {
    city: location.city.trim(),
    placeId: location.placeId || "",
    lat: location.lat,
    lon: location.lon,
    displayName: location.displayName || `${location.city}${location.country ? ', ' + location.country : ''}`,
    fullAddress: location.fullAddress || location.displayName || `${location.city}${location.country ? ', ' + location.country : ''}`,
    country: location.country || "",
  };

  return {
    success: true,
    data: completeLocation,
  };
}

