import { adminController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * GET /api/admin/member-reports
 * Get all member reports with 30% threshold information
 * Returns both all reports and reports that meet the review threshold
 */
export async function GET(request: NextRequest) {
  return adminController.getMemberReports(request);
}

