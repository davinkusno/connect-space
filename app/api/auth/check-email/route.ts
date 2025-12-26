import { authController } from "@/lib/controllers/auth.controller";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return authController.checkEmail(request);
}

