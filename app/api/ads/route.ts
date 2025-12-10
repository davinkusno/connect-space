import { NextRequest, NextResponse } from "next/server";
import { adsService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/ads
 * Get all ads with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const communityId = searchParams.get("community_id") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    const result = await adsService.getAll({ status, communityId, limit });

    return NextResponse.json(
      result.success ? { ads: result.data } : { error: result.error?.message },
      { status: result.status }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ads
 * Create a new ad
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = await adsService.create(user.id, body);

    return NextResponse.json(
      result.success ? result.data : { error: result.error?.message },
      { status: result.status }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
