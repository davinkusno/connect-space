import { NextRequest } from "next/server";
import { userController } from "@/lib/controllers/user.controller";

/**
 * Search for cities for user profile
 * GET /api/locations/search?q=london
 */
export async function GET(request: NextRequest) {
  return userController.searchLocations(request);
}

