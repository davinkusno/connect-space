import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const eventId = params.id;

    // Fetch the event with related data - simplified to avoid RLS issues
    const { data: event, error } = await supabase
      .from("events")
      .select(`
        *,
        users!events_creator_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          bio
        )
      `)
      .eq("id", eventId)
      .eq("is_cancelled", false)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Type assertion for the event data
    const eventData = event as any;

    // For now, allow access to all events (we'll implement proper access control later)
    // TODO: Implement proper community-based access control

    // Get related events from the same community
    const { data: relatedEvents } = await supabase
      .from("events")
      .select(`
        id,
        title,
        start_time,
        image_url,
        category,
        attendee_count,
        max_attendees
      `)
      .eq("community_id", eventData.community_id)
      .neq("id", eventId)
      .eq("is_cancelled", false)
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(5);

    // Get other events by the same creator
    const { data: creatorEvents } = await supabase
      .from("events")
      .select(`
        id,
        title,
        start_time,
        image_url,
        category,
        attendee_count,
        max_attendees
      `)
      .eq("creator_id", eventData.creator_id)
      .neq("id", eventId)
      .eq("is_cancelled", false)
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(3);

    // Transform the data to match the frontend interface
    const transformedEvent = {
      id: eventData.id,
      title: eventData.title,
      description: eventData.description,
      longDescription: eventData.description, // Using description as long description for now
      date: eventData.start_time.split('T')[0],
      time: eventData.start_time.split('T')[1]?.substring(0, 5) || "00:00",
      endTime: eventData.end_time.split('T')[1]?.substring(0, 5) || "00:00",
      location: {
        venue: eventData.location || "TBD",
        address: eventData.location || "",
        city: eventData.location_city || "",
        lat: eventData.location_lat || 0,
        lng: eventData.location_lng || 0,
        isOnline: eventData.is_online || false,
        meetingLink: eventData.is_online ? "https://zoom.us/j/123456789?pwd=abc123xyz" : undefined,
      },
      organizer: {
        name: eventData.users?.full_name || eventData.users?.username || "Unknown Organizer",
        image: eventData.users?.avatar_url || "/placeholder.svg",
        verified: true, // TODO: Add verification system
      },
      category: eventData.category || "General",
      price: {
        type: "free" as const, // TODO: Add price field to events table
        amount: 0,
        currency: "USD",
      },
      capacity: eventData.max_attendees || 100,
      registered: eventData.attendee_count || 0,
      image: eventData.image_url || "/placeholder.svg",
      images: [eventData.image_url || "/placeholder.svg"], // Single image for now
      tags: eventData.tags || [],
      website: undefined,
      relatedEvents: relatedEvents?.map((relatedEvent: any) => ({
        id: relatedEvent.id,
        title: relatedEvent.title,
        date: relatedEvent.start_time.split('T')[0],
        image: relatedEvent.image_url || "/placeholder.svg",
        category: relatedEvent.category || "General",
        tags: [],
        price: 0,
      })) || [],
      organizerEvents: creatorEvents?.map((creatorEvent: any) => ({
        id: creatorEvent.id,
        title: creatorEvent.title,
        date: creatorEvent.start_time.split('T')[0],
        image: creatorEvent.image_url || "/placeholder.svg",
        category: creatorEvent.category || "General",
        price: 0,
        attendees: creatorEvent.attendee_count || 0,
      })) || [],
      community: {
        id: eventData.community_id,
        name: "Community", // TODO: Fetch community name separately
        slug: "community",
        description: "Community description",
        logoUrl: null,
        isPrivate: false, // Default to public for now
      },
      creator: {
        id: eventData.users?.id,
        username: eventData.users?.username,
        fullName: eventData.users?.full_name,
        avatarUrl: eventData.users?.avatar_url,
        bio: eventData.users?.bio,
      },
      attendees: [], // TODO: Fetch attendees separately if needed
    };

    return NextResponse.json({ event: transformedEvent });

  } catch (error) {
    console.error("Error in get event API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const eventId = params.id;

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is the creator or has admin/moderator role
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`
        *,
        communities!inner(
          id,
          community_members!inner(
            user_id,
            role
          )
        )
      `)
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Type assertion for the event data
    const eventData = event as any;

    // Check permissions
    const isCreator = eventData.creator_id === user.id;
    const isAdminOrModerator = eventData.communities.community_members?.some(
      (member: any) => member.user_id === user.id && 
      (member.role === 'admin' || member.role === 'moderator')
    );

    if (!isCreator && !isAdminOrModerator) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedEvent, error: updateError } = await (supabase
      .from("events") as any)
      .update(updateData)
      .eq("id", eventId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating event:", updateError);
      return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }

    return NextResponse.json({ event: updatedEvent });

  } catch (error) {
    console.error("Error in update event API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const eventId = params.id;

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is the creator or has admin role
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`
        *,
        communities!inner(
          id,
          community_members!inner(
            user_id,
            role
          )
        )
      `)
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Type assertion for the event data
    const eventData = event as any;

    // Check permissions
    const isCreator = eventData.creator_id === user.id;
    const isAdmin = eventData.communities.community_members?.some(
      (member: any) => member.user_id === user.id && member.role === 'admin'
    );

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Soft delete by setting is_cancelled to true
    const { error: deleteError } = await (supabase
      .from("events") as any)
      .update({ 
        is_cancelled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (deleteError) {
      console.error("Error deleting event:", deleteError);
      return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }

    return NextResponse.json({ message: "Event deleted successfully" });

  } catch (error) {
    console.error("Error in delete event API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
