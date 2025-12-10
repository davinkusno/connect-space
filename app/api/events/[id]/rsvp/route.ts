import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    console.log("[RSVP API] POST request for event:", id);

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("[RSVP API] Auth error or no user:", authError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[RSVP API] User ID:", user.id);

    // Check if event exists
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("id", id)
      .single();

    console.log("[RSVP API] Event check - data:", event, "error:", eventError);

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user already has RSVP (use admin to bypass RLS)
    const { data: existingRsvp, error: checkError } = await supabaseAdmin
      .from("event_attendees")
      .select("id, status")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("[RSVP API] Existing RSVP check - data:", existingRsvp, "error:", checkError);

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("[RSVP API] Error checking existing RSVP:", checkError);
      return NextResponse.json(
        { error: "Failed to check RSVP status" },
        { status: 500 }
      );
    }

    if (existingRsvp) {
      console.log("[RSVP API] Updating existing RSVP:", existingRsvp.id);
      // Update existing RSVP to "going" (interested to join)
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from("event_attendees")
        .update({
          status: "going",
          registered_at: new Date().toISOString(),
        })
        .eq("id", existingRsvp.id)
        .select();

      console.log("[RSVP API] Update result - data:", updateData, "error:", updateError);

      if (updateError) {
        console.error("[RSVP API] Error updating RSVP:", updateError);
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
      console.log("[RSVP API] Creating new RSVP for user:", user.id, "event:", id);
      // Create new RSVP using admin client to bypass RLS
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from("event_attendees")
        .insert({
          event_id: id,
          user_id: user.id,
          status: "going",
          registered_at: new Date().toISOString(),
        })
        .select();

      console.log("[RSVP API] Insert result - data:", insertData, "error:", insertError);

      if (insertError) {
        // Handle duplicate key error - record might have been created between check and insert
        if (insertError.code === "23505") {
          console.log("[RSVP API] Duplicate key, updating instead");
          // Duplicate key - update existing record instead
          const { data: updateData, error: updateError } = await supabaseAdmin
            .from("event_attendees")
            .update({
              status: "going",
              registered_at: new Date().toISOString(),
            })
            .eq("event_id", id)
            .eq("user_id", user.id)
            .select();

          console.log("[RSVP API] Update after duplicate - data:", updateData, "error:", updateError);

          if (updateError) {
            console.error("[RSVP API] Error updating RSVP after duplicate:", updateError);
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

        console.error("[RSVP API] Error creating RSVP:", insertError);
        return NextResponse.json(
          { error: "Failed to create RSVP" },
          { status: 500 }
        );
      }

      console.log("[RSVP API] RSVP created successfully");
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
 * @route GET /api/events/[id]/rsvp
 * @description Check current RSVP status
 * @access Authenticated
 */
export async function GET(
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

    // Check RSVP status
    const { data: rsvp, error: rsvpError } = await supabaseAdmin
      .from("event_attendees")
      .select("id, status, registered_at")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("[RSVP API GET] Event:", id, "User:", user.id, "RSVP:", rsvp, "Error:", rsvpError);

    if (rsvpError && rsvpError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to check RSVP" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasRsvp: !!rsvp,
      status: rsvp?.status || null,
      rsvp: rsvp
    });
  } catch (error: any) {
    console.error("Error in GET /api/events/[id]/rsvp:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    // Delete RSVP using admin client to bypass RLS
    const { error: deleteError } = await supabaseAdmin
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


