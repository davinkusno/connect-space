import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * @route GET /api/posts?event_id=xxx
 * @description Get posts for an event
 * @access Public (authenticated users)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get("event_id");

    if (!event_id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Fetch posts for the event, ordered by is_pinned (pinned first), then by created_at (newest first)
    // Try with foreign key first, if it fails, use manual join
    let postsQuery = supabase
      .from("posts")
      .select("*")
      .eq("event_id", event_id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 }
      );
    }

    // If posts exist, fetch author information separately
    if (posts && posts.length > 0) {
      const authorIds = [...new Set(posts.map((p: any) => p.author_id))];
      const { data: authors } = await supabase
        .from("users")
        .select("id, full_name, avatar_url, email")
        .in("id", authorIds);

      // Map authors to posts
      const postsWithAuthors = posts.map((post: any) => ({
        ...post,
        author: authors?.find((a: any) => a.id === post.author_id) || null,
      }));

      return NextResponse.json(
        { posts: postsWithAuthors },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { posts: [] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in GET /api/posts:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

