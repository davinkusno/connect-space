import { communityController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.updateMemberRole(request, id);
}

