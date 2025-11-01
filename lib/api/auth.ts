import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

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

    // Get user role from users table
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

    return {
      authorized: true,
      userId: user.id,
      userRole: userData.user_type,
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
 * Check if user is authenticated (any role)
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  return checkAuth(request);
}
