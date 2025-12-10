import { adsController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return adsController.track(request, id);
}
