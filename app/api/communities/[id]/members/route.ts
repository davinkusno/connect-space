import { NextRequest } from "next/server";
import { communityController } from "@/lib/controllers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.getMembers(request, id);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return communityController.addMember(request, id);
}
