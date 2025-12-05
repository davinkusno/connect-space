import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Track ad click or view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type } = body; // 'click' or 'view'

    if (!type || !["click", "view"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'click' or 'view'" },
        { status: 400 }
      );
    }

    const field = type === "click" ? "click_count" : "view_count";

    // Get current ad to increment the count
    const { data: currentAd, error: fetchError } = await supabase
      .from("ads")
      .select(field)
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching ad for tracking:", fetchError);
      return NextResponse.json(
        { error: "Ad not found" },
        { status: 404 }
      );
    }

    if (!currentAd) {
      return NextResponse.json(
        { error: "Ad not found" },
        { status: 404 }
      );
    }

    // Increment the count
    const currentCount = currentAd[field] || 0;
    const { error: updateError } = await supabase
      .from("ads")
      .update({
        [field]: currentCount + 1,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error tracking ad:", updateError);
      return NextResponse.json(
        { error: "Failed to track ad" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in POST /api/ads/[id]/track:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

