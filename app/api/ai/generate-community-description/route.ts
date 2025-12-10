import { aiController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return aiController.generateCommunityDescription(request);
}
