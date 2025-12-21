import { NextRequest, NextResponse } from "next/server";
import { BaseController } from "./base.controller";
import { notificationService } from "../services/notification.service";

export class NotificationController extends BaseController {
  private static instance: NotificationController;
  protected service = notificationService;

  private constructor() {
    super();
  }

  public static getInstance(): NotificationController {
    if (!NotificationController.instance) {
      NotificationController.instance = new NotificationController();
    }
    return NotificationController.instance;
  }

  /**
   * GET /api/notifications
   * Get all notifications for the authenticated user
   */
  public async getNotifications(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await this.service.getUserNotifications(user.id);

      if (result.success) {
        return this.json(result.data, result.status);
      }

      return this.error(result.error?.message || "Failed to fetch notifications", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/notifications/[id]/read
   * Mark a notification as read
   */
  public async markAsRead(request: NextRequest, notificationId: string): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await this.service.markAsRead(notificationId, user.id);

      if (result.success) {
        return this.json({ success: true }, result.status);
      }

      return this.error(result.error?.message || "Failed to mark as read", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/notifications/[id]/unread
   * Mark a notification as unread
   */
  public async markAsUnread(request: NextRequest, notificationId: string): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await this.service.markAsUnread(notificationId, user.id);

      if (result.success) {
        return this.json({ success: true }, result.status);
      }

      return this.error(result.error?.message || "Failed to mark as unread", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/notifications/mark-all-read
   * Mark all notifications as read
   */
  public async markAllAsRead(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await this.service.markAllAsRead(user.id);

      if (result.success) {
        return this.json({ success: true }, result.status);
      }

      return this.error(result.error?.message || "Failed to mark all as read", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/notifications/[id]
   * Delete a notification
   */
  public async deleteNotification(request: NextRequest, notificationId: string): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await this.service.delete(notificationId, user.id);

      if (result.success) {
        return this.json({ success: true }, result.status);
      }

      return this.error(result.error?.message || "Failed to delete notification", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/notifications/delete-all-read
   * Delete all read notifications
   */
  public async deleteAllRead(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await this.service.deleteAllRead(user.id);

      if (result.success) {
        return this.json({ success: true }, result.status);
      }

      return this.error(result.error?.message || "Failed to delete read notifications", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

export const notificationController = NotificationController.getInstance();

