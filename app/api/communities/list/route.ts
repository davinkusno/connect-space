import { communityController } from "@/lib/controllers/community.controller";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return communityController.getCommunitiesWithMembershipStatus(request);
}

