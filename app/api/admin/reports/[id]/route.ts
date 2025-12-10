import { NextRequest } from "next/server";
import { adminController } from "@/lib/controllers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return adminController.getReportById(request, id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return adminController.updateReport(request, id);
}

