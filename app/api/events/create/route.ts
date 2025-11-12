import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import {
  STORAGE_CONFIG,
  getStoragePath,
  generateUniqueFilename,
  isValidImageType,
  isValidFileSize,
} from "@/config/storage";

// Create Supabase client with service role key for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * @route POST /api/events/create
 * @description Create a new event
 * @access Private (community admins only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
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
      is_public,
      max_attendees,
    } = body;

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: "Start time and end time are required" },
        { status: 400 }
      );
    }

    if (!community_id) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      );
    }

    // Verify community exists and get details
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("id, name, creator_id")
      .eq("id", community_id)
      .single();

    if (communityError || !community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Check if user is admin or creator of the community
    const { data: membership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", community_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = membership && membership.role === "admin";
    const isCreator = community.creator_id === user.id;

    if (!isAdmin && !isCreator) {
      console.error("Permission denied:", {
        user_id: user.id,
        user_email: user.email,
        community_id: community_id,
        community_name: community.name,
        isAdmin,
        isCreator
      });
      return NextResponse.json(
        { error: "You don't have permission to create events in this community" },
        { status: 403 }
      );
    }

    // Log for debugging
    console.log("Creating event:", {
      title,
      community_id: community_id,
      community_name: community.name,
      user_id: user.id,
      user_email: user.email,
      isCreator,
      isAdmin
    });

    // Prepare insert data
    // Note: category column may not exist in the database schema
    // If you need category, add it to the events table first
    const insertData: any = {
      title,
      description,
      location,
      start_time,
      end_time,
      image_url: image_url || null,
      community_id,
      creator_id: user.id,
      is_online: is_online || false,
      is_public: is_public !== undefined ? is_public : true, // Default to true if not provided
      max_attendees: max_attendees ? parseInt(max_attendees.toString()) : null,
    }

    // Category column is not available in the database schema
    // Uncomment below if you add the category column to the events table:
    // if (category) {
    //   insertData.category = category
    // }

    // Create event
    console.log("Attempting to insert event with data:", insertData);
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert(insertData)
      .select()
      .single();

    if (eventError) {
      console.error("Error creating event:", eventError);
      console.error("Error details:", {
        code: eventError.code,
        message: eventError.message,
        details: eventError.details,
        hint: eventError.hint
      });
      return NextResponse.json(
        { 
          error: "Failed to create event", 
          details: eventError.message,
          code: eventError.code 
        },
        { status: 500 }
      );
    }

    if (!event) {
      console.error("Event creation returned no data");
      return NextResponse.json(
        { error: "Event creation failed - no data returned" },
        { status: 500 }
      );
    }

    console.log("Event created successfully:", {
      event_id: event.id,
      event_title: event.title,
      community_id: event.community_id,
      creator_id: event.creator_id
    });

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      data: event,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

