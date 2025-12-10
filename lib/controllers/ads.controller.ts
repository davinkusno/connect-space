import { NextRequest, NextResponse } from "next/server";
import { BaseController } from "./base.controller";
import { adsService } from "@/lib/services";

/**
 * Controller for ads-related API endpoints
 */
export class AdsController extends BaseController {
  /**
   * GET /api/ads
   * Get all ads with optional filters
   */
  async getAll(request: NextRequest): Promise<NextResponse> {
    try {
      const status = this.getQueryParam(request, "status") || undefined;
      const communityId = this.getQueryParam(request, "community_id") || undefined;
      const limitStr = this.getQueryParam(request, "limit");
      const limit = limitStr ? parseInt(limitStr) : undefined;

      const result = await adsService.getAll({ status, communityId, limit });
      return this.json(
        result.success ? { ads: result.data } : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/ads
   * Create a new ad
   */
  async create(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const body = await this.parseBody<{
        title: string;
        description?: string;
        image_url?: string;
        video_url?: string;
        link_url: string;
        community_id: string;
        start_date?: string;
        end_date?: string;
      }>(request);

      const result = await adsService.create(user.id, body);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/ads/[id]
   * Get ad by ID
   */
  async getById(request: NextRequest, adId: string): Promise<NextResponse> {
    try {
      const result = await adsService.getById(adId);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/ads/[id]
   * Update ad status
   */
  async updateStatus(request: NextRequest, adId: string): Promise<NextResponse> {
    try {
      await this.requireAuth();
      const { status } = await this.parseBody<{ status: string }>(request);
      const result = await adsService.updateStatus(adId, status as any);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/ads/[id]
   * Delete an ad
   */
  async delete(request: NextRequest, adId: string): Promise<NextResponse> {
    try {
      await this.requireAuth();
      const result = await adsService.delete(adId);
      return this.json(
        result.success ? { message: "Ad deleted" } : { error: result.error?.message },
        result.status === 204 ? 200 : result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/ads/[id]/track
   * Track ad impression or click
   */
  async track(request: NextRequest, adId: string): Promise<NextResponse> {
    try {
      const { type } = await this.parseBody<{ type: "impression" | "click" }>(request);

      if (type === "impression") {
        await adsService.trackImpression(adId);
      } else if (type === "click") {
        await adsService.trackClick(adId);
      } else {
        return this.badRequest("Invalid tracking type");
      }

      return this.json({ success: true });
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const adsController = new AdsController();

