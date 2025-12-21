import { eventController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * GET /api/events/[id]/attendees-count
 * Get the count of interested attendees for an event (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return eventController.getAttendeesCount(request, id);
}

