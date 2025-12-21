import { notificationController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * DELETE /api/notifications/delete-all-read
 * Delete all read notifications for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  return notificationController.deleteAllRead(request);
}

