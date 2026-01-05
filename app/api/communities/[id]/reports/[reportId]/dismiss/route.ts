import { reportController } from "@/lib/controllers";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/communities/[id]/reports/[reportId]/dismiss
 * Dismiss a report (mark as dismissed/invalid)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
): Promise<NextResponse> {
  const { id, reportId } = await params;
  return reportController.dismissCommunityReport(request, id, reportId);
}





