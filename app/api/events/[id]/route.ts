import { eventController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * GET /api/events/[id]
 * Get event details with community and creator info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return eventController.getEventById(request, id);
}

/**
 * DELETE /api/events/[id]
 * Delete an event (community admin or creator only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return eventController.deleteEvent(request, id);
}

