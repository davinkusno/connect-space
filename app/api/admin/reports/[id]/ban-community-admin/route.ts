import { adminController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * POST /api/admin/reports/[id]/ban-community-admin
 * Ban a community admin from creating communities (superadmin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return adminController.banCommunityAdmin(request, id);
}

