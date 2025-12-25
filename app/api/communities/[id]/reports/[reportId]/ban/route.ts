import { reportController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * POST /api/communities/[id]/reports/[reportId]/ban
 * Ban a user from the community based on a report (admin/moderator only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  return reportController.banUserFromCommunity(request, id, reportId);
}

