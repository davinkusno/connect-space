import { BaseService, ServiceResult, ApiResponse } from "./base.service";

// ==================== Types ====================
export type NotificationType = 
  | "event_reminder" 
  | "new_message" 
  | "community_invite" 
  | "community_update"
  | "join_request"
  | "join_approved"
  | "join_rejected"
  | "new_event"
  | "event_cancelled"
  | "new_post"
  | "post_reply"
  | "mention";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  is_read: boolean;
  reference_id?: string;
  reference_type?: "event" | "community" | "post" | "message";
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  reference_id?: string;
  reference_type?: "event" | "community" | "post" | "message";
}

// ==================== Notification Service ====================
export class NotificationService extends BaseService {
  private static instance: NotificationService;

  private constructor() {
    super();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create a notification for a user
   */
  public async create(input: CreateNotificationInput): Promise<ServiceResult<Notification>> {
    const { data, error } = await this.supabaseAdmin
      .from("notifications")
      .insert({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        content: input.content,
        reference_id: input.reference_id,
        reference_type: input.reference_type,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      return ApiResponse.error(`Failed to create notification: ${error.message}`, 500);
    }

    return ApiResponse.success(data);
  }

  /**
   * Create notifications for multiple users
   */
  public async createBulk(
    userIds: string[],
    type: NotificationType,
    title: string,
    content: string,
    referenceId?: string,
    referenceType?: "event" | "community" | "post" | "message"
  ): Promise<ServiceResult<void>> {
    if (userIds.length === 0) {
      return ApiResponse.success(undefined);
    }

    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title,
      content,
      reference_id: referenceId,
      reference_type: referenceType,
      is_read: false,
    }));

    const { error } = await this.supabaseAdmin
      .from("notifications")
      .insert(notifications);

    if (error) {
      console.error("[NotificationService] Failed to create notifications:", error.message);
      return ApiResponse.error(`Failed to create notifications: ${error.message}`, 500);
    }

    return ApiResponse.success(undefined);
  }

  /**
   * Get notifications for a user
   */
  public async getByUserId(
    userId: string,
    limit = 50,
    unreadOnly = false
  ): Promise<ServiceResult<Notification[]>> {
    let query = this.supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      return ApiResponse.error(`Failed to get notifications: ${error.message}`, 500);
    }

    return ApiResponse.success(data || []);
  }

  /**
   * Get unread count for a user
   */
  public async getUnreadCount(userId: string): Promise<ServiceResult<number>> {
    const { count, error } = await this.supabaseAdmin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      return ApiResponse.error(`Failed to get unread count: ${error.message}`, 500);
    }

    return ApiResponse.success(count || 0);
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(notificationId: string, userId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      return ApiResponse.error(`Failed to mark as read: ${error.message}`, 500);
    }

    return ApiResponse.success(undefined);
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllAsRead(userId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      return ApiResponse.error(`Failed to mark all as read: ${error.message}`, 500);
    }

    return ApiResponse.success(undefined);
  }

  /**
   * Delete a notification
   */
  public async delete(notificationId: string, userId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      return ApiResponse.error(`Failed to delete notification: ${error.message}`, 500);
    }

    return ApiResponse.success(undefined);
  }

  /**
   * Get all notifications for a user (formatted for UI)
   */
  public async getUserNotifications(userId: string, limit = 50): Promise<ServiceResult<any[]>> {
    const { data, error } = await this.supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return ApiResponse.error(`Failed to fetch notifications: ${error.message}`, 500);
    }

    return ApiResponse.success(data || []);
  }

  /**
   * Mark a notification as unread
   */
  public async markAsUnread(notificationId: string, userId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin
      .from("notifications")
      .update({ is_read: false })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      return ApiResponse.error(`Failed to mark as unread: ${error.message}`, 500);
    }

    return ApiResponse.success(undefined);
  }

  /**
   * Delete all read notifications for a user
   */
  public async deleteAllRead(userId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .eq("is_read", true);

    if (error) {
      return ApiResponse.error(`Failed to delete read notifications: ${error.message}`, 500);
    }

    return ApiResponse.success(undefined);
  }

  // ==================== Helper Methods for Common Notifications ====================

  /**
   * Notify when a join request is submitted
   */
  public async onJoinRequest(communityId: string, communityName: string, userId: string, userName: string): Promise<void> {
    // Get community creator
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single();

    // Get community admins (only approved members with admin role)
    const { data: admins } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .eq("status", "approved")
      .eq("role", "admin");

    // Combine creator and admins, remove duplicates
    const adminSet = new Set<string>();
    if (community?.creator_id) {
      adminSet.add(community.creator_id);
    }
    if (admins) {
      admins.forEach(a => adminSet.add(a.user_id));
    }

    const adminIds = Array.from(adminSet);
    
    if (adminIds.length > 0) {
      await this.createBulk(
        adminIds,
        "join_request",
        "New Join Request",
        `${userName} wants to join ${communityName}`,
        communityId,
        "community"
      );
    } else {
    }
  }

  /**
   * Notify user when their join request is approved
   */
  public async onJoinApproved(userId: string, communityId: string, communityName: string): Promise<void> {
    await this.create({
      user_id: userId,
      type: "join_approved",
      title: "Join Request Approved",
      content: `You are now a member of ${communityName}`,
      reference_id: communityId,
      reference_type: "community",
    });
  }

  /**
   * Notify user when their join request is rejected
   */
  public async onJoinRejected(userId: string, communityId: string, communityName: string): Promise<void> {
    await this.create({
      user_id: userId,
      type: "join_rejected",
      title: "Join Request Declined",
      content: `Your request to join ${communityName} was declined`,
      reference_id: communityId,
      reference_type: "community",
    });
  }

  /**
   * Notify community members about a new event
   */
  public async onNewEvent(communityId: string, eventId: string, eventTitle: string, communityName: string): Promise<void> {
    // Get all community members
    const { data: members } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .eq("status", true); // Only approved members

    if (members && members.length > 0) {
      const memberIds = members.map(m => m.user_id);
      await this.createBulk(
        memberIds,
        "new_event",
        "New Event",
        `${eventTitle} has been created in ${communityName}`,
        eventId,
        "event"
      );
    }
  }

  /**
   * Notify about a new post in community
   */
  public async onNewPost(communityId: string, postId: string, postTitle: string, authorName: string): Promise<void> {
    // Get community members who want notifications (excluding the author)
    const { data: members } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .eq("status", true);

    if (members && members.length > 0) {
      const memberIds = members.map(m => m.user_id);
      await this.createBulk(
        memberIds,
        "new_post",
        "New Discussion",
        `${authorName} posted: ${postTitle}`,
        postId,
        "post"
      );
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

