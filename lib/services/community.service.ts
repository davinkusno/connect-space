import {
    CommunityLocation,
    CommunityMember,
    MemberRole,
    MemberStatus
} from "@/lib/types";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";
import { notificationService } from "./notification.service";
import { pointsService } from "./points.service";
import { calculateRequiredPoints } from "@/lib/config/points.config";

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
  status: MemberStatus;
  joined_at: string;  // Using joined_at as the request timestamp
  users?: UserInfo;
  user?: UserInfo;
}

interface MemberWithPoints {
  id: string;
  user_id: string;
  community_id: string;
  status: MemberStatus;
  joined_at: string;  // Using joined_at as the request timestamp
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
   * Check if user is the creator of the community
   * @param communityId - The community ID
   * @param userId - The user ID to check
   * @returns true if user is the creator
   */
  public async isCreator(
    communityId: string,
    userId: string
  ): Promise<boolean> {
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single();

    return community?.creator_id === userId;
  }

  /**
   * Check if a user is the creator of a community (by member record)
   * @param memberUserId - The user ID of the member to check
   * @param communityId - The community ID
   * @returns true if the member is the creator
   */
  public async isMemberCreator(
    memberUserId: string,
    communityId: string
  ): Promise<boolean> {
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single();

    return community?.creator_id === memberUserId;
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
        id, user_id, community_id, status, joined_at,
        users:user_id (id, full_name, avatar_url, email)
      `)
      .eq("community_id", communityId)
      .eq("status", "pending")  // String: 'pending'
      .order("joined_at", { ascending: false });

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
        joined_at: request.joined_at,  // Using joined_at as request timestamp
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

    // Check if already processed (status is not pending)
    if (member.status !== "pending") {
      return ApiResponse.badRequest("Request already processed");
    }

    // Update member status to approved
    const { error: updateError } = await this.supabaseAdmin
      .from("community_members")
      .update({
        status: "approved",  // String: 'approved'
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

    // Send notification to the user
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("name")
      .eq("id", communityId)
      .single();
    
    if (community) {
      await notificationService.onJoinApproved(member.user_id, communityId, community.name);
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

    // Get member info before deleting (for notification)
    const { data: member } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id")
      .eq("id", memberId)
      .eq("status", "pending")  // String: 'pending'
      .single();

    // Delete the pending request
    const { error } = await this.supabaseAdmin
      .from("community_members")
      .delete()
      .eq("id", memberId)
      .eq("status", "pending"); // Only delete if still pending

    if (error) {
      return ApiResponse.error("Failed to reject request", 500);
    }

    // Send notification to the user
    if (member) {
      const { data: community } = await this.supabaseAdmin
        .from("communities")
        .select("name")
        .eq("id", communityId)
        .single();
      
      if (community) {
        await notificationService.onJoinRejected(member.user_id, communityId, community.name);
      }
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
   * Bulk reject multiple join requests
   * @param memberIds - Array of member record IDs to reject
   * @param communityId - The community ID
   * @param adminUserId - The admin user making the rejections
   * @returns ServiceResult with counts of rejected and failed
   */
  public async bulkReject(
    memberIds: string[],
    communityId: string,
    adminUserId: string
  ): Promise<ServiceResult<BulkApproveResult>> {
    const isAdmin: boolean = await this.isAdminOrCreator(communityId, adminUserId);
    if (!isAdmin) {
      return ApiResponse.forbidden("Permission denied");
    }

    // If no member IDs provided, reject all pending requests
    let targetMemberIds = memberIds;
    if (memberIds.length === 0) {
      const { data: pendingMembers } = await this.supabaseAdmin
        .from("community_members")
        .select("id")
        .eq("community_id", communityId)
        .eq("status", "pending");
      
      targetMemberIds = (pendingMembers || []).map((m: any) => m.id);
    }

    let rejected: number = 0;
    let failed: number = 0;

    for (const memberId of targetMemberIds) {
      const result: ServiceResult<ApproveResult> = await this.rejectRequest(
        memberId, 
        communityId, 
        adminUserId
      );
      
      if (result.success) {
        rejected++;
      } else {
        failed++;
      }
    }

    return ApiResponse.success<BulkApproveResult>({
      message: `Rejected ${rejected} members`,
      approved: rejected, // reusing the same type
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
      if (existingMember.status === "pending") {  // String: 'pending'
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

    // Insert with status = 'pending' (awaiting approval)
    const { data: insertData, error: insertError } = await this.supabaseAdmin
      .from("community_members")
      .insert({
        community_id: communityId,
        user_id: userId,
        role: "member" as MemberRole,
        status: "pending",  // String: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return ApiResponse.badRequest("You already have a pending request or are a member");
      }
      console.error("[CommunityService] Error inserting member:", insertError);
      return ApiResponse.error("Failed to join community", 500);
    }

    if (!insertData) {
      console.error("[CommunityService] Insert succeeded but no data returned");
      return ApiResponse.error("Failed to create join request", 500);
    }

    console.log("[CommunityService] Join request created:", insertData);

    // Send notification to community admins
    try {
      // Get community name and user name for the notification
      const [communityResult, userResult] = await Promise.all([
        this.supabaseAdmin.from("communities").select("name").eq("id", communityId).single(),
        this.supabaseAdmin.from("users").select("full_name, username").eq("id", userId).single(),
      ]);

      const communityName = communityResult.data?.name || "the community";
      const userName = userResult.data?.full_name || userResult.data?.username || "A user";

      await notificationService.onJoinRequest(communityId, communityName, userId, userName);
    } catch (notifError) {
      console.error("[CommunityService] Failed to send join request notification:", notifError);
      // Don't fail the request if notification fails
    }

    return ApiResponse.created<JoinResult>({ 
      message: "Join request sent", 
      member: insertData as CommunityMember 
    });
  }

  /**
   * Cancel a pending join request (by the user who submitted it)
   * @param communityId - The community ID
   * @param userId - The user canceling their own request
   * @returns ServiceResult indicating success or failure
   */
  public async cancelJoinRequest(
    communityId: string,
    userId: string
  ): Promise<ServiceResult<ApproveResult>> {
    // Check if there's a pending request
    const { data: existingRequest, error: checkError } = await this.supabaseAdmin
      .from("community_members")
      .select("id, status")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      return ApiResponse.error("Failed to check request status", 500);
    }

    if (!existingRequest) {
      return ApiResponse.notFound("Join request");
    }

    // Only allow canceling pending requests
    if (existingRequest.status !== "pending") {  // String: 'pending'
      return ApiResponse.badRequest("Can only cancel pending requests");
    }

    // Delete the pending request
    const { error: deleteError } = await this.supabaseAdmin
      .from("community_members")
      .delete()
      .eq("id", existingRequest.id);

    if (deleteError) {
      return ApiResponse.error("Failed to cancel request", 500);
    }

    return ApiResponse.success<ApproveResult>({ message: "Join request cancelled" });
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

    // Only the creator can change roles (not co-admins)
    const isCreator: boolean = await this.isCreator(
      memberRecord.community_id, 
      adminUserId
    );
    if (!isCreator) {
      return ApiResponse.forbidden("Only the community creator can change member roles");
    }

    // Prevent changing the creator's role
    const isMemberCreator: boolean = await this.isMemberCreator(
      memberRecord.user_id,
      memberRecord.community_id
    );
    if (isMemberCreator) {
      return ApiResponse.forbidden("Cannot change the creator's role");
    }

    // Update role
    const { error: updateError } = await this.supabaseAdmin
      .from("community_members")
      .update({ role })
      .eq("id", memberId);

    if (updateError) {
      return ApiResponse.error("Failed to update member role", 500);
    }

    // Send notification to the user about role update
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("name")
      .eq("id", memberRecord.community_id)
      .single();
    
    if (community) {
      await notificationService.onRoleUpdated(memberRecord.user_id, memberRecord.community_id, community.name, role);
    }

    return ApiResponse.success<ApproveResult>({ message: "Member role updated" });
  }

  /**
   * Remove a member from the community (kick)
   * @param memberId - The member record ID to remove
   * @param adminUserId - The admin making the removal
   * @returns ServiceResult indicating success or failure
   */
  public async removeMember(
    memberId: string,
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

    // Check if user has permission (creator or admin)
    const isAdmin: boolean = await this.isAdminOrCreator(
      memberRecord.community_id,
      adminUserId
    );
    if (!isAdmin) {
      return ApiResponse.forbidden("Permission denied");
    }

    // Prevent removing the creator
    const isMemberCreator: boolean = await this.isMemberCreator(
      memberRecord.user_id,
      memberRecord.community_id
    );
    if (isMemberCreator) {
      return ApiResponse.forbidden("Cannot remove the community creator");
    }

    // If the requester is a co-admin (not creator), they cannot remove members
    // Only creator can remove members
    const isRequesterCreator: boolean = await this.isCreator(
      memberRecord.community_id,
      adminUserId
    );
    if (!isRequesterCreator) {
      return ApiResponse.forbidden("Only the community creator can remove members");
    }

    // Remove the member
    const { error: deleteError } = await this.supabaseAdmin
      .from("community_members")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      return ApiResponse.error("Failed to remove member", 500);
    }

    // Send notification to the user about being kicked
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("name")
      .eq("id", memberRecord.community_id)
      .single();
    
    if (community) {
      await notificationService.onMemberKicked(memberRecord.user_id, memberRecord.community_id, community.name);
    }

    return ApiResponse.success<ApproveResult>({ message: "Member removed successfully" });
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

    // Add member (directly approved since added by admin)
    const { data: newMember, error } = await this.supabaseAdmin
      .from("community_members")
      .insert({
        community_id: communityId,
        user_id: targetUserId,
        role: role || "member",
        status: "approved" as MemberStatus,
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

  // ==================== Community CRUD ====================

  /**
   * Create a new community with full onboarding flow
   * @param input - Community creation data including interests
   * @param userId - The user creating the community
   * @returns ServiceResult containing the created community
   */
  public async createCommunity(
    input: {
      name: string;
      description: string;
      logoUrl?: string;
      categoryName?: string;
      interests?: string[];
      location?: CommunityLocation;
      completeOnboarding?: boolean;
    },
    userId: string
  ): Promise<ServiceResult<CommunityData>> {
    // Validate description word count
    const wordCount = input.description.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 500) {
      return ApiResponse.badRequest(`Description must be 500 words or less. Current: ${wordCount}`);
    }

    // Generate slug from name
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Find or create category
    let categoryId: string | null = null;
    const categoryName = input.categoryName || (input.interests?.[0]);
    
    if (categoryName) {
      const { data: categoryData } = await this.supabaseAdmin
        .from("categories")
        .select("id")
        .ilike("name", categoryName)
        .maybeSingle();

      if (categoryData) {
        categoryId = categoryData.id;
      } else {
        // Create new category
        const { data: newCategory } = await this.supabaseAdmin
          .from("categories")
          .insert({ name: categoryName })
          .select("id")
          .single();
        
        if (newCategory) {
          categoryId = newCategory.id;
        }
      }
    }

    // Create community
    const { data: community, error: communityError } = await this.supabaseAdmin
      .from("communities")
      .insert({
        name: input.name,
        description: input.description,
        slug,
        logo_url: input.logoUrl || null,
        creator_id: userId,
        member_count: 1,
        category_id: categoryId,
        location: input.location ? JSON.stringify(input.location) : null,
      })
      .select()
      .single();

    if (communityError) {
      return ApiResponse.error(`Failed to create community: ${communityError.message}`, 500);
    }

    // Add creator as admin member
    const { error: memberError } = await this.supabaseAdmin
      .from("community_members")
      .insert({
        community_id: community.id,
        user_id: userId,
        role: "admin" as MemberRole,
        status: "approved",  // String: 'approved'
      });

    if (memberError) {
      console.error("[CommunityService] Error adding creator as member:", memberError);
    }

    // Award points for creating community
    await pointsService.onCommunityCreated(userId, community.id);

    // Save user interests if provided
    if (input.interests && input.interests.length > 0) {
      await this.saveUserInterests(userId, input.interests);
    }

    // Complete onboarding if requested
    if (input.completeOnboarding) {
      await this.completeUserOnboarding(userId);
    }

    return ApiResponse.created<CommunityData>(community as CommunityData);
  }

  /**
   * Save user interests to the database
   * @param userId - The user ID
   * @param interests - Array of interest/category names
   */
  private async saveUserInterests(userId: string, interests: string[]): Promise<void> {
    try {
      // Get all category IDs for the interests
      const { data: categoriesData } = await this.supabaseAdmin
        .from("categories")
        .select("id, name")
        .in("name", interests);

      if (categoriesData && categoriesData.length > 0) {
        // Create user_interests records with decreasing weights
        const userInterests = categoriesData.map((cat, index) => ({
          user_id: userId,
          category_id: cat.id,
          weight: 1.0 - (index * 0.1),
        }));

        await this.supabaseAdmin
          .from("user_interests")
          .upsert(userInterests, { onConflict: "user_id,category_id" });
      }
    } catch (error) {
      console.error("[CommunityService] Error saving user interests:", error);
    }
  }

  /**
   * Mark user onboarding as completed
   * @param userId - The user ID
   */
  private async completeUserOnboarding(userId: string): Promise<void> {
    try {
      await this.supabaseAdmin
        .from("users")
        .update({
          onboarding_completed: true,
          role_selected: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch (error) {
      console.error("[CommunityService] Error completing onboarding:", error);
    }
  }

  /**
   * Get community by ID
   * @param communityId - The community ID
   * @returns ServiceResult containing the community data
   */
  public async getCommunityById(
    communityId: string
  ): Promise<ServiceResult<CommunityData>> {
    const { data, error } = await this.supabaseAdmin
      .from("communities")
      .select(`
        *,
        creator:creator_id(id, full_name, username, avatar_url),
        category:category_id(id, name)
      `)
      .eq("id", communityId)
      .single();

    if (error) {
      return ApiResponse.notFound("Community");
    }

    return ApiResponse.success<CommunityData>(data as CommunityData);
  }

  /**
   * Get all communities with optional filters and membership status
   * @param options - Filter and pagination options
   * @param userId - Optional user ID to include membership status
   * @returns ServiceResult containing communities list with membership status
   */
  public async getCommunities(
    options?: {
      categoryId?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
    userId?: string
  ): Promise<ServiceResult<{ communities: (CommunityData & { membershipStatus?: "approved" | "pending" | "none" })[]; total: number }>> {
    let query = this.supabaseAdmin
      .from("communities")
      .select(`
        *,
        creator:creator_id(id, full_name, username, avatar_url),
        category:category_id(id, name)
      `, { count: "exact" });

    if (options?.categoryId) {
      query = query.eq("category_id", options.categoryId);
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    query = query.order("created_at", { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return ApiResponse.error(`Failed to fetch communities: ${error.message}`, 500);
    }

    const communities = (data || []) as CommunityData[];

    // If userId provided, fetch membership status for all communities
    if (userId && communities.length > 0) {
      const communityIds = communities.map(c => c.id);
      const { data: memberships } = await this.supabaseAdmin
        .from("community_members")
        .select("community_id, status")
        .eq("user_id", userId)
        .in("community_id", communityIds);

      const statusMap: Record<string, "approved" | "pending" | "none"> = {};
      communityIds.forEach(id => { statusMap[id] = "none"; });
      
      (memberships || []).forEach((m: { community_id: string; status: string }) => {
        if (m.status === "approved") {
          statusMap[m.community_id] = "approved";
        } else if (m.status === "pending") {
          statusMap[m.community_id] = "pending";
        }
      });

      // Also check if user is creator (they're automatically "approved")
      communities.forEach(c => {
        if (c.creator_id === userId) {
          statusMap[c.id] = "approved";
        }
      });

      const communitiesWithStatus = communities.map(c => ({
        ...c,
        membershipStatus: statusMap[c.id],
      }));

      return ApiResponse.success({
        communities: communitiesWithStatus,
        total: count || 0,
      });
    }

    return ApiResponse.success({
      communities: communities,
      total: count || 0,
    });
  }

  /**
   * Get membership status for a user across multiple communities
   * @param userId - The user ID
   * @param communityIds - Array of community IDs to check
   * @returns ServiceResult containing membership status map
   */
  public async getMembershipStatus(
    userId: string,
    communityIds: string[]
  ): Promise<ServiceResult<Record<string, "approved" | "pending" | "none">>> {
    if (communityIds.length === 0) {
      return ApiResponse.success({});
    }

    const { data: memberships, error } = await this.supabaseAdmin
      .from("community_members")
      .select("community_id, status")
      .eq("user_id", userId)
      .in("community_id", communityIds);

    if (error) {
      return ApiResponse.error(`Failed to fetch membership status: ${error.message}`, 500);
    }

    const statusMap: Record<string, "approved" | "pending" | "none"> = {};
    
    // Initialize all as none
    communityIds.forEach(id => {
      statusMap[id] = "none";
    });

    // Update with actual status
    (memberships || []).forEach((m: { community_id: string; status: string }) => {
      if (m.status === "approved") {
        statusMap[m.community_id] = "approved";
      } else if (m.status === "pending") {
        statusMap[m.community_id] = "pending";
      }
    });

    return ApiResponse.success(statusMap);
  }

  // ==================== Community Update Methods ====================

  /**
   * Update community details (logo, banner, location)
   * @param communityId - The community ID to update
   * @param userId - The user ID performing the update
   * @param data - The update data
   * @returns ServiceResult with updated data
   */
  public async updateCommunity(
    communityId: string,
    userId: string,
    data: {
      logoUrl?: string;
      bannerUrl?: string;
      location?: string;
    }
  ): Promise<ServiceResult<{
    logo_url: string | null;
    banner_url: string | null;
    location: string | null;
  }>> {
    // Check permission
    const isAdmin = await this.isAdminOrCreator(communityId, userId);
    if (!isAdmin) {
      return ApiResponse.error("You don't have permission to update this community", 403);
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.location) {
      updateData.location = data.location;
    }
    if (data.logoUrl) {
      updateData.logo_url = data.logoUrl;
    }
    if (data.bannerUrl) {
      updateData.banner_url = data.bannerUrl;
    }

    // Check if there's anything to update
    const hasUpdates = data.logoUrl || data.bannerUrl || data.location;
    if (!hasUpdates) {
      return ApiResponse.badRequest("No changes to save");
    }

    // Update community
    const { error: updateError } = await this.supabaseAdmin
      .from("communities")
      .update(updateData)
      .eq("id", communityId);

    if (updateError) {
      console.error("[CommunityService] Update error:", updateError);
      return ApiResponse.error(`Failed to update community: ${updateError.message}`, 500);
    }

    return ApiResponse.success({
      logo_url: data.logoUrl || null,
      banner_url: data.bannerUrl || null,
      location: data.location || null,
    });
  }

  /**
   * Get comprehensive user statistics including all report types
   * Includes: activity points, direct member reports, thread reports, and reply reports
   * @param userIds - Array of user IDs to get stats for
   * @returns ServiceResult containing user statistics
   */
  public async getUsersComprehensiveStats(
    userIds: string[]
  ): Promise<ServiceResult<Record<string, { points_count: number; report_count: number; reports: any[] }>>> {
    try {
      if (!userIds || userIds.length === 0) {
        return ApiResponse.success({});
      }

      // 1. Get activity points count (all points except report_received)
      const { data: userPointsData } = await this.supabaseAdmin
        .from("user_points")
        .select("user_id, point_type")
        .in("user_id", userIds)
        .neq("point_type", "report_received");

      // Count points per user
      const userStatsMap: Record<string, { points_count: number; report_count: number; reports: any[] }> = {};
      userIds.forEach(userId => {
        userStatsMap[userId] = { points_count: 0, report_count: 0, reports: [] };
      });

      if (userPointsData) {
        userPointsData.forEach((record: any) => {
          if (userStatsMap[record.user_id]) {
            userStatsMap[record.user_id].points_count += 1;
          }
        });
      }

      // 2. Get direct member reports
      const { data: memberReportsData } = await this.supabaseAdmin
        .from("reports")
        .select("id, reason, details, status, created_at, reporter_id, target_id, report_type")
        .eq("report_type", "member")
        .in("target_id", userIds)
        .order("created_at", { ascending: false });

      // 3. Get all threads created by these users
      const { data: userThreadsData } = await this.supabaseAdmin
        .from("messages")
        .select("id, sender_id")
        .in("sender_id", userIds)
        .is("parent_id", null); // Only threads

      let threadReportsData: any[] = [];
      if (userThreadsData && userThreadsData.length > 0) {
        const threadIds = userThreadsData.map(t => t.id);
        const { data } = await this.supabaseAdmin
          .from("reports")
          .select("id, reason, details, status, created_at, reporter_id, target_id, report_type")
          .eq("report_type", "thread")
          .in("target_id", threadIds)
          .order("created_at", { ascending: false });
        threadReportsData = data || [];
      }

      // 4. Get all replies created by these users
      const { data: userRepliesData } = await this.supabaseAdmin
        .from("messages")
        .select("id, sender_id")
        .in("sender_id", userIds)
        .not("parent_id", "is", null); // Only replies

      let replyReportsData: any[] = [];
      if (userRepliesData && userRepliesData.length > 0) {
        const replyIds = userRepliesData.map(r => r.id);
        const { data } = await this.supabaseAdmin
          .from("reports")
          .select("id, reason, details, status, created_at, reporter_id, target_id, report_type")
          .eq("report_type", "reply")
          .in("target_id", replyIds)
          .order("created_at", { ascending: false });
        replyReportsData = data || [];
      }

      // Create mapping of thread/reply IDs to sender IDs
      const threadSenderMap = new Map(userThreadsData?.map(t => [t.id, t.sender_id]) || []);
      const replySenderMap = new Map(userRepliesData?.map(r => [r.id, r.sender_id]) || []);

      // Add member reports
      memberReportsData?.forEach((report: any) => {
        const userId = report.target_id;
        if (userStatsMap[userId]) {
          userStatsMap[userId].reports.push({
            id: report.id,
            reason: report.reason,
            details: report.details,
            status: report.status,
            created_at: report.created_at,
            reporter_id: report.reporter_id
          });
        }
      });

      // Add thread reports (map to sender)
      threadReportsData.forEach((report: any) => {
        const userId = threadSenderMap.get(report.target_id);
        if (userId && userStatsMap[userId]) {
          userStatsMap[userId].reports.push({
            id: report.id,
            reason: report.reason,
            details: report.details,
            status: report.status,
            created_at: report.created_at,
            reporter_id: report.reporter_id
          });
        }
      });

      // Add reply reports (map to sender)
      replyReportsData.forEach((report: any) => {
        const userId = replySenderMap.get(report.target_id);
        if (userId && userStatsMap[userId]) {
          userStatsMap[userId].reports.push({
            id: report.id,
            reason: report.reason,
            details: report.details,
            status: report.status,
            created_at: report.created_at,
            reporter_id: report.reporter_id
          });
        }
      });

      // Set report counts
      userIds.forEach(userId => {
        userStatsMap[userId].report_count = userStatsMap[userId].reports.length;
      });

      return ApiResponse.success(userStatsMap);
    } catch (error) {
      console.error("[CommunityService] Error getting user stats:", error);
      return ApiResponse.error("Failed to get user statistics", 500);
    }
  }

  /**
   * Check if user has sufficient points to create a new community
   * @param userId - User ID to check
   * @returns ServiceResult with permission status and details
   */
  public async canUserCreateCommunity(
    userId: string
  ): Promise<ServiceResult<{
    canCreate: boolean;
    currentPoints: number;
    requiredPoints: number;
    communitiesOwned: number;
    message?: string;
  }>> {
    try {
      // Get user's total activity points (excluding reports)
      const { data: pointsData } = await this.supabaseAdmin
        .from("user_points")
        .select("points")
        .eq("user_id", userId)
        .neq("point_type", "report_received");
      
      const currentPoints = pointsData?.reduce((sum, p) => sum + (p.points || 1), 0) || 0;
      
      // Get number of communities owned by this user (all statuses - active, suspended, archived)
      // We count all communities the user created, regardless of status
      const { count: communitiesOwned, error: countError } = await this.supabaseAdmin
        .from("communities")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", userId);
      
      if (countError) {
        console.error("[CommunityService] Error counting communities:", countError);
      }
      
      const ownedCount = communitiesOwned || 0;
      
      console.log(`[CommunityService] User ${userId} owns ${ownedCount} communities, has ${currentPoints} points`);
      
      // Calculate required points based on progression
      const requiredPoints = calculateRequiredPoints(ownedCount);
      
      const canCreate = currentPoints >= requiredPoints;
      
      let message = "";
      if (!canCreate) {
        const needed = requiredPoints - currentPoints;
        message = `You need ${needed} more ${needed === 1 ? 'point' : 'points'} to create another community. Keep participating to earn points!`;
      }
      
      return ApiResponse.success({
        canCreate,
        currentPoints,
        requiredPoints,
        communitiesOwned: ownedCount,
        message: canCreate ? undefined : message
      });
    } catch (error) {
      console.error("[CommunityService] Error checking create permission:", error);
      return ApiResponse.error("Failed to check community creation permission", 500);
    }
  }

  /**
   * Get detailed community information by ID
   * Includes member count, event count, and membership status
   */
  public async getCommunityDetails(
    communityId: string,
    userId?: string
  ): Promise<ServiceResult<any>> {
    // Fetch basic community data
    const { data: community, error: communityError } = await this.supabaseAdmin
      .from("communities")
      .select(`
        *,
        creator:creator_id(id, username, avatar_url)
      `)
      .eq("id", communityId)
      .single();

    if (communityError) {
      return ApiResponse.notFound("Community");
    }

    // Get counts in parallel
    const [memberCountResult, eventCountResult, membershipResult] = await Promise.all([
      // Member count
      this.supabaseAdmin
        .from("community_members")
        .select("id", { count: "exact", head: true })
        .eq("community_id", communityId)
        .eq("status", "approved"),
      
      // Event count
      this.supabaseAdmin
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("community_id", communityId),
      
      // Check if user is a member (if userId provided)
      userId
        ? this.supabaseAdmin
            .from("community_members")
            .select("id")
            .eq("community_id", communityId)
            .eq("user_id", userId)
            .eq("status", "approved")
            .maybeSingle()
        : Promise.resolve({ data: null, error: null })
    ]);

    return ApiResponse.success({
      ...community,
      member_count: memberCountResult.count || 0,
      event_count: eventCountResult.count || 0,
      is_member: !!membershipResult.data
    });
  }

  /**
   * Update community details
   */
  public async updateCommunity(
    communityId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      location?: string;
      logo_url?: string;
      banner_url?: string;
    }
  ): Promise<ServiceResult<any>> {
    // Check if user is creator or admin
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single();

    if (!community) {
      return ApiResponse.notFound("Community");
    }

    const isCreator = community.creator_id === userId;

    // Check if user is admin
    const { data: membership } = await this.supabaseAdmin
      .from("community_members")
      .select("role")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .eq("status", "approved")
      .maybeSingle();

    const isAdmin = membership?.role === "admin";

    if (!isCreator && !isAdmin) {
      return ApiResponse.error("You don't have permission to update this community", 403);
    }

    // Update community
    const { data: updatedCommunity, error: updateError } = await this.supabaseAdmin
      .from("communities")
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq("id", communityId)
      .select()
      .single();

    if (updateError) {
      return ApiResponse.error(`Failed to update community: ${updateError.message}`, 500);
    }

    return ApiResponse.success(updatedCommunity);
  }

  /**
   * Delete a community (creator only)
   */
  public async deleteCommunity(
    communityId: string,
    userId: string
  ): Promise<ServiceResult<{ deleted: boolean }>> {
    // Check if user is the creator
    const { data: community, error: fetchError } = await this.supabaseAdmin
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single();

    if (fetchError) {
      return ApiResponse.notFound("Community");
    }

    if (community.creator_id !== userId) {
      return ApiResponse.error("Only the community creator can delete the community", 403);
    }

    // Delete community (cascade should handle related records)
    const { error: deleteError } = await this.supabaseAdmin
      .from("communities")
      .delete()
      .eq("id", communityId);

    if (deleteError) {
      return ApiResponse.error(`Failed to delete community: ${deleteError.message}`, 500);
    }

    return ApiResponse.success({ deleted: true });
  }
}

// Export singleton instance
export const communityService: CommunityService = CommunityService.getInstance();
