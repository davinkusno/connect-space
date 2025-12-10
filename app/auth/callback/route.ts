import { NextRequest } from "next/server";
import { authController } from "@/lib/controllers/auth.controller";

export async function GET(request: NextRequest) {
  return authController.handleCallback(request);
}
