import { communityController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * @route POST /api/communities/[id]/update
 * @description Update community logo, banner, and location
 * @access Private (community admins only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return communityController.updateCommunity(request, params.id);
}
