import { NextRequest, NextResponse } from "next/server";
import { CommunityController } from "@/lib/controllers/community.controller";

const controller = new CommunityController();

/**
 * GET /api/communities/admin-list
 * Get all communities where user is creator or admin
 */
export async function GET(request: NextRequest) {
  try {
    return await controller.getAdminCommunities(request);
  } catch (error) {
    console.error("[API] Error in admin-list:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

