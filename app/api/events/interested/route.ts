import { eventController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return eventController.getInterestedEvents(request);
}
