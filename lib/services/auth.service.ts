import { BaseService, ServiceResult, ApiResponse } from "./base.service";

// ==================== Types ====================
interface UserStatus {
  userId: string;
  userType: string | null;
  onboardingCompleted: boolean;
  roleSelected: boolean;
  isAdminOfAnyCommunity: boolean;
  hasCreatedCommunity: boolean;
}

interface OAuthMetadata {
  full_name?: string;
  avatar_url?: string;
}

type RedirectDestination = 
  | "superadmin" 
  | "home" 
  | "onboarding" 
  | "create-community" 
  | "root" 
  | "login";

interface RedirectResult {
  destination: RedirectDestination;
  error?: string;
}

// ==================== Auth Service ====================
export class AuthService extends BaseService {
  private static instance: AuthService;

  private constructor() {
    super();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Exchange OAuth code for session
   */
  public async exchangeCodeForSession(
    code: string
  ): Promise<ServiceResult<{ user: any; session: any }>> {
    const supabase = await this.getAuthClient();
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return ApiResponse.error(error.message, 401);
    }

    if (!data.session || !data.user) {
      return ApiResponse.error("No session created", 401);
    }

    return ApiResponse.success({ user: data.user, session: data.session });
  }

  /**
   * Update user metadata for OAuth providers (e.g., Google)
   */
  public async updateOAuthMetadata(
    user: any
  ): Promise<ServiceResult<void>> {
    if (!user || user.app_metadata?.provider !== "google") {
      return ApiResponse.success(undefined);
    }

    const supabase = await this.getAuthClient();
    
    const metadata: OAuthMetadata = {
      full_name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    };

    const { error } = await supabase.auth.updateUser({ data: metadata });

    if (error) {
      // Non-critical error, just log it
      return ApiResponse.error(error.message, 500);
    }

    return ApiResponse.success(undefined);
  }

  /**
   * Get user status for redirect determination
   */
  public async getUserStatus(userId: string): Promise<ServiceResult<UserStatus>> {
    const supabase = await this.getAuthClient();

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_type, onboarding_completed, role_selected")
      .eq("id", userId)
      .single();

    if (userError) {
      return ApiResponse.error("Failed to fetch user data", 500);
    }

    // Check if user is admin of any community
    const { data: adminCommunities } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);

    const isAdminOfAnyCommunity = (adminCommunities?.length ?? 0) > 0;

    // Check if user has created any community
    const { data: createdCommunities } = await supabase
      .from("communities")
      .select("id")
      .eq("creator_id", userId)
      .limit(1);

    const hasCreatedCommunity = (createdCommunities?.length ?? 0) > 0;

    return ApiResponse.success({
      userId,
      userType: userData?.user_type || null,
      onboardingCompleted: userData?.onboarding_completed || false,
      roleSelected: userData?.role_selected || false,
      isAdminOfAnyCommunity,
      hasCreatedCommunity,
    });
  }

  /**
   * Determine redirect destination based on user status
   */
  public determineRedirect(status: UserStatus): RedirectResult {
    // Super admin always goes to superadmin
    if (status.userType === "super_admin") {
      return { destination: "superadmin" };
    }

    // Community admins
    if (status.isAdminOfAnyCommunity) {
      // If admin but hasn't created a community and hasn't completed onboarding
      if (!status.hasCreatedCommunity && !status.onboardingCompleted) {
        return { destination: "create-community" };
      }
      return { destination: "home" };
    }

    // Regular users: check onboarding
    if (!status.onboardingCompleted) {
      return { destination: "onboarding" };
    }

    // Default to root
    return { destination: "root" };
  }

  /**
   * Get full redirect URL
   */
  public getRedirectUrl(origin: string, destination: RedirectDestination, error?: string): string {
    const paths: Record<RedirectDestination, string> = {
      superadmin: "/superadmin",
      home: "/home",
      onboarding: "/onboarding",
      "create-community": "/communities/create",
      root: "/",
      login: "/auth/login",
    };

    const path = paths[destination];
    
    if (error) {
      return `${origin}${path}?error=${encodeURIComponent(error)}`;
    }
    
    return `${origin}${path}`;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

