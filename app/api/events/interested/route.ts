import { NextRequest } from "next/server";
import { eventController } from "@/lib/controllers";

export async function GET(request: NextRequest) {
  return eventController.getInterestedEvents(request);
}
