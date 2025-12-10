import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * @route GET /api/events/interested
 * @description Get events the user is interested in (RSVP'd)
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

    console.log("[API Interested Events] User ID:", user.id);

    // Fetch attendee records using admin client to bypass RLS
    const { data: attendeeRecords, error: attendeeError } = await supabaseAdmin
      .from("event_attendees")
      .select("event_id, status, registered_at")
      .eq("user_id", user.id)
      .in("status", ["going", "maybe"])
      .order("registered_at", { ascending: false });

    console.log("[API Interested Events] Attendee records:", attendeeRecords?.length || 0);

    if (attendeeError) {
      console.error("[API Interested Events] Error fetching attendee records:", attendeeError);
      return NextResponse.json(
        { error: "Failed to fetch interested events" },
        { status: 500 }
      );
    }

    if (!attendeeRecords || attendeeRecords.length === 0) {
      console.log("[API Interested Events] No attendee records found");
      return NextResponse.json({ events: [] });
    }

    // Get event IDs
    const eventIds = attendeeRecords.map((r: any) => r.event_id);
    console.log("[API Interested Events] Event IDs:", eventIds);

    // Fetch events data
    const { data: eventsData, error: eventsError } = await supabaseAdmin
      .from("events")
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        location,
        image_url,
        is_online,
        community_id
      `)
      .in("id", eventIds);

    if (eventsError) {
      console.error("[API Interested Events] Error fetching events:", eventsError);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    // Fetch communities for the events
    const communityIds = [...new Set((eventsData || []).map(e => e.community_id).filter(Boolean))];
    let communitiesMap: Record<string, any> = {};
    
    if (communityIds.length > 0) {
      const { data: communitiesData } = await supabaseAdmin
        .from("communities")
        .select("id, name, logo_url")
        .in("id", communityIds);

      if (communitiesData) {
        communitiesData.forEach((c: any) => {
          communitiesMap[c.id] = c;
        });
      }
    }

    // Transform events
    const transformedEvents = (eventsData || []).map((event: any) => {
      const community = event.community_id ? communitiesMap[event.community_id] : null;
      
      // Parse location
      let locationData: any = {};
      if (event.location) {
        try {
          locationData = typeof event.location === "string"
            ? JSON.parse(event.location)
            : event.location;
        } catch {
          locationData = { address: event.location, city: event.location };
        }
      }

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        locationData,
        image_url: event.image_url,
        is_online: event.is_online,
        community_id: event.community_id,
        community: community ? {
          id: community.id,
          name: community.name,
          logo_url: community.logo_url,
        } : null,
      };
    });

    console.log("[API Interested Events] Returning", transformedEvents.length, "events");

    return NextResponse.json({ events: transformedEvents });
  } catch (error: any) {
    console.error("[API Interested Events] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

