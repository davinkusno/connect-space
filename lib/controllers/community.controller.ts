import { communityService, CommunityService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { CommunityMember, MemberRole } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, BaseController } from "./base.controller";

// ==================== Request Body Types ====================

interface ApproveRequestBody {
  community_id: string;
}

interface BulkApproveRequestBody {
  community_id: string;
  member_ids?: string[];
}

interface JoinCommunityRequestBody {
  community_id: string;
}

interface UpdateRoleRequestBody {
  role: MemberRole;
}

interface AddMemberRequestBody {
  user_id: string;
  role?: MemberRole;
}

// ==================== Response Types ====================

interface ApproveResponse {
  message: string;
}

interface BulkApproveResponse {
  message: string;
  approved: number;
  failed: number;
}

interface JoinResponse {
  message: string;
  member?: CommunityMember;
}

interface RequestsResponse {
  requests: unknown[];
}

interface MembersResponse {
  members: CommunityMember[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== Community Controller Class ====================

/**
 * Controller for community-related API endpoints
 * Handles HTTP requests and delegates to CommunityService
 */
export class CommunityController extends BaseController {
  private readonly service: CommunityService;

  constructor() {
    super();
    this.service = communityService;
  }

  /**
   * POST /api/communities/members/[id]/approve
   * Approve a join request
   * @param request - The incoming request with community_id in body
   * @param memberId - The member record ID to approve
   * @returns NextResponse indicating success or failure
   */
  public async approveRequest(
    request: NextRequest, 
    memberId: string
  ): Promise<NextResponse<ApproveResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body: ApproveRequestBody = await this.parseBody<ApproveRequestBody>(request);

      if (!body.community_id) {
        return this.badRequest("Community ID is required");
      }

      const result: ServiceResult<ApproveResponse> = await this.service.approveRequest(
        memberId, 
        body.community_id, 
        user.id
      );

      if (result.success) {
        return this.json<ApproveResponse>(result.data as ApproveResponse, result.status);
      }
      
      return this.error(result.error?.message || "Failed to approve", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/communities/members/[id]/approve
   * Reject a join request
   * @param request - The incoming request with community_id query param
   * @param memberId - The member record ID to reject
   * @returns NextResponse indicating success or failure
   */
  public async rejectRequest(
    request: NextRequest, 
    memberId: string
  ): Promise<NextResponse<ApproveResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const communityId: string | null = this.getQueryParam(request, "community_id");

      if (!communityId) {
        return this.badRequest("Community ID is required");
      }

      const result: ServiceResult<ApproveResponse> = await this.service.rejectRequest(
        memberId, 
        communityId, 
        user.id
      );

      if (result.success) {
        return this.json<ApproveResponse>(result.data as ApproveResponse, result.status);
      }
      
      return this.error(result.error?.message || "Failed to reject", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/communities/members/bulk-approve
   * Bulk approve multiple join requests
   * @param request - The incoming request with community_id and member_ids
   * @returns NextResponse with approval counts
   */
  public async bulkApprove(
    request: NextRequest
  ): Promise<NextResponse<BulkApproveResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body: BulkApproveRequestBody = await this.parseBody<BulkApproveRequestBody>(request);

      if (!body.community_id) {
        return this.badRequest("Community ID is required");
      }

      const result: ServiceResult<BulkApproveResponse> = await this.service.bulkApprove(
        body.member_ids || [],
        body.community_id,
        user.id
      );

      if (result.success) {
        return this.json<BulkApproveResponse>(result.data as BulkApproveResponse, result.status);
      }
      
      return this.error(result.error?.message || "Failed to bulk approve", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities/[id]/requests
   * Get pending join requests for a community
   * @param request - The incoming request
   * @param communityId - The community ID to fetch requests for
   * @returns NextResponse with array of pending requests
   */
  public async getPendingRequests(
    request: NextRequest, 
    communityId: string
  ): Promise<NextResponse<RequestsResponse | ApiErrorResponse>> {
    try {
      await this.requireAuth();
      const result: ServiceResult<unknown[]> = await this.service.getPendingRequests(communityId);

      if (result.success) {
        return this.json<RequestsResponse>({ requests: result.data || [] }, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch requests", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/communities/members/join
   * Request to join a community
   * @param request - The incoming request with community_id
   * @returns NextResponse with join status
   */
  public async joinCommunity(
    request: NextRequest
  ): Promise<NextResponse<JoinResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body: JoinCommunityRequestBody = await this.parseBody<JoinCommunityRequestBody>(request);

      if (!body.community_id) {
        return this.badRequest("Community ID is required");
      }

      const result: ServiceResult<JoinResponse> = await this.service.joinCommunity(
        body.community_id, 
        user.id
      );

      if (result.success) {
        return this.json<JoinResponse>(result.data as JoinResponse, result.status);
      }
      
      return this.error(result.error?.message || "Failed to join", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/communities/[id]/members/cancel
   * Cancel a pending join request (by the user who submitted it)
   * @param request - The incoming request
   * @param communityId - The community ID
   * @returns NextResponse indicating success or failure
   */
  public async cancelJoinRequest(
    request: NextRequest,
    communityId: string
  ): Promise<NextResponse<ApproveResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();

      const result: ServiceResult<ApproveResponse> = await this.service.cancelJoinRequest(
        communityId,
        user.id
      );

      if (result.success) {
        return this.json<ApproveResponse>(result.data as ApproveResponse, result.status);
      }
      
      return this.error(result.error?.message || "Failed to cancel request", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/communities/members/[id]/role
   * Update a member's role
   * @param request - The incoming request with new role
   * @param memberId - The member record ID to update
   * @returns NextResponse indicating success or failure
   */
  public async updateMemberRole(
    request: NextRequest, 
    memberId: string
  ): Promise<NextResponse<ApproveResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body: UpdateRoleRequestBody = await this.parseBody<UpdateRoleRequestBody>(request);

      const validRoles: MemberRole[] = ["admin", "member", "moderator"];
      if (!body.role || !validRoles.includes(body.role)) {
        return this.badRequest("Invalid role. Must be 'admin', 'member', or 'moderator'");
      }

      const result: ServiceResult<ApproveResponse> = await this.service.updateMemberRole(
        memberId, 
        body.role, 
        user.id
      );

      if (result.success) {
        return this.json<ApproveResponse>(result.data as ApproveResponse, result.status);
      }
      
      return this.error(result.error?.message || "Failed to update role", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities/[id]/members
   * Get community members with pagination
   * @param request - The incoming request with query params
   * @param communityId - The community ID to fetch members for
   * @returns NextResponse with paginated member list
   */
  public async getMembers(
    request: NextRequest, 
    communityId: string
  ): Promise<NextResponse<MembersResponse | ApiErrorResponse>> {
    try {
      const page: number = this.getQueryParamAsNumber(request, "page", 1);
      const pageSize: number = this.getQueryParamAsNumber(request, "pageSize", 10);
      const role: string | null = this.getQueryParam(request, "role");
      const search: string | null = this.getQueryParam(request, "search");

      const result: ServiceResult<MembersResponse> = await this.service.getMembers(
        communityId, 
        { 
          page, 
          pageSize, 
          role: role as MemberRole | undefined, 
          search: search || undefined 
        }
      );

      if (result.success) {
        return this.json<MembersResponse>(result.data as MembersResponse, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch members", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/communities/[id]/members
   * Add a member to community (by admin)
   * @param request - The incoming request with user_id and role
   * @param communityId - The community to add member to
   * @returns NextResponse with new member data
   */
  public async addMember(
    request: NextRequest, 
    communityId: string
  ): Promise<NextResponse<CommunityMember | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body: AddMemberRequestBody = await this.parseBody<AddMemberRequestBody>(request);

      if (!body.user_id) {
        return this.badRequest("User ID is required");
      }

      const result: ServiceResult<CommunityMember> = await this.service.addMember(
        communityId, 
        body.user_id, 
        body.role || "member", 
        user.id
      );

      if (result.success) {
        return this.json<CommunityMember>(result.data as CommunityMember, result.status);
      }
      
      return this.error(result.error?.message || "Failed to add member", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  // ==================== Community CRUD ====================

  /**
   * POST /api/communities
   * Create a new community
   * @param request - The incoming request with community data
   * @returns NextResponse with created community
   */
  public async createCommunity(
    request: NextRequest
  ): Promise<NextResponse<{ communityId: string; message: string } | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body = await this.parseBody<{
        name: string;
        description: string;
        logoUrl?: string;
        categoryName?: string;
        location?: { lat: number; lng: number; address?: string; city?: string };
      }>(request);

      if (!body.name || !body.description) {
        return this.badRequest("Name and description are required");
      }

      // Validate description length
      const wordCount = body.description.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount > 500) {
        return this.badRequest(`Description must be 500 words or less. Current: ${wordCount}`);
      }

      const result = await this.service.createCommunity(body, user.id);

      if (result.success && result.data) {
        return this.json({ communityId: result.data.id, message: "Community created successfully" }, 201);
      }
      
      return this.error(result.error?.message || "Failed to create community", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities
   * Get all communities with optional filters
   * @param request - The incoming request with query params
   * @returns NextResponse with communities list
   */
  public async getCommunities(
    request: NextRequest
  ): Promise<NextResponse<{ communities: unknown[]; total: number } | ApiErrorResponse>> {
    try {
      const { searchParams } = new URL(request.url);
      const categoryId = searchParams.get("category") || undefined;
      const search = searchParams.get("search") || undefined;
      const limit = parseInt(searchParams.get("limit") || "20");
      const offset = parseInt(searchParams.get("offset") || "0");

      const result = await this.service.getCommunities({
        categoryId,
        search,
        limit,
        offset,
      });

      if (result.success) {
        return this.json(result.data!, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch communities", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities/[id]
   * Get a community by ID
   * @param request - The incoming request
   * @param communityId - The community ID
   * @returns NextResponse with community data
   */
  public async getCommunityById(
    request: NextRequest,
    communityId: string
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      const result = await this.service.getCommunityById(communityId);

      if (result.success) {
        return this.json(result.data!, result.status);
      }
      
      return this.error(result.error?.message || "Community not found", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities/membership-status
   * Get membership status for current user across multiple communities
   * @param request - The incoming request with community IDs
   * @returns NextResponse with membership status map
   */
  public async getMembershipStatus(
    request: NextRequest
  ): Promise<NextResponse<Record<string, string> | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const { searchParams } = new URL(request.url);
      const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];

      if (ids.length === 0) {
        return this.json({}, 200);
      }

      const result = await this.service.getMembershipStatus(user.id, ids);

      if (result.success) {
        return this.json(result.data!, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch membership status", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const communityController: CommunityController = new CommunityController();
