import { communityController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * DELETE /api/communities/members/[id]
 * Remove a member from the community (kick)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.removeMember(request, id);
}

