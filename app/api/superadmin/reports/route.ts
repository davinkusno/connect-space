import { NextRequest, NextResponse } from "next/server";
import { superAdminService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/superadmin/reports
 * Get all reports (super admin only)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const result = await superAdminService.getReports({ status, page, pageSize });

    return NextResponse.json(
      result.success
        ? { reports: result.data?.reports, total: result.data?.total }
        : { error: result.error?.message },
      { status: result.status }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
