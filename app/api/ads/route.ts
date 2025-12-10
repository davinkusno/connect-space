import { NextRequest } from "next/server";
import { adsController } from "@/lib/controllers";

export async function GET(request: NextRequest) {
  return adsController.getAll(request);
}

export async function POST(request: NextRequest) {
  return adsController.create(request);
}
