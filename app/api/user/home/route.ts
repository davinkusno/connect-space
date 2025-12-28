import { NextRequest, NextResponse } from "next/server";
import { UserController } from "@/lib/controllers/user.controller";

const controller = new UserController();

/**
 * GET /api/user/home
 * Get comprehensive home page data for the authenticated user
 * Returns: user info, points, communities (created + joined), upcoming events
 */
export async function GET(request: NextRequest) {
  try {
    return await controller.getHomePage(request);
  } catch (error) {
    console.error("[API] Error in home page data:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
