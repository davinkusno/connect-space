import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * @route POST /api/events/[id]/rsvp
 * @description RSVP to an event (interested to join)
 * @access Authenticated
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user already has RSVP
    const { data: existingRsvp, error: checkError } = await supabase
      .from("event_attendees")
      .select("id, status")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("Error checking existing RSVP:", checkError);
      return NextResponse.json(
        { error: "Failed to check RSVP status" },
        { status: 500 }
      );
    }

    if (existingRsvp) {
      // Update existing RSVP to "going" (interested to join)
      const { error: updateError } = await supabase
        .from("event_attendees")
        .update({
          status: "going",
          registered_at: new Date().toISOString(),
        })
        .eq("id", existingRsvp.id);

      if (updateError) {
        console.error("Error updating RSVP:", updateError);
        return NextResponse.json(
          { error: "Failed to update RSVP" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: "RSVP updated successfully", status: "going" },
        { status: 200 }
      );
    } else {
      // Create new RSVP
      const { error: insertError } = await supabase
        .from("event_attendees")
        .insert({
          event_id: id,
          user_id: user.id,
          status: "going",
          registered_at: new Date().toISOString(),
        });

      if (insertError) {
        // Handle duplicate key error - record might have been created between check and insert
        if (insertError.code === "23505") {
          // Duplicate key - update existing record instead
          const { error: updateError } = await supabase
            .from("event_attendees")
            .update({
              status: "going",
              registered_at: new Date().toISOString(),
            })
            .eq("event_id", id)
            .eq("user_id", user.id);

          if (updateError) {
            console.error("Error updating RSVP after duplicate:", updateError);
            return NextResponse.json(
              { error: "Failed to update RSVP" },
              { status: 500 }
            );
          }

          return NextResponse.json(
            { message: "RSVP updated successfully", status: "going" },
            { status: 200 }
          );
        }

        console.error("Error creating RSVP:", insertError);
        return NextResponse.json(
          { error: "Failed to create RSVP" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: "RSVP created successfully", status: "going" },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error("Error in POST /api/events/[id]/rsvp:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * @route DELETE /api/events/[id]/rsvp
 * @description Remove RSVP (not interested anymore)
 * @access Authenticated
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete RSVP
    const { error: deleteError } = await supabase
      .from("event_attendees")
      .delete()
      .eq("event_id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting RSVP:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove RSVP" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "RSVP removed successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in DELETE /api/events/[id]/rsvp:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}


