import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/role
 * Get current user's role
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await userService.getById(user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message },
        { status: result.status }
      );
    }

    return NextResponse.json({
      user_type: result.data?.user_type || "member",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
