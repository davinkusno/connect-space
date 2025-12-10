import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/[id]/points
 * Get user's point summary by ID
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
    const result = await userService.getPoints(id);

    return NextResponse.json(
      result.success ? result.data : { error: result.error?.message },
      { status: result.status }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
