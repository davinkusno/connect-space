import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * @route POST /api/posts/create
 * @description Create a new post for an event
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
      content,
      community_id,
      event_id,
      is_pinned,
    } = body;

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    if (!community_id || !event_id) {
      return NextResponse.json(
        { error: "Community ID and Event ID are required" },
        { status: 400 }
      );
    }

    // Verify event exists and get community_id from event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("community_id")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Verify community_id matches
    if (event.community_id !== community_id) {
      return NextResponse.json(
        { error: "Community ID does not match event's community" },
        { status: 400 }
      );
    }

    // Check if user is admin of the community
    const { data: membership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", community_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = membership && membership.role === "admin";
    
    // Also check if user is creator of the community
    const { data: community } = await supabase
      .from("communities")
      .select("creator_id")
      .eq("id", community_id)
      .single();

    const isCreator = community && community.creator_id === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "You don't have permission to create posts in this community" },
        { status: 403 }
      );
    }

    // Create post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        title,
        content,
        author_id: user.id,
        community_id,
        event_id,
        is_pinned: is_pinned || false,
      })
      .select()
      .single();

    if (postError) {
      console.error("Error creating post:", postError);
      return NextResponse.json(
        { error: "Failed to create post", details: postError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { post, message: "Post created successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/posts/create:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}


