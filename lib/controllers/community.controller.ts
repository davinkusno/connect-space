import {
  communityService,
  CommunityService,
  storageService,
  StorageService,
  recommendationService,
  RecommendationService,
} from "@/lib/services";
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

interface CommunityRecommendationsResponse {
  recommendedCommunityIds: string[];
  recommendations: Array<{
    communityId: string;
    score: number;
    confidence: number;
    reasons: Array<{
      type: string;
      description: string;
      weight: number;
    }>;
  }>;
  metadata: {
    algorithmsUsed: string[];
    diversityScore: number;
  };
}

// ==================== Community Controller Class ====================

interface UpdateCommunityResponse {
  success: boolean;
  message: string;
  data: {
    logo_url: string | null;
    banner_url: string | null;
    location: string | null;
  };
}

/**
 * Controller for community-related API endpoints
 * Handles HTTP requests and delegates to CommunityService
 */
export class CommunityController extends BaseController {
  private readonly service: CommunityService;
  private readonly storage: StorageService;
  private readonly recommendationService: RecommendationService;

  constructor() {
    super();
    this.service = communityService;
    this.storage = storageService;
    this.recommendationService = recommendationService;
  }

  /**
   * GET /api/communities/recommendations
   * Get recommended communities for the current user
   * @param request - The incoming request
   * @returns NextResponse with recommended communities
   */
  public async getRecommendations(
    request: NextRequest
  ): Promise<NextResponse<CommunityRecommendationsResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get("limit") || "50");
      const includePopular = searchParams.get("includePopular") !== "false";
      const diversityWeight = parseFloat(searchParams.get("diversityWeight") || "0.3");

      const result = await this.recommendationService.getCommunityRecommendations(user.id, {
        maxRecommendations: limit,
        includePopular,
        diversityWeight,
      });

      if (!result.success || !result.data) {
        return this.error(result.error?.message || "Failed to generate recommendations", result.status);
      }

      // Sort with tie-breaking: score (desc) -> confidence (desc) -> communityId (asc for deterministic ordering)
      console.log("[CONTROLLER] Before sorting - top 5:");
      result.data.recommendations.slice(0, 5).forEach((rec, i) => {
        console.log(`  ${i + 1}. ID: ${rec.communityId}, score: ${rec.score.toFixed(3)}, confidence: ${rec.confidence.toFixed(3)}`);
      });
      
      const sortedRecommendations = result.data.recommendations.sort((a, b) => {
        // Primary: sort by score (descending)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Secondary: sort by confidence (descending) - higher confidence wins ties
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        // Tertiary: sort by communityId (ascending) - deterministic ordering for equal scores/confidence
        return a.communityId.localeCompare(b.communityId);
      });

      console.log("[CONTROLLER] After sorting - top 5:");
      sortedRecommendations.slice(0, 5).forEach((rec, i) => {
        console.log(`  ${i + 1}. ID: ${rec.communityId}, score: ${rec.score.toFixed(3)}, confidence: ${rec.confidence.toFixed(3)}`);
      });

      const response: CommunityRecommendationsResponse = {
        recommendedCommunityIds: sortedRecommendations.map((rec) => rec.communityId),
        recommendations: sortedRecommendations.map((rec) => ({
          communityId: rec.communityId,
          score: rec.score,
          confidence: rec.confidence,
          reasons: rec.reasons,
        })),
        metadata: result.data.metadata,
      };

      return this.json(response, 200);
    } catch (error: unknown) {
      return this.handleError(error);
    }
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
      const body: ApproveRequestBody = await this.parseBody<ApproveRequestBody>(
        request
      );

      if (!body.community_id) {
        return this.badRequest("Community ID is required");
      }

      const result: ServiceResult<ApproveResponse> =
        await this.service.approveRequest(memberId, body.community_id, user.id);

      if (result.success) {
        return this.json<ApproveResponse>(
          result.data as ApproveResponse,
          result.status
        );
      }

      return this.error(
        result.error?.message || "Failed to approve",
        result.status
      );
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
      const communityId: string | null = this.getQueryParam(
        request,
        "community_id"
      );

      if (!communityId) {
        return this.badRequest("Community ID is required");
      }

      const result: ServiceResult<ApproveResponse> =
        await this.service.rejectRequest(memberId, communityId, user.id);

      if (result.success) {
        return this.json<ApproveResponse>(
          result.data as ApproveResponse,
          result.status
        );
      }

      return this.error(
        result.error?.message || "Failed to reject",
        result.status
      );
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
      const body: BulkApproveRequestBody =
        await this.parseBody<BulkApproveRequestBody>(request);

      if (!body.community_id) {
        return this.badRequest("Community ID is required");
      }

      const result: ServiceResult<BulkApproveResponse> =
        await this.service.bulkApprove(
          body.member_ids || [],
          body.community_id,
          user.id
        );

      if (result.success) {
        return this.json<BulkApproveResponse>(
          result.data as BulkApproveResponse,
          result.status
        );
      }

      return this.error(
        result.error?.message || "Failed to bulk approve",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/communities/members/bulk-reject
   * Bulk reject multiple join requests
   * @param request - The incoming request with community_id and member_ids
   * @returns NextResponse with rejection counts
   */
  public async bulkReject(
    request: NextRequest
  ): Promise<NextResponse<BulkApproveResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body: BulkApproveRequestBody = await this.parseBody<BulkApproveRequestBody>(request);

      if (!body.community_id) {
        return this.badRequest("Community ID is required");
      }

      const result: ServiceResult<BulkApproveResponse> = await this.service.bulkReject(
        body.member_ids || [],
        body.community_id,
        user.id
      );

      if (result.success) {
        return this.json<BulkApproveResponse>(result.data as BulkApproveResponse, result.status);
      }
      
      return this.error(result.error?.message || "Failed to bulk reject", result.status);
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
      const result: ServiceResult<unknown[]> =
        await this.service.getPendingRequests(communityId);

      if (result.success) {
        return this.json<RequestsResponse>(
          { requests: result.data || [] },
          result.status
        );
      }

      return this.error(
        result.error?.message || "Failed to fetch requests",
        result.status
      );
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
      const body: JoinCommunityRequestBody =
        await this.parseBody<JoinCommunityRequestBody>(request);

      if (!body.community_id) {
        return this.badRequest("Community ID is required");
      }

      const result: ServiceResult<JoinResponse> =
        await this.service.joinCommunity(body.community_id, user.id);

      if (result.success) {
        return this.json<JoinResponse>(
          result.data as JoinResponse,
          result.status
        );
      }

      return this.error(
        result.error?.message || "Failed to join",
        result.status
      );
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

      const result: ServiceResult<ApproveResponse> =
        await this.service.cancelJoinRequest(communityId, user.id);

      if (result.success) {
        return this.json<ApproveResponse>(
          result.data as ApproveResponse,
          result.status
        );
      }

      return this.error(
        result.error?.message || "Failed to cancel request",
        result.status
      );
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
      const body: UpdateRoleRequestBody =
        await this.parseBody<UpdateRoleRequestBody>(request);

      const validRoles: MemberRole[] = ["admin", "member", "moderator"];
      if (!body.role || !validRoles.includes(body.role)) {
        return this.badRequest(
          "Invalid role. Must be 'admin', 'member', or 'moderator'"
        );
      }

      const result: ServiceResult<ApproveResponse> =
        await this.service.updateMemberRole(memberId, body.role, user.id);

      if (result.success) {
        return this.json<ApproveResponse>(
          result.data as ApproveResponse,
          result.status
        );
      }

      return this.error(
        result.error?.message || "Failed to update role",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/communities/members/[id]
   * Remove a member from the community (kick)
   * @param request - The incoming request
   * @param memberId - The member record ID to remove
   * @returns NextResponse indicating success or failure
   */
  public async removeMember(
    request: NextRequest,
    memberId: string
  ): Promise<NextResponse<ApproveResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();

      const result: ServiceResult<ApproveResponse> =
        await this.service.removeMember(memberId, user.id);

      if (result.success) {
        return this.json<ApproveResponse>(
          result.data as ApproveResponse,
          result.status
        );
      }

      return this.error(
        result.error?.message || "Failed to remove member",
        result.status
      );
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
      const pageSize: number = this.getQueryParamAsNumber(
        request,
        "pageSize",
        10
      );
      const role: string | null = this.getQueryParam(request, "role");
      const search: string | null = this.getQueryParam(request, "search");

      const result: ServiceResult<MembersResponse> =
        await this.service.getMembers(communityId, {
          page,
          pageSize,
          role: role as MemberRole | undefined,
          search: search || undefined,
        });

      if (result.success) {
        return this.json<MembersResponse>(
          result.data as MembersResponse,
          result.status
        );
      }

      return this.error(
        result.error?.message || "Failed to fetch members",
        result.status
      );
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
      const body: AddMemberRequestBody =
        await this.parseBody<AddMemberRequestBody>(request);

      if (!body.user_id) {
        return this.badRequest("User ID is required");
      }

      const result: ServiceResult<CommunityMember> =
        await this.service.addMember(
          communityId,
          body.user_id,
          body.role || "member",
          user.id
        );

      if (result.success) {
        return this.json<CommunityMember>(
          result.data as CommunityMember,
          result.status
        );
      }

      return this.error(
        result.error?.message || "Failed to add member",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  // ==================== Community CRUD ====================

  /**
   * POST /api/communities
   * Create a new community (JSON body)
   * @param request - The incoming request with community data
   * @returns NextResponse with created community
   */
  public async createCommunity(
    request: NextRequest
  ): Promise<
    NextResponse<{ communityId: string; message: string } | ApiErrorResponse>
  > {
    try {
      const user: User = await this.requireAuth();
      const body = await this.parseBody<{
        name: string;
        description: string;
        logoUrl?: string;
        categoryName?: string;
        interests?: string[];
        location?: {
          lat: number;
          lng: number;
          address?: string;
          city?: string;
        };
        completeOnboarding?: boolean;
      }>(request);

      if (!body.name || !body.description) {
        return this.badRequest("Name and description are required");
      }

      const result = await this.service.createCommunity(body, user.id);

      if (result.success && result.data) {
        return this.json(
          {
            communityId: result.data.id,
            message: "Community created successfully",
          },
          201
        );
      }

      return this.error(
        result.error?.message || "Failed to create community",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/communities/create
   * Create a new community with image upload (FormData)
   * @param request - The incoming request with form data
   * @returns NextResponse with created community
   */
  public async createCommunityWithImage(
    request: NextRequest
  ): Promise<
    NextResponse<{ communityId: string; message: string } | ApiErrorResponse>
  > {
    try {
      const user: User = await this.requireAuth();

      // Check if user is banned from creating communities
      const { data: userData, error: userError } = await this.supabaseAdmin
        .from("users")
        .select("can_create_communities")
        .eq("id", user.id)
        .single();

      if (userError) {
        return this.error("Failed to verify user permissions", 500);
      }

      if (userData && userData.can_create_communities === false) {
        return this.error(
          "You have been banned from creating communities due to previous violations. Please contact support if you believe this is an error.",
          403,
          "BANNED_FROM_CREATING_COMMUNITIES"
        );
      }

      // Parse form data
      const formData = await request.formData();
      const interests = JSON.parse(formData.get("interests") as string);
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const profileImage = formData.get("profileImage") as File | null;

      // Validate required fields
      if (!interests || !name || !description) {
        return this.badRequest("All required fields must be provided");
      }

      // Profile picture is now mandatory
      if (!profileImage || profileImage.size === 0) {
        return this.badRequest("Profile picture is required to create a community");
      }

      // Handle profile image upload (required)
      let profileImageUrl: string | undefined = undefined;
      if (profileImage && profileImage.size > 0) {
        const uploadResult = await this.storage.uploadImage(
          profileImage,
          {
            folder: "communities",
            maxSizeKey: "community"
          }
        );

        if (!uploadResult.success) {
          return this.error(
            uploadResult.error?.message || "Failed to upload image",
            uploadResult.status
          );
        }

        profileImageUrl = uploadResult.data?.url;
      }

      // Get category name from interests
      const interestsArray = Array.isArray(interests) ? interests : [interests];
      const categoryName = interestsArray[0];

      // Create community using the service
      const result = await this.service.createCommunity(
        {
          name,
          description,
          logoUrl: profileImageUrl,
          categoryName,
          interests: interestsArray,
          completeOnboarding: true,
        },
        user.id
      );

      if (result.success && result.data) {
        return this.json(
          {
            communityId: result.data.id,
            message: "Community created successfully",
          },
          201
        );
      }

      return this.error(
        result.error?.message || "Failed to create community",
        result.status
      );
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
  ): Promise<
    NextResponse<{ communities: unknown[]; total: number } | ApiErrorResponse>
  > {
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

      return this.error(
        result.error?.message || "Failed to fetch communities",
        result.status
      );
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

      return this.error(
        result.error?.message || "Community not found",
        result.status
      );
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

      return this.error(
        result.error?.message || "Failed to fetch membership status",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/communities/[id]/update
   * Update community logo, banner, and location
   * @param request - The incoming request with form data
   * @param communityId - The community ID to update
   * @returns NextResponse with updated data
   */
  public async updateCommunity(
    request: NextRequest,
    communityId: string
  ): Promise<NextResponse<UpdateCommunityResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();

      const formData = await request.formData();
      const profileImage = formData.get("profileImage") as File | null;
      const bannerImage = formData.get("bannerImage") as File | null;
      const location = formData.get("location") as string | null;

      let logoUrl: string | undefined;
      let bannerUrl: string | undefined;

      // Handle profile image upload
      if (profileImage && profileImage.size > 0) {
        const uploadResult = await this.storage.uploadImage(profileImage, {
          folder: "communities",
          maxSizeKey: "community",
        });
        if (!uploadResult.success) {
          return this.error(
            uploadResult.error?.message || "Failed to upload profile image",
            uploadResult.status
          );
        }
        logoUrl = uploadResult.data?.url;
      }

      // Handle banner image upload
      if (bannerImage && bannerImage.size > 0) {
        const uploadResult = await this.storage.uploadImage(bannerImage, {
          folder: "banners",
          maxSizeKey: "banner",
        });
        if (!uploadResult.success) {
          return this.error(
            uploadResult.error?.message || "Failed to upload banner image",
            uploadResult.status
          );
        }
        bannerUrl = uploadResult.data?.url;
      }

      // Update community
      const result = await this.service.updateCommunity(communityId, user.id, {
        logoUrl: logoUrl,
        bannerUrl: bannerUrl,
        location: location || undefined,
      });

      if (result.success) {
        return this.json<UpdateCommunityResponse>(
          {
            success: true,
            message: "Community updated successfully",
            data: result.data!,
          },
          result.status
        );
      }

      return this.error(
        result.error?.message || "Failed to update community",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities/[id]/join-requests
   * Get join requests for a community with comprehensive user stats
   * @param request - The incoming request
   * @param communityId - The community ID
   * @returns NextResponse with join requests including user stats
   */
  public async getJoinRequestsWithStats(
    request: NextRequest,
    communityId: string
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();

      // Get pending join requests
      const requestsResult = await this.service.getPendingRequests(
        communityId,
        user.id
      );
      if (!requestsResult.success) {
        return this.error(
          requestsResult.error?.message || "Failed to fetch requests",
          requestsResult.status
        );
      }

      const requests = requestsResult.data || [];

      if (requests.length === 0) {
        return this.json({ requests: [] });
      }

      // Get user IDs
      const userIds = requests.map((r: any) => r.user_id);

      // Get comprehensive user stats
      const statsResult = await this.service.getUsersComprehensiveStats(
        userIds
      );
      if (!statsResult.success) {
        return this.error(
          statsResult.error?.message || "Failed to fetch user stats",
          statsResult.status
        );
      }

      const userStats = statsResult.data || {};

      // Combine requests with stats
      const requestsWithStats = requests.map((request: any) => {
        const stats = userStats[request.user_id] || {
          points_count: 0,
          report_count: 0,
          reports: [],
        };
        return {
          ...request,
          points_count: stats.points_count,
          report_count: stats.report_count,
          reports: stats.reports,
        };
      });

      return this.json({ requests: requestsWithStats });
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities/[id]/members-stats
   * Get community members with comprehensive user stats
   * @param request - The incoming request
   * @param communityId - The community ID
   * @returns NextResponse with members including user stats
   */
  public async getMembersWithStats(
    request: NextRequest,
    communityId: string
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();

      // Get approved members
      const membersResult = await this.service.getMembers(
        communityId,
        user.id,
        {
          page: 1,
          pageSize: 1000, // Get all members
        }
      );

      if (!membersResult.success) {
        return this.error(
          membersResult.error?.message || "Failed to fetch members",
          membersResult.status
        );
      }

      const members = membersResult.data?.members || [];

      if (members.length === 0) {
        return this.json({ success: true, members: [] });
      }

      // Get user IDs
      const userIds = members.map((m: any) => m.user_id);

      // Get comprehensive user stats
      const statsResult = await this.service.getUsersComprehensiveStats(
        userIds
      );
      if (!statsResult.success) {
        return this.error(
          statsResult.error?.message || "Failed to fetch user stats",
          statsResult.status
        );
      }

      const userStats = statsResult.data || {};

      // Combine members with stats
      const membersWithStats = members.map((member: any) => {
        const stats = userStats[member.user_id] || {
          points_count: 0,
          report_count: 0,
          reports: [],
        };
        return {
          ...member,
          points_count: stats.points_count,
          report_count: stats.report_count,
        };
      });

      return this.json({ success: true, members: membersWithStats });
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities/check-create-permission
   * Check if user has sufficient points to create a new community
   * @param request - The incoming request
   * @returns NextResponse with permission status
   */
  public async checkCreatePermission(
    request: NextRequest
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();

      const result = await this.service.canUserCreateCommunity(user.id);

      if (result.success) {
        return this.json(result.data);
      }

      return this.error(
        result.error?.message || "Failed to check permission",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities/[id]
   * Get detailed community information
   * @param request - The incoming request
   * @param communityId - The community ID
   * @returns NextResponse with community details
   */
  public async getCommunityById(
    request: NextRequest,
    communityId: string
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      // Get user if authenticated (optional for this endpoint)
      let userId: string | undefined;
      try {
        const user = await this.requireAuth();
        userId = user.id;
      } catch {
        // User not authenticated - that's okay for viewing communities
        userId = undefined;
      }

      const result = await this.service.getCommunityDetails(
        communityId,
        userId
      );

      if (result.success) {
        return this.json({ success: true, data: result.data }, result.status);
      }

      return this.error(
        result.error?.message || "Failed to fetch community",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/communities/[id]
   * Update community details (creator or admin only)
   * @param request - The incoming request with update data
   * @param communityId - The community ID
   * @returns NextResponse with updated community
   */
  public async updateCommunityById(
    request: NextRequest,
    communityId: string
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      const user = await this.requireAuth();
      const body = await request.json();

      // Validate update data
      const allowedFields = [
        "name",
        "description",
        "category",
        "location",
        "logo_url",
        "banner_url",
      ];
      const updateData: any = {};

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return this.badRequest("No valid fields to update");
      }

      const result = await this.service.updateCommunity(
        communityId,
        user.id,
        updateData
      );

      if (result.success) {
        return this.json({ success: true, data: result.data }, result.status);
      }

      return this.error(
        result.error?.message || "Failed to update community",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/communities/[id]
   * Delete a community (creator only)
   * @param request - The incoming request
   * @param communityId - The community ID
   * @returns NextResponse with deletion confirmation
   */
  public async deleteCommunityById(
    request: NextRequest,
    communityId: string
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      const user = await this.requireAuth();
      const result = await this.service.deleteCommunity(communityId, user.id);

      if (result.success) {
        return this.json({ success: true, data: result.data }, result.status);
      }

      return this.error(
        result.error?.message || "Failed to delete community",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities/admin-list
   * Get all communities where user is creator or admin
   * @param request - The incoming request
   * @returns NextResponse with admin communities
   */
  public async getAdminCommunities(
    request: NextRequest
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      const user = await this.requireAuth();
      const result = await this.service.getAdminCommunities(user.id);

      if (result.success) {
        return this.json({ success: true, data: result.data }, result.status);
      }

      return this.error(
        result.error?.message || "Failed to fetch admin communities",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities/user
   * Get user's communities (created + joined) for dashboard
   * @param request - The incoming request
   * @returns NextResponse with user's communities
   */
  public async getUserCommunities(
    request: NextRequest
  ): Promise<NextResponse<{ created: unknown[]; joined: unknown[] } | ApiErrorResponse>> {
    try {
      const user = await this.requireAuth();
      const result = await this.service.getUserCommunities(user.id);

      if (result.success) {
        return this.json(result.data!, result.status);
      }

      return this.error(
        result.error?.message || "Failed to fetch user communities",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  // ==================== Superadmin Methods ====================

  /**
   * GET /api/admin/inactive-communities
   * Get all inactive communities (superadmin only)
   * @param request - The incoming request
   * @returns NextResponse with array of inactive communities
   */
  public async getInactiveCommunities(
    request: NextRequest
  ): Promise<NextResponse<{ communities: any[] } | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();
      const result = await this.service.getInactiveCommunities();

      if (result.success) {
        return this.json(
          { communities: result.data || [] }, 
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to fetch communities", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/admin/inactive-communities
   * Ban or reactivate a community (superadmin only)
   * @param request - The incoming request with action data
   * @returns NextResponse indicating success
   */
  public async manageCommunity(
    request: NextRequest
  ): Promise<NextResponse<{ message: string } | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();
      const body = await this.parseBody<{
        communityId: string;
        action: "ban" | "reactivate";
        reason?: string;
      }>(request);

      if (!body.communityId || !body.action) {
        return this.badRequest("Community ID and action are required");
      }

      let result: ServiceResult<void>;
      
      if (body.action === "ban") {
        result = await this.service.banCommunity(
          body.communityId, 
          body.reason || "Inactivity"
        );
      } else if (body.action === "reactivate") {
        result = await this.service.reactivateCommunity(body.communityId);
      } else {
        return this.badRequest("Invalid action. Must be 'ban' or 'reactivate'");
      }

      if (result.success) {
        return this.json(
          { message: `Community ${body.action}d successfully` },
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to manage community", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/admin/communities/[id]
   * Get community details for superadmin (read-only)
   * @param request - The incoming request
   * @param communityId - The community ID
   * @returns NextResponse with community details
   */
  public async getCommunityDetailsForSuperadmin(
    request: NextRequest,
    communityId: string
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();
      const result = await this.service.getCommunityDetailsForSuperadmin(communityId);

      if (result.success) {
        return this.json(result.data!, result.status);
      }

      return this.error(result.error?.message || "Failed to fetch community details", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const communityController: CommunityController =
  new CommunityController();
