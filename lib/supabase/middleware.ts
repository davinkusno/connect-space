import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { hasAccess, getRedirectPath, type UserRole } from "@/lib/auth/rbac"
import { createServiceClient } from "@/lib/supabase/service"

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentPath = request.nextUrl.pathname

  // Skip RBAC for static files, API routes, and auth pages
  if (
    currentPath.startsWith("/_next") ||
    currentPath.startsWith("/api") ||
    currentPath.startsWith("/auth") ||
    currentPath === "/" ||
    currentPath.startsWith("/test")
  ) {
    return supabaseResponse
  }

  // If no user, redirect to login for protected routes
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirectTo", currentPath)
    return NextResponse.redirect(url)
  }

  // Get user role from database with bypass for RLS
  try {
    // Use service client to bypass RLS and avoid recursion
    const serviceClient = createServiceClient()
    const { data: userData, error } = await serviceClient
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    // Default to "user" role if no user data or user_type is null/undefined
    let userRole: UserRole = "user"
    
    if (userData && userData.user_type) {
      userRole = userData.user_type as UserRole
    } else {
      // If user_type is null/undefined, default to "user" (all authenticated users)
      userRole = "user"
    }

    // Only restrict superadmin routes - everything else is allowed for authenticated users
    // Check if user has access to the current path
    if (!hasAccess(userRole, currentPath)) {
      console.log(`Access denied for user ${user.email} (${userRole}) to ${currentPath}`)
      
      // Redirect to appropriate page based on role
      const redirectPath = getRedirectPath(userRole, currentPath)
      const url = request.nextUrl.clone()
      url.pathname = redirectPath
      return NextResponse.redirect(url)
    }

    // Add user role to headers for use in components
    supabaseResponse.headers.set("x-user-role", userRole)

  } catch (error) {
    console.error("Error in RBAC middleware:", error)
    // On error, default to user role and allow access (only superadmin is restricted)
    const userRole = "user" as UserRole
    
    // Only restrict superadmin routes
    if (!hasAccess(userRole, currentPath)) {
      const redirectPath = getRedirectPath(userRole, currentPath)
      const url = request.nextUrl.clone()
      url.pathname = redirectPath
      return NextResponse.redirect(url)
    }
    
    supabaseResponse.headers.set("x-user-role", userRole)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}
