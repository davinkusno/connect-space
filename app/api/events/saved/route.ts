import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    console.log("[API] /api/events/saved - GET request received");
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log("[API] User check - user:", user ? "exists" : "null");
    console.log("[API] User check - userError:", userError);

    if (!user) {
      console.log("[API] No user, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[API] Fetching saved events for user:", user.id);

    // First, fetch saved event IDs
    const { data: savedRecords, error: savedError } = await supabase
      .from("event_save")
      .select("event_id, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    console.log("[API] Saved records query result:", savedRecords?.length || 0);
    console.log("[API] Saved records error:", savedError);

    if (savedError) {
      console.error("[API] Error fetching saved events:", savedError);
      console.error("[API] Error code:", savedError.code);
      console.error("[API] Error message:", savedError.message);
      // Return empty array instead of error to allow UI to function
      return NextResponse.json({ events: [] }, { status: 200 });
    }

    if (!savedRecords || savedRecords.length === 0) {
      console.log("[API] No saved records found, returning empty array");
      return NextResponse.json({ events: [] }, { status: 200 });
    }

    console.log("[API] Found", savedRecords.length, "saved records");

    // Get event IDs
    const eventIds = savedRecords.map((r: any) => r.event_id);
    console.log("[API] Event IDs to fetch:", eventIds);
    console.log("[API] Event IDs count:", eventIds.length);

    if (eventIds.length === 0) {
      console.log("[API] No event IDs to fetch");
      return NextResponse.json({ events: [] }, { status: 200 });
    }

    // Fetch events separately to avoid RLS issues with nested selects
    let eventsData: any[] = [];

    try {
      // Try to fetch events - use same approach as /api/events route
      const { data, error } = await supabase
        .from("events")
        .select("id, title, description, start_time, end_time, location, image_url, category, community_id")
        .in("id", eventIds);

      if (error) {
        console.error("[API] Error fetching events - code:", error.code);
        console.error("[API] Error fetching events - message:", error.message);
        console.error("[API] Error fetching events - hint:", error.hint);
        console.error("[API] Error fetching events - details:", JSON.stringify(error, null, 2));
        
        // Check if it's a column error
        if (error.code === "42703" || error.message?.includes("column") || error.message?.includes("does not exist")) {
          console.error("[API] Column error detected - trying with minimal columns");
          // Try with minimal columns that should always exist
          const { data: minimalData, error: minimalError } = await supabase
            .from("events")
            .select("id, title, start_time, location, community_id")
            .in("id", eventIds);
          
          if (minimalError) {
            console.error("[API] Minimal query also failed:", minimalError);
            console.warn("[API] Returning empty array due to query errors");
            eventsData = [];
          } else {
            eventsData = minimalData || [];
            console.log("[API] Minimal query succeeded, got", eventsData.length, "events");
          }
        } else {
          // For other errors, log but continue with empty array
          console.error("[API] Non-column error, continuing with empty events array");
          eventsData = [];
        }
      } else {
        eventsData = data || [];
        console.log("[API] Events query result:", eventsData.length);
      }
    } catch (err: any) {
      console.error("[API] Exception fetching events:", err);
      console.error("[API] Exception message:", err.message);
      console.error("[API] Exception stack:", err.stack);
      // Don't return error, just continue with empty array
      eventsData = [];
    }

    if (!eventsData || eventsData.length === 0) {
      console.log("[API] No events found for saved event IDs");
      // Return empty array instead of error - this allows the UI to show "No saved events" properly
      return NextResponse.json({ events: [] }, { status: 200 });
    }

    console.log("[API] Found", eventsData.length, "events");

    // Fetch communities for events
    const communityIds = [...new Set(eventsData.map((e: any) => e.community_id).filter(Boolean))];
    let communitiesData: any[] = [];
    
    if (communityIds.length > 0) {
      const { data: fetchedCommunities, error: communitiesError } = await supabase
        .from("communities")
        .select("id, name, logo_url")
        .in("id", communityIds);
      
      if (communitiesError) {
        console.error("[API] Error fetching communities:", communitiesError);
      } else {
        communitiesData = fetchedCommunities || [];
      }
    }

    // Transform data - combine saved records with events
    const transformedEvents = savedRecords
      .map((record: any) => {
        const event = eventsData.find((e: any) => e.id === record.event_id);
        if (!event) {
          console.warn("[API] Event not found for saved record:", record.event_id);
          return null;
        }

        const community = communitiesData.find(c => c.id === event.community_id);
        
        return {
          id: event.id,
          title: event.title || "Untitled Event",
          description: event.description || "",
          date: event.start_time,
          time: new Date(event.start_time).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          location: event.location || "Unknown",
          image: event.image_url || null,
          category: event.category || "General",
          community: community?.name || "Community",
          savedAt: record.saved_at,
        };
      })
      .filter((event: any) => event !== null);

    console.log("[API] Transformed events count:", transformedEvents.length);
    console.log("[API] Returning", transformedEvents.length, "events to client");

    return NextResponse.json({ events: transformedEvents }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Error in saved events route:", error);
    console.error("[API] Error message:", error.message);
    console.error("[API] Error stack:", error.stack);
    // Return empty array instead of error to allow UI to function
    return NextResponse.json({ events: [] }, { status: 200 });
  }
}

