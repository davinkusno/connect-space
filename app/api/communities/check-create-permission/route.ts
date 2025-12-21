import { communityController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * GET /api/communities/check-create-permission
 * Check if user has sufficient points to create a new community
 */
export async function GET(request: NextRequest) {
  return communityController.checkCreatePermission(request);
}


