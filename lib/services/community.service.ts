import {
  BaseService,
  ApiResponse,
  ServiceResult,
  NotFoundError,
  AuthorizationError,
} from "./base.service";

interface CommunityData {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  banner_url?: string;
  category_id?: string;
  location?: string;
  member_count: number;
  creator_id: string;
  status?: string;
}

interface JoinRequest {
  id: string;
  user_id: string;
  community_id: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
  activityCount?: number;
  reportCount?: number;
}

interface MemberWithPoints extends JoinRequest {
  activityCount: number;
  reportCount: number;
}

/**
 * Service for managing communities and memberships
 */
export class CommunityService extends BaseService {
  private static instance: CommunityService;
  private readonly JOIN_POINTS = 25;

  private constructor() {
    super();
  }

  static getInstance(): CommunityService {
    if (!CommunityService.instance) {
      CommunityService.instance = new CommunityService();
    }
    return CommunityService.instance;
  }

  /**
   * Get community by ID
   */
  async getById(communityId: string): Promise<ServiceResult<CommunityData>> {
    const { data, error } = await this.supabaseAdmin
      .from("communities")
      .select("*")
      .eq("id", communityId)
      .single();

    if (error || !data) {
      return ApiResponse.error("Community not found", 404);
    }

    return ApiResponse.success(data);
  }

  /**
   * Check if user is admin or creator of community
   */
  async isAdminOrCreator(communityId: string, userId: string): Promise<boolean> {
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single();

    if (community?.creator_id === userId) {
      return true;
    }

    const { data: membership } = await this.supabaseAdmin
      .from("community_members")
      .select("role")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .single();

    return membership?.role === "admin";
  }

  /**
   * Get pending join requests for a community
   */
  async getPendingRequests(communityId: string): Promise<ServiceResult<MemberWithPoints[]>> {
    const { data: requests, error } = await this.supabaseAdmin
      .from("community_members")
      .select(`
        id, user_id, community_id, status, requested_at,
        users:user_id (id, full_name, avatar_url, email)
      `)
      .eq("community_id", communityId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false });

    if (error) {
      return ApiResponse.error("Failed to fetch requests", 500);
    }

    // Fetch user points for each request
    const userIds = requests?.map((r) => r.user_id) || [];
    const requestsWithPoints: MemberWithPoints[] = [];

    for (const request of requests || []) {
      const { activityCount, reportCount } = await this.getUserPoints(request.user_id);
      requestsWithPoints.push({
        ...request,
        user: request.users as any,
        activityCount,
        reportCount,
      });
    }

    return ApiResponse.success(requestsWithPoints);
  }

  /**
   * Get user activity and report counts
   */
  private async getUserPoints(userId: string): Promise<{ activityCount: number; reportCount: number }> {
    const { data: points } = await this.supabaseAdmin
      .from("user_points")
      .select("points, reason")
      .eq("user_id", userId);

    let activityCount = 0;
    let reportCount = 0;

    (points || []).forEach((p) => {
      if (p.points > 0) {
        activityCount += 1;
      } else if (p.reason?.toLowerCase().includes("report")) {
        reportCount += 1;
      }
    });

    return { activityCount, reportCount };
  }

  /**
   * Approve a join request
   */
  async approveRequest(
    memberId: string,
    communityId: string,
    adminUserId: string
  ): Promise<ServiceResult<any>> {
    // Verify admin permission
    const isAdmin = await this.isAdminOrCreator(communityId, adminUserId);
    if (!isAdmin) {
      return ApiResponse.error("Permission denied", 403);
    }

    // Get member record
    const { data: member, error: memberError } = await this.supabaseAdmin
      .from("community_members")
      .select("id, user_id, community_id, status")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      return ApiResponse.error("Member request not found", 404);
    }

    if (member.status !== "pending") {
      return ApiResponse.error("Request already processed", 400);
    }

    // Update member status
    const { error: updateError } = await this.supabaseAdmin
      .from("community_members")
      .update({
        status: "approved",
        role: "member",
        joined_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (updateError) {
      return ApiResponse.error("Failed to approve request", 500);
    }

    // Increment member count
    await this.supabaseAdmin.rpc("increment_member_count", {
      community_id: communityId,
    });

    // Award points
    await this.awardJoinPoints(member.user_id, communityId);

    return ApiResponse.success({ message: "Request approved" });
  }

  /**
   * Reject a join request
   */
  async rejectRequest(
    memberId: string,
    communityId: string,
    adminUserId: string
  ): Promise<ServiceResult<any>> {
    const isAdmin = await this.isAdminOrCreator(communityId, adminUserId);
    if (!isAdmin) {
      return ApiResponse.error("Permission denied", 403);
    }

    const { error } = await this.supabaseAdmin
      .from("community_members")
      .update({ status: "rejected" })
      .eq("id", memberId);

    if (error) {
      return ApiResponse.error("Failed to reject request", 500);
    }

    return ApiResponse.success({ message: "Request rejected" });
  }

  /**
   * Bulk approve join requests
   */
  async bulkApprove(
    memberIds: string[],
    communityId: string,
    adminUserId: string
  ): Promise<ServiceResult<any>> {
    const isAdmin = await this.isAdminOrCreator(communityId, adminUserId);
    if (!isAdmin) {
      return ApiResponse.error("Permission denied", 403);
    }

    let approved = 0;
    let failed = 0;

    for (const memberId of memberIds) {
      const result = await this.approveRequest(memberId, communityId, adminUserId);
      if (result.success) {
        approved++;
      } else {
        failed++;
      }
    }

    return ApiResponse.success({
      message: `Approved ${approved} members`,
      approved,
      failed,
    });
  }

  /**
   * Award points for joining a community
   */
  private async awardJoinPoints(userId: string, communityId: string): Promise<void> {
    // Check if already awarded
    const { data: existing } = await this.supabaseAdmin
      .from("user_points")
      .select("id")
      .eq("user_id", userId)
      .eq("reason", `Joined community: ${communityId}`)
      .maybeSingle();

    if (existing) return;

    await this.supabaseAdmin.from("user_points").insert({
      user_id: userId,
      points: this.JOIN_POINTS,
      reason: `Joined community: ${communityId}`,
      source: "community_join",
    });
  }

  /**
   * Parse location to readable string
   */
  static parseLocationDisplay(location: any): string {
    if (!location) return "";

    try {
      const locData = typeof location === "string" ? JSON.parse(location) : location;
      return locData.city || locData.address || "";
    } catch {
      return typeof location === "string" ? location : "";
    }
  }
}

export const communityService = CommunityService.getInstance();

