import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/events/saved
 * Get user's saved events
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch saved event records
    const { data: savedRecords, error: savedError } = await supabase
      .from("event_save")
      .select("event_id, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (savedError || !savedRecords?.length) {
      return NextResponse.json({ events: [] });
    }

    const eventIds = savedRecords.map((r) => r.event_id);

    // Fetch events
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("id, title, description, start_time, end_time, location, image_url, category, community_id")
      .in("id", eventIds);

    if (eventsError || !eventsData?.length) {
      return NextResponse.json({ events: [] });
    }

    // Fetch communities
    const communityIds = [...new Set(eventsData.map((e) => e.community_id).filter(Boolean))];
    const communitiesMap: Record<string, { name: string; logo_url?: string }> = {};

    if (communityIds.length > 0) {
      const { data: communities } = await supabase
        .from("communities")
        .select("id, name, logo_url")
        .in("id", communityIds);

      communities?.forEach((c) => {
        communitiesMap[c.id] = c;
      });
    }

    // Transform data
    const transformedEvents = savedRecords
      .map((record) => {
        const event = eventsData.find((e) => e.id === record.event_id);
        if (!event) return null;

        const community = event.community_id ? communitiesMap[event.community_id] : null;

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
      .filter(Boolean);

    return NextResponse.json({ events: transformedEvents });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
