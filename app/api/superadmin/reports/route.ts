import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/superadmin/reports
 * Fetch all community reports grouped by community for superadmin
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is super admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (userError || userData?.user_type !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      );
    }

    // Fetch all community reports with pending status
    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select(`
        id,
        reporter_id,
        target_id,
        reason,
        details,
        status,
        created_at
      `)
      .eq("report_type", "community")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (reportsError) {
      console.error("Error fetching reports:", reportsError);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 }
      );
    }

    // Group reports by community (target_id)
    const communityReportsMap = new Map<string, any>();

    for (const report of reports || []) {
      const communityId = report.target_id;
      
      // Fetch reporter details
      const { data: reporter } = await supabase
        .from("users")
        .select("id, full_name, email, avatar_url")
        .eq("id", report.reporter_id)
        .single();
      
      if (!communityReportsMap.has(communityId)) {
        // Fetch community details
        const { data: community, error: communityError } = await supabase
          .from("communities")
          .select(`
            id,
            name,
            description,
            category_id,
            categories(name),
            member_count,
            created_at,
            creator_id,
            status,
            suspended_at,
            suspension_reason
          `)
          .eq("id", communityId)
          .single();

        if (communityError || !community) {
          console.error(`Error fetching community ${communityId}:`, communityError);
          continue;
        }

        // Get last activity (from events or posts)
        const { data: lastEvent } = await supabase
          .from("events")
          .select("created_at")
          .eq("community_id", communityId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { data: lastPost } = await supabase
          .from("posts")
          .select("created_at")
          .eq("community_id", communityId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const lastActivity = lastEvent?.created_at || lastPost?.created_at || community.created_at;

        // Fetch creator details
        const { data: creator } = await supabase
          .from("users")
          .select("id, full_name, email, avatar_url")
          .eq("id", community.creator_id)
          .single();

        communityReportsMap.set(communityId, {
          id: `rep-${communityId}`,
          communityId: community.id,
          communityName: community.name,
          category: (community.categories as any)?.name || "General",
          reportCount: 0,
          lastReportDate: report.created_at,
          status: "pending",
          communityStatus: community.status || "active",
          suspendedAt: community.suspended_at,
          suspensionReason: community.suspension_reason,
          reports: [],
          communityDetails: {
            memberCount: community.member_count || 0,
            createdAt: community.created_at,
            lastActivity: lastActivity,
            admin: {
              name: creator?.full_name || "Unknown",
              email: creator?.email || "",
            },
          },
        });
      }

      const communityReport = communityReportsMap.get(communityId);
      communityReport.reportCount += 1;
      communityReport.reports.push({
        reportedBy: report.reporter_id,
        reporterName: reporter?.full_name || "Unknown",
        reason: report.reason,
        description: report.details || "",
        reportDate: report.created_at,
      });

      // Update last report date if this is newer
      if (new Date(report.created_at) > new Date(communityReport.lastReportDate)) {
        communityReport.lastReportDate = report.created_at;
      }
    }

    // Convert map to array
    const groupedReports = Array.from(communityReportsMap.values());

    return NextResponse.json({
      reports: groupedReports,
      total: groupedReports.length,
    });
  } catch (error) {
    console.error("Error in GET /api/superadmin/reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

