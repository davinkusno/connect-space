import { eventController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * @route POST /api/events/create
 * @description Create a new event (community admins only)
 * @access Private (community admins only)
 */
export async function POST(request: NextRequest) {
  return eventController.createEvent(request);
}
