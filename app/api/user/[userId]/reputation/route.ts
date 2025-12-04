import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { UserReputation } from "@/lib/points/user-points";

/**
 * GET /api/user/[userId]/reputation
 * Get user reputation summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createServerClient();

    // Call the database function to get reputation
    const { data, error } = await supabase.rpc("get_user_reputation", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Error fetching reputation:", error);
      // Fallback to manual calculation if function doesn't exist
      return await getReputationFallback(supabase, userId);
    }

    if (!data || data.length === 0) {
      // Return default reputation if user has no points
      return NextResponse.json({
        reputation: {
          activity_points: 0,
          report_points: 0,
          report_count: 0,
          posts_created: 0,
          events_joined: 0,
          communities_joined: 0,
          active_days: 0,
          last_activity_at: null,
          reputation_score: 0,
        } as UserReputation,
      });
    }

    return NextResponse.json({
      reputation: data[0] as UserReputation,
    });
  } catch (error: any) {
    console.error("Error in reputation API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Fallback method if database function doesn't exist
 */
async function getReputationFallback(supabase: any, userId: string) {
  const { data: points, error } = await supabase
    .from("user_points")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  if (!points || points.length === 0) {
    return NextResponse.json({
      reputation: {
        activity_points: 0,
        report_points: 0,
        report_count: 0,
        posts_created: 0,
        events_joined: 0,
        communities_joined: 0,
        active_days: 0,
        last_activity_at: null,
        reputation_score: 0,
      } as UserReputation,
    });
  }

  const activityPoints = points
    .filter(
      (p: any) =>
        !["report_received"].includes(p.point_type) && p.points > 0
    )
    .reduce((sum: number, p: any) => sum + p.points, 0);

  const reportPoints = points
    .filter((p: any) => p.point_type === "report_received")
    .reduce((sum: number, p: any) => sum + Math.abs(p.points), 0);

  const reportCount = points.filter(
    (p: any) => p.point_type === "report_received"
  ).length;

  const postsCreated = points.filter(
    (p: any) => p.point_type === "post_created"
  ).length;

  const eventsJoined = points.filter(
    (p: any) => p.point_type === "event_joined"
  ).length;

  const communitiesJoined = points.filter(
    (p: any) => p.point_type === "community_joined"
  ).length;

  const activeDays = points.filter(
    (p: any) => p.point_type === "daily_active"
  ).length;

  const lastActivity = points.length > 0
    ? points.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0].created_at
    : null;

  const reputationScore = activityPoints - reportPoints * 10;

  return NextResponse.json({
    reputation: {
      activity_points: activityPoints,
      report_points: reportPoints,
      report_count: reportCount,
      posts_created: postsCreated,
      events_joined: eventsJoined,
      communities_joined: communitiesJoined,
      active_days: activeDays,
      last_activity_at: lastActivity,
      reputation_score: reputationScore,
    } as UserReputation,
  });
}

