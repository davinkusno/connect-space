import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * @route GET /api/events
 * @description Get a list of events with filtering and pagination
 * @access Public
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || null;
    const category = searchParams.get("category") || null;
    const location = searchParams.get("location") || null;
    const dateRange = searchParams.get("dateRange") || "upcoming"; // upcoming, today, week, month, all
    const sortBy = searchParams.get("sortBy") || "start_time";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Calculate pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build the query
    let query = supabase
      .from("events")
      .select(
        `
        *,
        community:community_id(id, name, logo_url),
        creator:creator_id(id, username, full_name, avatar_url),
        attendees:event_attendees(count)
      `,
        { count: "exact" }
      );

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Date range filter
    const now = new Date().toISOString();
    if (dateRange === "upcoming") {
      // Show upcoming events only
      query = query.gte("start_time", now);
    } else if (dateRange === "all") {
      // Show all events (no date filter)
      // Don't apply any date filter
    } else if (dateRange === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      query = query
        .gte("start_time", todayStart.toISOString())
        .lte("start_time", todayEnd.toISOString());
    } else if (dateRange === "week") {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      query = query
        .gte("start_time", now)
        .lte("start_time", weekFromNow.toISOString());
    } else if (dateRange === "month") {
      const monthFromNow = new Date();
      monthFromNow.setMonth(monthFromNow.getMonth() + 1);
      query = query
        .gte("start_time", now)
        .lte("start_time", monthFromNow.toISOString());
    }

    // Location filter (for online events)
    if (location === "online") {
      query = query.eq("is_online", true);
    } else if (location && location !== "all") {
      // Filter by location text (city, address, etc.)
      query = query.ilike("location", `%${location}%`);
    }

    // Apply sorting
    if (sortBy === "start_time") {
      query = query.order("start_time", { ascending: sortOrder === "asc" });
    } else if (sortBy === "created_at") {
      query = query.order("created_at", { ascending: sortOrder === "asc" });
    }

    // Apply pagination
    const { data: events, error, count } = await query.range(from, to);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events", details: error.message },
        { status: 500 }
      );
    }

    // Get attendee counts for each event
    const eventIds = events?.map((e: any) => e.id) || [];
    let attendeeCounts: Record<string, number> = {};

    if (eventIds.length > 0) {
      const { data: attendeesData } = await supabase
        .from("event_attendees")
        .select("event_id")
        .in("event_id", eventIds)
        .eq("status", "going");

      if (attendeesData) {
        attendeesData.forEach((att: any) => {
          attendeeCounts[att.event_id] = (attendeeCounts[att.event_id] || 0) + 1;
        });
      }
    }

    // Transform the data to match the expected format
    const transformedEvents = (events || []).map((event: any) => {
      // Parse location if it's a JSON string
      let locationData: any = {};
      if (event.location) {
        try {
          locationData = typeof event.location === "string" 
            ? JSON.parse(event.location) 
            : event.location;
        } catch {
          // If not JSON, treat as plain text
          locationData = { address: event.location };
        }
      }

      const startDate = new Date(event.start_time);
      const endDate = new Date(event.end_time);
      const attendeeCount = attendeeCounts[event.id] || 0;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category || "General",
        tags: event.category ? [event.category] : [],
        date: startDate.toISOString().split("T")[0],
        time: startDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        endTime: endDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        location: {
          latitude: locationData.latitude || locationData.lat || 0,
          longitude: locationData.longitude || locationData.lng || 0,
          address: locationData.address || event.location || "",
          venue: locationData.venue || locationData.name || "",
          city: locationData.city || locationData.town || locationData.municipality || "Unknown",
          isOnline: event.is_online || false,
        },
        organizer: (event.creator as any)?.full_name || (event.creator as any)?.username || "Unknown",
        attendees: attendeeCount,
        maxAttendees: event.max_attendees || null,
        rating: 4.5, // Default rating (can be calculated from reviews if available)
        reviewCount: 0, // Can be calculated from reviews table if available
        image: event.image_url || "/placeholder.svg?height=300&width=500",
        gallery: [],
        trending: false, // Can be calculated based on recent growth/activity
        featured: false, // Can be set by admins
        isNew: new Date(event.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // Created within last 7 days
        difficulty: "Intermediate", // Default
        duration: calculateDuration(event.start_time, event.end_time),
        language: "English", // Default
        certificates: false, // Default
        isPrivate: false, // Default (can be added to schema if needed)
        community: event.community ? {
          id: event.community.id,
          name: event.community.name,
          logo: event.community.logo_url,
        } : null,
      };
    });

    return NextResponse.json(
      {
        events: transformedEvents,
        pagination: {
          page,
          pageSize,
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in GET /api/events:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to calculate duration
function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return diffMinutes > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffHours} hours`;
  }
  return `${diffMinutes} minutes`;
}

