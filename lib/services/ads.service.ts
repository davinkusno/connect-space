import {
  BaseService,
  ApiResponse,
  ServiceResult,
} from "./base.service";
import {
  Ad,
  AdStatus,
  AdType,
  AdTargetAudience,
} from "@/lib/types";

// ==================== Ads Service Types ====================

interface AdData {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  link_url: string;
  community_id: string;
  creator_id: string;
  status: AdStatus;
  start_date?: string;
  end_date?: string;
  impressions: number;
  clicks: number;
  created_at: string;
  updated_at?: string;
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

interface AdWithCommunity extends AdData {
  community?: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

interface AdsQueryOptions {
  status?: string;
  communityId?: string;
  limit?: number;
}

// ==================== Ads Service Class ====================

/**
 * Service for managing advertisements
 * Handles ad CRUD, tracking, and analytics
 */
export class AdsService extends BaseService {
  private static instance: AdsService;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance of AdsService
   */
  public static getInstance(): AdsService {
    if (!AdsService.instance) {
      AdsService.instance = new AdsService();
    }
    return AdsService.instance;
  }

  /**
   * Get ad by ID
   * @param adId - The ad ID to fetch
   * @returns ServiceResult containing ad data or error
   */
  public async getById(adId: string): Promise<ServiceResult<AdData>> {
    const { data, error } = await this.supabaseAdmin
      .from("ads")
      .select("*")
      .eq("id", adId)
      .single();

    if (error || !data) {
      return ApiResponse.notFound("Ad");
    }

    return ApiResponse.success<AdData>(data as AdData);
  }

  /**
   * Get all ads with optional filters
   * @param options - Query options (status, communityId, limit)
   * @returns ServiceResult containing array of ads
   */
  public async getAll(
    options?: AdsQueryOptions
  ): Promise<ServiceResult<AdWithCommunity[]>> {
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

    return ApiResponse.success<AdWithCommunity[]>(
      (data || []) as AdWithCommunity[]
    );
  }

  /**
   * Create a new ad
   * @param userId - The user creating the ad
   * @param input - The ad data
   * @returns ServiceResult containing created ad
   */
  public async create(
    userId: string, 
    input: CreateAdInput
  ): Promise<ServiceResult<AdData>> {
    const { data, error } = await this.supabaseAdmin
      .from("ads")
      .insert({
        ...input,
        creator_id: userId,
        status: "pending" as AdStatus,
        impressions: 0,
        clicks: 0,
      })
      .select()
      .single();

    if (error) {
      return ApiResponse.error("Failed to create ad", 500);
    }

    return ApiResponse.created<AdData>(data as AdData);
  }

  /**
   * Update ad status
   * @param adId - The ad ID to update
   * @param status - The new status
   * @returns ServiceResult containing updated ad
   */
  public async updateStatus(
    adId: string,
    status: AdStatus
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

    return ApiResponse.success<AdData>(data as AdData);
  }

  /**
   * Track ad impression
   * @param adId - The ad ID to track
   * @returns ServiceResult indicating success
   */
  public async trackImpression(adId: string): Promise<ServiceResult<void>> {
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

    return ApiResponse.success<void>(undefined);
  }

  /**
   * Track ad click
   * @param adId - The ad ID to track
   * @returns ServiceResult indicating success
   */
  public async trackClick(adId: string): Promise<ServiceResult<void>> {
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

    return ApiResponse.success<void>(undefined);
  }

  /**
   * Delete an ad
   * @param adId - The ad ID to delete
   * @returns ServiceResult indicating success
   */
  public async delete(adId: string): Promise<ServiceResult<void>> {
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

// Export singleton instance
export const adsService: AdsService = AdsService.getInstance();
