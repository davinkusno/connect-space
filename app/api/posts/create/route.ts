import { NextRequest, NextResponse } from "next/server";
import { postService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/posts/create
 * Create a new post
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, community_id, type } = body;

    if (!title || !content || !community_id) {
      return NextResponse.json(
        { error: "Title, content, and community_id are required" },
        { status: 400 }
      );
    }

    const result = await postService.create(user.id, {
      title,
      content,
      community_id,
      type,
    });

    return NextResponse.json(
      result.success ? result.data : { error: result.error?.message },
      { status: result.status }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
