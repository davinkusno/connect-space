import { NextRequest, NextResponse } from "next/server";
import { superAdminService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/superadmin/inactive-communities
 * Get inactive communities
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

    const result = await superAdminService.getInactiveCommunities();

    return NextResponse.json(
      result.success
        ? { communities: result.data }
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

/**
 * POST /api/superadmin/inactive-communities
 * Suspend or reactivate a community
 */
export async function POST(request: NextRequest) {
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

    const { communityId, action, reason } = await request.json();

    if (!communityId || !action) {
      return NextResponse.json(
        { error: "Community ID and action are required" },
        { status: 400 }
      );
    }

    let result;
    if (action === "suspend") {
      result = await superAdminService.suspendCommunity(communityId, reason || "Inactivity");
    } else if (action === "reactivate") {
      result = await superAdminService.reactivateCommunity(communityId);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(
      result.success
        ? { message: `Community ${action}d successfully` }
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
