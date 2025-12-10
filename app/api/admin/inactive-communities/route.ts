import { NextRequest } from "next/server";
import { adminController } from "@/lib/controllers";

export async function GET(request: NextRequest) {
  return adminController.getInactiveCommunities(request);
}

export async function POST(request: NextRequest) {
  return adminController.manageCommunity(request);
}

