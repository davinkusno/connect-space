import { communityController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * GET /api/communities/[id]/join-requests
 * Get join requests for a community with comprehensive user stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.getJoinRequestsWithStats(request, id);
}

