import {
  BaseService,
  ApiResponse,
  ServiceResult,
  NotFoundError,
  ValidationError,
} from "./base.service";

interface EventData {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url?: string;
  is_online: boolean;
  community_id: string;
  max_attendees?: number;
}

interface CreateEventInput {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_online?: boolean;
  community_id: string;
  max_attendees?: number;
  image_url?: string;
}

interface EventWithCommunity extends EventData {
  community?: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

/**
 * Service for managing events
 */
export class EventService extends BaseService {
  private static instance: EventService;

  private constructor() {
    super();
  }

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  /**
   * Get event by ID
   */
  async getById(eventId: string): Promise<ServiceResult<EventData>> {
    const { data, error } = await this.supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !data) {
      return ApiResponse.error("Event not found", 404);
    }

    return ApiResponse.success(data);
  }

  /**
   * Create RSVP for an event
   */
  async createRsvp(eventId: string, userId: string): Promise<ServiceResult<any>> {
    // Check if event exists
    const eventResult = await this.getById(eventId);
    if (!eventResult.success) {
      return eventResult;
    }

    // Check existing RSVP
    const { data: existingRsvp } = await this.supabaseAdmin
      .from("event_attendees")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingRsvp) {
      // Update existing RSVP
      const { error: updateError } = await this.supabaseAdmin
        .from("event_attendees")
        .update({
          status: "going",
          registered_at: new Date().toISOString(),
        })
        .eq("id", existingRsvp.id);

      if (updateError) {
        return ApiResponse.error("Failed to update RSVP", 500);
      }

      return ApiResponse.success({ message: "RSVP updated", status: "going" });
    }

    // Create new RSVP
    const { error: insertError } = await this.supabaseAdmin
      .from("event_attendees")
      .insert({
        event_id: eventId,
        user_id: userId,
        status: "going",
        registered_at: new Date().toISOString(),
      });

    if (insertError) {
      // Handle duplicate key error
      if (insertError.code === "23505") {
        const { error: updateError } = await this.supabaseAdmin
          .from("event_attendees")
          .update({
            status: "going",
            registered_at: new Date().toISOString(),
          })
          .eq("event_id", eventId)
          .eq("user_id", userId);

        if (updateError) {
          return ApiResponse.error("Failed to update RSVP", 500);
        }

        return ApiResponse.success({ message: "RSVP updated", status: "going" });
      }

      return ApiResponse.error("Failed to create RSVP", 500);
    }

    return ApiResponse.created({ message: "RSVP created", status: "going" });
  }

  /**
   * Remove RSVP from an event
   */
  async removeRsvp(eventId: string, userId: string): Promise<ServiceResult<any>> {
    const { error } = await this.supabaseAdmin
      .from("event_attendees")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) {
      return ApiResponse.error("Failed to remove RSVP", 500);
    }

    return ApiResponse.success({ message: "RSVP removed" });
  }

  /**
   * Check if user has RSVP for an event
   */
  async getRsvpStatus(eventId: string, userId: string): Promise<ServiceResult<any>> {
    const { data, error } = await this.supabaseAdmin
      .from("event_attendees")
      .select("id, status, registered_at")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return ApiResponse.error("Failed to check RSVP", 500);
    }

    return ApiResponse.success({
      hasRsvp: !!data,
      status: data?.status || null,
      rsvp: data,
    });
  }

  /**
   * Get user's interested events
   */
  async getUserInterestedEvents(userId: string): Promise<ServiceResult<EventWithCommunity[]>> {
    // Get attendee records
    const { data: attendeeRecords, error: attendeeError } = await this.supabaseAdmin
      .from("event_attendees")
      .select("event_id, status, registered_at")
      .eq("user_id", userId)
      .in("status", ["going", "maybe"])
      .order("registered_at", { ascending: false });

    if (attendeeError) {
      return ApiResponse.error("Failed to fetch interested events", 500);
    }

    if (!attendeeRecords?.length) {
      return ApiResponse.success([]);
    }

    const eventIds = attendeeRecords.map((r) => r.event_id);

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

    // Fetch communities
    const communityIds = [...new Set((eventsData || []).map((e) => e.community_id).filter(Boolean))];
    const communitiesMap: Record<string, any> = {};

    if (communityIds.length > 0) {
      const { data: communitiesData } = await this.supabaseAdmin
        .from("communities")
        .select("id, name, logo_url")
        .in("id", communityIds);

      communitiesData?.forEach((c) => {
        communitiesMap[c.id] = c;
      });
    }

    // Transform events
    const events = (eventsData || []).map((event) => ({
      ...event,
      community: event.community_id ? communitiesMap[event.community_id] : null,
    }));

    return ApiResponse.success(events);
  }

  /**
   * Parse location JSON to readable string
   */
  static parseLocationDisplay(location: any): string {
    if (!location) return "";
    
    try {
      const locData = typeof location === "string" ? JSON.parse(location) : location;

      if (locData.meetingLink) {
        return locData.meetingLink;
      }

      return locData.city || locData.venue || locData.address || "";
    } catch {
      return typeof location === "string" ? location : "";
    }
  }
}

// Export singleton instance
export const eventService = EventService.getInstance();

