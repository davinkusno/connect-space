import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const priceRange = searchParams.get("priceRange");
    const dateRange = searchParams.get("dateRange");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build the query - simplified to avoid RLS circular references
    let query = supabase
      .from("events")
      .select(`
        *,
        users!events_creator_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("is_cancelled", false)
      .order("start_time", { ascending: true });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (location && location !== "all") {
      if (location === "online") {
        query = query.eq("is_online", true);
      } else {
        query = query.ilike("location", `%${location}%`);
      }
    }

    if (priceRange && priceRange !== "all") {
      // Note: We'll need to add a price field to events table
      // For now, we'll skip this filter
    }

    if (dateRange && dateRange !== "all") {
      const now = new Date();
      switch (dateRange) {
        case "today":
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          query = query.gte("start_time", today.toISOString()).lt("start_time", tomorrow.toISOString());
          break;
        case "week":
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          query = query.gte("start_time", now.toISOString()).lte("start_time", weekFromNow.toISOString());
          break;
        case "month":
          const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          query = query.gte("start_time", now.toISOString()).lte("start_time", monthFromNow.toISOString());
          break;
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const transformedEvents = events?.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      tags: event.tags || [],
      date: event.start_time.split('T')[0],
      time: event.start_time.split('T')[1]?.substring(0, 5) || "00:00",
      endTime: event.end_time.split('T')[1]?.substring(0, 5) || "00:00",
      location: {
        latitude: event.location_lat || 0,
        longitude: event.location_lng || 0,
        address: event.location || "",
        venue: event.location || "",
        city: event.location_city || "",
        isOnline: event.is_online || false,
      },
      organizer: event.users?.full_name || event.users?.username || "Unknown",
      attendees: event.attendee_count || 0,
      maxAttendees: event.max_attendees || 0,
      price: 0, // TODO: Add price field to events table
      originalPrice: undefined,
      rating: 0, // TODO: Add rating system
      reviewCount: 0,
      image: event.image_url || "/placeholder.svg",
      gallery: [],
      trending: false, // TODO: Add trending logic
      featured: false, // TODO: Add featured logic
      isNew: new Date(event.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      difficulty: "Intermediate", // TODO: Add difficulty field
      duration: "2 hours", // TODO: Calculate from start/end time
      language: "English", // TODO: Add language field
      certificates: false, // TODO: Add certificates field
      community: {
        id: event.community_id,
        name: "Community", // TODO: Fetch community name separately if needed
        slug: "community",
        isPrivate: false, // Default to public for now
      },
      creator: {
        id: event.users?.id,
        username: event.users?.username,
        fullName: event.users?.full_name,
        avatarUrl: event.users?.avatar_url,
      },
    })) || [];

    return NextResponse.json({
      events: transformedEvents,
      total: transformedEvents.length,
      hasMore: transformedEvents.length === limit,
    });

  } catch (error) {
    console.error("Error in events API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      start_time,
      end_time,
      location,
      location_lat,
      location_lng,
      location_city,
      is_online,
      max_attendees,
      category,
      image_url,
      community_id,
    } = body;

    // Validate required fields
    if (!title || !description || !start_time || !end_time || !community_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user is a member of the community
    const { data: membership, error: membershipError } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", community_id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "You must be a member of this community to create events" }, { status: 403 });
    }

    // Create the event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        title,
        description,
        start_time,
        end_time,
        location,
        location_lat,
        location_lng,
        location_city,
        is_online: is_online || false,
        max_attendees,
        category,
        image_url,
        community_id,
        creator_id: user.id,
      })
      .select()
      .single();

    if (eventError) {
      console.error("Error creating event:", eventError);
      return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }

    return NextResponse.json({ event }, { status: 201 });

  } catch (error) {
    console.error("Error in create event API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
