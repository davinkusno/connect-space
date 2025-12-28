import { messageController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return messageController.createReply(request);
}

export async function GET(request: NextRequest) {
  return messageController.getReplies(request);
}

