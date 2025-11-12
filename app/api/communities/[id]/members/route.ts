import type { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { validateRequest, formatResponse, formatError, applyRateLimit, requireAuth } from "@/lib/api/utils"
import { communityIdSchema, communityQuerySchema } from "@/lib/api/types"
import { z } from "zod"

// Member query schema
const memberQuerySchema = communityQuerySchema.extend({
  role: z.enum(["admin", "moderator", "member"]).optional(),
})

/**
 * @route GET /api/communities/:id/members
 * @description Get members of a specific community with pagination and filtering
 * @access Public (for public communities) or Private (for private communities)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimited = await applyRateLimit(req)
    if (!rateLimited) {
      return formatError("RATE_LIMIT_EXCEEDED", "Too many requests, please try again later", null, 429)
    }

    // Validate community ID
    const validId = communityIdSchema.safeParse({ id: params.id })
    if (!validId.success) {
      return formatError("VALIDATION_ERROR", "Invalid community ID", validId.error.format(), 400)
    }

    // Validate query parameters
    const { success, data: query, error } = await validateRequest(req, memberQuerySchema)

    if (!success) {
      return formatError(error!.code, error!.message, error!.details)
    }

    const { page = 1, pageSize = 10, search, role, sortBy = "joined_at", sortOrder = "desc" } = query!

    const supabase = createServerClient()

    // Check if community exists and if it's private
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("is_private")
      .eq("id", params.id)
      .single()

    if (communityError) {
      if (communityError.code === "PGRST116") {
        return formatError("NOT_FOUND", "Community not found", null, 404)
      }

      console.error("Database error:", communityError)
      return formatError("DATABASE_ERROR", "Failed to fetch community", null, 500)
    }

    // If community is private, check if user is a member
    if (community.is_private) {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return formatError("FORBIDDEN", "This is a private community. You must be a member to view details.", null, 403)
      }

      const { data: membership, error: membershipError } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", params.id)
        .eq("user_id", session.user.id)
        .single()

      if (membershipError || !membership) {
        return formatError("FORBIDDEN", "This is a private community. You must be a member to view details.", null, 403)
      }
    }

    // Calculate pagination values
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build the query
    let queryBuilder = supabase
      .from("community_members")
      .select(
        `
        *,
        user:user_id(id, username, full_name, avatar_url)
      `,
        { count: "exact" },
      )
      .eq("community_id", params.id)

    // Apply role filter if provided
    if (role) {
      queryBuilder = queryBuilder.eq("role", role)
    }

    // Apply search filter if provided
    if (search) {
      queryBuilder = queryBuilder.or(`user.username.ilike.%${search}%,user.full_name.ilike.%${search}%`)
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === "asc" })

    // Execute the query with pagination
    const { data: members, count, error: membersError } = await queryBuilder.range(from, to)

    if (membersError) {
      console.error("Database error:", membersError)
      return formatError("DATABASE_ERROR", "Failed to fetch community members", null, 500)
    }

    return formatResponse(members, {
      page,
      pageSize,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return formatError("SERVER_ERROR", error.message || "An unexpected error occurred", null, 500)
  }
}

// Schema for adding a member
const addMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "moderator", "member"]).default("member"),
})

/**
 * @route POST /api/communities/:id/members
 * @description Add a member to the community
 * @access Private (admin only)
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimited = await applyRateLimit(req)
    if (!rateLimited) {
      return formatError("RATE_LIMIT_EXCEEDED", "Too many requests, please try again later", null, 429)
    }

    // Validate community ID
    const validId = communityIdSchema.safeParse({ id: params.id })
    if (!validId.success) {
      return formatError("VALIDATION_ERROR", "Invalid community ID", validId.error.format(), 400)
    }

    // Validate request body
    const { success, data: memberData, error } = await validateRequest(req, addMemberSchema)

    if (!success) {
      return formatError(error!.code, error!.message, error!.details)
    }

    // Check authentication
    const supabase = createServerClient()
    let session

    try {
      session = await requireAuth()
    } catch (error) {
      return formatError("UNAUTHORIZED", "Authentication required", null, 401)
    }

    // Check if user is admin of the community
    const { data: membership, error: membershipError } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (membershipError || !membership || membership.role !== "admin") {
      return formatError("FORBIDDEN", "You don't have permission to add members to this community", null, 403)
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", memberData!.user_id)
      .single()

    if (userError || !user) {
      return formatError("NOT_FOUND", "User not found", null, 404)
    }

    // Check if user is already a member
    const { data: existingMember, error: existingError } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", params.id)
      .eq("user_id", memberData!.user_id)
      .maybeSingle()

    if (existingMember) {
      return formatError("CONFLICT", "User is already a member of this community", null, 409)
    }

    // Add the member
    const { data: newMember, error: addError } = await supabase
      .from("community_members")
      .insert({
        community_id: params.id,
        user_id: memberData!.user_id,
        role: memberData!.role,
      })
      .select(`
        *,
        user:user_id(id, username, full_name, avatar_url)
      `)
      .single()

    if (addError) {
      console.error("Database error:", addError)
      return formatError("DATABASE_ERROR", "Failed to add member to community", null, 500)
    }

    // Create a notification for the user
    await supabase.from("notifications").insert({
      user_id: memberData!.user_id,
      type: "community_invite",
      content: `You have been added to a community`,
      reference_id: params.id,
      reference_type: "community",
    })

    return formatResponse(newMember, undefined, 201)
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return formatError("SERVER_ERROR", error.message || "An unexpected error occurred", null, 500)
  }
}
