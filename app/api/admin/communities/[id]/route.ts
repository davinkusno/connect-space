import { adminController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * GET /api/admin/communities/[id]
 * Get community details for superadmin (read-only access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return adminController.getCommunityDetails(request, id);
}



