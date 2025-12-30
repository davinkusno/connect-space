import { reportController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * POST /api/admin/reports/[id]/ban
 * Ban reported content and apply appropriate moderation actions
 * @param request - The incoming request with ban reason
 * @param params - Route parameters containing report ID
 * @returns NextResponse with ban result
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return reportController.banReportedContent(request, id);
}
