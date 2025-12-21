import { notificationController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * DELETE /api/notifications/[id]
 * Delete a specific notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return notificationController.deleteNotification(request, id);
}

/**
 * PATCH /api/notifications/[id]/read
 * Mark a notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  if (body.action === "read") {
    return notificationController.markAsRead(request, id);
  } else if (body.action === "unread") {
    return notificationController.markAsUnread(request, id);
  }
  
  return new NextResponse(
    JSON.stringify({ error: "Invalid action. Use 'read' or 'unread'" }),
    { status: 400 }
  );
}

