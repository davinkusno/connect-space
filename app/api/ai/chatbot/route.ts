import { NextRequest } from "next/server";
import { aiController } from "@/lib/controllers";

export async function POST(request: NextRequest) {
  return aiController.chat(request);
}
