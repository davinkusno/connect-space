import { NextRequest, NextResponse } from "next/server";
import { User } from "@supabase/supabase-js";
import { BaseController, ForbiddenError, ApiErrorResponse } from "./base.controller";
import { userService, UserService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { UserType, ReputationLevel } from "@/lib/types";

// ==================== Response Types ====================

interface PointsResponse {
  total: number;
  activities: number;
  reports: number;
  breakdown: PointBreakdownItem[];
}

interface PointBreakdownItem {
  reason: string;
  points: number;
  created_at: string;
}

interface ReputationResponse {
  total: number;
  level: ReputationLevel;
  activities: number;
  reports: number;
}

interface TransactionsResponse {
  transactions: PointBreakdownItem[];
  total: number;
}

interface OnboardingResponse {
  onboardingCompleted: boolean;
  userType: UserType | null;
  hasProfile?: boolean;
  hasInterests?: boolean;
  hasLocation?: boolean;
}

interface RoleResponse {
  user_type: UserType;
}

interface MessageResponse {
  message: string;
}

// ==================== User Controller Class ====================

/**
 * Controller for user-related API endpoints
 * Handles HTTP requests and delegates to UserService
 */
export class UserController extends BaseController {
  private readonly service: UserService;

  constructor() {
    super();
    this.service = userService;
  }

  /**
   * GET /api/user/points
   * Get current user's points summary
   * @param request - The incoming request
   * @returns NextResponse with points data
   */
  public async getPoints(
    request: NextRequest
  ): Promise<NextResponse<PointsResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<PointsResponse> = await this.service.getPoints(user.id);

      if (result.success) {
        return this.json<PointsResponse>(result.data as PointsResponse, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch points", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/[id]/points
   * Get user's points by ID
   * @param request - The incoming request
   * @param userId - The user ID to fetch points for
   * @returns NextResponse with points data
   */
  public async getPointsById(
    request: NextRequest, 
    userId: string
  ): Promise<NextResponse<PointsResponse | ApiErrorResponse>> {
    try {
      await this.requireAuth();
      const result: ServiceResult<PointsResponse> = await this.service.getPoints(userId);

      if (result.success) {
        return this.json<PointsResponse>(result.data as PointsResponse, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch points", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/[id]/reputation
   * Get user's reputation summary
   * @param request - The incoming request
   * @param userId - The user ID to fetch reputation for
   * @returns NextResponse with reputation data
   */
  public async getReputation(
    request: NextRequest, 
    userId: string
  ): Promise<NextResponse<ReputationResponse | ApiErrorResponse>> {
    try {
      const result: ServiceResult<PointsResponse> = await this.service.getPoints(userId);

      if (!result.success) {
        return this.error(result.error?.message || "Failed to fetch reputation", result.status);
      }

      const data: PointsResponse = result.data as PointsResponse;
      const response: ReputationResponse = {
        total: data.total,
        level: this.calculateLevel(data.total),
        activities: data.activities,
        reports: data.reports,
      };

      return this.json<ReputationResponse>(response);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/[id]/transactions
   * Get user's point transactions
   * @param request - The incoming request
   * @param userId - The user ID to fetch transactions for
   * @returns NextResponse with transaction history
   */
  public async getTransactions(
    request: NextRequest, 
    userId: string
  ): Promise<NextResponse<TransactionsResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();

      // Users can only view their own transactions
      if (user.id !== userId) {
        throw new ForbiddenError("Cannot view other user's transactions");
      }

      const result: ServiceResult<PointsResponse> = await this.service.getPoints(userId);

      if (!result.success) {
        return this.error(result.error?.message || "Failed to fetch transactions", result.status);
      }

      const data: PointsResponse = result.data as PointsResponse;
      const response: TransactionsResponse = {
        transactions: data.breakdown || [],
        total: data.total || 0,
      };

      return this.json<TransactionsResponse>(response);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/onboarding
   * Get current user's onboarding status
   * @param request - The incoming request
   * @returns NextResponse with onboarding status
   */
  public async getOnboardingStatus(
    request: NextRequest
  ): Promise<NextResponse<OnboardingResponse | ApiErrorResponse>> {
    try {
      const user: User | null = await this.getAuthenticatedUser();

      if (!user) {
        return this.json<OnboardingResponse>({ 
          onboardingCompleted: false, 
          userType: null 
        });
      }

      const result: ServiceResult<OnboardingResponse> = 
        await this.service.getOnboardingStatus(user.id);

      return this.json<OnboardingResponse>(
        result.data as OnboardingResponse, 
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/user/onboarding
   * Complete user onboarding
   * @param request - The incoming request
   * @returns NextResponse indicating success
   */
  public async completeOnboarding(
    request: NextRequest
  ): Promise<NextResponse<MessageResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<MessageResponse> = 
        await this.service.completeOnboarding(user.id);

      if (result.success) {
        return this.json<MessageResponse>(result.data as MessageResponse, result.status);
      }
      
      return this.error(result.error?.message || "Failed to complete onboarding", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/role
   * Get current user's role/type
   * @param request - The incoming request
   * @returns NextResponse with user role
   */
  public async getRole(
    request: NextRequest
  ): Promise<NextResponse<RoleResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<{ role: UserType }> = await this.service.getRole(user.id);

      if (!result.success) {
        return this.error(result.error?.message || "Failed to fetch role", result.status);
      }

      return this.json<RoleResponse>({ 
        user_type: result.data?.role || "regular" 
      });
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * Calculate reputation level based on points
   * @param points - The user's total points
   * @returns The reputation level
   */
  private calculateLevel(points: number): ReputationLevel {
    if (points >= 1000) return "legend";
    if (points >= 500) return "veteran";
    if (points >= 100) return "trusted";
    if (points >= 25) return "active";
    return "beginner";
  }
}

// Export singleton instance
export const userController: UserController = new UserController();
