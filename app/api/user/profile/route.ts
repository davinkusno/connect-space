import { userController } from "@/lib/controllers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  console.log("[API Route] PATCH /api/user/profile called at", new Date().toISOString());
  try {
    const result = await userController.updateProfile(request);
    console.log("[API Route] Profile update completed, status:", result.status);
    return result;
  } catch (error) {
    console.error("[API Route] Error in profile route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

