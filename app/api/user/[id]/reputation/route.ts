import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/[id]/reputation
 * Get user's reputation (points summary)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await userService.getPoints(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message },
        { status: result.status }
      );
    }

    // Transform to reputation format
    const data = result.data!;
    return NextResponse.json({
      total: data.total,
      level: calculateLevel(data.total),
      activities: data.activities,
      reports: data.reports,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateLevel(points: number): string {
  if (points >= 1000) return "Expert";
  if (points >= 500) return "Advanced";
  if (points >= 100) return "Intermediate";
  if (points >= 25) return "Beginner";
  return "Newcomer";
}
