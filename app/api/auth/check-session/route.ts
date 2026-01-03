import { authController } from "@/lib/controllers/auth.controller";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return authController.checkSession(request);
}

