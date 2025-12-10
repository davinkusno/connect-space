import { NextRequest, NextResponse } from "next/server";
import { reportService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/reports
 * Get all reports (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const result = await reportService.getAll(status);
    return NextResponse.json(
      result.success ? { reports: result.data } : { error: result.error?.message },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Create a new report
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = await reportService.create(user.id, body);

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
