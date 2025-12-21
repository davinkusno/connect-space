import { getRedirectPath, hasAccess, type UserRole } from "@/lib/services/auth.service"
import { isCreatorOrAdminOfCommunity } from "@/lib/supabase/community-roles"
import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentPath = request.nextUrl.pathname

  // Define public routes (accessible without authentication)
  const publicRoutes = [
    "/_next",
    "/api",
    "/auth",
    "/",
    "/test",
    "/events", // Public: browse events
    "/communities", // Public: browse communities (but not create/admin)
  ]

  // Check if current path is public (but exclude protected sub-routes)
  const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route))
  
  // Protect specific sub-routes even if parent is public
  const isProtectedSubRoute = 
    currentPath.startsWith("/communities/create") || // Must be logged in to create
    currentPath.includes("/admin") // Must be logged in for admin routes

  // Skip auth check for public routes (unless it's a protected sub-route)
  if (isPublicRoute && !isProtectedSubRoute) {
    return supabaseResponse
  }

  // If no user and trying to access protected route, redirect to login
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

    // Special handling for communities admin routes
    // Check if user is creator or admin of the specific community
    if (currentPath.includes("/admin")) {
      const pathMatch = currentPath.match(/^\/communities\/([^/]+)\/admin/)
      if (pathMatch && pathMatch[1]) {
        const communityId = pathMatch[1]
        // Use service client for middleware to bypass RLS
        const hasPermission = await isCreatorOrAdminOfCommunity(user.id, communityId, true)
        
        // Super admins always have access
        if (userRole === "super_admin" || hasPermission) {
          // Allow access - continue to next check
        } else {
          console.log(`Access denied for user ${user.email} (${userRole}) to ${currentPath} - not creator or admin of community ${communityId}`)
          const redirectPath = getRedirectPath(userRole, currentPath)
          const url = request.nextUrl.clone()
          url.pathname = redirectPath
          return NextResponse.redirect(url)
        }
      }
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
