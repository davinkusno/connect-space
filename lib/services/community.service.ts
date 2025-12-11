import {
    CommunityLocation,
    CommunityMember,
    MemberRole,
    MemberStatus
} from "@/lib/types";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";
import { pointsService } from "./points.service";

// ==================== Community Service Types ====================

interface CommunityData {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  banner_url?: string;
  category_id?: string;
  location?: string | CommunityLocation;
  member_count: number;
  creator_id: string;
  status?: string;
}

interface UserInfo {
  id: string;
  full_name: string;
  avatar_url?: string;
  email: string;
  username?: string;
}

interface JoinRequestData {
  id: string;
  user_id: string;
  community_id: string;
  status: MemberStatus | boolean;
  requested_at: string;
  users?: UserInfo;
  user?: UserInfo;
}

interface MemberWithPoints {
  id: string;
  user_id: string;
  community_id: string;
  status: MemberStatus | boolean;
  requested_at: string;
  user?: UserInfo;
  activity_count: number;  // Count of positive activities
  report_count: number;    // Count of reports (separate from activities)
}

interface UserPointsCount {
  activity_count: number;
  report_count: number;
}

interface ApproveResult {
  message: string;
}

interface BulkApproveResult {
  message: string;
  approved: number;
  failed: number;
}

interface JoinResult {
  message: string;
  member?: CommunityMember;
}

interface MembersResult {
  members: CommunityMember[];
  total: number;
  page: number;
  pageSize: number;
}

interface MembersQueryOptions {
  page?: number;
  pageSize?: number;
  role?: MemberRole;
  search?: string;
}


// ==================== Community Service Class ====================

/**
 * Service for managing communities and memberships
 * Handles community CRUD, member management, and join requests
 */
export class CommunityService extends BaseService {
  private static instance: CommunityService;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance of CommunityService
   */
  public static getInstance(): CommunityService {
    if (!CommunityService.instance) {
      CommunityService.instance = new CommunityService();
    }
    return CommunityService.instance;
  }

  /**
   * Get community by ID
   * @param communityId - The community ID to fetch
   * @returns ServiceResult containing community data or error
   */
  public async getById(communityId: string): Promise<ServiceResult<CommunityData>> {
    const { data, error } = await this.supabaseAdmin
      .from("communities")
      .select("*")
      .eq("id", communityId)
      .single();

    if (error || !data) {
      return ApiResponse.notFound("Community");
    }

    return ApiResponse.success<CommunityData>(data as CommunityData);
  }

  /**
   * Check if user is admin or creator of community
   * @param communityId - The community to check
   * @param userId - The user to check
   * @returns Boolean indicating if user is admin/creator
   */
  public async isAdminOrCreator(
    communityId: string, 
    userId: string
  ): Promise<boolean> {
    // Check if user is creator
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single();

    if (community?.creator_id === userId) {
      return true;
    }

    // Check if user is admin
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
   * @param communityId - The community ID to fetch requests for
   * @returns ServiceResult containing array of requests with user points
   */
  public async getPendingRequests(
    communityId: string
  ): Promise<ServiceResult<MemberWithPoints[]>> {
    // Database uses boolean: false = pending
    const { data: requests, error } = await this.supabaseAdmin
      .from("community_members")
      .select(`
        id, user_id, community_id, status, requested_at,
        users:user_id (id, full_name, avatar_url, email)
      `)
      .eq("community_id", communityId)
      .eq("status", false)
      .order("requested_at", { ascending: false });

    if (error) {
      return ApiResponse.error("Failed to fetch requests", 500);
    }

    // Fetch user points for each request
    const requestsWithPoints: MemberWithPoints[] = [];

    for (const request of (requests || [])) {
      const pointsData: UserPointsCount = await this.getUserPoints(request.user_id);
      
      // Handle users relation which comes as array from Supabase
      const userInfo = Array.isArray(request.users) 
        ? request.users[0] as UserInfo
        : request.users as unknown as UserInfo;
      
      requestsWithPoints.push({
        id: request.id,
        user_id: request.user_id,
        community_id: request.community_id,
        status: request.status as MemberStatus,
        requested_at: request.requested_at,
        user: userInfo,
        activity_count: pointsData.activity_count,
        report_count: pointsData.report_count,
      });
    }

    return ApiResponse.success<MemberWithPoints[]>(requestsWithPoints);
  }

  /**
   * Get user activity count and report count (separate, not combined)
   * @param userId - The user ID to fetch counts for
   * @returns Object containing activity count and report count
   */
  private async getUserPoints(userId: string): Promise<UserPointsCount> {
    const { data: pointRecords } = await this.supabaseAdmin
      .from("user_points")
      .select("point_type")
      .eq("user_id", userId);

    let activityCount: number = 0;
    let reportCount: number = 0;

    ((pointRecords || []) as { point_type?: string }[]).forEach((p) => {
      if (p.point_type === "report_received") {
        // Count reports separately
        reportCount += 1;
      } else {
        // Count positive activities
        activityCount += 1;
      }
    });

    return { activity_count: activityCount, report_count: reportCount };
  }

  /**
   * Approve a join request
   * @param memberId - The member record ID to approve
   * @param communityId - The community ID
   * @param adminUserId - The admin user making the approval
   * @returns ServiceResult indicating success or failure
   */
  public async approveRequest(
    memberId: string,
    communityId: string,
    adminUserId: string
  ): Promise<ServiceResult<ApproveResult>> {
    // Verify admin permission
    const isAdmin: boolean = await this.isAdminOrCreator(communityId, adminUserId);
    if (!isAdmin) {
      return ApiResponse.forbidden("Permission denied");
    }

    // Get member record
    const { data: member, error: memberError } = await this.supabaseAdmin
      .from("community_members")
      .select("id, user_id, community_id, status")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      return ApiResponse.notFound("Member request");
    }

    // Database uses boolean: false = pending, true = approved
    // Check if already processed (status is not false/pending)
    if (member.status !== false && member.status !== "pending") {
      return ApiResponse.badRequest("Request already processed");
    }

    // Update member status (database uses boolean: true = approved)
    const { error: updateError } = await this.supabaseAdmin
      .from("community_members")
      .update({
        status: true,
        role: "member" as MemberRole,
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

    // Award points using pointsService
    const pointsResult = await pointsService.onCommunityJoined(member.user_id, communityId);
    if (!pointsResult.success) {
      console.error(`[CommunityService] Failed to award join points:`, pointsResult.error);
    }

    return ApiResponse.success<ApproveResult>({ message: "Request approved" });
  }

  /**
   * Reject a join request
   * @param memberId - The member record ID to reject
   * @param communityId - The community ID
   * @param adminUserId - The admin user making the rejection
   * @returns ServiceResult indicating success or failure
   */
  public async rejectRequest(
    memberId: string,
    communityId: string,
    adminUserId: string
  ): Promise<ServiceResult<ApproveResult>> {
    const isAdmin: boolean = await this.isAdminOrCreator(communityId, adminUserId);
    if (!isAdmin) {
      return ApiResponse.forbidden("Permission denied");
    }

    // Delete the pending request (database uses boolean so can't store "rejected")
    const { error } = await this.supabaseAdmin
      .from("community_members")
      .delete()
      .eq("id", memberId)
      .eq("status", false); // Only delete if still pending

    if (error) {
      return ApiResponse.error("Failed to reject request", 500);
    }

    return ApiResponse.success<ApproveResult>({ message: "Request rejected" });
  }

  /**
   * Bulk approve multiple join requests
   * @param memberIds - Array of member record IDs to approve
   * @param communityId - The community ID
   * @param adminUserId - The admin user making the approvals
   * @returns ServiceResult with counts of approved and failed
   */
  public async bulkApprove(
    memberIds: string[],
    communityId: string,
    adminUserId: string
  ): Promise<ServiceResult<BulkApproveResult>> {
    const isAdmin: boolean = await this.isAdminOrCreator(communityId, adminUserId);
    if (!isAdmin) {
      return ApiResponse.forbidden("Permission denied");
    }

    let approved: number = 0;
    let failed: number = 0;

    for (const memberId of memberIds) {
      const result: ServiceResult<ApproveResult> = await this.approveRequest(
        memberId, 
        communityId, 
        adminUserId
      );
      
      if (result.success) {
        approved++;
      } else {
        failed++;
      }
    }

    return ApiResponse.success<BulkApproveResult>({
      message: `Approved ${approved} members`,
      approved,
      failed,
    });
  }


  /**
   * Join a community (send request)
   * @param communityId - The community to join
   * @param userId - The user requesting to join
   * @returns ServiceResult with join status
   */
  public async joinCommunity(
    communityId: string, 
    userId: string
  ): Promise<ServiceResult<JoinResult>> {
    // Check if already a member
    const { data: existingMember } = await this.supabaseAdmin
      .from("community_members")
      .select("id, status")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMember) {
      const status = existingMember.status;
      if (status === false || status === "pending") {
        return ApiResponse.success<JoinResult>({ 
          message: "Join request is already pending", 
          member: existingMember as unknown as CommunityMember 
        });
      }
      return ApiResponse.success<JoinResult>({ 
        message: "Already a member", 
        member: existingMember as unknown as CommunityMember 
      });
    }

    // Insert with status = false (pending approval)
    const { data: insertData, error: insertError } = await this.supabaseAdmin
      .from("community_members")
      .insert({
        community_id: communityId,
        user_id: userId,
        role: "member" as MemberRole,
        status: false,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return ApiResponse.badRequest("You already have a pending request or are a member");
      }
      return ApiResponse.error("Failed to join community", 500);
    }

    return ApiResponse.created<JoinResult>({ 
      message: "Join request sent", 
      member: insertData as CommunityMember 
    });
  }

  /**
   * Update member role
   * @param memberId - The member record ID to update
   * @param role - The new role to assign
   * @param adminUserId - The admin making the change
   * @returns ServiceResult indicating success or failure
   */
  public async updateMemberRole(
    memberId: string,
    role: MemberRole,
    adminUserId: string
  ): Promise<ServiceResult<ApproveResult>> {
    // Fetch member record
    const { data: memberRecord, error: fetchError } = await this.supabaseAdmin
      .from("community_members")
      .select("id, community_id, user_id")
      .eq("id", memberId)
      .single();

    if (fetchError || !memberRecord) {
      return ApiResponse.notFound("Member");
    }

    // Verify permission
    const isAdmin: boolean = await this.isAdminOrCreator(
      memberRecord.community_id, 
      adminUserId
    );
    if (!isAdmin) {
      return ApiResponse.forbidden("Permission denied");
    }

    // Update role
    const { error: updateError } = await this.supabaseAdmin
      .from("community_members")
      .update({ role })
      .eq("id", memberId);

    if (updateError) {
      return ApiResponse.error("Failed to update member role", 500);
    }

    return ApiResponse.success<ApproveResult>({ message: "Member role updated" });
  }

  /**
   * Get community members with pagination
   * @param communityId - The community to fetch members for
   * @param options - Query options (page, pageSize, role, search)
   * @returns ServiceResult with paginated member list
   */
  public async getMembers(
    communityId: string,
    options?: MembersQueryOptions
  ): Promise<ServiceResult<MembersResult>> {
    const page: number = options?.page || 1;
    const pageSize: number = options?.pageSize || 10;
    const from: number = (page - 1) * pageSize;
    const to: number = from + pageSize - 1;

    let query = this.supabaseAdmin
      .from("community_members")
      .select(`
        *,
        user:user_id(id, username, full_name, avatar_url)
      `, { count: "exact" })
      .eq("community_id", communityId);

    if (options?.role) {
      query = query.eq("role", options.role);
    }

    const { data: members, count, error } = await query
      .order("joined_at", { ascending: false })
      .range(from, to);

    if (error) {
      return ApiResponse.error("Failed to fetch members", 500);
    }

    return ApiResponse.success<MembersResult>({
      members: (members || []) as CommunityMember[],
      total: count || 0,
      page,
      pageSize,
    });
  }

  /**
   * Add member to community (by admin)
   * @param communityId - The community to add member to
   * @param targetUserId - The user to add
   * @param role - The role to assign
   * @param adminUserId - The admin making the addition
   * @returns ServiceResult with new member data
   */
  public async addMember(
    communityId: string,
    targetUserId: string,
    role: MemberRole,
    adminUserId: string
  ): Promise<ServiceResult<CommunityMember>> {
    // Verify permission
    const isAdmin: boolean = await this.isAdminOrCreator(communityId, adminUserId);
    if (!isAdmin) {
      return ApiResponse.forbidden("Permission denied");
    }

    // Check if already a member
    const { data: existingMember } = await this.supabaseAdmin
      .from("community_members")
      .select("id")
      .eq("community_id", communityId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (existingMember) {
      return ApiResponse.error("User is already a member", 409);
    }

    // Add member
    const { data: newMember, error } = await this.supabaseAdmin
      .from("community_members")
      .insert({
        community_id: communityId,
        user_id: targetUserId,
        role: role || "member",
        status: true,
      })
      .select(`*, user:user_id(id, username, full_name, avatar_url)`)
      .single();

    if (error) {
      return ApiResponse.error("Failed to add member", 500);
    }

    // Create notification
    await this.supabaseAdmin.from("notifications").insert({
      user_id: targetUserId,
      type: "community_invite",
      content: "You have been added to a community",
      reference_id: communityId,
      reference_type: "community",
    });

    return ApiResponse.created<CommunityMember>(newMember as CommunityMember);
  }

  /**
   * Parse location to readable string
   * @param location - The location data to parse
   * @returns Formatted location string
   */
  public static parseLocationDisplay(location: unknown): string {
    if (!location) return "";

    try {
      const locData: CommunityLocation = 
        typeof location === "string" 
          ? JSON.parse(location) 
          : (location as CommunityLocation);
      
      return locData.city || locData.address || "";
    } catch {
      return typeof location === "string" ? location : "";
    }
  }
}

// Export singleton instance
export const communityService: CommunityService = CommunityService.getInstance();
