import { communityController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * @route GET /api/communities
 * @description Get all communities with optional filters
 * @access Public
 */
export async function GET(request: NextRequest) {
  return communityController.getCommunities(request);
}

/**
 * @route POST /api/communities
 * @description Create a new community
 * @access Private (authenticated users)
 */
export async function POST(request: NextRequest) {
  return communityController.createCommunity(request);
}
