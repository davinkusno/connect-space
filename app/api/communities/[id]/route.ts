import type { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { validateRequest, formatResponse, formatError, applyRateLimit, requireAuth } from "@/lib/api/utils"
import { communityIdSchema, updateCommunitySchema } from "@/lib/api/types"

/**
 * @route GET /api/communities/:id
 * @description Get detailed information about a specific community
 * @access Public (with private community restrictions)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimited = await applyRateLimit(req)
    if (!rateLimited) {
      return formatError("RATE_LIMIT_EXCEEDED", "Too many requests, please try again later", null, 429)
    }

    // Validate community ID
    const { success, error } = await validateRequest(req, communityIdSchema.parse({ id: params.id }))

    if (!success) {
      return formatError(error!.code, error!.message, error!.details)
    }

    const supabase = createServerClient()

    // Get user session (optional)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // Fetch community with related data
    const { data: community, error: fetchError } = await supabase
      .from("communities")
      .select(`
        *,
        creator:creator_id(id, username, avatar_url),
        members:community_members(count),
        events:events(count),
        is_member:community_members!inner(id)
      `)
      .eq("id", params.id)
      .eq(userId ? "community_members.user_id" : "id", userId || params.id)
      .single()

    // If community not found or is private and user is not a member
    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        // Try to get just the community without member check
        const { data: privateComm, error: privateError } = await supabase
          .from("communities")
          .select(`
            *,
            creator:creator_id(id, username, avatar_url),
            members:community_members(count),
            events:events(count)
          `)
          .eq("id", params.id)
          .single()

        if (privateError) {
          return formatError("NOT_FOUND", "Community not found", null, 404)
        }

        if (privateComm.is_private) {
          return formatError(
            "FORBIDDEN",
            "This is a private community. You must be a member to view details.",
            null,
            403,
          )
        }

        return formatResponse({
          ...privateComm,
          is_member: false,
        })
      }

      console.error("Database error:", fetchError)
      return formatError("DATABASE_ERROR", "Failed to fetch community details", null, 500)
    }

    // Add additional data
    const [memberCount, eventCount] = await Promise.all([
      // Get exact member count
      supabase
        .from("community_members")
        .select("id", { count: "exact" })
        .eq("community_id", params.id)
        .then((res) => res.count || 0),

      // Get exact event count
      supabase
        .from("events")
        .select("id", { count: "exact" })
        .eq("community_id", params.id)
        .then((res) => res.count || 0),
    ])

    // Format the response
    return formatResponse({
      ...community,
      member_count: memberCount,
      event_count: eventCount,
      is_member: Boolean(community.is_member),
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return formatError("SERVER_ERROR", error.message || "An unexpected error occurred", null, 500)
  }
}

/**
 * @route PATCH /api/communities/:id
 * @description Update a community's details
 * @access Private (community admins only)
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
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
    const { success, data: updateData, error } = await validateRequest(req, updateCommunitySchema)

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
      return formatError("FORBIDDEN", "You don't have permission to update this community", null, 403)
    }

    // Update the community
    const { data: updatedCommunity, error: updateError } = await supabase
      .from("communities")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Database error:", updateError)
      return formatError("DATABASE_ERROR", "Failed to update community", null, 500)
    }

    return formatResponse(updatedCommunity)
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return formatError("SERVER_ERROR", error.message || "An unexpected error occurred", null, 500)
  }
}

/**
 * @route DELETE /api/communities/:id
 * @description Delete a community
 * @access Private (community creator only)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
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

    // Check authentication
    const supabase = createServerClient()
    let session

    try {
      session = await requireAuth()
    } catch (error) {
      return formatError("UNAUTHORIZED", "Authentication required", null, 401)
    }

    // Check if user is the creator of the community
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("creator_id")
      .eq("id", params.id)
      .single()

    if (communityError) {
      if (communityError.code === "PGRST116") {
        return formatError("NOT_FOUND", "Community not found", null, 404)
      }

      console.error("Database error:", communityError)
      return formatError("DATABASE_ERROR", "Failed to fetch community", null, 500)
    }

    if (community.creator_id !== session.user.id) {
      return formatError("FORBIDDEN", "Only the community creator can delete the community", null, 403)
    }

    // Delete the community (cascade will handle related records)
    const { error: deleteError } = await supabase.from("communities").delete().eq("id", params.id)

    if (deleteError) {
      console.error("Database error:", deleteError)
      return formatError("DATABASE_ERROR", "Failed to delete community", null, 500)
    }

    return formatResponse({ deleted: true })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return formatError("SERVER_ERROR", error.message || "An unexpected error occurred", null, 500)
  }
}
