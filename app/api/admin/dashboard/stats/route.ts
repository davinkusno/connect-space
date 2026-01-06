import { userController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * GET /api/admin/dashboard/stats
 * Get admin dashboard statistics (superadmin only)
 */
export async function GET(request: NextRequest) {
  return userController.getAdminDashboardStats(request);
}






