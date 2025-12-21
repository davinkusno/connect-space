import { notificationController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
export async function PATCH(request: NextRequest) {
  return notificationController.markAllAsRead(request);
}

