import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { communityService } from "@/lib/services";

/**
 * POST /api/events/create
 * Create a new event (community admins only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      location,
      start_time,
      end_time,
      image_url,
      community_id,
      is_online,
      max_attendees,
      link,
    } = body;

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const wordCount = description.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
    if (wordCount > 500) {
      return NextResponse.json(
        { error: `Description must be 500 words or less (current: ${wordCount})` },
        { status: 400 }
      );
    }

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: "Start and end time are required" },
        { status: 400 }
      );
    }

    if (!community_id) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      );
    }

    // Verify community exists
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("id, name, creator_id, category_id")
      .eq("id", community_id)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check permission
    const isAdmin = await communityService.isAdminOrCreator(community_id, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Prepare event data
    const insertData: Record<string, any> = {
      title,
      description,
      location: location || null,
      start_time,
      end_time,
      image_url: image_url || null,
      community_id,
      creator_id: user.id,
      is_online: is_online || false,
      max_attendees: max_attendees ? parseInt(max_attendees.toString()) : null,
      link: link || null,
    };

    // Set category
    if (category) {
      insertData.category = category;
    } else if (community.category_id) {
      const { data: catData } = await supabase
        .from("categories")
        .select("name")
        .eq("id", community.category_id)
        .single();

      if (catData?.name) {
        insertData.category = catData.name;
      }
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert(insertData)
      .select()
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }

    // Update community activity
    await supabase
      .from("communities")
      .update({
        last_activity_date: new Date().toISOString(),
        last_activity_type: "event",
        status: "active",
      })
      .eq("id", community_id);

    return NextResponse.json(event);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
