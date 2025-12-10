import { NextRequest, NextResponse } from "next/server";
import { postService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/posts
 * Get posts with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("community_id") || undefined;
    const authorId = searchParams.get("author_id") || undefined;
    const type = searchParams.get("type") as any || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const result = await postService.getAll({
      communityId,
      authorId,
      type,
      page,
      pageSize,
    });

    return NextResponse.json(
      result.success
        ? { posts: result.data?.posts, total: result.data?.total }
        : { error: result.error?.message },
      { status: result.status }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
