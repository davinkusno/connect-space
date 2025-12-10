import { BaseService, ServiceResult, ApiResponse } from "./base.service";

// ==================== Types ====================

// Authentication types
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

// Authorization types
export type UserRole = "user" | "community_admin" | "super_admin";

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
    community_admin: 2,
    super_admin: 3,
  };

  // Default redirect paths for each role
  private readonly defaultRedirectPaths: Record<UserRole, string> = {
    user: "/home",
    community_admin: "/home",
    super_admin: "/superadmin",
  };

  // Route access rules configuration
  private readonly routeAccessRules: RouteConfig[] = [
    // Public routes (no authentication required)
    { path: "/", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/auth/login", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/auth/signup", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/auth/forgot-password", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/auth/reset-password", allowedRoles: ["user", "community_admin", "super_admin"] },

    // Onboarding routes
    { path: "/onboarding", allowedRoles: ["user", "community_admin", "super_admin"] },

    // User routes (regular users and above)
    { path: "/dashboard", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/home", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/profile", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/settings", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/discover", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/events", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/events/[id]", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/events/create", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/communities", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/communities/[id]", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/communities/create", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/messages", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/leaderboard", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/recommendations", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/daily-summary", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/help-center", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/store", allowedRoles: ["user", "community_admin", "super_admin"] },

    // Community Admin routes (permission checked in middleware)
    { path: "/communities/[id]/admin", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/communities/[id]/admin/members", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/communities/[id]/admin/discussions", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/communities/[id]/admin/events", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/communities/[id]/admin/events/[eventId]", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/communities/[id]/admin/events/[eventId]/edit", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/communities/[id]/admin/notifications", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/communities/[id]/admin/requests", allowedRoles: ["user", "community_admin", "super_admin"] },

    // Super Admin routes (super admins only)
    { path: "/superadmin", allowedRoles: ["super_admin"] },
    { path: "/superadmin/badges", allowedRoles: ["super_admin"] },
    { path: "/superadmin/ads", allowedRoles: ["super_admin"] },

    // Test routes
    { path: "/test-auth", allowedRoles: ["user", "community_admin", "super_admin"] },
    { path: "/test-profile", allowedRoles: ["user", "community_admin", "super_admin"] },
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
   */
  public async updateOAuthMetadata(user: any): Promise<ServiceResult<void>> {
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
    userData: { has_community?: boolean }
  ): boolean {
    if (userRole === "community_admin") {
      return !userData?.has_community;
    }
    return false;
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
}

// Export singleton instance
export const authService = AuthService.getInstance();

// ==================== Backwards Compatibility Exports ====================

// Constants
export const ROUTE_ACCESS_RULES = authService.getRouteRules();
export const ROLE_HIERARCHY = { user: 1, community_admin: 2, super_admin: 3 };
export const DEFAULT_REDIRECT_PATHS = {
  user: "/home",
  community_admin: "/home",
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
