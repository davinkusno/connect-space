import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/points
 * Get current user's point summary
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await userService.getPoints(user.id);
    return NextResponse.json(
      result.success ? result.data : { error: result.error?.message },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
