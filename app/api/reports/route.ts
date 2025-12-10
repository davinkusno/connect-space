import { reportController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return reportController.getAll(request);
}

export async function POST(request: NextRequest) {
  return reportController.create(request);
}
