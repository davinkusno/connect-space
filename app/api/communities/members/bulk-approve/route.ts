import { NextRequest } from "next/server";
import { communityController } from "@/lib/controllers";

export async function POST(request: NextRequest) {
  return communityController.bulkApprove(request);
}

