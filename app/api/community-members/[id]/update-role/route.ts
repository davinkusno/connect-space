import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * @route PATCH /api/community-members/[id]/update-role
 * @description Update a community member's role
 * @access Private (community admins only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    // Fetch the member record to get community_id
    const { data: memberRecord, error: fetchError } = await supabase
      .from("community_members")
      .select("id, community_id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !memberRecord) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Verify user is admin/creator of the community
    const { data: community } = await supabase
      .from("communities")
      .select("id, creator_id")
      .eq("id", memberRecord.community_id)
      .single();

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Check if user is creator or admin
    const isCreator = community.creator_id === user.id;
    const { data: membership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", memberRecord.community_id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!isCreator && !membership) {
      return NextResponse.json(
        { error: "You don't have permission to update member roles" },
        { status: 403 }
      );
    }

    // Update the member's role
    const { error: updateError } = await supabase
      .from("community_members")
      .update({ role })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating member role:", updateError);
      return NextResponse.json(
        { 
          error: "Failed to update member role", 
          details: updateError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Member role updated successfully",
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}





