/**
 * Standardized Location Data Structures
 * Used across user profiles, events, and communities
 * Ensures consistent city matching for recommendations
 */

/**
 * Standardized location format stored in database
 * ALL entities (users, events, communities) should use this structure
 */
export interface StandardizedLocation {
  // City identification - MUST be consistent for recommendations
  city: string; // City name in English (e.g., "Jakarta", "London")
  placeId: string; // OpenStreetMap place_id for uniqueness

  // Geographic coordinates
  lat: number; // Latitude (number, not string)
  lon: number; // Longitude (NOT lng! Use 'lon' for consistency)

  // Display information
  displayName: string; // Full address in English (e.g., "Jakarta, Indonesia")

  // Optional detailed address (for display purposes only)
  fullAddress?: string; // User-provided or formatted full address
  country?: string; // Country name in English
}

/**
 * Location search result from API
 * Returned by /api/locations/search and /api/locations/reverse
 */
export interface LocationSearchResult {
  id: string; // place_id from OpenStreetMap
  name: string; // City name in English
  display_name: string; // Full address in English
  lat: string; // String from API (convert to number when storing)
  lon: string; // String from API (convert to number when storing)
}

/**
 * Helper: Convert LocationSearchResult to StandardizedLocation
 * Use this when saving location data to database
 */
export function toStandardizedLocation(
  result: LocationSearchResult,
  fullAddress?: string
): StandardizedLocation {
  return {
    city: result.name,
    placeId: result.id,
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    displayName: result.display_name,
    fullAddress: fullAddress || result.display_name,
    // Extract country from display_name (last part after comma)
    country: result.display_name.split(",").pop()?.trim(),
  };
}

/**
 * Helper: Check if two locations are in the same city
 * Used by recommendation algorithms
 */
export function isSameCity(
  location1: StandardizedLocation | null | undefined,
  location2: StandardizedLocation | null | undefined
): boolean {
  if (!location1 || !location2) return false;

  // Primary: Compare place IDs (most reliable)
  if (location1.placeId && location2.placeId) {
    return location1.placeId === location2.placeId;
  }

  // Fallback: Compare normalized city names
  const city1 = location1.city.toLowerCase().trim();
  const city2 = location2.city.toLowerCase().trim();

  return city1 === city2;
}

/**
 * Helper: Get distance between two locations (in km)
 * Used for proximity-based recommendations
 */
export function getDistance(
  location1: StandardizedLocation,
  location2: StandardizedLocation
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(location2.lat - location1.lat);
  const dLon = toRad(location2.lon - location1.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(location1.lat)) *
      Math.cos(toRad(location2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Legacy location format (for migration reference)
 * DO NOT USE - kept for backwards compatibility during migration
 */
export interface LegacyLocation {
  address?: string;
  city?: string; // Inconsistent language!
  lat?: number;
  lng?: number; // Note: lng not lon!
  country?: string;
}

/**
 * Helper: Convert legacy location to standardized format
 * Use during data migration
 */
export function migrateLegacyLocation(
  legacy: LegacyLocation
): StandardizedLocation | null {
  if (!legacy.city || !legacy.lat || !legacy.lng) return null;

  return {
    city: legacy.city,
    placeId: "", // Will need to be populated via reverse geocoding
    lat: legacy.lat,
    lon: legacy.lng, // Convert lng to lon
    displayName: legacy.address || `${legacy.city}, ${legacy.country || ""}`,
    fullAddress: legacy.address,
    country: legacy.country,
  };
}

