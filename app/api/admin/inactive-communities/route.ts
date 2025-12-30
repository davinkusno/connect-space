import { communityController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return communityController.getInactiveCommunities(request);
}

export async function POST(request: NextRequest) {
  return communityController.manageCommunity(request);
}

