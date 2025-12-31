import { eventController } from "@/lib/controllers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    return await eventController.getCommunityEvents(request, communityId);
  } catch (error: any) {
    console.error("Error fetching community events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

