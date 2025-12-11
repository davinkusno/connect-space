import { eventController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * @route GET /api/events
 * @description Get a list of events with filtering, pagination, and user status
 * @access Public (with optional auth for personalized data)
 */
export async function GET(request: NextRequest) {
  return eventController.getEvents(request);
}
