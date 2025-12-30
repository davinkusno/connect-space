import {
    PointSource,
    UserPointsSummary,
    UserType
} from "@/lib/types";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";
import { pointsService } from "./points.service";

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
  username?: string;
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
   * @returns ServiceResult containing points summary (activity points and report count separate)
   */
  public async getPoints(userId: string): Promise<ServiceResult<UserPointsSummary>> {
    // Delegate to pointsService for consistent data
    return pointsService.getUserPointsSummary(userId);
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
    // Map legacy source types to pointsService point types
    const sourceToPointType: Record<PointSource, import("./points.service").PointType> = {
      community_joined: "community_joined",
      event_attended: "event_joined",
      post_created: "post_created",
      community_created: "community_created",
      event_created: "event_created",
      report_penalty: "report_received",
      admin_warning: "report_received",
      referral: "daily_active", // Map referral to daily_active as fallback
    };

    const result = await pointsService.awardPoints({
      user_id: userId,
      points,
      point_type: sourceToPointType[source],
    });

    if (!result.success) {
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
    // First check if user exists
    const { data: existingUser, error: checkError } = await this.supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .maybeSingle();
    
    if (checkError) {
      console.error("[UserService] Error checking user existence:", checkError);
      return ApiResponse.error(`Failed to check user: ${checkError.message}`, 500);
    }
    
    // If user doesn't exist, create them first (fallback for missing trigger)
    if (!existingUser) {
      console.warn("[UserService] User not found in public.users, creating profile for:", userId);
      
      // Get user info from auth.users
      const { data: authUser, error: authError } = await this.supabaseAdmin.auth.admin.getUserById(userId);
      
      if (authError || !authUser.user) {
        console.error("[UserService] Cannot find user in auth.users:", authError);
        return ApiResponse.error(
          "User not found. Please contact support or try logging out and back in.",
          404
        );
      }
      
      // Create user profile
      const { data: newUser, error: createError } = await this.supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email: authUser.user.email,
          username: authUser.user.user_metadata?.username || authUser.user.email?.split('@')[0] || 'user',
          full_name: authUser.user.user_metadata?.full_name || null,
          avatar_url: authUser.user.user_metadata?.avatar_url || null,
          interests: updates.interests || [],
          onboarding_completed: false,
          user_type: 'user',
        })
        .select()
        .single();
      
      if (createError) {
        console.error("[UserService] Failed to create user profile:", createError);
        return ApiResponse.error(`Failed to create user profile: ${createError.message}`, 500);
      }
      
      console.log("[UserService] Created user profile successfully");
      
      // If we just created with interests, return the new user
      if (updates.interests && updates.interests.length > 0) {
        return ApiResponse.success<UserProfile>(newUser as UserProfile);
      }
    }
    
    // Update the user profile
    const { data, error } = await this.supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("[UserService] Failed to update profile:", error);
      return ApiResponse.error(`Failed to update profile: ${error.message}`, 500);
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

  /**
   * Get user basic dashboard data (username, points) in one query
   * Consolidates user data and points queries
   * @param userId - The user ID
   * @returns ServiceResult with user basic dashboard data
   */
  private async getUserBasicData(
    userId: string
  ): Promise<ServiceResult<{
    username: string;
    full_name?: string;
    points: number;
  }>> {
    try {
      // Fetch user data and points in parallel
      const [userResult, pointsResult] = await Promise.all([
        this.supabaseAdmin
          .from("users")
          .select("username, full_name, email")
          .eq("id", userId)
          .single(),
        
        this.supabaseAdmin
          .from("user_points")
          .select("points_count")
          .eq("user_id", userId)
          .single()
      ]);

      if (userResult.error || !userResult.data) {
        return ApiResponse.error("Failed to fetch user data", 500);
      }

      const userData = userResult.data;
      const displayName = userData.full_name || userData.username || userData.email?.split("@")[0] || "there";
      const points = pointsResult.data?.points_count || 0;

      return ApiResponse.success({
        username: displayName,
        full_name: userData.full_name,
        points,
      });
    } catch (error: any) {
      console.error("Error fetching user dashboard data:", error);
      return ApiResponse.error("Failed to fetch user dashboard data", 500);
    }
  }

  /**
   * Get comprehensive home page data
   * Includes user info, points, and communities (created + joined with counts)
   * @param userId - The user ID
   * @returns ServiceResult with complete home page data
   */
  public async getHomePageData(
    userId: string
  ): Promise<ServiceResult<{
    user: {
      username: string;
      full_name?: string;
      points: number;
    };
    communities: {
      created: Array<{
        id: string;
        name: string;
        description?: string;
        logo_url?: string;
        created_at?: string;
        member_count: number;
        upcomingEvents: number;
        isCreator: boolean;
        isAdmin?: boolean;
      }>;
      joined: Array<{
        id: string;
        name: string;
        description?: string;
        logo_url?: string;
        created_at?: string;
        member_count: number;
        role?: string;
        status?: string;
      }>;
    };
  }>> {
    try {
      // Import community service
      const { communityService } = await import("./community.service");

      // Fetch user data and communities in parallel
      const [userDataResult, communitiesResult] = await Promise.all([
        this.getUserBasicData(userId),
        communityService.getUserCommunities(userId)
      ]);

      if (!userDataResult.success) {
        return ApiResponse.error("Failed to fetch user data", 500);
      }

      if (!communitiesResult.success) {
        return ApiResponse.error("Failed to fetch communities", 500);
      }

      return ApiResponse.success({
        user: userDataResult.data!,
        communities: communitiesResult.data!,
      });
    } catch (error: any) {
      console.error("Error fetching home page data:", error);
      return ApiResponse.error("Failed to fetch home page data", 500);
    }
  }

  // ==================== Superadmin Methods ====================

  /**
   * Check if user is a super admin
   * @param userId - The user ID to check
   * @returns Boolean indicating if user is super admin
   */
  public async isSuperAdmin(userId: string): Promise<boolean> {
    const { data } = await this.supabaseAdmin
      .from("users")
      .select("user_type")
      .eq("id", userId)
      .single();

    return data?.user_type === "super_admin";
  }

  /**
   * Ban a user from creating communities (platform-wide ban)
   * @param userId - The user ID to ban
   * @param adminId - The superadmin performing the ban
   * @param reason - The reason for the ban
   * @param reportId - Optional report ID that led to this ban
   * @returns ServiceResult indicating success or failure
   */
  public async banUserFromCreatingCommunities(
    userId: string,
    adminId: string,
    reason: string,
    reportId?: string
  ): Promise<ServiceResult<{ message: string }>> {
    // Check if user is already banned
    const { data: existingBan } = await this.supabaseAdmin
      .from("banned_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingBan) {
      return ApiResponse.success({ message: "User is already banned from creating communities" });
    }

    // Create ban record
    const { error: banError } = await this.supabaseAdmin
      .from("banned_users")
      .insert({
        user_id: userId,
        banned_by: adminId,
        reason,
        report_id: reportId || null,
      });

    if (banError) {
      console.error("Error creating platform ban:", banError);
      return ApiResponse.error("Failed to ban user from creating communities", 500);
    }

    return ApiResponse.success({ 
      message: "User has been banned from creating communities" 
    });
  }

  /**
   * Check if a user is banned from creating communities
   * @param userId - The user ID to check
   * @returns ServiceResult with ban status
   */
  public async isUserBannedFromCreatingCommunities(
    userId: string
  ): Promise<ServiceResult<{ isBanned: boolean; ban?: { reason: string; created_at: string } }>> {
    const { data: ban, error } = await this.supabaseAdmin
      .from("banned_users")
      .select("reason, created_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking platform ban status:", error);
      return ApiResponse.error("Failed to check ban status", 500);
    }

    return ApiResponse.success({
      isBanned: !!ban,
      ban: ban || undefined,
    });
  }

  /**
   * Get admin dashboard statistics
   * @returns ServiceResult containing dashboard stats
   */
  public async getAdminDashboardStats(): Promise<ServiceResult<{
    totalUsers: number;
    totalCommunities: number;
    totalEvents: number;
    pendingReports: number;
    inactiveCommunities: number;
  }>> {
    const [users, communities, events, reports] = await Promise.all([
      this.supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      this.supabaseAdmin.from("communities").select("id", { count: "exact", head: true }),
      this.supabaseAdmin.from("events").select("id", { count: "exact", head: true }),
      this.supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    // Get inactive communities count
    const { communityService } = await import("./community.service");
    const inactive = await communityService.getInactiveCommunities();

    const stats = {
      totalUsers: users.count || 0,
      totalCommunities: communities.count || 0,
      totalEvents: events.count || 0,
      pendingReports: reports.count || 0,
      inactiveCommunities: inactive.data?.length || 0,
    };

    return ApiResponse.success(stats);
  }
}

// Export singleton instance
export const userService: UserService = UserService.getInstance();
