import { adsService, AdsService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { Ad, AdStatus } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, BaseController } from "./base.controller";

// ==================== Request Body Types ====================

interface CreateAdBody {
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  link_url: string;
  community_id?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  placement?: string;
}

interface UpdateStatusBody {
  status: AdStatus;
}

interface TrackBody {
  type: "impression" | "click" | "view";
}

// ==================== Response Types ====================

interface AdsListResponse {
  ads: Ad[];
}

interface MessageResponse {
  message: string;
}

interface SuccessResponse {
  success: boolean;
}

// ==================== Ads Controller Class ====================

/**
 * Controller for ads-related API endpoints
 * Handles HTTP requests and delegates to AdsService
 */
export class AdsController extends BaseController {
  private readonly service: AdsService;

  constructor() {
    super();
    this.service = adsService;
  }

  /**
   * GET /api/ads
   * Get all ads with optional filters
   * @param request - The incoming request with query params
   * @returns NextResponse with array of ads
   */
  public async getAll(
    request: NextRequest
  ): Promise<NextResponse<AdsListResponse | ApiErrorResponse>> {
    try {
      const status: string | null = this.getQueryParam(request, "status");
      const communityId: string | null = this.getQueryParam(request, "community_id");
      const placement: string | null = this.getQueryParam(request, "placement");
      const activeOnly: boolean = this.getQueryParam(request, "active_only") === "true";
      const limit: number | undefined = this.getQueryParamAsNumber(request, "limit", 0) || undefined;

      const result: ServiceResult<Ad[]> = await this.service.getAll({ 
        status: status || undefined, 
        communityId: communityId || undefined,
        placement: placement || undefined,
        activeOnly: activeOnly,
        limit 
      });

      if (result.success) {
        return this.json<AdsListResponse>({ ads: result.data || [] }, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch ads", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/ads
   * Create a new ad
   * @param request - The incoming request with ad data
   * @returns NextResponse with created ad
   */
  public async create(
    request: NextRequest
  ): Promise<NextResponse<Ad | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body: CreateAdBody = await this.parseBody<CreateAdBody>(request);

      const result: ServiceResult<Ad> = await this.service.create(user.id, body);

      if (result.success) {
        return this.json<Ad>(result.data as Ad, result.status);
      }
      
      return this.error(result.error?.message || "Failed to create ad", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/ads/[id]
   * Get ad by ID
   * @param request - The incoming request
   * @param adId - The ad ID to fetch
   * @returns NextResponse with ad data
   */
  public async getById(
    request: NextRequest, 
    adId: string
  ): Promise<NextResponse<Ad | ApiErrorResponse>> {
    try {
      const result: ServiceResult<Ad> = await this.service.getById(adId);

      if (result.success) {
        return this.json<Ad>(result.data as Ad, result.status);
      }
      
      return this.error(result.error?.message || "Ad not found", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/ads/[id]
   * Update ad data or status
   * @param request - The incoming request with ad data or status
   * @param adId - The ad ID to update
   * @returns NextResponse with updated ad
   */
  public async update(
    request: NextRequest, 
    adId: string
  ): Promise<NextResponse<Ad | ApiErrorResponse>> {
    try {
      await this.requireAuth();
      const body = await this.parseBody<CreateAdBody | UpdateStatusBody>(request);
      
      // If body has status field, use updateStatus
      if ('status' in body && Object.keys(body).length === 1) {
        const result: ServiceResult<Ad> = await this.service.updateStatus(adId, body.status);
        if (result.success) {
          return this.json<Ad>(result.data as Ad, result.status);
        }
        return this.error(result.error?.message || "Failed to update status", result.status);
      }
      
      // Otherwise, update full ad data
      const result: ServiceResult<Ad> = await this.service.update(adId, body);
      if (result.success) {
        return this.json<Ad>(result.data as Ad, result.status);
      }
      
      return this.error(result.error?.message || "Failed to update ad", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/ads/[id] (legacy - for status only updates)
   * Update ad status
   * @param request - The incoming request with new status
   * @param adId - The ad ID to update
   * @returns NextResponse with updated ad
   */
  public async updateStatus(
    request: NextRequest, 
    adId: string
  ): Promise<NextResponse<Ad | ApiErrorResponse>> {
    try {
      await this.requireAuth();
      const body: UpdateStatusBody = await this.parseBody<UpdateStatusBody>(request);
      const result: ServiceResult<Ad> = await this.service.updateStatus(adId, body.status);

      if (result.success) {
        return this.json<Ad>(result.data as Ad, result.status);
      }
      
      return this.error(result.error?.message || "Failed to update status", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/ads/[id]
   * Delete an ad
   * @param request - The incoming request
   * @param adId - The ad ID to delete
   * @returns NextResponse indicating success
   */
  public async delete(
    request: NextRequest, 
    adId: string
  ): Promise<NextResponse<MessageResponse | ApiErrorResponse>> {
    try {
      await this.requireAuth();
      const result: ServiceResult<void> = await this.service.delete(adId);

      if (result.success) {
        return this.json<MessageResponse>({ message: "Ad deleted" }, 200);
      }
      
      return this.error(result.error?.message || "Failed to delete ad", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/ads/[id]/track
   * Track ad impression or click
   * @param request - The incoming request with tracking type
   * @param adId - The ad ID to track
   * @returns NextResponse indicating success
   */
  public async track(
    request: NextRequest, 
    adId: string
  ): Promise<NextResponse<SuccessResponse | ApiErrorResponse>> {
    try {
      const body: TrackBody = await this.parseBody<TrackBody>(request);

      // Map "view" to "impression" for backward compatibility
      const trackingType = body.type === "view" ? "impression" : body.type;
      
      if (trackingType === "impression") {
        await this.service.trackImpression(adId);
      } else if (trackingType === "click") {
        await this.service.trackClick(adId);
      } else {
        return this.badRequest("Invalid tracking type. Must be 'impression', 'click', or 'view'");
      }

      return this.json<SuccessResponse>({ success: true });
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const adsController: AdsController = new AdsController();
