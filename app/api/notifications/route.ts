import { notificationController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  return notificationController.getNotifications(request);
}

