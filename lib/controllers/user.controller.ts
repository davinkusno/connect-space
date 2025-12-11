import { userService, UserService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { UserPointsSummary, UserType } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, BaseController, ForbiddenError } from "./base.controller";

// ==================== Response Types ====================

interface PointBreakdownItem {
  reason: string;
  points: number;
  created_at: string;
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
  ): Promise<NextResponse<UserPointsSummary | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<UserPointsSummary> = await this.service.getPoints(user.id);

      if (result.success) {
        return this.json<UserPointsSummary>(result.data as UserPointsSummary, result.status);
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
  ): Promise<NextResponse<UserPointsSummary | ApiErrorResponse>> {
    try {
      await this.requireAuth();
      const result: ServiceResult<UserPointsSummary> = await this.service.getPoints(userId);

      if (result.success) {
        return this.json<UserPointsSummary>(result.data as UserPointsSummary, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch points", result.status);
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

      const result: ServiceResult<UserPointsSummary> = await this.service.getPoints(userId);

      if (!result.success) {
        return this.error(result.error?.message || "Failed to fetch transactions", result.status);
      }

      const data: UserPointsSummary = result.data as UserPointsSummary;
      const response: TransactionsResponse = {
        transactions: [],
        total: data.activity_count || 0,
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

}

// Export singleton instance
export const userController: UserController = new UserController();
