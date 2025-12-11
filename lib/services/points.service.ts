import { BaseService, ServiceResult, ApiResponse } from "./base.service";

// ==================== Types ====================
export type PointType =
  | "post_created"
  | "post_liked"
  | "event_joined"
  | "event_created"
  | "community_joined"
  | "community_created"
  | "daily_active"
  | "report_received"
  | "report_resolved";

export interface PointTransaction {
  user_id: string;
  points: number;
  point_type: PointType;
  related_id?: string;
  related_type?: "post" | "event" | "community" | "report";
  description?: string;
}

export interface UserPointsSummary {
  activity_count: number;    // Count of positive activities (+1 each)
  report_count: number;      // Count of reports received (separate, not combined)
  posts_created: number;
  events_joined: number;
  communities_joined: number;
  active_days: number;
  last_activity_at: string | null;
}

// ==================== Points Service ====================
export class PointsService extends BaseService {
  private static instance: PointsService;

  // Point values for different activities (+1 for each positive activity)
  public readonly POINT_VALUES = {
    post_created: 1,
    post_liked: 1,
    event_joined: 1,
    event_created: 1,
    community_joined: 1,
    community_created: 1,
    daily_active: 1,
    report_received: 1,  // Stored as separate count, not subtracted
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

    // Check for duplicate if there's a related_id (prevent double-counting)
    if (transaction.related_id) {
      const { data: existing } = await supabase
        .from("user_points")
        .select("id")
        .eq("user_id", transaction.user_id)
        .eq("point_type", transaction.point_type)
        .eq("related_id", transaction.related_id)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`[PointsService] Skipping duplicate: ${transaction.point_type} for user ${transaction.user_id}`);
        return ApiResponse.success(undefined); // Already awarded, skip
      }
    }

    const { error } = await supabase.from("user_points").insert({
      user_id: transaction.user_id,
      points: transaction.points,
      point_type: transaction.point_type,
      related_id: transaction.related_id,
      related_type: transaction.related_type,
      description: transaction.description,
    });

    if (error) {
      console.error(`[PointsService] Failed to award points:`, error);
      return ApiResponse.error(`Failed to award points: ${error.message}`, 500);
    }

    console.log(`[PointsService] Awarded ${transaction.point_type} to user ${transaction.user_id}`);
    return ApiResponse.success(undefined);
  }

  /**
   * Get user's total points
   */
  public async getUserPoints(userId: string): Promise<ServiceResult<number>> {
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
   * Get user points summary (activity count and report count separately)
   * Uses cached columns on users table for fast reads
   */
  public async getUserPointsSummary(userId: string): Promise<ServiceResult<UserPointsSummary>> {
    const supabase = this.supabaseAdmin;

    // Try to get cached counts from users table first (fast)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("activity_count, report_count")
      .eq("id", userId)
      .single();

    // Get detailed breakdown from user_points
    const { data: pointsData, error: pointsError } = await supabase
      .from("user_points")
      .select("point_type, created_at")
      .eq("user_id", userId);

    if (pointsError) {
      return ApiResponse.error(`Failed to get points: ${pointsError.message}`, 500);
    }

    const points = pointsData || [];

    // Use cached counts if available, otherwise count from transactions
    let activityCount: number;
    let reportCount: number;

    if (!userError && userData && (userData.activity_count !== null || userData.report_count !== null)) {
      // Use cached counts from users table
      activityCount = userData.activity_count || 0;
      reportCount = userData.report_count || 0;
    } else {
      // Fallback: count from transactions
      activityCount = points.filter((p) => p.point_type !== "report_received").length;
      reportCount = points.filter((p) => p.point_type === "report_received").length;
    }

    // Calculate breakdown (always from transactions for accuracy)
    const postsCreated = points.filter((p) => p.point_type === "post_created").length;
    const eventsJoined = points.filter((p) => p.point_type === "event_joined").length;
    const communitiesJoined = points.filter((p) => p.point_type === "community_joined").length;
    const activeDays = points.filter((p) => p.point_type === "daily_active").length;

    const lastActivity = points.length > 0
      ? points.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    return ApiResponse.success({
      activity_count: activityCount,
      report_count: reportCount,
      posts_created: postsCreated,
      events_joined: eventsJoined,
      communities_joined: communitiesJoined,
      active_days: activeDays,
      last_activity_at: lastActivity,
    });
  }

  /**
   * Get quick activity/report counts from cached columns (fast read)
   * Use this when you only need the counts, not the full breakdown
   */
  public async getQuickCounts(userId: string): Promise<ServiceResult<{ activity_count: number; report_count: number }>> {
    const supabase = this.supabaseAdmin;

    const { data, error } = await supabase
      .from("users")
      .select("activity_count, report_count")
      .eq("id", userId)
      .single();

    if (error) {
      // Fallback to counting if cached columns don't exist
      return this.getUserPointsSummary(userId).then(result => {
        if (result.success && result.data) {
          return ApiResponse.success({
            activity_count: result.data.activity_count,
            report_count: result.data.report_count,
          });
        }
        return ApiResponse.success({ activity_count: 0, report_count: 0 });
      });
    }

    return ApiResponse.success({
      activity_count: data?.activity_count || 0,
      report_count: data?.report_count || 0,
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

  /**
   * Check if user already received daily active points today
   */
  public async hasDailyActiveToday(userId: string): Promise<ServiceResult<boolean>> {
    const supabase = this.supabaseAdmin;
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("user_points")
      .select("id")
      .eq("user_id", userId)
      .eq("point_type", "daily_active")
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`)
      .limit(1);

    if (error) {
      return ApiResponse.error(`Failed to check daily active: ${error.message}`, 500);
    }

    return ApiResponse.success((data?.length || 0) > 0);
  }

  // ==================== Helper Methods ====================

  /**
   * Award points when user creates a post
   */
  public async onPostCreated(userId: string, postId: string): Promise<ServiceResult<void>> {
    return this.awardPoints({
      user_id: userId,
      points: this.POINT_VALUES.post_created,
      point_type: "post_created",
      related_id: postId,
      related_type: "post",
      description: "Created a post",
    });
  }

  /**
   * Award points when user joins an event
   */
  public async onEventJoined(userId: string, eventId: string): Promise<ServiceResult<void>> {
    return this.awardPoints({
      user_id: userId,
      points: this.POINT_VALUES.event_joined,
      point_type: "event_joined",
      related_id: eventId,
      related_type: "event",
      description: "Joined an event",
    });
  }

  /**
   * Award points when user creates an event
   */
  public async onEventCreated(userId: string, eventId: string): Promise<ServiceResult<void>> {
    return this.awardPoints({
      user_id: userId,
      points: this.POINT_VALUES.event_created,
      point_type: "event_created",
      related_id: eventId,
      related_type: "event",
      description: "Created an event",
    });
  }

  /**
   * Award points when user joins a community
   */
  public async onCommunityJoined(userId: string, communityId: string): Promise<ServiceResult<void>> {
    return this.awardPoints({
      user_id: userId,
      points: this.POINT_VALUES.community_joined,
      point_type: "community_joined",
      related_id: communityId,
      related_type: "community",
      description: "Joined a community",
    });
  }

  /**
   * Award points when user creates a community
   */
  public async onCommunityCreated(userId: string, communityId: string): Promise<ServiceResult<void>> {
    return this.awardPoints({
      user_id: userId,
      points: this.POINT_VALUES.community_created,
      point_type: "community_created",
      related_id: communityId,
      related_type: "community",
      description: "Created a community",
    });
  }

  /**
   * Deduct points when user receives a report
   */
  public async onReportReceived(userId: string, reportId: string): Promise<ServiceResult<void>> {
    return this.awardPoints({
      user_id: userId,
      points: this.POINT_VALUES.report_received,
      point_type: "report_received",
      related_id: reportId,
      related_type: "report",
      description: "Received a report",
    });
  }

  /**
   * Award daily active points
   */
  public async onDailyActive(userId: string): Promise<ServiceResult<void>> {
    // Check if already awarded today
    const hasToday = await this.hasDailyActiveToday(userId);
    if (hasToday.success && hasToday.data) {
      return ApiResponse.success(undefined); // Already awarded
    }

    const today = new Date().toISOString().split("T")[0];
    return this.awardPoints({
      user_id: userId,
      points: this.POINT_VALUES.daily_active,
      point_type: "daily_active",
      description: `Active on ${today}`,
    });
  }
}

// Export singleton instance
export const pointsService = PointsService.getInstance();

// Export constants for backwards compatibility
export const POINT_VALUES = pointsService.POINT_VALUES;

// Export legacy helper object for backwards compatibility
export const PointsHelper = {
  onPostCreated: (userId: string, postId: string) => pointsService.onPostCreated(userId, postId),
  onEventJoined: (userId: string, eventId: string) => pointsService.onEventJoined(userId, eventId),
  onEventCreated: (userId: string, eventId: string) => pointsService.onEventCreated(userId, eventId),
  onCommunityJoined: (userId: string, communityId: string) => pointsService.onCommunityJoined(userId, communityId),
  onCommunityCreated: (userId: string, communityId: string) => pointsService.onCommunityCreated(userId, communityId),
  onReportReceived: (userId: string, reportId: string) => pointsService.onReportReceived(userId, reportId),
  onDailyActive: (userId: string) => pointsService.onDailyActive(userId),
};

