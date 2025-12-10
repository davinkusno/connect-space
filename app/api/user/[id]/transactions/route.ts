import { userController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return userController.getTransactions(request, id);
}
