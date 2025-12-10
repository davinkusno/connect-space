import { NextRequest, NextResponse } from "next/server";
import { BaseController } from "./base.controller";
import { eventService } from "@/lib/services";

/**
 * Controller for event-related API endpoints
 */
export class EventController extends BaseController {
  /**
   * GET /api/events/[id]/rsvp
   * Check RSVP status for authenticated user
   */
  async getRsvpStatus(request: NextRequest, eventId: string): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await eventService.getRsvpStatus(eventId, user.id);
      return this.json(result.data, result.status);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/events/[id]/rsvp
   * Create or update RSVP
   */
  async createRsvp(request: NextRequest, eventId: string): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await eventService.createRsvp(eventId, user.id);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/events/[id]/rsvp
   * Remove RSVP
   */
  async removeRsvp(request: NextRequest, eventId: string): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await eventService.removeRsvp(eventId, user.id);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/events/interested
   * Get user's interested events
   */
  async getInterestedEvents(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await eventService.getUserInterestedEvents(user.id);
      return this.json(
        result.success ? { events: result.data } : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const eventController = new EventController();

