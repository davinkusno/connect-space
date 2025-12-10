import { NextRequest } from "next/server";
import { userController } from "@/lib/controllers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return userController.getPointsById(request, id);
}
