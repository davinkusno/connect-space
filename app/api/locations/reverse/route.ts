/**
 * API Route: /api/locations/reverse
 * Reverse geocode coordinates to location (for map clicks)
 * Uses UserController for consistent location data
 */

import { NextRequest } from "next/server";
import { userController } from "@/lib/controllers/user.controller";

export async function GET(request: NextRequest) {
  return userController.reverseGeocodeLocation(request);
}

