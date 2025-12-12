import { eventController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * @route PATCH /api/events/[id]/update
 * @description Update an existing event (partial updates allowed)
 * @access Private (community admins only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return eventController.updateEvent(request, id);
}
