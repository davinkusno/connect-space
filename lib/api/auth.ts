import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { isCommunityAdmin } from "@/lib/supabase/community-roles";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthResult {
  authorized: boolean;
  userId?: string;
  userRole?: string;
  error?: string;
}

/**
 * Check if the request has valid authentication
 * Returns effective role: checks if user is community admin via community_members table
 */
export async function checkAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        authorized: false,
        error: "No authorization token provided",
      };
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        authorized: false,
        error: "Invalid or expired token",
      };
    }

    // Get user data from users table (for super_admin check)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return {
        authorized: false,
        error: "User not found",
      };
    }

    // Determine effective role:
    // - super_admin comes from user_type
    // - community_admin is determined by checking community_members table
    let effectiveRole = userData.user_type || "user";
    
    // If user_type is not community_admin, check if they're admin of any community
    if (effectiveRole !== "super_admin") {
      const isAdmin = await isCommunityAdmin(user.id);
      if (isAdmin) {
        effectiveRole = "community_admin";
      } else if (effectiveRole === "community_admin") {
        // If user_type says community_admin but they're not admin of any community,
        // treat them as regular user
        effectiveRole = "user";
      }
    }

    return {
      authorized: true,
      userId: user.id,
      userRole: effectiveRole,
    };
  } catch (error) {
    return {
      authorized: false,
      error: "Authentication failed",
    };
  }
}

/**
 * Check if user has super_admin role
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<AuthResult> {
  const authResult = await checkAuth(request);

  if (!authResult.authorized) {
    return authResult;
  }

  if (authResult.userRole !== "super_admin") {
    return {
      authorized: false,
      userId: authResult.userId,
      userRole: authResult.userRole,
      error: "Super admin access required",
    };
  }

  return authResult;
}

/**
 * Check if user has community_admin or super_admin role
 * For community_admin, checks if user is admin of any community
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await checkAuth(request);

  if (!authResult.authorized) {
    return authResult;
  }

  const allowedRoles = ["community_admin", "super_admin"];

  if (!authResult.userRole || !allowedRoles.includes(authResult.userRole)) {
    return {
      authorized: false,
      userId: authResult.userId,
      userRole: authResult.userRole,
      error: "Admin access required",
    };
  }

  return authResult;
}

/**
 * Check if user is admin of a specific community
 */
export async function requireCommunityAdmin(
  request: NextRequest,
  communityId: string
): Promise<AuthResult> {
  const authResult = await checkAuth(request);

  if (!authResult.authorized || !authResult.userId) {
    return authResult;
  }

  // Super admins have access to all communities
  if (authResult.userRole === "super_admin") {
    return authResult;
  }

  // Check if user is creator or admin of the community
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("creator_id")
    .eq("id", communityId)
    .single();

  if (communityError || !community) {
    return {
      authorized: false,
      userId: authResult.userId,
      error: "Community not found",
    };
  }

  // Check if user is creator
  if (community.creator_id === authResult.userId) {
    return authResult;
  }

  // Check if user is admin member
  const { data: membership, error: membershipError } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", authResult.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      authorized: false,
      userId: authResult.userId,
      error: "Admin access required for this community",
    };
  }

  return authResult;
}

/**
 * Check if user is authenticated (any role)
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  return checkAuth(request);
}
