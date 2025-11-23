import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { report_type, target_id, reason, details } = body;

    // Validate required fields
    if (!report_type || !target_id || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: report_type, target_id, and reason are required" },
        { status: 400 }
      );
    }

    // Validate report_type
    const validReportTypes = ["community", "post", "member", "event"];
    if (!validReportTypes.includes(report_type)) {
      return NextResponse.json(
        { error: "Invalid report_type. Must be one of: community, post, member, event" },
        { status: 400 }
      );
    }

    // Check if user has already reported this target
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", session.user.id)
      .eq("report_type", report_type)
      .eq("target_id", target_id)
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this item" },
        { status: 409 }
      );
    }

    // Insert the report
    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: session.user.id,
        report_type,
        target_id,
        reason,
        details: details || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to submit report" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Report submitted successfully",
        report_id: report.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

