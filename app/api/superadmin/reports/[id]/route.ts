import { NextRequest } from "next/server";
import { superAdminController } from "@/lib/controllers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return superAdminController.getReportById(request, id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return superAdminController.updateReport(request, id);
}
