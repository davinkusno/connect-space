import {
  BaseService,
  ApiResponse,
  ServiceResult,
  NotFoundError,
} from "./base.service";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  interests?: string[];
  location?: string;
  user_type?: string;
  onboarding_completed?: boolean;
}

interface UserPoints {
  total: number;
  activities: number;
  reports: number;
  breakdown: {
    reason: string;
    points: number;
    created_at: string;
  }[];
}

/**
 * Service for user operations
 */
export class UserService extends BaseService {
  private static instance: UserService;

  private constructor() {
    super();
  }

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Get user profile by ID
   */
  async getById(userId: string): Promise<ServiceResult<UserProfile>> {
    const { data, error } = await this.supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return ApiResponse.error("User not found", 404);
    }

    return ApiResponse.success(data);
  }

  /**
   * Get user's point summary
   */
  async getPoints(userId: string): Promise<ServiceResult<UserPoints>> {
    const { data: points, error } = await this.supabaseAdmin
      .from("user_points")
      .select("points, reason, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return ApiResponse.error("Failed to fetch points", 500);
    }

    let total = 0;
    let activities = 0;
    let reports = 0;

    const breakdown = (points || []).map((p) => {
      total += p.points;
      if (p.points > 0) {
        activities += 1;
      } else if (p.reason?.toLowerCase().includes("report")) {
        reports += 1;
      }
      return p;
    });

    return ApiResponse.success({ total, activities, reports, breakdown });
  }

  /**
   * Award points to user
   */
  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    source: string = "system"
  ): Promise<ServiceResult<any>> {
    const { error } = await this.supabaseAdmin.from("user_points").insert({
      user_id: userId,
      points,
      reason,
      source,
    });

    if (error) {
      return ApiResponse.error("Failed to award points", 500);
    }

    return ApiResponse.success({ message: "Points awarded" });
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(userId: string): Promise<ServiceResult<any>> {
    const { data, error } = await this.supabaseAdmin
      .from("users")
      .select("onboarding_completed, user_type, full_name, interests, location")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return ApiResponse.success({
        onboarding_completed: false,
        user_type: null,
      });
    }

    return ApiResponse.success({
      onboarding_completed: data.onboarding_completed ?? false,
      user_type: data.user_type,
      has_profile: !!data.full_name,
      has_interests: (data.interests?.length || 0) > 0,
      has_location: !!data.location,
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<ServiceResult<UserProfile>> {
    const { data, error } = await this.supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return ApiResponse.error("Failed to update profile", 500);
    }

    return ApiResponse.success(data);
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(userId: string): Promise<ServiceResult<any>> {
    const { error } = await this.supabaseAdmin
      .from("users")
      .update({ onboarding_completed: true })
      .eq("id", userId);

    if (error) {
      return ApiResponse.error("Failed to complete onboarding", 500);
    }

    return ApiResponse.success({ message: "Onboarding completed" });
  }
}

export const userService = UserService.getInstance();

