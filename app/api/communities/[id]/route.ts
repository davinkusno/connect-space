import { communityController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * GET /api/communities/[id]
 * Get detailed community information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.getCommunityById(request, id);
}

/**
 * PATCH /api/communities/[id]
 * Update community details (creator or admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.updateCommunityById(request, id);
}

/**
 * DELETE /api/communities/[id]
 * Delete a community (creator only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.deleteCommunityById(request, id);
}
