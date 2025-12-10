import { NextRequest } from "next/server";
import { reportController } from "@/lib/controllers";

export async function GET(request: NextRequest) {
  return reportController.getAll(request);
}

export async function POST(request: NextRequest) {
  return reportController.create(request);
}
