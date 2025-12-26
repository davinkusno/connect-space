import { communityController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return communityController.getUserCommunities(request);
}

