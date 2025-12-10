import { NextRequest } from "next/server";
import { superAdminController } from "@/lib/controllers";

export async function GET(request: NextRequest) {
  return superAdminController.getReports(request);
}
