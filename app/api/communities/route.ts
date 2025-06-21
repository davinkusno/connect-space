import type { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { validateRequest, formatResponse, formatError, applyRateLimit } from "@/lib/api/utils"
import { communityQuerySchema, createCommunitySchema } from "@/lib/api/types"

/**
 * @route GET /api/communities
 * @description Get a list of communities with filtering and pagination
 * @access Public
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimited = await applyRateLimit(req)
    if (!rateLimited) {
      return formatError("RATE_LIMIT_EXCEEDED", "Too many requests, please try again later", null, 429)
    }

    // Validate query parameters
    const { success, data: query, error } = await validateRequest(req, communityQuerySchema)

    if (!success) {
      return formatError(error!.code, error!.message, error!.details)
    }

    const { page = 1, pageSize = 10, search, category, sortBy = "created_at", sortOrder = "desc" } = query!

    const supabase = createServerClient()

    // Calculate pagination values
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build the query
    let queryBuilder = supabase
      .from("communities")
      .select(
        `
        *,
        creator:creator_id(id, username, avatar_url),
        members:community_members(count)
      `,
        { count: "exact" },
      )
      .eq("is_private", false)

    // Apply filters
    if (search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      queryBuilder = queryBuilder.eq("category", category)
    }

    // Apply sorting
    if (sortBy === "member_count") {
      // For member_count sorting, we need a different approach
      // This is a simplified version - in production, you might use a more optimized query
      const { data: communities, count, error } = await queryBuilder.range(from, to)

      if (error) {
        console.error("Database error:", error)
        return formatError("DATABASE_ERROR", "Failed to fetch communities", null, 500)
      }

      // Sort by member count manually
      const sortedCommunities = communities?.sort((a, b) => {
        const countA = a.members?.length || 0
        const countB = b.members?.length || 0
        return sortOrder === "desc" ? countB - countA : countA - countB
      })

      return formatResponse(sortedCommunities, {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      })
    } else {
      // For other fields, we can use the built-in sorting
      queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === "asc" })

      const { data: communities, count, error } = await queryBuilder.range(from, to)

      if (error) {
        console.error("Database error:", error)
        return formatError("DATABASE_ERROR", "Failed to fetch communities", null, 500)
      }

      return formatResponse(communities, {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      })
    }
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return formatError("SERVER_ERROR", error.message || "An unexpected error occurred", null, 500)
  }
}

/**
 * @route POST /api/communities
 * @description Create a new community
 * @access Private
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimited = await applyRateLimit(req)
    if (!rateLimited) {
      return formatError("RATE_LIMIT_EXCEEDED", "Too many requests, please try again later", null, 429)
    }

    const supabase = createServerClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return formatError("UNAUTHORIZED", "Authentication required", null, 401)
    }

    // Validate request body
    const { success, data: communityData, error } = await validateRequest(req, createCommunitySchema)

    if (!success) {
      return formatError(error!.code, error!.message, error!.details)
    }

    // Create the community
    const { data: community, error: createError } = await supabase
      .from("communities")
      .insert({
        ...communityData,
        creator_id: session.user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error("Database error:", createError)
      return formatError("DATABASE_ERROR", "Failed to create community", null, 500)
    }

    // Add creator as admin member
    await supabase.from("community_members").insert({
      community_id: community.id,
      user_id: session.user.id,
      role: "admin",
    })

    return formatResponse(community, undefined, 201)
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return formatError("SERVER_ERROR", error.message || "An unexpected error occurred", null, 500)
  }
}
