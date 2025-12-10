import { NextRequest } from "next/server";
import { userController } from "@/lib/controllers";

export async function GET(request: NextRequest) {
  return userController.getOnboardingStatus(request);
}

export async function POST(request: NextRequest) {
  return userController.completeOnboarding(request);
}
