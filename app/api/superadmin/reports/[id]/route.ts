import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

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

    const body = await request.json();
    const { action, reportIds, reviewNotes } = body;

    // Validate action
    const validActions = ["suspend", "dismiss", "resolve", "reactivate"];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be one of: suspend, dismiss, resolve, reactivate" },
        { status: 400 }
      );
    }

    // The id parameter is the communityId
    const communityId = id;
    
    // Create admin client to bypass RLS for super admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Verify the community exists
    const { data: community, error: communityError } = await supabaseAdmin
      .from("communities")
      .select("id")
      .eq("id", communityId)
      .single();

    if (communityError || !community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Update report statuses
    let newStatus: string;
    switch (action) {
      case "suspend":
        newStatus = "resolved";
        // Suspend the community - update status, suspended_at, and suspension_reason
        const now = new Date().toISOString();
        const suspensionReason = reviewNotes || "Suspended by super admin due to community reports";
        
        const { error: suspendError } = await supabaseAdmin
          .from("communities")
          .update({
            status: "suspended",
            suspended_at: now,
            suspension_reason: suspensionReason,
            updated_at: now,
          })
          .eq("id", communityId);

        if (suspendError) {
          console.error("Error suspending community:", suspendError);
          return NextResponse.json(
            { error: "Failed to suspend community", details: suspendError.message },
            { status: 500 }
          );
        }
        break;
      case "dismiss":
        newStatus = "dismissed";
        break;
      case "resolve":
        newStatus = "resolved";
        break;
      case "reactivate":
        newStatus = "resolved";
        // Reactivate the community - clear suspension fields and set status to active
        const reactivateNow = new Date().toISOString();
        const { error: reactivateError } = await supabaseAdmin
          .from("communities")
          .update({
            status: "active",
            suspended_at: null,
            suspension_reason: null,
            last_activity_date: reactivateNow,
            updated_at: reactivateNow,
          })
          .eq("id", communityId);

        if (reactivateError) {
          console.error("Error reactivating community:", reactivateError);
          return NextResponse.json(
            { error: "Failed to reactivate community", details: reactivateError.message },
            { status: 500 }
          );
        }
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
          reviewed_by: user.id,
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
          reviewed_by: user.id,
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

