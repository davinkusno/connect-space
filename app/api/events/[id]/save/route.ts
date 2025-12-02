import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * @route POST /api/events/[id]/save
 * @description Save an event to user's saved events
 * @access Authenticated
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id: eventId } = await params;

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
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from("saved_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: "Event already saved", saved: true },
        { status: 200 }
      );
    }

    // Save event
    const { error: saveError } = await supabase
      .from("saved_events")
      .insert({
        user_id: user.id,
        event_id: eventId,
      });

    if (saveError) {
      console.error("Error saving event:", saveError);
      return NextResponse.json(
        { error: "Failed to save event" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Event saved successfully", saved: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in save event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @route DELETE /api/events/[id]/save
 * @description Remove an event from user's saved events
 * @access Authenticated
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id: eventId } = await params;

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

    // Remove saved event
    const { error: deleteError } = await supabase
      .from("saved_events")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", eventId);

    if (deleteError) {
      console.error("Error unsaving event:", deleteError);
      return NextResponse.json(
        { error: "Failed to unsave event" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Event unsaved successfully", saved: false },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in unsave event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


