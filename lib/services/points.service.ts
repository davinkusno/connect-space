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

export interface UserReputation {
  activity_points: number;
  report_points: number;
  report_count: number;
  posts_created: number;
  events_joined: number;
  communities_joined: number;
  active_days: number;
  last_activity_at: string | null;
  reputation_score: number;
}

// ==================== Points Service ====================
export class PointsService extends BaseService {
  private static instance: PointsService;

  // Point values for different activities
  public readonly POINT_VALUES = {
    post_created: 10,
    post_liked: 2,
    event_joined: 15,
    event_created: 20,
    community_joined: 25,
    community_created: 50,
    daily_active: 5,
    report_received: -50,
    report_resolved: 10,
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
   * Award points to a user
   */
  public async awardPoints(transaction: PointTransaction): Promise<ServiceResult<void>> {
    const supabase = this.supabaseAdmin;

    const { error } = await supabase.from("user_points").insert({
      user_id: transaction.user_id,
      points: transaction.points,
      point_type: transaction.point_type,
      related_id: transaction.related_id,
      related_type: transaction.related_type,
      description: transaction.description,
    });

    if (error) {
      return ApiResponse.error(`Failed to award points: ${error.message}`, 500);
    }

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
   * Get user reputation (comprehensive stats)
   */
  public async getUserReputation(userId: string): Promise<ServiceResult<UserReputation>> {
    const supabase = this.supabaseAdmin;

    // Get all point transactions
    const { data: pointsData, error: pointsError } = await supabase
      .from("user_points")
      .select("*")
      .eq("user_id", userId);

    if (pointsError) {
      return ApiResponse.error(`Failed to get reputation: ${pointsError.message}`, 500);
    }

    const points = pointsData || [];

    // Calculate reputation metrics
    const activityPoints = points
      .filter((p) => p.points > 0)
      .reduce((sum, p) => sum + p.points, 0);

    const reportPoints = points
      .filter((p) => p.point_type === "report_received")
      .reduce((sum, p) => sum + Math.abs(p.points), 0);

    const reportCount = points.filter((p) => p.point_type === "report_received").length;

    const postsCreated = points.filter((p) => p.point_type === "post_created").length;
    const eventsJoined = points.filter((p) => p.point_type === "event_joined").length;
    const communitiesJoined = points.filter((p) => p.point_type === "community_joined").length;
    const activeDays = points.filter((p) => p.point_type === "daily_active").length;

    const lastActivity = points.length > 0
      ? points.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    // Calculate overall reputation score
    const reputationScore = Math.max(0, activityPoints - reportPoints);

    return ApiResponse.success({
      activity_points: activityPoints,
      report_points: reportPoints,
      report_count: reportCount,
      posts_created: postsCreated,
      events_joined: eventsJoined,
      communities_joined: communitiesJoined,
      active_days: activeDays,
      last_activity_at: lastActivity,
      reputation_score: reputationScore,
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

