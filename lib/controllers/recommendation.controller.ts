import { recommendationService, RecommendationService } from "@/lib/services";
import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, BaseController } from "./base.controller";

// ==================== Response Types ====================

interface CommunityRecommendationsResponse {
  recommendedCommunityIds: string[];
  recommendations: Array<{
    communityId: string;
    score: number;
    confidence: number;
    reasons: Array<{
      type: string;
      description: string;
      weight: number;
    }>;
  }>;
  metadata: {
    algorithmsUsed: string[];
    diversityScore: number;
  };
}

interface EventRecommendationsResponse {
  recommendedEventIds: string[];
  recommendations: Array<{
    eventId: string;
    score: number;
    confidence: number;
    reasons: Array<{
      type: string;
      description: string;
      weight: number;
    }>;
  }>;
  metadata: {
    algorithmsUsed: string[];
    diversityScore: number;
  };
}

// ==================== Recommendation Controller Class ====================

/**
 * Controller for recommendation-related API endpoints
 * Handles HTTP requests and delegates to RecommendationService
 */
export class RecommendationController extends BaseController {
  private readonly service: RecommendationService;

  constructor() {
    super();
    this.service = recommendationService;
  }

  /**
   * GET /api/communities/recommendations
   * Get recommended communities for the current user
   * @param request - The incoming request
   * @returns NextResponse with recommended communities
   */
  public async getCommunityRecommendations(
    request: NextRequest
  ): Promise<NextResponse<CommunityRecommendationsResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get("limit") || "50");
      const includePopular = searchParams.get("includePopular") !== "false";
      const diversityWeight = parseFloat(searchParams.get("diversityWeight") || "0.3");

      const result = await this.service.getCommunityRecommendations(user.id, {
        maxRecommendations: limit,
        includePopular,
        diversityWeight,
      });

      if (!result.success || !result.data) {
        return this.error(result.error?.message || "Failed to generate recommendations", result.status);
      }

      // Sort with tie-breaking: score (desc) -> confidence (desc) -> communityId (asc for deterministic ordering)
      const sortedRecommendations = result.data.recommendations.sort((a, b) => {
        // Primary: sort by score (descending)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Secondary: sort by confidence (descending) - higher confidence wins ties
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        // Tertiary: sort by communityId (ascending) - deterministic ordering for equal scores/confidence
        return a.communityId.localeCompare(b.communityId);
      });

      const response: CommunityRecommendationsResponse = {
        recommendedCommunityIds: sortedRecommendations.map((rec) => rec.communityId),
        recommendations: sortedRecommendations.map((rec) => ({
          communityId: rec.communityId,
          score: rec.score,
          confidence: rec.confidence,
          reasons: rec.reasons,
        })),
        metadata: result.data.metadata,
      };

      return this.json(response, 200);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/events/recommendations
   * Get recommended events for the current user
   * @param request - The incoming request
   * @returns NextResponse with recommended events
   */
  public async getEventRecommendations(
    request: NextRequest
  ): Promise<NextResponse<EventRecommendationsResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get("limit") || "20");
      const dateRange = searchParams.get("dateRange") || "all";
      const onlineOnly = searchParams.get("onlineOnly") === "true";
      const inPersonOnly = searchParams.get("inPersonOnly") === "true";
      const includePopular = searchParams.get("includePopular") !== "false";
      const diversityWeight = parseFloat(searchParams.get("diversityWeight") || "0.3");

      const result = await this.service.getEventRecommendations(user.id, {
        maxRecommendations: limit,
        includePopular,
        diversityWeight,
        dateRangeFilter: dateRange as "all" | "today" | "week" | "month",
        includeOnlineOnly: onlineOnly,
        includeInPersonOnly: inPersonOnly,
      });

      if (!result.success || !result.data) {
        return this.error(result.error?.message || "Failed to generate recommendations", result.status);
      }

      // Sort with tie-breaking: score (desc) -> confidence (desc) -> eventId (asc for deterministic ordering)
      const sortedRecommendations = result.data.recommendations.sort((a, b) => {
        // Primary: sort by score (descending)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Secondary: sort by confidence (descending) - higher confidence wins ties
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        // Tertiary: sort by eventId (ascending) - deterministic ordering for equal scores/confidence
        return a.eventId.localeCompare(b.eventId);
      });

      const response: EventRecommendationsResponse = {
        recommendedEventIds: sortedRecommendations.map((rec) => rec.eventId),
        recommendations: sortedRecommendations.map((rec) => ({
          eventId: rec.eventId,
          score: rec.score,
          confidence: rec.confidence,
          reasons: rec.reasons,
        })),
        metadata: result.data.metadata,
      };

      return this.json(response, 200);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const recommendationController: RecommendationController = new RecommendationController();

