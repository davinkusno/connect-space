import { NextRequest, NextResponse } from "next/server";
import { communityService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Create notification when a user is approved
 */
async function createApprovalNotification(
  userId: string,
  communityId: string,
  communityName: string
): Promise<void> {
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: "community_update",
    content: `Your join request to "${communityName}" has been approved!`,
    is_read: false,
    reference_id: communityId,
    reference_type: "community",
  });
}

/**
 * Award points for joining community
 */
async function awardCommunityJoinedPoints(
  userId: string,
  communityId: string
): Promise<boolean> {
  const POINTS_FOR_JOINING = 25;

  const { data: existingPoints } = await supabaseAdmin
    .from("user_points")
    .select("id")
    .eq("user_id", userId)
    .eq("point_type", "community_joined")
    .eq("related_id", communityId)
    .maybeSingle();

  if (existingPoints) return false;

  const { error } = await supabaseAdmin.from("user_points").insert({
    user_id: userId,
    points: POINTS_FOR_JOINING,
    point_type: "community_joined",
    related_id: communityId,
    related_type: "community",
    description: "Joined a community",
  });

  return !error;
}

/**
 * POST /api/community-members/bulk-approve
 * Approve multiple join requests at once
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { community_id, member_ids } = await request.json();

    if (!community_id) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      );
    }

    // Verify admin permission
    const isAdmin = await communityService.isAdminOrCreator(community_id, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Get community name for notifications
    const { data: community } = await supabaseAdmin
      .from("communities")
      .select("name")
      .eq("id", community_id)
      .single();

    // Build query for pending members
    let query = supabaseAdmin
      .from("community_members")
      .select("id, user_id")
      .eq("community_id", community_id)
      .eq("status", false);

    if (member_ids?.length > 0) {
      query = query.in("id", member_ids);
    }

    const { data: pendingMembers, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch pending members" },
        { status: 500 }
      );
    }

    if (!pendingMembers?.length) {
      return NextResponse.json({ message: "No pending members to approve" });
    }

    // Approve all members
    const memberIds = pendingMembers.map((m) => m.id);
    const { error: updateError } = await supabaseAdmin
      .from("community_members")
      .update({ status: true })
      .in("id", memberIds)
      .eq("community_id", community_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to approve members" },
        { status: 500 }
      );
    }

    // Send notifications and award points
    await Promise.all(
      pendingMembers.map((member) =>
        Promise.all([
          createApprovalNotification(
            member.user_id,
            community_id,
            community?.name || "Community"
          ),
          awardCommunityJoinedPoints(member.user_id, community_id),
        ])
      )
    );

    return NextResponse.json({
      message: `Approved ${pendingMembers.length} member(s)`,
      approved_count: pendingMembers.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
