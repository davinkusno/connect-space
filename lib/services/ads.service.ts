import {
  BaseService,
  ApiResponse,
  ServiceResult,
} from "./base.service";
import { createClient } from "@supabase/supabase-js";

interface AdData {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  link_url: string;
  community_id: string;
  status: "pending" | "approved" | "rejected" | "active" | "inactive";
  start_date?: string;
  end_date?: string;
  impressions: number;
  clicks: number;
  created_at: string;
}

interface CreateAdInput {
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  link_url: string;
  community_id: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Service for managing advertisements
 */
export class AdsService extends BaseService {
  private static instance: AdsService;

  private constructor() {
    super();
  }

  static getInstance(): AdsService {
    if (!AdsService.instance) {
      AdsService.instance = new AdsService();
    }
    return AdsService.instance;
  }

  /**
   * Get ad by ID
   */
  async getById(adId: string): Promise<ServiceResult<AdData>> {
    const { data, error } = await this.supabaseAdmin
      .from("ads")
      .select("*")
      .eq("id", adId)
      .single();

    if (error || !data) {
      return ApiResponse.error("Ad not found", 404);
    }

    return ApiResponse.success(data);
  }

  /**
   * Get all ads with optional filters
   */
  async getAll(options?: {
    status?: string;
    communityId?: string;
    limit?: number;
  }): Promise<ServiceResult<AdData[]>> {
    let query = this.supabaseAdmin
      .from("ads")
      .select(`
        *,
        community:community_id (id, name, logo_url)
      `)
      .order("created_at", { ascending: false });

    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    if (options?.communityId) {
      query = query.eq("community_id", options.communityId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return ApiResponse.error("Failed to fetch ads", 500);
    }

    return ApiResponse.success(data || []);
  }

  /**
   * Create a new ad
   */
  async create(userId: string, input: CreateAdInput): Promise<ServiceResult<AdData>> {
    const { data, error } = await this.supabaseAdmin
      .from("ads")
      .insert({
        ...input,
        creator_id: userId,
        status: "pending",
        impressions: 0,
        clicks: 0,
      })
      .select()
      .single();

    if (error) {
      return ApiResponse.error("Failed to create ad", 500);
    }

    return ApiResponse.created(data);
  }

  /**
   * Update ad status
   */
  async updateStatus(
    adId: string,
    status: AdData["status"]
  ): Promise<ServiceResult<AdData>> {
    const { data, error } = await this.supabaseAdmin
      .from("ads")
      .update({ status })
      .eq("id", adId)
      .select()
      .single();

    if (error) {
      return ApiResponse.error("Failed to update ad status", 500);
    }

    return ApiResponse.success(data);
  }

  /**
   * Track ad impression
   */
  async trackImpression(adId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin.rpc("increment_ad_impressions", {
      ad_id: adId,
    });

    if (error) {
      // Fallback: manual increment
      const { data: ad } = await this.supabaseAdmin
        .from("ads")
        .select("impressions")
        .eq("id", adId)
        .single();

      if (ad) {
        await this.supabaseAdmin
          .from("ads")
          .update({ impressions: (ad.impressions || 0) + 1 })
          .eq("id", adId);
      }
    }

    return ApiResponse.success(undefined);
  }

  /**
   * Track ad click
   */
  async trackClick(adId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin.rpc("increment_ad_clicks", {
      ad_id: adId,
    });

    if (error) {
      // Fallback: manual increment
      const { data: ad } = await this.supabaseAdmin
        .from("ads")
        .select("clicks")
        .eq("id", adId)
        .single();

      if (ad) {
        await this.supabaseAdmin
          .from("ads")
          .update({ clicks: (ad.clicks || 0) + 1 })
          .eq("id", adId);
      }
    }

    return ApiResponse.success(undefined);
  }

  /**
   * Delete an ad
   */
  async delete(adId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin
      .from("ads")
      .delete()
      .eq("id", adId);

    if (error) {
      return ApiResponse.error("Failed to delete ad", 500);
    }

    return ApiResponse.noContent();
  }
}

export const adsService = AdsService.getInstance();

