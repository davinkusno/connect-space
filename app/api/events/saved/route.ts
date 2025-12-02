import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * @route GET /api/events/saved
 * @description Get all saved events for the current user
 * @access Authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

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

    // Get saved event IDs
    const { data: savedEvents, error: savedError } = await supabase
      .from("saved_events")
      .select("event_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (savedError) {
      console.error("Error fetching saved events:", savedError);
      return NextResponse.json(
        { error: "Failed to fetch saved events" },
        { status: 500 }
      );
    }

    if (!savedEvents || savedEvents.length === 0) {
      return NextResponse.json(
        { events: [], count: 0 },
        { status: 200 }
      );
    }

    // Get full event details
    const eventIds = savedEvents.map((se) => se.event_id);
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(`
        *,
        community:community_id(id, name, logo_url),
        creator:creator_id(id, username, full_name, avatar_url),
        attendees:event_attendees(count)
      `)
      .in("id", eventIds)
      .order("start_time", { ascending: true });

    if (eventsError) {
      console.error("Error fetching event details:", eventsError);
      return NextResponse.json(
        { error: "Failed to fetch event details" },
        { status: 500 }
      );
    }

    // Get attendee counts
    const eventIdsForCount = events?.map((e: any) => e.id) || [];
    let attendeeCounts: Record<string, number> = {};

    if (eventIdsForCount.length > 0) {
      const { data: attendees } = await supabase
        .from("event_attendees")
        .select("event_id")
        .in("event_id", eventIdsForCount);

      (attendees || []).forEach((att: any) => {
        attendeeCounts[att.event_id] = (attendeeCounts[att.event_id] || 0) + 1;
      });
    }

    // Format events with attendee counts
    const formattedEvents = (events || []).map((event: any) => ({
      ...event,
      attendees: attendeeCounts[event.id] || 0,
    }));

    return NextResponse.json(
      {
        events: formattedEvents,
        count: formattedEvents.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in get saved events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


