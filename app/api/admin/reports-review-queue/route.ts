import { reportController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return reportController.getReportsReviewQueue(request);
}

