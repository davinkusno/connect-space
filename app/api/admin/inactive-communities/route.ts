import { adminController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return adminController.getInactiveCommunities(request);
}

export async function POST(request: NextRequest) {
  return adminController.manageCommunity(request);
}

