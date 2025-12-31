import { userController } from "@/lib/controllers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return await userController.getCurrentUserInfo(request);
  } catch (error: any) {
    console.error("Error in GET /api/user/me:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
