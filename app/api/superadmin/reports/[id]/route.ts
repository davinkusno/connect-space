import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * PATCH /api/superadmin/reports/[id]
 * Update report status or take action on a community
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    
    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is super admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", session.user.id)
      .single();

    if (userError || userData?.user_type !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, reportIds, reviewNotes } = body;

    // Validate action
    const validActions = ["suspend", "dismiss", "resolve"];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be one of: suspend, dismiss, resolve" },
        { status: 400 }
      );
    }

    // Get community ID from the report
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("target_id")
      .eq("report_type", "community")
      .eq("target_id", id)
      .limit(1)
      .single();

    if (reportError && action !== "dismiss") {
      // For dismiss, we might not need the community
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const communityId = report?.target_id || id;

    // Update report statuses
    let newStatus: string;
    switch (action) {
      case "suspend":
        newStatus = "resolved";
        // Suspend the community (you may need to add a status field to communities table)
        const { error: suspendError } = await supabase
          .from("communities")
          .update({
            // If you have a status field, update it here
            // status: "suspended",
            updated_at: new Date().toISOString(),
          })
          .eq("id", communityId);

        if (suspendError) {
          console.error("Error suspending community:", suspendError);
        }
        break;
      case "dismiss":
        newStatus = "dismissed";
        break;
      case "resolve":
        newStatus = "resolved";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update all reports for this community
    const reportIdsToUpdate = reportIds || [];
    if (reportIdsToUpdate.length === 0) {
      // Update all pending reports for this community
      const { error: updateError } = await supabase
        .from("reports")
        .update({
          status: newStatus,
          reviewed_by: session.user.id,
          review_notes: reviewNotes || null,
          resolved_at: action === "resolve" || action === "suspend" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("report_type", "community")
        .eq("target_id", communityId)
        .eq("status", "pending");

      if (updateError) {
        console.error("Error updating reports:", updateError);
        return NextResponse.json(
          { error: "Failed to update reports" },
          { status: 500 }
        );
      }
    } else {
      // Update specific reports
      const { error: updateError } = await supabase
        .from("reports")
        .update({
          status: newStatus,
          reviewed_by: session.user.id,
          review_notes: reviewNotes || null,
          resolved_at: action === "resolve" || action === "suspend" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .in("id", reportIdsToUpdate);

      if (updateError) {
        console.error("Error updating reports:", updateError);
        return NextResponse.json(
          { error: "Failed to update reports" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: `Reports ${action}ed successfully`,
      communityId,
      action,
    });
  } catch (error) {
    console.error("Error in PATCH /api/superadmin/reports/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

