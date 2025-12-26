import { BaseService, ServiceResult, ApiResponse } from "./base.service";
import { HybridRecommendationEngine } from "../recommendation-engine/hybrid-recommender";
import { HybridEventRecommendationEngine } from "../recommendation-engine/hybrid-event-recommender";
import type {
  User,
  Community,
  Event,
  RecommendationOptions,
  RecommendationResult,
  EventRecommendationOptions,
  EventRecommendationResult,
} from "../recommendation-engine/types";

// ==================== Recommendation Service ====================
export class RecommendationService extends BaseService {
  private static instance: RecommendationService;
  
  // Singleton instances of recommendation engines
  private readonly communityEngine: HybridRecommendationEngine;
  private readonly eventEngine: HybridEventRecommendationEngine;

  private constructor() {
    super();
    this.communityEngine = new HybridRecommendationEngine();
    this.eventEngine = new HybridEventRecommendationEngine();
  }

  public static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  /**
   * Generate community recommendations for a user
   */
  public async getCommunityRecommendations(
    userId: string,
    options?: RecommendationOptions
  ): Promise<ServiceResult<RecommendationResult>> {
    try {
      // Fetch user data
      const userData = await this.fetchUserData(userId);
      if (!userData.success || !userData.data) {
        return ApiResponse.error("Failed to fetch user data", 500);
      }

      // Fetch all users for collaborative filtering
      const allUsersResult = await this.fetchAllUsers();
      if (!allUsersResult.success || !allUsersResult.data) {
        return ApiResponse.error("Failed to fetch users data", 500);
      }

      // Fetch all communities
      const communitiesResult = await this.fetchCommunities(userId);
      if (!communitiesResult.success || !communitiesResult.data) {
        return ApiResponse.error(
          communitiesResult.error?.message || "Failed to fetch communities", 
          communitiesResult.status || 500
        );
      }

      // Generate recommendations
      const recommendations = await this.communityEngine.generateRecommendations(
        userData.data,
        allUsersResult.data,
        communitiesResult.data,
        options
      );

      return ApiResponse.success(recommendations);
    } catch (error) {
      return ApiResponse.error(`Recommendation error: ${error}`, 500);
    }
  }

  /**
   * Generate event recommendations for a user
   */
  public async getEventRecommendations(
    userId: string,
    options?: EventRecommendationOptions
  ): Promise<ServiceResult<EventRecommendationResult>> {
    try {
      // Fetch user data
      const userData = await this.fetchUserData(userId);
      if (!userData.success || !userData.data) {
        return ApiResponse.error("Failed to fetch user data", 500);
      }

      // Fetch all users for collaborative filtering
      const allUsersResult = await this.fetchAllUsers();
      if (!allUsersResult.success || !allUsersResult.data) {
        return ApiResponse.error("Failed to fetch users data", 500);
      }

      // Fetch events
      const eventsResult = await this.fetchEvents();
      if (!eventsResult.success || !eventsResult.data) {
        return ApiResponse.error("Failed to fetch events", 500);
      }

      // Fetch user's community IDs
      const communityIdsResult = await this.fetchUserCommunityIds(userId);
      const communityIds = communityIdsResult.success && communityIdsResult.data ? communityIdsResult.data : [];

      // Generate recommendations
      const recommendations = await this.eventEngine.generateRecommendations(
        userData.data,
        allUsersResult.data,
        eventsResult.data,
        communityIds,
        options
      );

      return ApiResponse.success(recommendations);
    } catch (error) {
      return ApiResponse.error(`Recommendation error: ${error}`, 500);
    }
  }

  // ==================== Data Fetching Methods ====================

  /**
   * Fetch user data formatted for recommendation engine
   */
  private async fetchUserData(userId: string): Promise<ServiceResult<User>> {
    const supabase = this.supabaseAdmin;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return ApiResponse.error("User not found", 404);
    }

    // Get user's joined communities
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", userId)
      .eq("status", "approved");

    // Get user's attended events
    const { data: attendances } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", userId);

    // Get user's interactions
    const { data: interactions } = await supabase
      .from("user_points")
      .select("*")
      .eq("user_id", userId);

    const user: User = {
      id: userId,
      interests: profile.interests || [],
      location: profile.location ? this.parseLocationData(profile.location) : undefined,
      joinedCommunities: memberships?.map((m) => m.community_id) || [],
      attendedEvents: attendances?.map((a) => a.event_id) || [],
      interactions: interactions?.map((i) => ({
        type: "join" as const, // All points are from joining communities
        targetId: i.community_id || i.related_id, // Use community_id (fallback to related_id for migration period)
        targetType: "community" as const,
        timestamp: new Date(i.created_at),
      })) || [],
      preferences: {
        preferredCategories: profile.interests || [],
        communitySize: "any",
        maxDistance: 50,
      },
      activityLevel: "medium",
    };

    return ApiResponse.success(user);
  }

  /**
   * Fetch all users for collaborative filtering
   */
  private async fetchAllUsers(): Promise<ServiceResult<User[]>> {
    const supabase = this.supabaseAdmin;

    const { data: profiles, error } = await supabase
      .from("users")
      .select("id, interests, location")
      .limit(1000);

    if (error) {
      return ApiResponse.error("Failed to fetch users", 500);
    }

    // Get memberships and attendances for all users
    const userIds = profiles?.map((p) => p.id) || [];

    const { data: memberships } = await supabase
      .from("community_members")
      .select("user_id, community_id")
      .in("user_id", userIds)
      .eq("status", "approved");

    const { data: attendances } = await supabase
      .from("event_attendees")
      .select("user_id, event_id")
      .in("user_id", userIds);

    const users: User[] = (profiles || []).map((profile) => ({
      id: profile.id,
      interests: profile.interests || [],
      location: profile.location ? this.parseLocationData(profile.location) : undefined,
      joinedCommunities: memberships?.filter((m) => m.user_id === profile.id).map((m) => m.community_id) || [],
      attendedEvents: attendances?.filter((a) => a.user_id === profile.id).map((a) => a.event_id) || [],
      interactions: [],
      activityLevel: "medium",
      preferences: {
        preferredCategories: profile.interests || [],
        communitySize: "any",
        maxDistance: 50,
      },
    }));

    return ApiResponse.success(users);
  }

  /**
   * Fetch communities formatted for recommendation engine
   */
  private async fetchCommunities(excludeUserId?: string): Promise<ServiceResult<Community[]>> {
    const supabase = this.supabaseAdmin;

    let query = supabase
      .from("communities")
      .select(`
        id,
        name,
        description,
        category_id,
        location,
        created_at,
        category:category_id(id, name)
      `);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching communities for recommendations:", error);
      return ApiResponse.error(error.message || "Failed to fetch communities", 500);
    }

    // If excludeUserId provided, filter out communities user already joined
    let userCommunityIds: string[] = [];
    if (excludeUserId) {
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", excludeUserId);
      userCommunityIds = memberships?.map((m) => m.community_id) || [];
    }

    // Get member counts for communities
    const communityIds = (data || []).map((c) => c.id);
    let memberCountMap = new Map<string, number>();
    
    if (communityIds.length > 0) {
      const { data: memberCounts } = await supabase
        .from("community_members")
        .select("community_id")
        .in("community_id", communityIds)
        .eq("status", "approved");
      
      memberCounts?.forEach((m) => {
        memberCountMap.set(m.community_id, (memberCountMap.get(m.community_id) || 0) + 1);
      });
    }

    const communities: Community[] = (data || [])
      .filter((c) => !userCommunityIds.includes(c.id))
      .map((c) => {
        const memberCount = memberCountMap.get(c.id) || 0;
        const categoryData: any = c.category;
        // Handle category as either object with name property or string
        let categoryName = "general";
        if (typeof categoryData === "object" && categoryData !== null && "name" in categoryData) {
          categoryName = categoryData.name?.toLowerCase() || "general";
        } else if (typeof categoryData === "string") {
          categoryName = categoryData.toLowerCase();
        }
        
        return {
          id: c.id,
          name: c.name,
          description: c.description || "",
          category: categoryName,
          tags: [],
          memberCount: memberCount,
          activityLevel: this.calculateActivityLevel(memberCount),
          location: c.location ? this.parseLocationData(c.location) : undefined,
          createdAt: new Date(c.created_at),
          lastActivity: new Date(c.created_at),
          growthRate: 0,
          engagementScore: 0,
          contentTopics: [],
          memberDemographics: {
            ageGroups: {},
            professions: {},
            locations: {},
          },
        };
      });

    return ApiResponse.success(communities);
  }

  /**
   * Fetch events formatted for recommendation engine
   */
  private async fetchEvents(): Promise<ServiceResult<Event[]>> {
    const supabase = this.supabaseAdmin;

    const { data, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        category:category_id(name),
        location,
        start_time,
        end_time,
        max_attendees,
        is_online,
        community_id,
        created_by,
        created_at,
        communities!inner(name)
      `)
      .gte("start_time", new Date().toISOString());

    if (error) {
      return ApiResponse.error("Failed to fetch events", 500);
    }

    // Get attendee counts
    const eventIds = data?.map((e) => e.id) || [];
    const { data: attendeeCounts } = await supabase
      .from("event_attendees")
      .select("event_id")
      .in("event_id", eventIds);

    const countMap = new Map<string, number>();
    attendeeCounts?.forEach((a) => {
      countMap.set(a.event_id, (countMap.get(a.event_id) || 0) + 1);
    });

    const events: Event[] = (data || []).map((e) => {
      const location = e.location ? this.parseLocationData(e.location) : undefined;
      return {
        id: e.id,
        title: e.title,
        description: e.description || "",
        category: (e.category as any)?.name || e.category || "general",
        tags: [],
        contentTopics: [],
        communityId: e.community_id,
        communityName: (e.communities as any)?.name || "",
        creatorId: e.created_by || "", // Add creatorId
        startTime: new Date(e.start_time),
        endTime: e.end_time ? new Date(e.end_time) : null,
        location: location,
        isOnline: e.is_online || false,
        maxAttendees: e.max_attendees,
        currentAttendees: countMap.get(e.id) || 0,
        createdAt: new Date(e.created_at),
      };
    });

    return ApiResponse.success(events);
  }

  /**
   * Fetch user's community IDs
   */
  private async fetchUserCommunityIds(userId: string): Promise<ServiceResult<string[]>> {
    const supabase = this.supabaseAdmin;

    const { data, error } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", userId)
      .eq("status", "approved");

    if (error) {
      return ApiResponse.error("Failed to fetch user communities", 500);
    }

    return ApiResponse.success(data?.map((m) => m.community_id) || []);
  }

  // ==================== Helper Methods ====================

  /**
   * Parse location from string or object
   * Supports both new standardized format and legacy format
   */
  private parseLocationData(location: any): { lat: number; lng: number; city: string; placeId?: string } | undefined {
    if (!location) return undefined;

    if (typeof location === "string") {
      try {
        const parsed = JSON.parse(location);
        
        // NEW standardized format
        if (parsed.placeId) {
          return {
            lat: parsed.lat || 0,
            lng: parsed.lon || parsed.lng || 0, // Support both lon and lng
            city: parsed.city || "Unknown",
            placeId: parsed.placeId,
          };
        }
        
        // Legacy format
        return {
          lat: parsed.lat || 0,
          lng: parsed.lng || parsed.lon || 0, // Support both lng and lon
          city: parsed.city || "Unknown",
        };
      } catch {
        return undefined;
      }
    }

    if (typeof location === "object") {
      // NEW standardized format
      if (location.placeId) {
        return {
          lat: location.lat || 0,
          lng: location.lon || location.lng || 0, // Support both lon and lng
          city: location.city || "Unknown",
          placeId: location.placeId,
        };
      }
      
      // Legacy format
      return {
        lat: location.lat || 0,
        lng: location.lng || location.lon || 0, // Support both lng and lon
        city: location.city || "Unknown",
      };
    }

    return undefined;
  }

  /**
   * Check if two locations are in the same city
   * Supports both placeId matching (most reliable) and city name matching
   */
  private isSameCity(
    location1: { city?: string; placeId?: string } | null,
    location2: { city?: string; placeId?: string } | null
  ): boolean {
    if (!location1 || !location2) return false;

    // Primary: Compare place IDs (most reliable)
    if (location1.placeId && location2.placeId) {
      return location1.placeId === location2.placeId;
    }

    // Fallback: Compare normalized city names
    if (location1.city && location2.city) {
      const city1 = location1.city.toLowerCase().trim();
      const city2 = location2.city.toLowerCase().trim();
      return city1 === city2;
    }

    return false;
  }

  /**
   * Calculate activity level based on member count
   */
  private calculateActivityLevel(memberCount: number): "low" | "medium" | "high" {
    if (memberCount >= 100) return "high";
    if (memberCount >= 20) return "medium";
    return "low";
  }
}

// Export singleton instance
export const recommendationService = RecommendationService.getInstance();

