import { NextRequest, NextResponse } from "next/server";
import { superAdminService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/superadmin/reports/[id]
 * Get report by ID
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

    const isAdmin = await superAdminService.isSuperAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const result = await superAdminService.getReportById(id);

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

/**
 * PATCH /api/superadmin/reports/[id]
 * Update report (resolve or dismiss)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await superAdminService.isSuperAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { action, resolution, userAction } = await request.json();

    let result;
    if (action === "resolve") {
      result = await superAdminService.resolveReport(id, user.id, resolution, userAction);
    } else if (action === "dismiss") {
      result = await superAdminService.dismissReport(id, user.id, resolution);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

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
