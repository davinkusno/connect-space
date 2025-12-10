import { adsController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return adsController.getAll(request);
}

export async function POST(request: NextRequest) {
  return adsController.create(request);
}
