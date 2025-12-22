import {
    EventAttendee, EventLocation
} from "@/lib/types";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";
import { pointsService } from "./points.service";

// ==================== Event Service Types ====================

interface EventData {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string | EventLocation;
  image_url?: string;
  is_online: boolean;
  community_id: string;
  max_attendees?: number;
  creator_id?: string;
  created_at?: string;
}

interface CommunityInfo {
  id: string;
  name: string;
  logo_url?: string;
}

interface EventWithCommunity extends EventData {
  community?: CommunityInfo | null;
}

interface InterestResult {
  message: string;
  interested?: boolean;
}

interface InterestStatusResult {
  isInterested: boolean;
  registeredAt: string | null;
}

interface SavedEventResult extends EventData {
  community?: CommunityInfo | null;
  savedAt: string;
}

interface AttendeeRecord {
  event_id: string;
  registered_at: string;
}

interface SavedRecord {
  event_id: string;
  saved_at: string;
}

// ==================== Event Service Class ====================

/**
 * Service for managing events and event-related operations
 * Handles RSVP, saves, and event queries
 */
export class EventService extends BaseService {
  private static instance: EventService;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance of EventService
   */
  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  /**
   * Get event by ID
   * @param eventId - The event ID to fetch
   * @returns ServiceResult containing event data or error
   */
  public async getById(eventId: string): Promise<ServiceResult<EventData>> {
    const { data, error } = await this.supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !data) {
      return ApiResponse.notFound("Event");
    }

    return ApiResponse.success(data as EventData);
  }

  /**
   * Get events with filtering, pagination, and user status
   * @param options - Query options
   * @param userId - Optional user ID for personalized status
   * @returns ServiceResult containing events and pagination info
   */
  public async getEvents(
    options: {
      page?: number;
      pageSize?: number;
      search?: string;
      category?: string;
      location?: string;
      dateRange?: "upcoming" | "today" | "week" | "month" | "all";
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
    userId?: string
  ): Promise<ServiceResult<{
    events: unknown[];
    pagination: { page: number; pageSize: number; totalCount: number; totalPages: number };
  }>> {
    const {
      page = 1,
      pageSize = 20,
      search,
      category,
      location,
      dateRange = "upcoming",
      sortBy = "start_time",
      sortOrder = "asc",
    } = options;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build query
    let query = this.supabaseAdmin
      .from("events")
      .select(
        `
        *,
        community:community_id(id, name, logo_url),
        creator:creator_id(id, username, full_name, avatar_url)
      `,
        { count: "exact" }
      );

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply category filter
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Apply date range filter
    const now = new Date().toISOString();
    if (dateRange === "upcoming") {
      query = query.gte("start_time", now);
    } else if (dateRange === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      query = query
        .gte("start_time", todayStart.toISOString())
        .lte("start_time", todayEnd.toISOString());
    } else if (dateRange === "week") {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      query = query
        .gte("start_time", now)
        .lte("start_time", weekFromNow.toISOString());
    } else if (dateRange === "month") {
      const monthFromNow = new Date();
      monthFromNow.setMonth(monthFromNow.getMonth() + 1);
      query = query
        .gte("start_time", now)
        .lte("start_time", monthFromNow.toISOString());
    }

    // Apply location filter
    if (location === "online") {
      query = query.eq("is_online", true);
    } else if (location && location !== "all") {
      query = query.ilike("location", `%${location}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const { data: events, error, count } = await query.range(from, to);

    if (error) {
      return ApiResponse.error(`Failed to fetch events: ${error.message}`, 500);
    }

    const eventIds = (events || []).map((e: { id: string }) => e.id);
    let attendeeCounts: Record<string, number> = {};
    let userInterestedMap: Record<string, boolean> = {};
    let userSavedMap: Record<string, boolean> = {};

    if (eventIds.length > 0) {
      // Get attendee counts
      const { data: attendeesData } = await this.supabaseAdmin
        .from("event_attendees")
        .select("event_id")
        .in("event_id", eventIds);

      if (attendeesData) {
        attendeesData.forEach((att: { event_id: string }) => {
          attendeeCounts[att.event_id] = (attendeeCounts[att.event_id] || 0) + 1;
        });
      }

      // Get user-specific status if userId provided
      if (userId) {
        const { data: userAttendees } = await this.supabaseAdmin
          .from("event_attendees")
          .select("event_id")
          .eq("user_id", userId)
          .in("event_id", eventIds);

        if (userAttendees) {
          userAttendees.forEach((att: { event_id: string }) => {
            userInterestedMap[att.event_id] = true;
          });
        }

        const { data: userSaved } = await this.supabaseAdmin
          .from("saved_events")
          .select("event_id")
          .eq("user_id", userId)
          .in("event_id", eventIds);

        if (userSaved) {
          userSaved.forEach((saved: { event_id: string }) => {
            userSavedMap[saved.event_id] = true;
          });
        }
      }
    }

    // Transform events
    const transformedEvents = (events || []).map((event: any) => {
      let locationData: any = {};
      if (event.location) {
        try {
          locationData = typeof event.location === "string"
            ? JSON.parse(event.location)
            : event.location;
        } catch {
          locationData = { address: event.location, city: event.location };
        }
      }

      const startDate = new Date(event.start_time);
      const endDate = new Date(event.end_time);
      const attendeeCount = attendeeCounts[event.id] || 0;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category || "General",
        tags: event.category ? [event.category] : [],
        date: startDate.toISOString().split("T")[0],
        time: startDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        endTime: endDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        location: {
          latitude: locationData.latitude || locationData.lat || 0,
          longitude: locationData.longitude || locationData.lng || 0,
          address: locationData.address || event.location || "",
          venue: locationData.venue || locationData.name || "",
          city: event.is_online ? "Online" : (locationData.city || locationData.town || locationData.municipality || "Unknown"),
          isOnline: event.is_online || false,
        },
        organizer: event.community?.name || "Unknown Community",
        attendees: attendeeCount,
        maxAttendees: event.max_attendees || null,
        rating: 4.5,
        reviewCount: 0,
        image: event.image_url || "/placeholder.svg?height=300&width=500",
        gallery: [],
        trending: false,
        featured: false,
        isNew: new Date(event.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
        difficulty: "Intermediate",
        duration: this.calculateDuration(event.start_time, event.end_time),
        language: "English",
        certificates: false,
        isPrivate: false,
        community: event.community ? {
          id: event.community.id,
          name: event.community.name,
          logo: event.community.logo_url,
        } : null,
        isInterested: userInterestedMap[event.id] || false,
        isSaved: userSavedMap[event.id] || false,
      };
    });

    return ApiResponse.success({
      events: transformedEvents,
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  }

  /**
   * Calculate duration between two times
   */
  private calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return diffMinutes > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffHours} hours`;
    }
    return `${diffMinutes} minutes`;
  }

  /**
   * Mark interest in an event
   * @param eventId - The event ID to show interest in
   * @param userId - The user ID showing interest
   * @returns ServiceResult indicating success or failure
   */
  public async markInterested(
    eventId: string, 
    userId: string
  ): Promise<ServiceResult<InterestResult>> {
    // Validate event exists and get event details
    const eventResult: ServiceResult<EventData> = await this.getById(eventId);
    if (!eventResult.success) {
      return ApiResponse.notFound("Event");
    }

    const event = eventResult.data as EventData;

    // Check for existing RSVP
    const { data: existingRsvp } = await this.supabaseAdmin
      .from("event_attendees")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingRsvp) {
      // Update existing RSVP timestamp
      const { error: updateError } = await this.supabaseAdmin
        .from("event_attendees")
        .update({
          registered_at: new Date().toISOString(),
        })
        .eq("id", existingRsvp.id);

      if (updateError) {
        return ApiResponse.error("Failed to mark as interested", 500);
      }

      return ApiResponse.success<InterestResult>({ 
        message: "Marked as interested", 
        interested: true 
      });
    }

    // Create new interest record
    const { error: insertError } = await this.supabaseAdmin
      .from("event_attendees")
      .insert({
        event_id: eventId,
        user_id: userId,
        registered_at: new Date().toISOString(),
      });

    if (insertError) {
      // Handle duplicate key constraint violation
      if (insertError.code === "23505") {
        const { error: updateError } = await this.supabaseAdmin
          .from("event_attendees")
          .update({
            registered_at: new Date().toISOString(),
          })
          .eq("event_id", eventId)
          .eq("user_id", userId);

        if (updateError) {
          return ApiResponse.error("Failed to mark as interested", 500);
        }

        return ApiResponse.success<InterestResult>({ 
          message: "Marked as interested", 
          interested: true 
        });
      }

      return ApiResponse.error("Failed to mark as interested", 500);
    }

    // Award points for joining event using pointsService
    await pointsService.onEventJoined(userId, eventId);

    // Send notifications to community creator and admins
    try {
      // Get user info who is interested
      const { data: interestedUser } = await this.supabaseAdmin
        .from("users")
        .select("full_name, username")
        .eq("id", userId)
        .single();

      const interestedUserName = interestedUser?.full_name || interestedUser?.username || "Someone";

      // Get community details including creator_id
      const { data: community } = await this.supabaseAdmin
        .from("communities")
        .select("id, name, creator_id")
        .eq("id", event.community_id)
        .single();

      if (community) {
        const recipientIds: string[] = [];

        // Add community creator
        if (community.creator_id && community.creator_id !== userId) {
          recipientIds.push(community.creator_id);
        }

        // Get community admins
        const { data: admins } = await this.supabaseAdmin
          .from("community_members")
          .select("user_id")
          .eq("community_id", community.id)
          .eq("role", "admin")
          .eq("status", "approved");

        if (admins && admins.length > 0) {
          admins.forEach(admin => {
            if (admin.user_id !== userId && !recipientIds.includes(admin.user_id)) {
              recipientIds.push(admin.user_id);
            }
          });
        }

        // Send notifications to all recipients
        if (recipientIds.length > 0) {
          const notificationService = (await import("./notification.service")).NotificationService.getInstance();
          await notificationService.createBulk(
            recipientIds,
            "event_interested",
            "New Event Interest",
            `${interestedUserName} is interested in "${event.title}"`,
            eventId,
            "event"
          );
        }
      }
    } catch (notifError) {
      // Log error but don't fail the request
      console.error("Failed to send event interest notifications:", notifError);
    }

    return ApiResponse.created<InterestResult>({ 
      message: "Marked as interested", 
      interested: true 
    });
  }

  /**
   * Remove interest from an event
   * @param eventId - The event ID to remove interest from
   * @param userId - The user ID removing their interest
   * @returns ServiceResult indicating success or failure
   */
  public async removeInterest(
    eventId: string, 
    userId: string
  ): Promise<ServiceResult<InterestResult>> {
    const { error } = await this.supabaseAdmin
      .from("event_attendees")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) {
      return ApiResponse.error("Failed to remove interest", 500);
    }

    return ApiResponse.success<InterestResult>({ message: "Interest removed", interested: false });
  }

  /**
   * Get interest status for a user and event
   * @param eventId - The event ID to check
   * @param userId - The user ID to check
   * @returns ServiceResult containing interest status
   */
  public async getInterestStatus(
    eventId: string, 
    userId: string
  ): Promise<ServiceResult<InterestStatusResult>> {
    const { data, error } = await this.supabaseAdmin
      .from("event_attendees")
      .select("id, registered_at")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return ApiResponse.error("Failed to check interest", 500);
    }

    const result: InterestStatusResult = {
      isInterested: !!data,
      registeredAt: data?.registered_at || null,
    };

    return ApiResponse.success<InterestStatusResult>(result);
  }

  /**
   * Get all events a user is interested in
   * @param userId - The user ID to fetch events for
   * @returns ServiceResult containing array of events with community info
   */
  public async getUserInterestedEvents(
    userId: string
  ): Promise<ServiceResult<EventWithCommunity[]>> {
    // Fetch attendee records
    const { data: attendeeRecords, error: attendeeError } = await this.supabaseAdmin
      .from("event_attendees")
      .select("event_id, registered_at")
      .eq("user_id", userId)
      .order("registered_at", { ascending: false });

    if (attendeeError) {
      return ApiResponse.error("Failed to fetch interested events", 500);
    }

    if (!attendeeRecords?.length) {
      return ApiResponse.success<EventWithCommunity[]>([]);
    }

    const eventIds: string[] = (attendeeRecords as AttendeeRecord[]).map(
      (r: AttendeeRecord) => r.event_id
    );

    // Fetch events
    const { data: eventsData, error: eventsError } = await this.supabaseAdmin
      .from("events")
      .select(`
        id, title, description, start_time, end_time,
        location, image_url, is_online, community_id
      `)
      .in("id", eventIds);

    if (eventsError) {
      return ApiResponse.error("Failed to fetch events", 500);
    }

    // Build communities map
    const communityIds: string[] = [
      ...new Set(
        (eventsData || [])
          .map((e: EventData) => e.community_id)
          .filter(Boolean)
      ),
    ];
    
    const communitiesMap: Record<string, CommunityInfo> = {};

    if (communityIds.length > 0) {
      const { data: communitiesData } = await this.supabaseAdmin
        .from("communities")
        .select("id, name, logo_url")
        .in("id", communityIds);

      (communitiesData || []).forEach((c: CommunityInfo) => {
        communitiesMap[c.id] = c;
      });
    }

    // Transform events with community info
    const events: EventWithCommunity[] = (eventsData || []).map(
      (event: EventData) => ({
        ...event,
        community: event.community_id 
          ? communitiesMap[event.community_id] || null 
          : null,
      })
    );

    return ApiResponse.success<EventWithCommunity[]>(events);
  }

  /**
   * Save an event for later
   * @param eventId - The event ID to save
   * @param userId - The user ID saving the event
   * @returns ServiceResult indicating success or failure
   */
  public async saveEvent(
    eventId: string, 
    userId: string
  ): Promise<ServiceResult<InterestResult>> {
    // Check if already saved
    const { data: existing } = await this.supabaseAdmin
      .from("saved_events")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return ApiResponse.success<InterestResult>({ message: "Event already saved" });
    }

    const { error } = await this.supabaseAdmin
      .from("saved_events")
      .insert({ event_id: eventId, user_id: userId });

    if (error) {
      return ApiResponse.error("Failed to save event", 500);
    }

    return ApiResponse.created<InterestResult>({ message: "Event saved" });
  }

  /**
   * Remove saved event
   * @param eventId - The event ID to unsave
   * @param userId - The user ID unsaving the event
   * @returns ServiceResult indicating success or failure
   */
  public async unsaveEvent(
    eventId: string, 
    userId: string
  ): Promise<ServiceResult<InterestResult>> {
    const { error } = await this.supabaseAdmin
      .from("saved_events")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) {
      return ApiResponse.error("Failed to unsave event", 500);
    }

    return ApiResponse.success<InterestResult>({ message: "Event unsaved" });
  }

  /**
   * Get all saved events for a user
   * @param userId - The user ID to fetch saved events for
   * @returns ServiceResult containing array of saved events
   */
  public async getSavedEvents(
    userId: string
  ): Promise<ServiceResult<SavedEventResult[]>> {
    const { data: savedRecords, error: savedError } = await this.supabaseAdmin
      .from("saved_events")
      .select("event_id, saved_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    if (savedError || !savedRecords?.length) {
      return ApiResponse.success<SavedEventResult[]>([]);
    }

    const eventIds: string[] = (savedRecords as SavedRecord[]).map(
      (r: SavedRecord) => r.event_id
    );

    const { data: eventsData, error: eventsError } = await this.supabaseAdmin
      .from("events")
      .select("id, title, description, start_time, end_time, location, image_url, is_online, community_id")
      .in("id", eventIds);

    if (eventsError || !eventsData?.length) {
      return ApiResponse.success<SavedEventResult[]>([]);
    }

    // Build communities map
    const communityIds: string[] = [
      ...new Set(
        (eventsData as Array<{ community_id: string }>)
          .map((e) => e.community_id)
          .filter(Boolean)
      ),
    ];
    
    const communitiesMap: Record<string, CommunityInfo> = {};

    if (communityIds.length > 0) {
      const { data: communities } = await this.supabaseAdmin
        .from("communities")
        .select("id, name, logo_url")
        .in("id", communityIds);

      (communities || []).forEach((c: CommunityInfo) => {
        communitiesMap[c.id] = c;
      });
    }

    // Transform saved events
    const events: SavedEventResult[] = (savedRecords as SavedRecord[])
      .map((record: SavedRecord) => {
        const event = eventsData.find(
          (e) => e.id === record.event_id
        );
        if (!event) return null;

        return {
          ...event,
          community: event.community_id 
            ? communitiesMap[event.community_id] || null 
            : null,
          savedAt: record.saved_at,
        } as SavedEventResult;
      })
      .filter((e): e is SavedEventResult => e !== null);

    return ApiResponse.success<SavedEventResult[]>(events);
  }

  /**
   * Check if an event is saved by a user
   * @param eventId - The event ID to check
   * @param userId - The user ID to check
   * @returns ServiceResult containing boolean indicating if saved
   */
  public async isEventSaved(
    eventId: string, 
    userId: string
  ): Promise<ServiceResult<boolean>> {
    const { data } = await this.supabaseAdmin
      .from("saved_events")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    return ApiResponse.success<boolean>(!!data);
  }

  /**
   * Parse location data to display string
   * Handles both JSON and plain string formats
   * @param location - The location data to parse
   * @returns Formatted location string
   */
  public static parseLocationDisplay(location: unknown): string {
    if (!location) return "";

    try {
      const locData: EventLocation = 
        typeof location === "string" 
          ? JSON.parse(location) 
          : (location as EventLocation);

      // Handle online events
      if (locData.meetingLink) {
        return locData.meetingLink;
      }

      // Return first available location field
      return locData.city || locData.venue || locData.address || "";
    } catch {
      return typeof location === "string" ? location : "";
    }
  }

  // ==================== Batch Status Methods ====================

  /**
   * Get interest status for multiple events (batch)
   * @param userId - The user ID
   * @param eventIds - Array of event IDs to check
   * @returns ServiceResult containing map of event ID to interested status
   */
  public async getBatchInterestStatus(
    userId: string,
    eventIds: string[]
  ): Promise<ServiceResult<Record<string, boolean>>> {
    if (eventIds.length === 0) {
      return ApiResponse.success({});
    }

    const { data, error } = await this.supabaseAdmin
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", userId)
      .in("event_id", eventIds);

    if (error) {
      return ApiResponse.error(`Failed to fetch interest status: ${error.message}`, 500);
    }

    const statusMap: Record<string, boolean> = {};
    eventIds.forEach(id => {
      statusMap[id] = false;
    });

    (data || []).forEach((row: { event_id: string }) => {
      statusMap[row.event_id] = true;
    });

    return ApiResponse.success(statusMap);
  }

  /**
   * Get saved status for multiple events (batch)
   * @param userId - The user ID
   * @param eventIds - Array of event IDs to check
   * @returns ServiceResult containing map of event ID to saved status
   */
  public async getBatchSavedStatus(
    userId: string,
    eventIds: string[]
  ): Promise<ServiceResult<Record<string, boolean>>> {
    if (eventIds.length === 0) {
      return ApiResponse.success({});
    }

    const { data, error } = await this.supabaseAdmin
      .from("saved_events")
      .select("event_id")
      .eq("user_id", userId)
      .in("event_id", eventIds);

    if (error) {
      return ApiResponse.error(`Failed to fetch saved status: ${error.message}`, 500);
    }

    const statusMap: Record<string, boolean> = {};
    eventIds.forEach(id => {
      statusMap[id] = false;
    });

    (data || []).forEach((row: { event_id: string }) => {
      statusMap[row.event_id] = true;
    });

    return ApiResponse.success(statusMap);
  }

  /**
   * Get both interest and saved status for multiple events (batch)
   * @param userId - The user ID
   * @param eventIds - Array of event IDs to check
   * @returns ServiceResult containing combined status for each event
   */
  public async getBatchEventStatus(
    userId: string,
    eventIds: string[]
  ): Promise<ServiceResult<{ interested: Record<string, boolean>; saved: Record<string, boolean> }>> {
    const [interestedResult, savedResult] = await Promise.all([
      this.getBatchInterestStatus(userId, eventIds),
      this.getBatchSavedStatus(userId, eventIds),
    ]);

    if (!interestedResult.success) {
      return ApiResponse.error(interestedResult.error?.message || "Failed to fetch interest status", 500);
    }

    if (!savedResult.success) {
      return ApiResponse.error(savedResult.error?.message || "Failed to fetch saved status", 500);
    }

    return ApiResponse.success({
      interested: interestedResult.data!,
      saved: savedResult.data!,
    });
  }

  // ==================== Event CRUD Methods ====================

  /**
   * Create a new event
   * @param data - Event data
   * @param userId - Creator user ID
   * @returns ServiceResult with created event
   */
  public async createEvent(
    data: {
      title: string;
      description: string;
      category?: string;
      location?: string;
      start_time: string;
      end_time: string;
      image_url?: string;
      community_id: string;
      is_online?: boolean;
      max_attendees?: number;
      link?: string;
    },
    userId: string
  ): Promise<ServiceResult<EventData>> {
    // Validate required fields
    if (!data.title || !data.description) {
      return ApiResponse.badRequest("Title and description are required");
    }

    const wordCount = data.description.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
    if (wordCount > 500) {
      return ApiResponse.badRequest(`Description must be 500 words or less (current: ${wordCount})`);
    }

    if (!data.start_time || !data.end_time) {
      return ApiResponse.badRequest("Start and end time are required");
    }

    if (!data.community_id) {
      return ApiResponse.badRequest("Community ID is required");
    }

    // Verify community exists
    const { data: community, error: communityError } = await this.supabaseAdmin
      .from("communities")
      .select("id, name, creator_id, category_id")
      .eq("id", data.community_id)
      .single();

    if (communityError || !community) {
      return ApiResponse.notFound("Community not found");
    }

    // Check permission (must be admin or creator)
    const { data: membership } = await this.supabaseAdmin
      .from("community_members")
      .select("role")
      .eq("community_id", data.community_id)
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!membership;
    const isCreator = community.creator_id === userId;

    if (!isAdmin && !isCreator) {
      return ApiResponse.error("Permission denied", 403);
    }

    // Prepare event data
    const insertData: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      location: data.location || null,
      start_time: data.start_time,
      end_time: data.end_time,
      image_url: data.image_url || null,
      community_id: data.community_id,
      creator_id: userId,
      is_online: data.is_online || false,
      max_attendees: data.max_attendees || null,
      link: data.link || null,
    };

    // Set category
    if (data.category) {
      insertData.category = data.category;
    } else if (community.category_id) {
      const { data: catData } = await this.supabaseAdmin
        .from("categories")
        .select("name")
        .eq("id", community.category_id)
        .single();

      if (catData?.name) {
        insertData.category = catData.name;
      }
    }

    // Create event
    const { data: event, error: eventError } = await this.supabaseAdmin
      .from("events")
      .insert(insertData)
      .select()
      .single();

    if (eventError || !event) {
      console.error("[EventService] Create error:", eventError);
      return ApiResponse.error("Failed to create event", 500);
    }

    // Update community activity
    await this.supabaseAdmin
      .from("communities")
      .update({
        last_activity_date: new Date().toISOString(),
        last_activity_type: "event",
        status: "active",
      })
      .eq("id", data.community_id);

    return ApiResponse.success(event as EventData);
  }

  /**
   * Update an existing event
   * @param eventId - Event ID to update
   * @param data - Update data
   * @param userId - User ID performing the update
   * @returns ServiceResult with updated event
   */
  public async updateEvent(
    eventId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      location?: string;
      start_time?: string;
      end_time?: string;
      image_url?: string;
      is_online?: boolean;
      is_public?: boolean;
      max_attendees?: number;
      link?: string;
    },
    userId: string
  ): Promise<ServiceResult<EventData>> {
    // Fetch existing event to verify ownership
    const { data: existingEvent, error: fetchError } = await this.supabaseAdmin
      .from("events")
      .select("id, community_id, creator_id")
      .eq("id", eventId)
      .single();

    if (fetchError || !existingEvent) {
      return ApiResponse.notFound("Event not found");
    }

    // Verify user is admin/creator of the community
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("id, creator_id")
      .eq("id", existingEvent.community_id)
      .single();

    if (!community) {
      return ApiResponse.notFound("Community not found");
    }

    // Check if user is creator or admin
    const isCreator = community.creator_id === userId;
    const { data: membership } = await this.supabaseAdmin
      .from("community_members")
      .select("role")
      .eq("community_id", existingEvent.community_id)
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!isCreator && !membership) {
      return ApiResponse.error("You don't have permission to update this event", 403);
    }

    // Build update data (only include fields that are provided)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.is_online !== undefined) updateData.is_online = data.is_online;
    if (data.is_public !== undefined) updateData.is_public = data.is_public;
    if (data.max_attendees !== undefined) updateData.max_attendees = data.max_attendees;
    if (data.link !== undefined) updateData.link = data.link;
    if (data.category !== undefined) updateData.category = data.category;

    // Update event
    const { data: updatedEvent, error: updateError } = await this.supabaseAdmin
      .from("events")
      .update(updateData)
      .eq("id", eventId)
      .select()
      .single();

    if (updateError) {
      console.error("[EventService] Update error:", updateError);
      return ApiResponse.error(`Failed to update event: ${updateError.message}`, 500);
    }

    return ApiResponse.success(updatedEvent as EventData);
  }

  /**
   * Get the count of interested attendees for an event
   * @param eventId - The event ID
   * @returns ServiceResult with attendees count
   */
  public async getAttendeesCount(eventId: string): Promise<ServiceResult<number>> {
    const { count, error } = await this.supabaseAdmin
      .from("event_attendees")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (error) {
      return ApiResponse.error(`Failed to get attendees count: ${error.message}`, 500);
    }

    return ApiResponse.success(count || 0);
  }

  /**
   * Delete an event (admin or creator only)
   * @param eventId - The event ID
   * @param userId - The user ID requesting deletion
   * @returns ServiceResult with deletion confirmation
   */
  public async deleteEvent(eventId: string, userId: string): Promise<ServiceResult<{ deleted: boolean; message: string }>> {
    // Fetch existing event to verify ownership
    const { data: existingEvent, error: fetchError } = await this.supabaseAdmin
      .from("events")
      .select("id, community_id, creator_id")
      .eq("id", eventId)
      .single();

    if (fetchError || !existingEvent) {
      return ApiResponse.notFound("Event");
    }

    // Verify user is admin/creator of the community
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("id, creator_id")
      .eq("id", existingEvent.community_id)
      .single();

    if (!community) {
      return ApiResponse.notFound("Community");
    }

    // Check if user is creator or admin
    const isCreator = community.creator_id === userId;
    const { data: membership } = await this.supabaseAdmin
      .from("community_members")
      .select("role")
      .eq("community_id", existingEvent.community_id)
      .eq("user_id", userId)
      .eq("role", "admin")
      .eq("status", "approved")
      .maybeSingle();

    if (!isCreator && !membership) {
      return ApiResponse.error("You don't have permission to delete this event", 403);
    }

    // Delete related posts first (as safety measure, even if cascade is set)
    await this.supabaseAdmin
      .from("posts")
      .delete()
      .eq("event_id", eventId);

    // Delete event (cascade will handle related records like event_attendees)
    const { error: deleteError } = await this.supabaseAdmin
      .from("events")
      .delete()
      .eq("id", eventId);

    if (deleteError) {
      return ApiResponse.error(`Failed to delete event: ${deleteError.message}`, 500);
    }

    return ApiResponse.success({
      deleted: true,
      message: "Event deleted successfully"
    });
  }
}

// Export singleton instance
export const eventService: EventService = EventService.getInstance();
