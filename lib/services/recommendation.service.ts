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
      location: profile.location ? this.parseLocation(profile.location) : null,
      joinedCommunities: memberships?.map((m) => m.community_id) || [],
      attendedEvents: attendances?.map((a) => a.event_id) || [],
      interactions: interactions?.map((i) => ({
        type: i.point_type,
        targetId: i.related_id,
        timestamp: new Date(i.created_at),
      })) || [],
      preferences: {
        preferredCategories: profile.interests || [],
        preferredSize: "any",
        maxDistance: 50,
      },
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
      location: profile.location ? this.parseLocation(profile.location) : null,
      joinedCommunities: memberships?.filter((m) => m.user_id === profile.id).map((m) => m.community_id) || [],
      attendedEvents: attendances?.filter((a) => a.user_id === profile.id).map((a) => a.event_id) || [],
      interactions: [],
      preferences: {
        preferredCategories: profile.interests || [],
        preferredSize: "any",
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
        const categoryData = c.category as { id: string; name: string } | null;
        const categoryName = categoryData?.name?.toLowerCase() || "general";
        return {
          id: c.id,
          name: c.name,
          description: c.description || "",
          category: categoryName,
          tags: [],
          memberCount: memberCount,
          activityLevel: this.calculateActivityLevel(memberCount),
          location: c.location ? this.parseLocation(c.location) : null,
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
        category,
        location,
        start_time,
        end_time,
        max_attendees,
        is_online,
        community_id,
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
      const location = e.location ? this.parseLocation(e.location) : null;
      return {
        id: e.id,
        title: e.title,
        description: e.description || "",
        category: e.category || "general",
        tags: [],
        contentTopics: [],
        communityId: e.community_id,
        communityName: (e.communities as any)?.name || "",
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
   */
  private parseLocation(location: any): { lat: number; lng: number; city?: string } | null {
    if (!location) return null;

    if (typeof location === "string") {
      try {
        const parsed = JSON.parse(location);
        return {
          lat: parsed.lat || 0,
          lng: parsed.lng || 0,
          city: parsed.city,
        };
      } catch {
        return null;
      }
    }

    if (typeof location === "object") {
      return {
        lat: location.lat || 0,
        lng: location.lng || 0,
        city: location.city,
      };
    }

    return null;
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

