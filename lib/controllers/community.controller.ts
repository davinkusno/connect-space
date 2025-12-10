import { NextRequest, NextResponse } from "next/server";
import { BaseController } from "./base.controller";
import { communityService } from "@/lib/services";

/**
 * Controller for community-related API endpoints
 */
export class CommunityController extends BaseController {
  /**
   * POST /api/community-members/[id]/approve
   * Approve a join request
   */
  async approveRequest(request: NextRequest, memberId: string): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const { community_id } = await this.parseBody<{ community_id: string }>(request);

      if (!community_id) {
        return this.badRequest("Community ID is required");
      }

      const result = await communityService.approveRequest(memberId, community_id, user.id);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/community-members/[id]/approve
   * Reject a join request
   */
  async rejectRequest(request: NextRequest, memberId: string): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const communityId = this.getQueryParam(request, "community_id");

      if (!communityId) {
        return this.badRequest("Community ID is required");
      }

      const result = await communityService.rejectRequest(memberId, communityId, user.id);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/community-members/bulk-approve
   * Bulk approve join requests
   */
  async bulkApprove(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const { community_id, member_ids } = await this.parseBody<{
        community_id: string;
        member_ids?: string[];
      }>(request);

      if (!community_id) {
        return this.badRequest("Community ID is required");
      }

      const result = await communityService.bulkApprove(
        member_ids || [],
        community_id,
        user.id
      );
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/community-members/[communityId]/requests
   * Get pending join requests
   */
  async getPendingRequests(request: NextRequest, communityId: string): Promise<NextResponse> {
    try {
      await this.requireAuth();
      const result = await communityService.getPendingRequests(communityId);
      return this.json(
        result.success ? { requests: result.data } : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const communityController = new CommunityController();

