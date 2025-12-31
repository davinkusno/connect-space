import { BaseService, ServiceResult, ApiResponse } from "./base.service";
import { ContentBasedFilteringAlgorithm } from "../recommendation-engine/algorithms/content-based-filtering";
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
  
  // Singleton instance of content-based filtering engine
  private readonly contentBasedEngine: ContentBasedFilteringAlgorithm;

  private constructor() {
    super();
    this.contentBasedEngine = new ContentBasedFilteringAlgorithm();
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

      // Fetch all communities
      const communitiesResult = await this.fetchCommunities(userId);
      if (!communitiesResult.success || !communitiesResult.data) {
        return ApiResponse.error(
          communitiesResult.error?.message || "Failed to fetch communities", 
          communitiesResult.status || 500
        );
      }

      // Generate recommendations using content-based filtering
      const startTime = Date.now();
      const recommendations = await this.contentBasedEngine.generateRecommendations(
        userData.data,
        communitiesResult.data,
        options?.maxRecommendations || 20
      );
      const processingTime = Date.now() - startTime;

      // Format result
      const result: RecommendationResult = {
        recommendations,
        metadata: {
          totalCommunities: communitiesResult.data.length,
          processingTime
        }
      };

      return ApiResponse.success(result);
    } catch (error) {
      return ApiResponse.error(`Recommendation error: ${error}`, 500);
    }
  }

  /**
   * Generate event recommendations for a user
   * Note: Events use same content-based approach as communities
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

      // Fetch events
      const eventsResult = await this.fetchEvents();
      if (!eventsResult.success || !eventsResult.data) {
        return ApiResponse.error("Failed to fetch events", 500);
      }

      // For events, we can treat them like communities and use content-based filtering
      // Convert events to community-like format for the algorithm
      const eventAsCommunities: Community[] = eventsResult.data.map(event => ({
        id: event.id,
        name: event.title,
        description: event.description,
        category: event.category,
        tags: event.tags || [],
        memberCount: event.currentAttendees,
        location: event.location,
        createdAt: event.createdAt,
        contentTopics: event.contentTopics || []
      }));

      // Generate recommendations
      const startTime = Date.now();
      const communityRecs = await this.contentBasedEngine.generateRecommendations(
        userData.data,
        eventAsCommunities,
        options?.maxRecommendations || 20
      );
      const processingTime = Date.now() - startTime;

      // Convert back to event recommendations
      const eventRecommendations = communityRecs.map(rec => ({
        eventId: rec.communityId,
        score: rec.score,
        confidence: rec.confidence,
        method: rec.method,
        reasons: rec.reasons as any
      }));

      const result: EventRecommendationResult = {
        recommendations: eventRecommendations,
        metadata: {
          totalEvents: eventsResult.data.length,
          processingTime
        }
      };

      return ApiResponse.success(result);
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
      `)
      .eq("status", "active"); // Only recommend active communities

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
    console.log('[LOCATION-PARSE] Input:', typeof location, JSON.stringify(location)?.substring(0, 200));
    
    if (!location) return undefined;

    if (typeof location === "string") {
      // Check if it looks like JSON (starts with { or [)
      if (!location.trim().startsWith('{') && !location.trim().startsWith('[')) {
        console.log(`[LOCATION-PARSE] ⚠️  Plain text location (no coordinates): "${location}"`);
        return undefined; // Plain text location, no coordinates available
      }
      
      try {
        const parsed = JSON.parse(location);
        console.log('[LOCATION-PARSE] Parsed from string:', JSON.stringify(parsed));
        
        // Validate that we have actual coordinates (not 0)
        const lat = parsed.lat;
        const lng = parsed.lon || parsed.lng;
        
        if (!lat || !lng || lat === 0 || lng === 0) {
          console.log(`[LOCATION-PARSE] ❌ Invalid coordinates in string: lat=${lat}, lng=${lng}`);
          return undefined; // Don't return location if coordinates are missing or zero
        }
        
        console.log(`[LOCATION-PARSE] ✅ Valid location from string: ${parsed.city} (${lat}, ${lng})`);
        
        // NEW standardized format
        if (parsed.placeId) {
          return {
            lat,
            lng,
            city: parsed.city || "Unknown",
            placeId: parsed.placeId,
          };
        }
        
        // Legacy format
        return {
          lat,
          lng,
          city: parsed.city || "Unknown",
        };
      } catch (e) {
        console.log('[LOCATION-PARSE] ❌ JSON parse error:', e);
        return undefined;
      }
    }

    if (typeof location === "object") {
      console.log('[LOCATION-PARSE] Object location:', JSON.stringify(location));
      
      // Validate that we have actual coordinates (not 0)
      const lat = location.lat;
      const lng = location.lon || location.lng;
      
      if (!lat || !lng || lat === 0 || lng === 0) {
        console.log(`[LOCATION-PARSE] ❌ Invalid coordinates in object: lat=${lat}, lng=${lng}`);
        return undefined; // Don't return location if coordinates are missing or zero
      }
      
      console.log(`[LOCATION-PARSE] ✅ Valid location from object: ${location.city} (${lat}, ${lng})`);
      
      // NEW standardized format
      if (location.placeId) {
        return {
          lat,
          lng,
          city: location.city || "Unknown",
          placeId: location.placeId,
        };
      }
      
      // Legacy format
      return {
        lat,
        lng,
        city: location.city || "Unknown",
      };
    }

    console.log('[LOCATION-PARSE] ❌ Unknown location type');
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

