import { NextRequest, NextResponse } from "next/server";
import { BaseController, ForbiddenError } from "./base.controller";
import { userService } from "@/lib/services";

/**
 * Controller for user-related API endpoints
 */
export class UserController extends BaseController {
  /**
   * GET /api/user/points
   * Get current user's points
   */
  async getPoints(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await userService.getPoints(user.id);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/[id]/points
   * Get user's points by ID
   */
  async getPointsById(request: NextRequest, userId: string): Promise<NextResponse> {
    try {
      await this.requireAuth();
      const result = await userService.getPoints(userId);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/[id]/reputation
   * Get user's reputation
   */
  async getReputation(request: NextRequest, userId: string): Promise<NextResponse> {
    try {
      const result = await userService.getPoints(userId);

      if (!result.success) {
        return this.json({ error: result.error?.message }, result.status);
      }

      const data = result.data!;
      return this.json({
        total: data.total,
        level: this.calculateLevel(data.total),
        activities: data.activities,
        reports: data.reports,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/[id]/transactions
   * Get user's point transactions
   */
  async getTransactions(request: NextRequest, userId: string): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();

      if (user.id !== userId) {
        throw new ForbiddenError("Cannot view other user's transactions");
      }

      const result = await userService.getPoints(userId);

      if (!result.success) {
        return this.json({ error: result.error?.message }, result.status);
      }

      return this.json({
        transactions: result.data?.breakdown || [],
        total: result.data?.total || 0,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/onboarding
   * Get onboarding status
   */
  async getOnboardingStatus(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.getAuthenticatedUser();

      if (!user) {
        return this.json({ onboarding_completed: false, user_type: null });
      }

      const result = await userService.getOnboardingStatus(user.id);
      return this.json(result.data, result.status);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/user/onboarding
   * Complete onboarding
   */
  async completeOnboarding(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await userService.completeOnboarding(user.id);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/role
   * Get current user's role
   */
  async getRole(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await userService.getById(user.id);

      if (!result.success) {
        return this.json({ error: result.error?.message }, result.status);
      }

      return this.json({ user_type: result.data?.user_type || "member" });
    } catch (error) {
      return this.handleError(error);
    }
  }

  private calculateLevel(points: number): string {
    if (points >= 1000) return "Expert";
    if (points >= 500) return "Advanced";
    if (points >= 100) return "Intermediate";
    if (points >= 25) return "Beginner";
    return "Newcomer";
  }
}

export const userController = new UserController();

