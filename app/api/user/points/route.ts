import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { PointTransaction } from "@/lib/points/user-points";

/**
 * POST /api/user/points
 * Award points to a user
 * Requires service role or authenticated user awarding to themselves
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const body: PointTransaction = await request.json();

    // Validate required fields
    if (!body.user_id || !body.points || !body.point_type) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, points, point_type" },
        { status: 400 }
      );
    }

    // Check if user is awarding to themselves or using service role
    // In production, you might want to restrict this to service role only
    // For now, allow users to award points to themselves
    if (session?.user.id !== body.user_id) {
      // Check if user is admin/moderator (can award points to others)
      const { data: isAdmin } = await supabase
        .from("community_members")
        .select("id")
        .eq("user_id", session?.user.id)
        .in("role", ["admin", "moderator"])
        .limit(1)
        .single();

      if (!isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized: Can only award points to yourself or need admin role" },
          { status: 403 }
        );
      }
    }

    // Insert point transaction
    const { data, error } = await supabase
      .from("user_points")
      .insert({
        user_id: body.user_id,
        points: body.points,
        point_type: body.point_type,
        related_id: body.related_id || null,
        related_type: body.related_type || null,
        description: body.description || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting points:", error);
      return NextResponse.json(
        { error: "Failed to award points", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: data,
    });
  } catch (error: any) {
    console.error("Error in points API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
