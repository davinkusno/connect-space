import {
    PointSource,
    UserTransaction, UserType
} from "@/lib/types";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";

// ==================== User Service Types ====================

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  interests?: string[];
  location?: string;
  user_type?: UserType;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UserPointsSummary {
  total: number;
  activities: number;
  reports: number;
  breakdown: PointBreakdown[];
}

interface PointBreakdown {
  reason: string;
  points: number;
  created_at: string;
}

interface OnboardingStatus {
  onboardingCompleted: boolean;
  userType: UserType | null;
  hasProfile?: boolean;
  hasInterests?: boolean;
  hasLocation?: boolean;
}

interface AwardPointsResult {
  message: string;
}

interface UpdateProfileRequest {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  interests?: string[];
  location?: string;
}

interface PointRecord {
  points: number;
  reason: string | null;
  created_at: string;
}

// ==================== User Service Class ====================

/**
 * Service for user operations
 * Handles user profile, points, and onboarding
 */
export class UserService extends BaseService {
  private static instance: UserService;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance of UserService
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Get user profile by ID
   * @param userId - The user ID to fetch
   * @returns ServiceResult containing user profile or error
   */
  public async getById(userId: string): Promise<ServiceResult<UserProfile>> {
    const { data, error } = await this.supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return ApiResponse.notFound("User");
    }

    return ApiResponse.success<UserProfile>(data as UserProfile);
  }

  /**
   * Get user's point summary
   * @param userId - The user ID to fetch points for
   * @returns ServiceResult containing points summary
   */
  public async getPoints(userId: string): Promise<ServiceResult<UserPointsSummary>> {
    const { data: points, error } = await this.supabaseAdmin
      .from("user_points")
      .select("points, reason, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return ApiResponse.error("Failed to fetch points", 500);
    }

    let total: number = 0;
    let activities: number = 0;
    let reports: number = 0;

    const breakdown: PointBreakdown[] = ((points || []) as PointRecord[]).map(
      (p: PointRecord) => {
        total += p.points;
        if (p.points > 0) {
          activities += 1;
        } else if (p.reason?.toLowerCase().includes("report")) {
          reports += 1;
        }
        return {
          reason: p.reason || "",
          points: p.points,
          created_at: p.created_at,
        };
      }
    );

    return ApiResponse.success<UserPointsSummary>({ 
      total, 
      activities, 
      reports, 
      breakdown 
    });
  }

  /**
   * Award points to user
   * @param userId - The user to award points to
   * @param points - The number of points to award (can be negative)
   * @param reason - The reason for the points
   * @param source - The source of the points
   * @returns ServiceResult indicating success or failure
   */
  public async awardPoints(
    userId: string,
    points: number,
    reason: string,
    source: PointSource = "community_joined"
  ): Promise<ServiceResult<AwardPointsResult>> {
    const { error } = await this.supabaseAdmin.from("user_points").insert({
      user_id: userId,
      points,
      reason,
      source,
    });

    if (error) {
      return ApiResponse.error("Failed to award points", 500);
    }

    return ApiResponse.success<AwardPointsResult>({ message: "Points awarded" });
  }

  /**
   * Get onboarding status for a user
   * @param userId - The user ID to check
   * @returns ServiceResult containing onboarding status
   */
  public async getOnboardingStatus(
    userId: string
  ): Promise<ServiceResult<OnboardingStatus>> {
    const { data, error } = await this.supabaseAdmin
      .from("users")
      .select("onboarding_completed, user_type, full_name, interests, location")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return ApiResponse.success<OnboardingStatus>({
        onboardingCompleted: false,
        userType: null,
      });
    }

    const status: OnboardingStatus = {
      onboardingCompleted: data.onboarding_completed ?? false,
      userType: data.user_type as UserType | null,
      hasProfile: !!data.full_name,
      hasInterests: (data.interests?.length || 0) > 0,
      hasLocation: !!data.location,
    };

    return ApiResponse.success<OnboardingStatus>(status);
  }

  /**
   * Update user profile
   * @param userId - The user ID to update
   * @param updates - The profile fields to update
   * @returns ServiceResult containing updated profile
   */
  public async updateProfile(
    userId: string,
    updates: UpdateProfileRequest
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

    return ApiResponse.success<UserProfile>(data as UserProfile);
  }

  /**
   * Complete user onboarding
   * @param userId - The user ID to complete onboarding for
   * @returns ServiceResult indicating success or failure
   */
  public async completeOnboarding(
    userId: string
  ): Promise<ServiceResult<AwardPointsResult>> {
    const { error } = await this.supabaseAdmin
      .from("users")
      .update({ onboarding_completed: true })
      .eq("id", userId);

    if (error) {
      return ApiResponse.error("Failed to complete onboarding", 500);
    }

    return ApiResponse.success<AwardPointsResult>({ message: "Onboarding completed" });
  }

  /**
   * Get user transactions (point history)
   * @param userId - The user ID to fetch transactions for
   * @returns ServiceResult containing array of transactions
   */
  public async getTransactions(
    userId: string
  ): Promise<ServiceResult<UserTransaction[]>> {
    const { data, error } = await this.supabaseAdmin
      .from("user_points")
      .select("id, user_id, points, reason, source, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return ApiResponse.error("Failed to fetch transactions", 500);
    }

    return ApiResponse.success<UserTransaction[]>(
      (data || []) as UserTransaction[]
    );
  }

  /**
   * Get user role/type
   * @param userId - The user ID to fetch role for
   * @returns ServiceResult containing user type
   */
  public async getRole(userId: string): Promise<ServiceResult<{ role: UserType }>> {
    const { data, error } = await this.supabaseAdmin
      .from("users")
      .select("user_type")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return ApiResponse.notFound("User");
    }

    return ApiResponse.success<{ role: UserType }>({ 
      role: data.user_type as UserType 
    });
  }

  /**
   * Get user reputation summary
   * @param userId - The user ID to fetch reputation for
   * @returns ServiceResult containing reputation data
   */
  public async getReputation(
    userId: string
  ): Promise<ServiceResult<UserPointsSummary>> {
    return this.getPoints(userId);
  }

  /**
   * Upload user profile picture
   * @param userId - The user ID to update
   * @param avatarUrl - The new avatar URL
   * @returns ServiceResult indicating success
   */
  public async updateAvatar(
    userId: string,
    avatarUrl: string
  ): Promise<ServiceResult<{ avatar_url: string }>> {
    // Update user metadata via auth
    const { error: updateError } = await this.supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { avatar_url: avatarUrl } }
    );

    if (updateError) {
      return ApiResponse.error("Failed to update user metadata", 500);
    }

    // Also update the users table if it has an avatar_url column
    await this.supabaseAdmin
      .from("users")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);

    return ApiResponse.success<{ avatar_url: string }>({ avatar_url: avatarUrl });
  }

  /**
   * Get user's username or generate one from email
   * @param userId - The user ID
   * @returns Username string
   */
  public async getUsername(userId: string): Promise<string> {
    const { data } = await this.supabaseAdmin
      .from("users")
      .select("username, email")
      .eq("id", userId)
      .single();

    return data?.username || data?.email?.split("@")[0] || userId.slice(0, 8);
  }
}

// Export singleton instance
export const userService: UserService = UserService.getInstance();
