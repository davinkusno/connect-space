import { NextRequest } from "next/server";
import { userController } from "@/lib/controllers";

export async function GET(request: NextRequest) {
  return userController.getPoints(request);
}
