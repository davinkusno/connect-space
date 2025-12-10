import { pointsService } from "@/lib/services/points.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const result = await pointsService.getUserReputation(id);
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error?.message || "Failed to fetch reputation" },
      { status: result.status || 500 }
    );
  }
  
  return NextResponse.json(result.data);
}

