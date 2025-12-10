import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/[id]/transactions
 * Get user's point transactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Only allow users to see their own transactions
    if (user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await userService.getPoints(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message },
        { status: result.status }
      );
    }

    return NextResponse.json({
      transactions: result.data?.breakdown || [],
      total: result.data?.total || 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
