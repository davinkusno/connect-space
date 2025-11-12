// Role-Based Access Control (RBAC) configuration

export type UserRole = "user" | "community_admin" | "super_admin";

export interface RouteConfig {
  path: string;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

// Define route access rules
export const ROUTE_ACCESS_RULES: RouteConfig[] = [
  // Public routes (no authentication required)
  { path: "/", allowedRoles: ["user", "community_admin", "super_admin"] },
  {
    path: "/auth/login",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/auth/signup",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/auth/forgot-password",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/auth/reset-password",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },

  // Onboarding routes (all authenticated users)
  {
    path: "/onboarding",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/onboarding/role",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },

  // User routes (regular users and above)
  {
    path: "/dashboard",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/profile",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/settings",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/discover",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  { path: "/events", allowedRoles: ["user", "community_admin", "super_admin"] },
  {
    path: "/events/[id]",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/community/[id]",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/messages",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/leaderboard",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/recommendations",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/daily-summary",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/help-center",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/wishlist",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  { path: "/store", allowedRoles: ["user", "community_admin", "super_admin"] },

  // Community Admin routes (community admins and super admins)
  {
    path: "/community-admin-registration",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/community-admin",
    allowedRoles: ["community_admin", "super_admin"],
  },
  {
    path: "/community-admin/edit",
    allowedRoles: ["community_admin", "super_admin"],
  },
  {
    path: "/community-admin/members",
    allowedRoles: ["community_admin", "super_admin"],
  },
  {
    path: "/community-admin/discussions",
    allowedRoles: ["community_admin", "super_admin"],
  },
  {
    path: "/community-admin/events",
    allowedRoles: ["community_admin", "super_admin"],
  },
  {
    path: "/community-admin/events/[id]",
    allowedRoles: ["community_admin", "super_admin"],
  },
  {
    path: "/community-admin/events/[id]/edit",
    allowedRoles: ["community_admin", "super_admin"],
  },
  {
    path: "/community-admin/notifications",
    allowedRoles: ["community_admin", "super_admin"],
  },
  {
    path: "/community-admin/requests",
    allowedRoles: ["community_admin", "super_admin"],
  },
  {
    path: "/community-admin/create",
    allowedRoles: ["community_admin", "super_admin"],
  },
  {
    path: "/create-community",
    allowedRoles: ["community_admin", "super_admin"],
  },
  { path: "/events/create", allowedRoles: ["community_admin", "super_admin"] },

  // Super Admin routes (super admins only)
  { path: "/superadmin", allowedRoles: ["super_admin"] },
  { path: "/superadmin/badges", allowedRoles: ["super_admin"] },

  // Test routes (all authenticated users)
  {
    path: "/test-auth",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
  {
    path: "/test-profile",
    allowedRoles: ["user", "community_admin", "super_admin"],
  },
];

// Role hierarchy (higher roles inherit permissions from lower roles)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  community_admin: 2,
  super_admin: 3,
};

// Default redirect paths for each role after login
export const DEFAULT_REDIRECT_PATHS: Record<UserRole, string> = {
  user: "/dashboard",
  community_admin: "/community-admin",
  super_admin: "/superadmin",
};

// Check if a user role has access to a specific path
export function hasAccess(userRole: UserRole, path: string): boolean {
  // Find matching route rule
  const rule = ROUTE_ACCESS_RULES.find((rule) => {
    if (rule.path === path) return true;

    // Handle dynamic routes (e.g., /events/[id])
    if (rule.path.includes("[") && rule.path.includes("]")) {
      const pattern = rule.path.replace(/\[.*?\]/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    }

    return false;
  });

  if (!rule) {
    // If no specific rule found, deny access by default
    return false;
  }

  return rule.allowedRoles.includes(userRole);
}

// Get the appropriate redirect path for a user role
export function getRedirectPath(
  userRole: UserRole,
  currentPath?: string
): string {
  // If user is trying to access a restricted path, redirect to their default
  if (currentPath && !hasAccess(userRole, currentPath)) {
    return DEFAULT_REDIRECT_PATHS[userRole];
  }

  return DEFAULT_REDIRECT_PATHS[userRole];
}

// Check if user needs to complete onboarding
export function needsOnboarding(userRole: UserRole, userData: any): boolean {
  if (userRole === "community_admin") {
    // Community admins need to complete registration if they don't have a community
    return !userData?.has_community;
  }

  return false;
}
