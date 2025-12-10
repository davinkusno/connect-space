import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/ai/generate-community-description
 * Generate a community description using AI
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { communityName, category, keywords } = await request.json();

    if (!communityName || !category) {
      return NextResponse.json(
        { error: "Community name and category are required" },
        { status: 400 }
      );
    }

    const result = await aiService.generateCommunityDescription(
      communityName,
      category,
      keywords
    );

    return NextResponse.json(
      result.success
        ? { description: result.data }
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
