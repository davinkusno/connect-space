import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * @route PATCH /api/events/[id]/update
 * @description Update an existing event (partial updates allowed)
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
    const {
      title,
      description,
      category,
      location,
      start_time,
      end_time,
      image_url,
      is_online,
      is_public,
      max_attendees,
      link,
    } = body;

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
        { error: "You don't have permission to update this event" },
        { status: 403 }
      );
    }

    // Build update data (only include fields that are provided)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_online !== undefined) updateData.is_online = is_online;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (max_attendees !== undefined) updateData.max_attendees = max_attendees;
    if (link !== undefined) updateData.link = link;
    
    // Category is optional (may not exist in schema)
    if (category !== undefined) {
      updateData.category = category;
    }

    // Update event
    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating event:", updateError);
      return NextResponse.json(
        { 
          error: "Failed to update event", 
          details: updateError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}








