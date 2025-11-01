import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET user's badges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user badges with badge details
    const { data, error } = await supabase
      .from("user_badges")
      .select(
        `
        *,
        badge:badges(*)
      `
      )
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST add badge to user (super_admin only - for awarding/gifting badges)
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await requireSuperAdmin(request);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.error?.includes("Super admin") ? 403 : 401 }
      );
    }

    const body = await request.json();
    const { userId, badgeId } = body;

    if (!userId || !badgeId) {
      return NextResponse.json(
        { error: "User ID and Badge ID are required" },
        { status: 400 }
      );
    }

    // Check if user already owns this badge
    const { data: existingBadge } = await supabase
      .from("user_badges")
      .select("*")
      .eq("user_id", userId)
      .eq("badge_id", badgeId)
      .single();

    if (existingBadge) {
      return NextResponse.json(
        { error: "User already owns this badge" },
        { status: 400 }
      );
    }

    // Get badge price
    const { data: badge } = await supabase
      .from("badges")
      .select("price")
      .eq("id", badgeId)
      .single();

    // Create user_badge record
    const { data: userBadge, error } = await supabase
      .from("user_badges")
      .insert([
        {
          user_id: userId,
          badge_id: badgeId,
          purchased_at: new Date().toISOString(),
          purchase_price: badge?.price || 0,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(userBadge[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
