import { BaseService, ServiceResult, ApiResponse } from "./base.service";

// ==================== Types ====================

// Authentication types
interface UserStatus {
  userId: string;
  userType: string | null;
  onboardingCompleted: boolean;
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

// Authorization types
export type UserRole = "user" | "super_admin";

export interface RouteConfig {
  path: string;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export interface AccessCheckResult {
  hasAccess: boolean;
  redirectTo?: string;
  matchedRule?: RouteConfig;
}

export interface CommunityAccessResult {
  isCreator: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

// ==================== Auth Service (Combined Authentication + Authorization) ====================
export class AuthService extends BaseService {
  private static instance: AuthService;

  // ==================== Authorization Configuration ====================

  // Role hierarchy (higher roles inherit permissions from lower roles)
  private readonly roleHierarchy: Record<UserRole, number> = {
    user: 1,
    super_admin: 2,
  };

  // Default redirect paths for each role
  private readonly defaultRedirectPaths: Record<UserRole, string> = {
    user: "/home",
    super_admin: "/superadmin",
  };

  // Route access rules configuration
  // Note: Community admin pages are protected by creator check in middleware, not role
  private readonly routeAccessRules: RouteConfig[] = [
    // Public routes (no authentication required)
    { path: "/", allowedRoles: ["user", "super_admin"] },
    { path: "/auth/login", allowedRoles: ["user", "super_admin"] },
    { path: "/auth/signup", allowedRoles: ["user", "super_admin"] },
    { path: "/auth/forgot-password", allowedRoles: ["user", "super_admin"] },
    { path: "/auth/reset-password", allowedRoles: ["user", "super_admin"] },

    // Onboarding routes
    { path: "/onboarding", allowedRoles: ["user", "super_admin"] },

    // User routes (all authenticated users)
    { path: "/dashboard", allowedRoles: ["user", "super_admin"] },
    { path: "/home", allowedRoles: ["user", "super_admin"] },
    { path: "/profile", allowedRoles: ["user", "super_admin"] },
    { path: "/settings", allowedRoles: ["user", "super_admin"] },
    { path: "/discover", allowedRoles: ["user", "super_admin"] },
    { path: "/events", allowedRoles: ["user", "super_admin"] },
    { path: "/events/[id]", allowedRoles: ["user", "super_admin"] },
    { path: "/events/create", allowedRoles: ["user", "super_admin"] },
    { path: "/communities", allowedRoles: ["user", "super_admin"] },
    { path: "/communities/[id]", allowedRoles: ["user", "super_admin"] },
    { path: "/communities/create", allowedRoles: ["user", "super_admin"] },
    { path: "/messages", allowedRoles: ["user", "super_admin"] },
    { path: "/leaderboard", allowedRoles: ["user", "super_admin"] },
    { path: "/recommendations", allowedRoles: ["user", "super_admin"] },
    { path: "/daily-summary", allowedRoles: ["user", "super_admin"] },
    { path: "/help-center", allowedRoles: ["user", "super_admin"] },
    { path: "/store", allowedRoles: ["user", "super_admin"] },

    // Community Admin routes (creator check handled in page/middleware)
    { path: "/communities/[id]/admin", allowedRoles: ["user", "super_admin"] },
    { path: "/communities/[id]/admin/members", allowedRoles: ["user", "super_admin"] },
    { path: "/communities/[id]/admin/discussions", allowedRoles: ["user", "super_admin"] },
    { path: "/communities/[id]/admin/events", allowedRoles: ["user", "super_admin"] },
    { path: "/communities/[id]/admin/events/[eventId]", allowedRoles: ["user", "super_admin"] },
    { path: "/communities/[id]/admin/events/[eventId]/edit", allowedRoles: ["user", "super_admin"] },
    { path: "/communities/[id]/admin/notifications", allowedRoles: ["user", "super_admin"] },
    { path: "/communities/[id]/admin/requests", allowedRoles: ["user", "super_admin"] },

    // Super Admin routes (super admins only)
    { path: "/superadmin", allowedRoles: ["super_admin"] },
    { path: "/superadmin/badges", allowedRoles: ["super_admin"] },
    { path: "/superadmin/ads", allowedRoles: ["super_admin"] },

    // Test routes
    { path: "/test-auth", allowedRoles: ["user", "super_admin"] },
    { path: "/test-profile", allowedRoles: ["user", "super_admin"] },
  ];

  private constructor() {
    super();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // ==================== Authentication Methods ====================

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
   * Preserves custom avatar_url from users table if it exists
   */
  public async updateOAuthMetadata(user: any): Promise<ServiceResult<void>> {
    if (!user || user.app_metadata?.provider !== "google") {
      return ApiResponse.success(undefined);
    }

    const supabase = await this.getAuthClient();

    // Check if user has a custom avatar in the users table
    const { data: userProfile } = await this.supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    // Only use Google's avatar if there's no custom avatar in the users table
    // This prevents Google OAuth from overwriting custom profile pictures
    const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    const finalAvatarUrl = userProfile?.avatar_url || googleAvatarUrl;

    const metadata: OAuthMetadata = {
      full_name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: finalAvatarUrl,
    };

    const { error } = await supabase.auth.updateUser({ data: metadata });

    if (error) {
      return ApiResponse.error(error.message, 500);
    }

    // If user has a custom avatar, also ensure it's saved in the users table
    if (userProfile?.avatar_url && userProfile.avatar_url !== googleAvatarUrl) {
      // Custom avatar exists, make sure it's preserved in users table
      // (It should already be there, but we ensure it's not overwritten)
      await this.supabaseAdmin
        .from("users")
        .update({ avatar_url: userProfile.avatar_url })
        .eq("id", user.id);
    } else if (googleAvatarUrl && !userProfile?.avatar_url) {
      // No custom avatar exists, save Google's avatar to users table for first-time login
      await this.supabaseAdmin
        .from("users")
        .update({ avatar_url: googleAvatarUrl })
        .eq("id", user.id);
    }

    return ApiResponse.success(undefined);
  }

  /**
   * Check if user has active session (for login page redirect)
   */
  public async checkSessionAndGetRedirect(): Promise<ServiceResult<{ isAuthenticated: boolean; redirectUrl?: string }>> {
    const supabase = await this.getAuthClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return ApiResponse.success({ isAuthenticated: false });
    }

    // User is authenticated, get their status
    const statusResult = await this.getUserStatus(session.user.id);
    
    if (!statusResult.success || !statusResult.data) {
      return ApiResponse.success({ isAuthenticated: true, redirectUrl: "/" });
    }

    // Determine redirect
    const redirect = this.determineRedirect(statusResult.data);
    const paths: Record<RedirectDestination, string> = {
      superadmin: "/superadmin",
      home: "/home",
      onboarding: "/onboarding",
      "create-community": "/communities/create",
      root: "/",
      login: "/auth/login",
    };

    return ApiResponse.success({ 
      isAuthenticated: true, 
      redirectUrl: paths[redirect.destination] 
    });
  }

  /**
   * Get user status for redirect determination
   */
  public async getUserStatus(userId: string): Promise<ServiceResult<UserStatus>> {
    const supabase = await this.getAuthClient();

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_type, onboarding_completed")
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
   * Get full redirect URL for authentication callbacks
   */
  public getRedirectUrl(
    origin: string,
    destination: RedirectDestination,
    error?: string
  ): string {
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

  // ==================== Authorization Methods ====================

  /**
   * Check if a user role has access to a specific path
   */
  public checkAccess(userRole: UserRole, path: string): AccessCheckResult {
    // Super admin routes are always restricted
    if (path.startsWith("/superadmin")) {
      const hasAccess = userRole === "super_admin";
      return {
        hasAccess,
        redirectTo: hasAccess ? undefined : this.defaultRedirectPaths[userRole],
      };
    }

    // Find matching route rule
    const rule = this.findMatchingRule(path);

    if (!rule) {
      // If no specific rule found, allow access by default
      return { hasAccess: true };
    }

    const hasAccess = rule.allowedRoles.includes(userRole);
    return {
      hasAccess,
      matchedRule: rule,
      redirectTo: hasAccess
        ? undefined
        : rule.redirectTo || this.defaultRedirectPaths[userRole],
    };
  }

  /**
   * Find a matching route rule for a given path
   */
  private findMatchingRule(path: string): RouteConfig | null {
    return (
      this.routeAccessRules.find((rule) => {
        if (rule.path === path) return true;

        // Handle dynamic routes (e.g., /events/[id])
        if (rule.path.includes("[") && rule.path.includes("]")) {
          const pattern = rule.path.replace(/\[.*?\]/g, "[^/]+");
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(path);
        }

        return false;
      }) || null
    );
  }

  /**
   * Get the appropriate redirect path for a user role
   */
  public getRoleRedirectPath(userRole: UserRole, currentPath?: string): string {
    if (currentPath) {
      const accessResult = this.checkAccess(userRole, currentPath);
      if (!accessResult.hasAccess && accessResult.redirectTo) {
        return accessResult.redirectTo;
      }
    }
    return this.defaultRedirectPaths[userRole];
  }

  /**
   * Get role hierarchy level
   */
  public getRoleLevel(role: UserRole): number {
    return this.roleHierarchy[role];
  }

  /**
   * Check if one role is higher than another
   */
  public isRoleHigherOrEqual(role: UserRole, comparedTo: UserRole): boolean {
    return this.roleHierarchy[role] >= this.roleHierarchy[comparedTo];
  }

  /**
   * Check if user needs to complete onboarding
   */
  public needsOnboarding(
    userRole: UserRole,
    userData: { onboarding_completed?: boolean }
  ): boolean {
    return !userData?.onboarding_completed;
  }

  /**
   * Get all route rules (for debugging/admin purposes)
   */
  public getRouteRules(): RouteConfig[] {
    return [...this.routeAccessRules];
  }

  /**
   * Check community-specific authorization
   */
  public async checkCommunityAccess(
    userId: string,
    communityId: string
  ): Promise<ServiceResult<CommunityAccessResult>> {
    const supabase = this.supabaseAdmin;

    // Check if user is creator
    const { data: community } = await supabase
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single();

    const isCreator = community?.creator_id === userId;

    // Check membership and role
    const { data: membership } = await supabase
      .from("community_members")
      .select("role, status")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .single();

    const isAdmin =
      membership?.role === "admin" && membership?.status === "approved";
    const isMember = membership?.status === "approved";

    return ApiResponse.success({ isCreator, isAdmin, isMember });
  }

  /**
   * Resend verification email for unverified user
   * @param email - The user's email address
   * @returns ServiceResult indicating success or failure
   */
  public async resendVerificationEmail(
    email: string
  ): Promise<ServiceResult<{ message: string; requestId?: string }>> {
    try {
      if (!email || typeof email !== "string") {
        return ApiResponse.badRequest("Email is required");
      }

      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return ApiResponse.error("Server configuration error", 500);
      }

      // Use Admin API to get user by email
      let user: any = null;
      let getUserError: any = null;
      
      try {
        // List all users and find by email
        const { data: { users }, error: listError } = await this.supabaseAdmin.auth.admin.listUsers();
        
        if (!listError && users) {
          user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
          if (!user) {
            getUserError = { message: "User not found" };
          }
        } else {
          getUserError = listError;
        }
      } catch (err: any) {
        getUserError = err;
      }

      if (getUserError || !user) {
        return ApiResponse.notFound("User not found");
      }

      // Check if user is already confirmed
      if (user.email_confirmed_at) {
        return ApiResponse.badRequest("Email is already verified");
      }

      const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/auth/callback`;
      
      // Try multiple methods to resend verification email
      // Method 1: Use inviteUserByEmail (works best with SMTP configured)
      let lastError: any = null;
      
      try {
        const { data: inviteData, error: inviteError } = await this.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: redirectUrl,
          data: user.user_metadata || {},
        });

        if (!inviteError && inviteData) {
          return ApiResponse.success({ 
            message: "Verification email sent successfully"
          });
        }
        
        // Check if error is because user already exists (this is OK for unverified users)
        if (inviteError && !inviteError.message?.includes("already") && !inviteError.message?.includes("exists")) {
          lastError = inviteError;
        } else if (inviteError) {
          lastError = inviteError;
        }
      } catch (inviteErr: any) {
        lastError = inviteErr;
      }

      // Method 2: Generate magic link (fallback)
      try {
        const { data: linkData, error: linkError } = await this.supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: email,
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (!linkError && linkData) {
          return ApiResponse.success({ 
            message: "Verification email sent successfully"
          });
        }
        
        lastError = linkError || lastError;
      } catch (linkErr: any) {
        lastError = linkErr;
      }

      // If both methods failed, return detailed error
      const errorMessage = lastError?.message || "Unknown error";
      const isEmailConfigError = errorMessage.includes("confirmation email") || 
                                  errorMessage.includes("SMTP") ||
                                  errorMessage.includes("email") ||
                                  errorMessage.includes("sending") ||
                                  errorMessage.includes("Error sending");

      if (isEmailConfigError) {
        return ApiResponse.error(
          `SMTP/Email configuration issue: ${errorMessage}. Please verify your SMTP settings in Supabase dashboard.`,
          500,
          { code: "EMAIL_CONFIG_ERROR", originalError: errorMessage }
        );
      }

      return ApiResponse.error(
        `Failed to resend verification email: ${errorMessage}`,
        500
      );
    } catch (error: any) {
      return ApiResponse.error(
        error.message || "Failed to resend verification email. Please check your Supabase email configuration in the dashboard.",
        500
      );
    }
  }

  /**
   * Check if an email exists in the users table
   * @param email - The email to check
   * @returns ServiceResult with exists boolean
   */
  public async checkEmailExists(email: string): Promise<ServiceResult<{ exists: boolean }>> {
    try {
      if (!email || typeof email !== "string") {
        return ApiResponse.error("Email is required", 400);
      }

      const { data, error } = await this.supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        console.error("[AuthService] Error checking email:", error);
        return ApiResponse.error("Failed to check email", 500);
      }

      return ApiResponse.success({ exists: !!data });
    } catch (error: any) {
      console.error("[AuthService] Error checking email:", error);
      return ApiResponse.error(
        error.message || "Failed to check email",
        500
      );
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// ==================== Backwards Compatibility Exports ====================

// Constants
export const ROUTE_ACCESS_RULES = authService.getRouteRules();
export const ROLE_HIERARCHY = { user: 1, super_admin: 2 };
export const DEFAULT_REDIRECT_PATHS = {
  user: "/home",
  super_admin: "/superadmin",
};

// Legacy functions
export function hasAccess(userRole: UserRole, path: string): boolean {
  return authService.checkAccess(userRole, path).hasAccess;
}

export function getRedirectPath(
  userRole: UserRole,
  currentPath?: string
): string {
  return authService.getRoleRedirectPath(userRole, currentPath);
}

export function needsOnboarding(userRole: UserRole, userData: any): boolean {
  return authService.needsOnboarding(userRole, userData);
}
