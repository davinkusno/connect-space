import { messageController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return messageController.deleteMessage(request, id);
}

