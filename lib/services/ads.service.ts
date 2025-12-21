import {
    AdStatus
} from "@/lib/types";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";

// ==================== Ads Service Types ====================

interface AdData {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  link_url?: string;
  community_id?: string;
  created_by: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  view_count: number;
  click_count: number;
  created_at: string;
  updated_at?: string;
}

interface CreateAdInput {
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  link_url?: string;
  community_id?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
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
  activeOnly?: boolean;
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

    // Filter by is_active (not status)
    if (options?.activeOnly) {
      query = query.eq("is_active", true);
    } else if (options?.status && options.status !== "all") {
      // Legacy support: if status is provided, map it to is_active
      if (options.status === "active") {
        query = query.eq("is_active", true);
      } else if (options.status === "inactive") {
        query = query.eq("is_active", false);
      }
    }

    // Filter by community_id
    // If communityId is provided, show ads for that community OR ads for all communities (null)
    // If communityId is not provided, show all ads
    if (options?.communityId) {
      // Show ads for specific community OR ads for all communities (null)
      query = query.or(`community_id.eq.${options.communityId},community_id.is.null`);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching ads:", error);
      return ApiResponse.error(error.message || "Failed to fetch ads", 500);
    }

    // Filter by date ranges (start_date and end_date) in memory
    const now = new Date();
    const filteredAds = (data || []).filter((ad: any) => {
      // If active_only is true, check dates
      if (options?.activeOnly) {
        // Check start_date - ad should be active if start_date is null OR start_date <= now
        if (ad.start_date) {
          const startDate = new Date(ad.start_date);
          // Compare dates (ignore time) - ad is active if today is >= start_date
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (startDateOnly > nowDateOnly) {
            return false; // Ad hasn't started yet
          }
        }
        
        // Check end_date - ad should be active if end_date is null OR end_date >= now
        // Ads should be active for the entire day of end_date
        if (ad.end_date) {
          const endDate = new Date(ad.end_date);
          // Compare dates (ignore time) - ad is active if today is <= end_date
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (endDateOnly < nowDateOnly) {
            return false; // Ad has expired (past end_date)
          }
        }
      }
      
      return true;
    });

    return ApiResponse.success<AdWithCommunity[]>(
      filteredAds as AdWithCommunity[]
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
    const insertData: Record<string, unknown> = {
      title: input.title,
      created_by: userId,
      is_active: input.is_active !== undefined ? input.is_active : true,
      view_count: 0,
      click_count: 0,
    };

    if (input.description) insertData.description = input.description;
    if (input.image_url) insertData.image_url = input.image_url;
    if (input.video_url) insertData.video_url = input.video_url;
    if (input.link_url) insertData.link_url = input.link_url;
    if (input.community_id) insertData.community_id = input.community_id;
    if (input.start_date) insertData.start_date = input.start_date;
    if (input.end_date) insertData.end_date = input.end_date;

    const { data, error } = await this.supabaseAdmin
      .from("ads")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating ad:", error);
      return ApiResponse.error(error.message || "Failed to create ad", 500);
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
   * Update ad data
   * @param adId - The ad ID to update
   * @param input - The ad data to update
   * @returns ServiceResult containing updated ad
   */
  public async update(
    adId: string,
    input: Partial<CreateAdInput & { is_active?: boolean }>
  ): Promise<ServiceResult<AdData>> {
    // Map frontend fields to database fields
    const updateData: Record<string, unknown> = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description || null;
    if (input.image_url !== undefined) updateData.image_url = input.image_url;
    if (input.video_url !== undefined) updateData.video_url = input.video_url || null;
    if (input.link_url !== undefined) updateData.link_url = input.link_url || null;
    if (input.community_id !== undefined) updateData.community_id = input.community_id || null;
    if (input.start_date !== undefined) updateData.start_date = input.start_date || null;
    if (input.end_date !== undefined) updateData.end_date = input.end_date || null;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { data, error } = await this.supabaseAdmin
      .from("ads")
      .update(updateData)
      .eq("id", adId)
      .select()
      .single();

    if (error) {
      console.error("Error updating ad:", error);
      return ApiResponse.error(error.message || "Failed to update ad", 500);
    }

    return ApiResponse.success<AdData>(data as AdData);
  }

  /**
   * Track ad impression (view)
   * @param adId - The ad ID to track
   * @returns ServiceResult indicating success
   */
  public async trackImpression(adId: string): Promise<ServiceResult<void>> {
    // Increment view_count
    const { data: ad } = await this.supabaseAdmin
      .from("ads")
      .select("view_count")
      .eq("id", adId)
      .single();

    if (ad) {
      const { error } = await this.supabaseAdmin
        .from("ads")
        .update({ view_count: (ad.view_count || 0) + 1 })
        .eq("id", adId);

      if (error) {
        console.error("Error tracking impression:", error);
        return ApiResponse.error("Failed to track impression", 500);
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
    // Increment click_count
    const { data: ad } = await this.supabaseAdmin
      .from("ads")
      .select("click_count")
      .eq("id", adId)
      .single();

    if (ad) {
      const { error } = await this.supabaseAdmin
        .from("ads")
        .update({ click_count: (ad.click_count || 0) + 1 })
        .eq("id", adId);

      if (error) {
        console.error("Error tracking click:", error);
        return ApiResponse.error("Failed to track click", 500);
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
