import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * @route DELETE /api/events/[id]
 * @description Delete an event
 * @access Private (community admins only)
 */
export async function DELETE(
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

    // Fetch existing event to verify ownership
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("id, community_id, creator_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Verify user is admin/creator of the community
    const { data: community } = await supabase
      .from("communities")
      .select("id, creator_id")
      .eq("id", existingEvent.community_id)
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
      .eq("community_id", existingEvent.community_id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!isCreator && !membership) {
      return NextResponse.json(
        { error: "You don't have permission to delete this event" },
        { status: 403 }
      );
    }

    // Delete related posts first (as safety measure, even if cascade is set)
    const { error: postsDeleteError } = await supabase
      .from("posts")
      .delete()
      .eq("event_id", id);

    if (postsDeleteError) {
      console.warn("Warning: Failed to delete posts (may not exist or cascade will handle):", postsDeleteError);
      // Continue with event deletion even if posts deletion fails
    }

    // Delete event (cascade will handle related records like event_attendees)
    // If cascade is properly set, posts will also be deleted automatically
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting event:", deleteError);
      return NextResponse.json(
        { 
          error: "Failed to delete event", 
          details: deleteError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

