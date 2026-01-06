import { reportController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * POST /api/communities/[id]/reports/[reportId]/delete-content
 * Delete reported thread or reply content (admin/moderator only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  return reportController.deleteReportedContent(request, id, reportId);
}






