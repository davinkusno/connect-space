import { reportController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * PATCH /api/communities/[id]/reports/[reportId]
 * Update report status (admin/moderator only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  return reportController.updateCommunityReportStatus(request, id, reportId);
}



