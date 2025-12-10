import { NextRequest } from "next/server";
import { superAdminController } from "@/lib/controllers";

export async function GET(request: NextRequest) {
  return superAdminController.getInactiveCommunities(request);
}

export async function POST(request: NextRequest) {
  return superAdminController.manageCommunity(request);
}
