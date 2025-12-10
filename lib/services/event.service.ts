import {
    AttendeeStatus, EventAttendee, EventLocation
} from "@/lib/types";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";

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

interface RsvpResult {
  message: string;
  status?: AttendeeStatus;
}

interface RsvpStatusResult {
  hasRsvp: boolean;
  status: AttendeeStatus | null;
  rsvp: EventAttendee | null;
}

interface SavedEventResult extends EventData {
  community?: CommunityInfo | null;
  savedAt: string;
}

interface AttendeeRecord {
  event_id: string;
  status: AttendeeStatus;
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
   * Create RSVP for an event
   * @param eventId - The event ID to RSVP to
   * @param userId - The user ID making the RSVP
   * @returns ServiceResult indicating success or failure
   */
  public async createRsvp(
    eventId: string, 
    userId: string
  ): Promise<ServiceResult<RsvpResult>> {
    // Validate event exists
    const eventResult: ServiceResult<EventData> = await this.getById(eventId);
    if (!eventResult.success) {
      return ApiResponse.notFound("Event");
    }

    // Check for existing RSVP
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
          status: "going" as AttendeeStatus,
          registered_at: new Date().toISOString(),
        })
        .eq("id", existingRsvp.id);

      if (updateError) {
        return ApiResponse.error("Failed to update RSVP", 500);
      }

      return ApiResponse.success<RsvpResult>({ 
        message: "RSVP updated", 
        status: "going" 
      });
    }

    // Create new RSVP
    const { error: insertError } = await this.supabaseAdmin
      .from("event_attendees")
      .insert({
        event_id: eventId,
        user_id: userId,
        status: "going" as AttendeeStatus,
        registered_at: new Date().toISOString(),
      });

    if (insertError) {
      // Handle duplicate key constraint violation
      if (insertError.code === "23505") {
        const { error: updateError } = await this.supabaseAdmin
          .from("event_attendees")
          .update({
            status: "going" as AttendeeStatus,
            registered_at: new Date().toISOString(),
          })
          .eq("event_id", eventId)
          .eq("user_id", userId);

        if (updateError) {
          return ApiResponse.error("Failed to update RSVP", 500);
        }

        return ApiResponse.success<RsvpResult>({ 
          message: "RSVP updated", 
          status: "going" 
        });
      }

      return ApiResponse.error("Failed to create RSVP", 500);
    }

    return ApiResponse.created<RsvpResult>({ 
      message: "RSVP created", 
      status: "going" 
    });
  }

  /**
   * Remove RSVP from an event
   * @param eventId - The event ID to remove RSVP from
   * @param userId - The user ID removing their RSVP
   * @returns ServiceResult indicating success or failure
   */
  public async removeRsvp(
    eventId: string, 
    userId: string
  ): Promise<ServiceResult<RsvpResult>> {
    const { error } = await this.supabaseAdmin
      .from("event_attendees")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) {
      return ApiResponse.error("Failed to remove RSVP", 500);
    }

    return ApiResponse.success<RsvpResult>({ message: "RSVP removed" });
  }

  /**
   * Get RSVP status for a user and event
   * @param eventId - The event ID to check
   * @param userId - The user ID to check
   * @returns ServiceResult containing RSVP status
   */
  public async getRsvpStatus(
    eventId: string, 
    userId: string
  ): Promise<ServiceResult<RsvpStatusResult>> {
    const { data, error } = await this.supabaseAdmin
      .from("event_attendees")
      .select("id, status, registered_at")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return ApiResponse.error("Failed to check RSVP", 500);
    }

    const result: RsvpStatusResult = {
      hasRsvp: !!data,
      status: (data?.status as AttendeeStatus) || null,
      rsvp: data as EventAttendee | null,
    };

    return ApiResponse.success<RsvpStatusResult>(result);
  }

  /**
   * Get all events a user is interested in (RSVP'd to)
   * @param userId - The user ID to fetch events for
   * @returns ServiceResult containing array of events with community info
   */
  public async getUserInterestedEvents(
    userId: string
  ): Promise<ServiceResult<EventWithCommunity[]>> {
    // Fetch attendee records
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
  ): Promise<ServiceResult<RsvpResult>> {
    // Check if already saved
    const { data: existing } = await this.supabaseAdmin
      .from("event_save")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return ApiResponse.success<RsvpResult>({ message: "Event already saved" });
    }

    const { error } = await this.supabaseAdmin
      .from("event_save")
      .insert({ event_id: eventId, user_id: userId });

    if (error) {
      return ApiResponse.error("Failed to save event", 500);
    }

    return ApiResponse.created<RsvpResult>({ message: "Event saved" });
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
  ): Promise<ServiceResult<RsvpResult>> {
    const { error } = await this.supabaseAdmin
      .from("event_save")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) {
      return ApiResponse.error("Failed to unsave event", 500);
    }

    return ApiResponse.success<RsvpResult>({ message: "Event unsaved" });
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
      .from("event_save")
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
      .from("event_save")
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
}

// Export singleton instance
export const eventService: EventService = EventService.getInstance();
