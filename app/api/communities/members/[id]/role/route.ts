import { NextRequest } from "next/server";
import { communityController } from "@/lib/controllers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.updateMemberRole(request, id);
}

