import { NextRequest, NextResponse } from "next/server";
import { communityService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/community-members/[id]/approve
 * Approve a community join request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get community ID from request body
    const body = await request.json();
    const { community_id } = body;

    if (!community_id) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      );
    }

    const result = await communityService.approveRequest(
      memberId,
      community_id,
      user.id
    );

    return NextResponse.json(
      result.success ? result.data : { error: result.error?.message },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/community-members/[id]/approve
 * Reject a community join request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("community_id");

    if (!communityId) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      );
    }

    const result = await communityService.rejectRequest(
      memberId,
      communityId,
      user.id
    );

    return NextResponse.json(
      result.success ? result.data : { error: result.error?.message },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
