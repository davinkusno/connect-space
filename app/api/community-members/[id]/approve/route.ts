import { NextRequest } from "next/server";
import { communityController } from "@/lib/controllers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.approveRequest(request, id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.rejectRequest(request, id);
}
