import { reportController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * GET /api/communities/[id]/reports
 * Get member reports for a community (admin/moderator only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return reportController.getCommunityReports(request, id);
}



