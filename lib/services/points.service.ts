import { BaseService, ServiceResult, ApiResponse } from "./base.service";

// ==================== Types ====================
export type PointType =
  | "community_joined"
  | "report_received"
  | "report_resolved";

export interface PointTransaction {
  user_id: string;
  points: number;
  point_type: PointType;
  community_id?: string; // Community ID that awarded these points (replaces related_id)
  points_unlocked_at?: string; // ISO timestamp when points become usable
}

export interface UserPointsSummary {
  activity_count: number;    // Count of positive activities (+1 each)
  report_count: number;      // Count of reports received (separate, not combined)
  posts_created: number;
  events_joined: number;
  communities_joined: number;
  active_days: number;
  last_activity_at: string | null;
  total_points: number;      // Total points (including locked)
  usable_points: number;     // Usable points (unlocked)
  locked_points: number;     // Locked points (not yet usable)
}

// ==================== Points Service ====================
export class PointsService extends BaseService {
  private static instance: PointsService;

  // Point values - only community_joined awards points (3 points per community)
  public readonly POINT_VALUES = {
    community_joined: 3,  // 3 points per community join
    report_received: 1,   // Stored as separate count, not subtracted
    report_resolved: 1,
  } as const;

  private constructor() {
    super();
  }

  public static getInstance(): PointsService {
    if (!PointsService.instance) {
      PointsService.instance = new PointsService();
    }
    return PointsService.instance;
  }

  /**
   * Award points to a user (with duplicate prevention for related entities)
   */
  public async awardPoints(transaction: PointTransaction): Promise<ServiceResult<void>> {
    const supabase = this.supabaseAdmin;

    // Check for duplicate if there's a community_id (prevent double-counting for same community)
    if (transaction.community_id) {
      const { data: existing } = await supabase
        .from("user_points")
        .select("id")
        .eq("user_id", transaction.user_id)
        .eq("community_id", transaction.community_id)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`[PointsService] Skipping duplicate: user ${transaction.user_id} already has points for community ${transaction.community_id}`);
        return ApiResponse.success(undefined); // Already awarded, skip
      }
    }

    const insertData: any = {
      user_id: transaction.user_id,
      points: transaction.points,
      point_type: transaction.point_type,
      community_id: transaction.community_id,
    };

    // Add points_unlocked_at if provided
    if (transaction.points_unlocked_at) {
      insertData.points_unlocked_at = transaction.points_unlocked_at;
    }

    const { error } = await supabase.from("user_points").insert(insertData);

    if (error) {
      console.error(`[PointsService] Failed to award points:`, error);
      return ApiResponse.error(`Failed to award points: ${error.message}`, 500);
    }

    console.log(`[PointsService] Awarded ${transaction.point_type} to user ${transaction.user_id}`);
    return ApiResponse.success(undefined);
  }

  /**
   * Get user's total points (including locked points)
   */
  public async getTotalPoints(userId: string): Promise<ServiceResult<number>> {
    const supabase = this.supabaseAdmin;

    const { data, error } = await supabase
      .from("user_points")
      .select("points")
      .eq("user_id", userId);

    if (error) {
      return ApiResponse.error(`Failed to get points: ${error.message}`, 500);
    }

    const totalPoints = data?.reduce((sum, row) => sum + row.points, 0) || 0;
    return ApiResponse.success(totalPoints);
  }

  /**
   * Get user's usable points (only unlocked points - on-demand calculation)
   * Points are unlocked when points_unlocked_at <= NOW() or points_unlocked_at IS NULL
   */
  public async getUsablePoints(userId: string): Promise<ServiceResult<number>> {
    const supabase = this.supabaseAdmin;
    const now = new Date().toISOString();

    // Get all points (all are from joining communities)
    const { data, error } = await supabase
      .from("user_points")
      .select("points, points_unlocked_at")
      .eq("user_id", userId);

    if (error) {
      return ApiResponse.error(`Failed to get usable points: ${error.message}`, 500);
    }

    // Filter to only unlocked points (on-demand calculation)
    const usablePoints = (data || []).reduce((sum, row) => {
      // Points are usable if:
      // 1. points_unlocked_at is NULL (immediately usable)
      // 2. points_unlocked_at <= NOW() (unlock time has passed)
      if (!row.points_unlocked_at || new Date(row.points_unlocked_at) <= new Date(now)) {
        return sum + row.points;
      }
      return sum;
    }, 0);

    return ApiResponse.success(usablePoints);
  }

  /**
   * Get user's locked points count
   */
  public async getLockedPoints(userId: string): Promise<ServiceResult<number>> {
    const totalResult = await this.getTotalPoints(userId);
    const usableResult = await this.getUsablePoints(userId);

    if (!totalResult.success || !usableResult.success) {
      return ApiResponse.error("Failed to calculate locked points", 500);
    }

    const lockedPoints = (totalResult.data || 0) - (usableResult.data || 0);
    return ApiResponse.success(lockedPoints);
  }

  /**
   * Check if user already received community points today
   * Only 1 community can award points per day
   */
  public async hasReceivedCommunityPointsToday(userId: string): Promise<ServiceResult<boolean>> {
    const supabase = this.supabaseAdmin;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndStr = todayEnd.toISOString();

    const { data, error } = await supabase
      .from("user_points")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", todayStart)
      .lte("created_at", todayEndStr)
      .limit(1);

    if (error) {
      return ApiResponse.error(`Failed to check daily points: ${error.message}`, 500);
    }

    return ApiResponse.success((data?.length || 0) > 0);
  }

  /**
   * Get user's total points (legacy method - now calls getTotalPoints)
   * @deprecated Use getTotalPoints() or getUsablePoints() instead
   */
  public async getUserPoints(userId: string): Promise<ServiceResult<number>> {
    return this.getTotalPoints(userId);
  }

  /**
   * Get user points summary (activity count and report count separately)
   * Calculates report_count from reports table (member reports + content reports)
   */
  public async getUserPointsSummary(userId: string): Promise<ServiceResult<UserPointsSummary>> {
    const supabase = this.supabaseAdmin;

    // Try to get cached activity_count from users table first (fast)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("activity_count")
      .eq("id", userId)
      .single();

    // Get detailed breakdown from user_points
    const { data: pointsData, error: pointsError } = await supabase
      .from("user_points")
      .select("created_at")
      .eq("user_id", userId);

    if (pointsError) {
      return ApiResponse.error(`Failed to get points: ${pointsError.message}`, 500);
    }

    const points = pointsData || [];

    // Use cached activity_count if available, otherwise count from transactions
    let activityCount: number;
    if (!userError && userData && userData.activity_count !== null) {
      activityCount = userData.activity_count;
    } else {
      // All points are from joining communities (activity points)
      activityCount = points.length;
    }

    // Calculate report_count from reports table
    // Count: 1) Direct member reports, 2) Thread reports (where user is creator), 
    // 3) Reply reports (where user is creator), 4) Event reports (where user is creator)
    
    // 1. Direct member reports
    const { count: memberReportsCount } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("report_type", "member")
      .eq("target_id", userId);

    // 2. Get all threads created by this user
    const { data: userThreads } = await supabase
      .from("messages")
      .select("id")
      .eq("sender_id", userId)
      .is("parent_id", null);

    let threadReportsCount = 0;
    if (userThreads && userThreads.length > 0) {
      const threadIds = userThreads.map(t => t.id);
      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("report_type", "thread")
        .in("target_id", threadIds);
      threadReportsCount = count || 0;
    }

    // 3. Get all replies created by this user
    const { data: userReplies } = await supabase
      .from("messages")
      .select("id")
      .eq("sender_id", userId)
      .not("parent_id", "is", null);

    let replyReportsCount = 0;
    if (userReplies && userReplies.length > 0) {
      const replyIds = userReplies.map(r => r.id);
      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("report_type", "reply")
        .in("target_id", replyIds);
      replyReportsCount = count || 0;
    }

    // 4. Get all events created by this user
    const { data: userEvents } = await supabase
      .from("events")
      .select("id")
      .eq("creator_id", userId);

    let eventReportsCount = 0;
    if (userEvents && userEvents.length > 0) {
      const eventIds = userEvents.map(e => e.id);
      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("report_type", "event")
        .in("target_id", eventIds);
      eventReportsCount = count || 0;
    }

    // Total report count
    const reportCount = (memberReportsCount || 0) + threadReportsCount + replyReportsCount + eventReportsCount;

    // Calculate breakdown (all points are from joining communities)
    const postsCreated = 0; // No longer awarded
    const eventsJoined = 0; // No longer awarded
    const communitiesJoined = points.length; // All points are from joining communities
    const activeDays = 0; // No longer awarded

    const lastActivity = points.length > 0
      ? points.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    // Get total, usable, and locked points
    const totalPointsResult = await this.getTotalPoints(userId);
    const usablePointsResult = await this.getUsablePoints(userId);
    const totalPoints = totalPointsResult.success ? (totalPointsResult.data || 0) : 0;
    const usablePoints = usablePointsResult.success ? (usablePointsResult.data || 0) : 0;
    const lockedPoints = totalPoints - usablePoints;

    return ApiResponse.success({
      activity_count: activityCount,
      report_count: reportCount,
      posts_created: postsCreated,
      events_joined: eventsJoined,
      communities_joined: communitiesJoined,
      active_days: activeDays,
      last_activity_at: lastActivity,
      total_points: totalPoints,
      usable_points: usablePoints,
      locked_points: lockedPoints,
    });
  }

  /**
   * Get quick activity/report counts
   * Calculates report_count from reports table for accuracy
   */
  public async getQuickCounts(userId: string): Promise<ServiceResult<{ activity_count: number; report_count: number }>> {
    const supabase = this.supabaseAdmin;

    // Get cached activity_count from users table
    const { data: userData } = await supabase
      .from("users")
      .select("activity_count")
      .eq("id", userId)
      .single();

    const activityCount = userData?.activity_count ?? 0;

    // Calculate report_count from reports table
    // 1. Direct member reports
    const { count: memberReportsCount } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("report_type", "member")
      .eq("target_id", userId);

    // 2. Thread reports
    const { data: userThreads } = await supabase
      .from("messages")
      .select("id")
      .eq("sender_id", userId)
      .is("parent_id", null);

    let threadReportsCount = 0;
    if (userThreads && userThreads.length > 0) {
      const threadIds = userThreads.map(t => t.id);
      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("report_type", "thread")
        .in("target_id", threadIds);
      threadReportsCount = count || 0;
    }

    // 3. Reply reports
    const { data: userReplies } = await supabase
      .from("messages")
      .select("id")
      .eq("sender_id", userId)
      .not("parent_id", "is", null);

    let replyReportsCount = 0;
    if (userReplies && userReplies.length > 0) {
      const replyIds = userReplies.map(r => r.id);
      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("report_type", "reply")
        .in("target_id", replyIds);
      replyReportsCount = count || 0;
    }

    // 4. Event reports
    const { data: userEvents } = await supabase
      .from("events")
      .select("id")
      .eq("creator_id", userId);

    let eventReportsCount = 0;
    if (userEvents && userEvents.length > 0) {
      const eventIds = userEvents.map(e => e.id);
      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("report_type", "event")
        .in("target_id", eventIds);
      eventReportsCount = count || 0;
    }

    const reportCount = (memberReportsCount || 0) + threadReportsCount + replyReportsCount + eventReportsCount;

    return ApiResponse.success({
      activity_count: activityCount,
      report_count: reportCount,
    });
  }

  /**
   * Get point transactions for a user
   */
  public async getTransactions(
    userId: string,
    limit = 50
  ): Promise<ServiceResult<PointTransaction[]>> {
    const supabase = this.supabaseAdmin;

    const { data, error } = await supabase
      .from("user_points")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return ApiResponse.error(`Failed to get transactions: ${error.message}`, 500);
    }

    return ApiResponse.success(data || []);
  }


  // ==================== Helper Methods ====================

  /**
   * Award points when user joins a community
   * - Awards 3 points per community
   * - Points are locked for 3 days (points_unlocked_at = created_at + 3 days)
   * - Only awards if user hasn't received points from another community today
   */
  public async onCommunityJoined(userId: string, communityId: string): Promise<ServiceResult<void>> {
    // Check if user already received points today
    const hasToday = await this.hasReceivedCommunityPointsToday(userId);
    if (hasToday.success && hasToday.data) {
      console.log(`[PointsService] User ${userId} already received community points today, skipping`);
      return ApiResponse.success(undefined); // Already received points today, skip
    }

    // Calculate unlock date (3 days from now)
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + 3);
    const unlockDateISO = unlockDate.toISOString();

    return this.awardPoints({
      user_id: userId,
      points: this.POINT_VALUES.community_joined,
      point_type: "community_joined",
      community_id: communityId,
      points_unlocked_at: unlockDateISO,
    });
  }

  /**
   * Deduct points when user receives a report
   */
  public async onReportReceived(userId: string, reportId: string): Promise<ServiceResult<void>> {
    // Note: Report points are no longer tracked in user_points
    // This method is kept for backward compatibility but does nothing
    return ApiResponse.success(undefined);
  }
}

// Export singleton instance
export const pointsService = PointsService.getInstance();

// Export constants for backwards compatibility
export const POINT_VALUES = pointsService.POINT_VALUES;

// Export legacy helper object for backwards compatibility
// Note: Only community_joined awards points now
export const PointsHelper = {
  onCommunityJoined: (userId: string, communityId: string) => pointsService.onCommunityJoined(userId, communityId),
  onReportReceived: (userId: string, reportId: string) => pointsService.onReportReceived(userId, reportId),
};

