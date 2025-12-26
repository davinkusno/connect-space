import { eventService, EventService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, BaseController } from "./base.controller";

// ==================== Controller Response Types ====================

interface InterestStatusResponse {
  isInterested: boolean;
  registeredAt: string | null;
}

interface InterestActionResponse {
  message: string;
  interested?: boolean;
}

interface EventsListResponse {
  events: unknown[];
}

interface SavedStatusResponse {
  saved: boolean;
}

interface SaveActionResponse {
  message: string;
  saved?: boolean;
}

// ==================== Event Controller Class ====================

/**
 * Controller for event-related API endpoints
 * Handles HTTP requests and delegates to EventService
 */
export class EventController extends BaseController {
  private readonly service: EventService;

  constructor() {
    super();
    this.service = eventService;
  }

  /**
   * GET /api/events
   * Get events with filtering, pagination, and user status
   * @param request - The incoming request with query params
   * @returns NextResponse with events list and pagination
   */
  public async getEvents(
    request: NextRequest
  ): Promise<NextResponse<{ events: unknown[]; pagination: unknown } | ApiErrorResponse>> {
    try {
      const { searchParams } = new URL(request.url);
      
      // Parse query params
      const options = {
        page: parseInt(searchParams.get("page") || "1"),
        pageSize: parseInt(searchParams.get("pageSize") || "20"),
        search: searchParams.get("search") || undefined,
        category: searchParams.get("category") || undefined,
        location: searchParams.get("location") || undefined,
        dateRange: (searchParams.get("dateRange") || "upcoming") as "upcoming" | "today" | "week" | "month" | "all",
        sortBy: searchParams.get("sortBy") || "start_time",
        sortOrder: (searchParams.get("sortOrder") || "asc") as "asc" | "desc",
      };

      // Try to get current user (optional - for personalized data)
      let userId: string | undefined;
      try {
        const user = await this.getOptionalAuth();
        userId = user?.id;
      } catch {
        // No auth - continue without user-specific data
      }

      const result = await this.service.getEvents(options, userId);

      if (result.success) {
        return this.json(result.data!, result.status);
      }

      return this.error(result.error?.message || "Failed to fetch events", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/events/[id]/interested
   * Check interest status for authenticated user
   * @param request - The incoming request
   * @param eventId - The event ID to check
   * @returns NextResponse with interest status
   */
  public async getInterestStatus(
    request: NextRequest, 
    eventId: string
  ): Promise<NextResponse<InterestStatusResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<InterestStatusResponse> = 
        await this.service.getInterestStatus(eventId, user.id);
      
      return this.json<InterestStatusResponse>(
        result.data as InterestStatusResponse, 
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/events/[id]/interested
   * Mark interest in an event
   * @param request - The incoming request
   * @param eventId - The event ID to show interest in
   * @returns NextResponse indicating success or failure
   */
  public async markInterested(
    request: NextRequest, 
    eventId: string
  ): Promise<NextResponse<InterestActionResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<InterestActionResponse> = 
        await this.service.markInterested(eventId, user.id);
      
      if (result.success) {
        return this.json<InterestActionResponse>(
          result.data as InterestActionResponse, 
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to mark interest", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/events/[id]/interested
   * Remove interest from an event
   * @param request - The incoming request
   * @param eventId - The event ID to remove interest from
   * @returns NextResponse indicating success or failure
   */
  public async removeInterest(
    request: NextRequest, 
    eventId: string
  ): Promise<NextResponse<InterestActionResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<InterestActionResponse> = 
        await this.service.removeInterest(eventId, user.id);
      
      if (result.success) {
        return this.json<InterestActionResponse>(
          result.data as InterestActionResponse, 
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to remove interest", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/events/interested
   * Get all events the user is interested in
   * @param request - The incoming request
   * @returns NextResponse containing array of events
   */
  public async getInterestedEvents(
    request: NextRequest
  ): Promise<NextResponse<EventsListResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<unknown[]> = 
        await this.service.getUserInterestedEvents(user.id);
      
      if (result.success) {
        return this.json<EventsListResponse>({ events: result.data || [] }, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch events", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/events/[id]/save
   * Save an event for later
   * @param request - The incoming request
   * @param eventId - The event ID to save
   * @returns NextResponse indicating success or failure
   */
  public async saveEvent(
    request: NextRequest, 
    eventId: string
  ): Promise<NextResponse<SaveActionResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<SaveActionResponse> = 
        await this.service.saveEvent(eventId, user.id);
      
      if (result.success) {
        return this.json<SaveActionResponse>(
          result.data as SaveActionResponse, 
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to save event", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/events/[id]/save
   * Remove saved event
   * @param request - The incoming request
   * @param eventId - The event ID to unsave
   * @returns NextResponse indicating success or failure
   */
  public async unsaveEvent(
    request: NextRequest, 
    eventId: string
  ): Promise<NextResponse<SaveActionResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<SaveActionResponse> = 
        await this.service.unsaveEvent(eventId, user.id);
      
      if (result.success) {
        return this.json<SaveActionResponse>(
          result.data as SaveActionResponse, 
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to unsave event", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/events/[id]/save
   * Check if an event is saved by the user
   * @param request - The incoming request
   * @param eventId - The event ID to check
   * @returns NextResponse indicating if event is saved
   */
  public async isEventSaved(
    request: NextRequest, 
    eventId: string
  ): Promise<NextResponse<SavedStatusResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<boolean> = 
        await this.service.isEventSaved(eventId, user.id);
      
      return this.json<SavedStatusResponse>(
        { saved: result.data || false }, 
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/events/saved
   * Get all saved events for the user
   * @param request - The incoming request
   * @returns NextResponse containing array of saved events
   */
  public async getSavedEvents(
    request: NextRequest
  ): Promise<NextResponse<EventsListResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<unknown[]> = 
        await this.service.getSavedEvents(user.id);
      
      if (result.success) {
        return this.json<EventsListResponse>({ events: result.data || [] }, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch saved events", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/events/batch-status
   * Get interest and saved status for multiple events
   * @param request - The incoming request with event IDs
   * @returns NextResponse with status map
   */
  public async getBatchStatus(
    request: NextRequest
  ): Promise<NextResponse<{ interested: Record<string, boolean>; saved: Record<string, boolean> } | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const { searchParams } = new URL(request.url);
      const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];

      if (ids.length === 0) {
        return this.json({ interested: {}, saved: {} }, 200);
      }

      const result = await this.service.getBatchEventStatus(user.id, ids);

      if (result.success) {
        return this.json(result.data!, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch event status", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  // ==================== Event CRUD Methods ====================

  /**
   * POST /api/events/create
   * Create a new event
   * @param request - The incoming request with event data
   * @returns NextResponse with created event
   */
  public async createEvent(
    request: NextRequest
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body = await this.parseBody<{
        title: string;
        description: string;
        category?: string; // Category name (for backward compatibility)
        category_id?: string; // Category ID (preferred)
        location?: string;
        start_time: string;
        end_time: string;
        image_url?: string;
        community_id: string;
        is_online?: boolean;
        max_attendees?: number;
        link?: string;
        is_private?: boolean;
      }>(request);

      const result = await this.service.createEvent(body, user.id);

      if (result.success) {
        return this.json(result.data, 201);
      }
      
      return this.error(result.error?.message || "Failed to create event", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/events/[id]/update
   * Update an existing event
   * @param request - The incoming request with update data
   * @param eventId - The event ID to update
   * @returns NextResponse with updated event
   */
  public async updateEvent(
    request: NextRequest,
    eventId: string
  ): Promise<NextResponse<{ success: boolean; message: string; data: unknown } | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body = await this.parseBody<{
        title?: string;
        description?: string;
        category?: string; // Category name (for backward compatibility)
        category_id?: string; // Category ID (preferred)
        location?: string;
        start_time?: string;
        end_time?: string;
        image_url?: string;
        is_online?: boolean;
        is_public?: boolean;
        max_attendees?: number;
        link?: string;
      }>(request);

      const result = await this.service.updateEvent(eventId, body, user.id);

      if (result.success) {
        return this.json({
          success: true,
          message: "Event updated successfully",
          data: result.data,
        }, result.status);
      }
      
      return this.error(result.error?.message || "Failed to update event", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/events/[id]/attendees-count
   * Get count of interested attendees for an event (public endpoint)
   * @param request - The incoming request
   * @param eventId - The event ID
   * @returns NextResponse with attendees count
   */
  public async getAttendeesCount(
    request: NextRequest,
    eventId: string
  ): Promise<NextResponse<{ count: number } | ApiErrorResponse>> {
    try {
      const result: ServiceResult<number> = await this.service.getAttendeesCount(eventId);
      
      if (result.success) {
        return this.json<{ count: number }>({ count: result.data || 0 }, result.status);
      }
      
      return this.error(result.error?.message || "Failed to get attendees count", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/events/[id]
   * Delete an event (community admin or creator only)
   * @param request - The incoming request
   * @param eventId - The event ID
   * @returns NextResponse with deletion confirmation
   */
  public async deleteEvent(
    request: NextRequest,
    eventId: string
  ): Promise<NextResponse<{ success: boolean; message: string } | ApiErrorResponse>> {
    try {
      const user = await this.requireAuth();
      const result: ServiceResult<{ deleted: boolean; message: string }> = await this.service.deleteEvent(eventId, user.id);
      
      if (result.success) {
        return this.json<{ success: boolean; message: string }>(
          { success: true, message: result.data?.message || "Event deleted successfully" },
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to delete event", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/events/user
   * Get user's events (interested + saved) for dashboard
   * @param request - The incoming request
   * @returns NextResponse with user's events
   */
  public async getUserEvents(
    request: NextRequest
  ): Promise<NextResponse<{ interested: unknown[]; saved: unknown[] } | ApiErrorResponse>> {
    try {
      const user = await this.requireAuth();
      const result = await this.service.getUserEvents(user.id);

      if (result.success) {
        return this.json(result.data!, result.status);
      }

      return this.error(
        result.error?.message || "Failed to fetch user events",
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const eventController: EventController = new EventController();
