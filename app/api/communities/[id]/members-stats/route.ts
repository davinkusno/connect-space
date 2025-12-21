import { communityController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * GET /api/communities/[id]/members-stats
 * Get community members with comprehensive user stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.getMembersWithStats(request, id);
}

