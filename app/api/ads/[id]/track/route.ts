import { NextRequest, NextResponse } from "next/server";
import { adsService } from "@/lib/services";

/**
 * POST /api/ads/[id]/track
 * Track ad impression or click
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { type } = await request.json();

    if (type === "impression") {
      await adsService.trackImpression(id);
    } else if (type === "click") {
      await adsService.trackClick(id);
    } else {
      return NextResponse.json(
        { error: "Invalid tracking type" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
