import { communityController } from "@/lib/controllers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    return await communityController.leaveCommunity(request, communityId);
  } catch (error: any) {
    console.error("Error leaving community:", error);
    return NextResponse.json(
      { error: error.message || "Failed to leave community. Please try again." },
      { status: 500 }
    );
  }
}

