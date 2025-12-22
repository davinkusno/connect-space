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
  community_ids?: string[]; // Multiple communities (empty array = all communities)
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
  communities?: Array<{
    id: string;
    name: string;
    logo_url?: string;
  }>;
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
  public async getById(adId: string): Promise<ServiceResult<AdWithCommunity>> {
    const { data, error } = await this.supabaseAdmin
      .from("ads")
      .select(`
        *,
        ad_communities (
          community:communities (id, name, logo_url)
        )
      `)
      .eq("id", adId)
      .single();

    if (error || !data) {
      return ApiResponse.notFound("Ad");
    }

    // Transform the data to flatten ad_communities
    const communities = (data as any).ad_communities?.map((ac: any) => ac.community).filter(Boolean) || [];
    delete (data as any).ad_communities;

    return ApiResponse.success<AdWithCommunity>({
      ...data,
      communities,
    } as AdWithCommunity);
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
        ad_communities (
          community:communities (id, name, logo_url)
        )
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

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching ads:", error);
      return ApiResponse.error(error.message || "Failed to fetch ads", 500);
    }

    // Transform the data to flatten ad_communities
    let transformedAds = (data || []).map((ad: any) => {
      const communities = ad.ad_communities?.map((ac: any) => ac.community).filter(Boolean) || [];
      delete ad.ad_communities;
      return {
        ...ad,
        communities,
      };
    });

    // Filter by community_id (do this in memory after fetching)
    if (options?.communityId) {
      transformedAds = transformedAds.filter((ad: any) => {
        // Show ad if:
        // 1. It targets all communities (no ad_communities entries)
        if (ad.communities.length === 0) {
          return true;
        }
        // 2. It has the community in ad_communities
        if (ad.communities.some((c: any) => c.id === options.communityId)) {
          return true;
        }
        return false;
      });
    }

    if (options?.limit) {
      transformedAds = transformedAds.slice(0, options.limit);
    }

    // Filter by date ranges (start_date and end_date) in memory
    const now = new Date();
    const filteredAds = transformedAds.filter((ad: any) => {
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
  ): Promise<ServiceResult<AdWithCommunity>> {
    const { community_ids, ...adData } = input;
    
    const insertData: Record<string, unknown> = {
      title: adData.title,
      created_by: userId,
      is_active: adData.is_active !== undefined ? adData.is_active : true,
      view_count: 0,
      click_count: 0,
    };

    if (adData.description) insertData.description = adData.description;
    if (adData.image_url) insertData.image_url = adData.image_url;
    if (adData.video_url) insertData.video_url = adData.video_url;
    if (adData.link_url) insertData.link_url = adData.link_url;
    if (adData.start_date) insertData.start_date = adData.start_date;
    if (adData.end_date) insertData.end_date = adData.end_date;

    const { data: ad, error: adError } = await this.supabaseAdmin
      .from("ads")
      .insert(insertData)
      .select(`*`)
      .single();

    if (adError || !ad) {
      console.error("Error creating ad:", adError);
      return ApiResponse.error(adError?.message || "Failed to create ad", 500);
    }

    // If community_ids provided, insert into junction table
    if (community_ids && community_ids.length > 0) {
      const adCommunities = community_ids.map(communityId => ({
        ad_id: ad.id,
        community_id: communityId
      }));
      
      const { error: junctionError } = await this.supabaseAdmin
        .from("ad_communities")
        .insert(adCommunities);
      
      if (junctionError) {
        console.error("Error creating ad-community relationships:", junctionError);
        // Don't fail the whole operation, just log it
      }
    }

    // Fetch the complete ad with communities
    const result = await this.getById(ad.id);
    if (result.success && result.data) {
      return ApiResponse.created<AdWithCommunity>(result.data as AdWithCommunity);
    }

    return ApiResponse.created<AdWithCommunity>(ad as AdWithCommunity);
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
  ): Promise<ServiceResult<AdWithCommunity>> {
    const { community_ids, ...restInput } = input;
    
    // Map frontend fields to database fields
    const updateData: Record<string, unknown> = {};
    
    if (restInput.title !== undefined) updateData.title = restInput.title;
    if (restInput.description !== undefined) updateData.description = restInput.description || null;
    if (restInput.image_url !== undefined) updateData.image_url = restInput.image_url;
    if (restInput.video_url !== undefined) updateData.video_url = restInput.video_url || null;
    if (restInput.link_url !== undefined) updateData.link_url = restInput.link_url || null;
    if (restInput.start_date !== undefined) updateData.start_date = restInput.start_date || null;
    if (restInput.end_date !== undefined) updateData.end_date = restInput.end_date || null;
    if (restInput.is_active !== undefined) updateData.is_active = restInput.is_active;

    const { data, error } = await this.supabaseAdmin
      .from("ads")
      .update(updateData)
      .eq("id", adId)
      .select(`*`)
      .single();

    if (error) {
      console.error("Error updating ad:", error);
      return ApiResponse.error(error.message || "Failed to update ad", 500);
    }

    // Update community relationships if provided
    if (community_ids !== undefined) {
      // Delete existing relationships
      await this.supabaseAdmin
        .from("ad_communities")
        .delete()
        .eq("ad_id", adId);
      
      // Insert new relationships
      if (community_ids.length > 0) {
        const adCommunities = community_ids.map(communityId => ({
          ad_id: adId,
          community_id: communityId
        }));
        
        const { error: junctionError } = await this.supabaseAdmin
          .from("ad_communities")
          .insert(adCommunities);
        
        if (junctionError) {
          console.error("Error updating ad-community relationships:", junctionError);
          // Don't fail the whole operation, just log it
        }
      }
    }

    // Fetch the complete ad with communities
    const result = await this.getById(adId);
    if (result.success && result.data) {
      return ApiResponse.success<AdWithCommunity>(result.data as AdWithCommunity);
    }

    return ApiResponse.success<AdWithCommunity>(data as AdWithCommunity);
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
