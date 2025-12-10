import { NextRequest } from "next/server";
import { adminController } from "@/lib/controllers";

export async function GET(request: NextRequest) {
  return adminController.getReports(request);
}

