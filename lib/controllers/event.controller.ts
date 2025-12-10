import { NextRequest, NextResponse } from "next/server";
import { User } from "@supabase/supabase-js";
import { BaseController, ApiErrorResponse } from "./base.controller";
import { eventService, EventService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";

// ==================== Controller Response Types ====================

interface RsvpStatusResponse {
  hasRsvp: boolean;
  status: string | null;
  rsvp: unknown;
}

interface RsvpActionResponse {
  message: string;
  status?: string;
}

interface EventsListResponse {
  events: unknown[];
}

interface SavedStatusResponse {
  saved: boolean;
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
   * GET /api/events/[id]/rsvp
   * Check RSVP status for authenticated user
   * @param request - The incoming request
   * @param eventId - The event ID to check
   * @returns NextResponse with RSVP status
   */
  public async getRsvpStatus(
    request: NextRequest, 
    eventId: string
  ): Promise<NextResponse<RsvpStatusResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<RsvpStatusResponse> = 
        await this.service.getRsvpStatus(eventId, user.id);
      
      return this.json<RsvpStatusResponse>(
        result.data as RsvpStatusResponse, 
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/events/[id]/rsvp
   * Create or update RSVP for an event
   * @param request - The incoming request
   * @param eventId - The event ID to RSVP to
   * @returns NextResponse indicating success or failure
   */
  public async createRsvp(
    request: NextRequest, 
    eventId: string
  ): Promise<NextResponse<RsvpActionResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<RsvpActionResponse> = 
        await this.service.createRsvp(eventId, user.id);
      
      if (result.success) {
        return this.json<RsvpActionResponse>(
          result.data as RsvpActionResponse, 
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to create RSVP", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/events/[id]/rsvp
   * Remove RSVP from an event
   * @param request - The incoming request
   * @param eventId - The event ID to remove RSVP from
   * @returns NextResponse indicating success or failure
   */
  public async removeRsvp(
    request: NextRequest, 
    eventId: string
  ): Promise<NextResponse<RsvpActionResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<RsvpActionResponse> = 
        await this.service.removeRsvp(eventId, user.id);
      
      if (result.success) {
        return this.json<RsvpActionResponse>(
          result.data as RsvpActionResponse, 
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to remove RSVP", result.status);
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
  ): Promise<NextResponse<RsvpActionResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<RsvpActionResponse> = 
        await this.service.saveEvent(eventId, user.id);
      
      if (result.success) {
        return this.json<RsvpActionResponse>(
          result.data as RsvpActionResponse, 
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
  ): Promise<NextResponse<RsvpActionResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<RsvpActionResponse> = 
        await this.service.unsaveEvent(eventId, user.id);
      
      if (result.success) {
        return this.json<RsvpActionResponse>(
          result.data as RsvpActionResponse, 
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
}

// Export singleton instance
export const eventController: EventController = new EventController();
