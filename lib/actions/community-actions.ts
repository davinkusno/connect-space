"use server"

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/supabase/auth-helpers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { InsertTables, Tables } from "@/lib/supabase/types"

// Create a new community
export async function createCommunity(
  communityData: Omit<InsertTables<"communities">, "creator_id">,
): Promise<Tables<"communities">> {
  const session = await requireAuth()
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("communities")
      .insert({
        ...communityData,
        creator_id: session.user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Add creator as admin member
    await supabase.from("community_members").insert({
      community_id: data.id,
      user_id: session.user.id,
      role: "admin",
    })

    revalidatePath("/communities")
    return data
  } catch (error: any) {
    console.error("Error creating community:", error)
    throw new Error("Failed to create community. Please try again.")
  }
}

// Get a community by ID
export async function getCommunity(id: string): Promise<Tables<"communities"> | null> {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("communities")
      .select(`
        *,
        creator:creator_id(id, username, avatar_url),
        members:community_members(count)
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // Community not found
      }
      throw new Error(error.message)
    }

    return data
  } catch (error: any) {
    console.error("Error getting community:", error)
    throw new Error("Failed to fetch community details.")
  }
}

// List communities with optional filters
export async function listCommunities({
  page = 1,
  pageSize = 10,
  category = null,
  search = null,
  onlyJoined = false,
}: {
  page?: number
  pageSize?: number
  category?: string | null
  search?: string | null
  onlyJoined?: boolean
} = {}) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  try {
    let query = supabase.from("communities").select(
      `
        *,
        creator:creator_id(id, username, avatar_url),
        members:community_members(count)
      `,
      { count: "exact" },
    )

    // Filter by category if provided
    if (category) {
      query = query.eq("category", category)
    }

    // Filter by search term if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Filter by communities the user has joined
    if (onlyJoined && session?.user.id) {
      query = query.in("id", (subquery) => {
        return subquery.from("community_members").select("community_id").eq("user_id", session.user.id)
      })
    }

    // Filter out private communities unless the user is a member
    if (session?.user.id) {
      query = query.or(
        `is_private.eq.false,id.in.(${supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", session.user.id)
          .toString()})`,
      )
    } else {
      query = query.eq("is_private", false)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order("created_at", { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return {
      communities: data,
      count: count || 0,
      page,
      pageSize,
      totalPages: count ? Math.ceil(count / pageSize) : 0,
    }
  } catch (error: any) {
    console.error("Error listing communities:", error)
    throw new Error("Failed to fetch communities.")
  }
}

// Join a community
export async function joinCommunity(communityId: string) {
  const session = await requireAuth()
  const supabase = createServerClient()

  try {
    // Check if the community exists and if it's private
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("is_private")
      .eq("id", communityId)
      .single()

    if (communityError) {
      throw new Error("Community not found")
    }

    // Check if already a member
    const { data: existingMembership, error: membershipError } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", communityId)
      .eq("user_id", session.user.id)
      .maybeSingle()

    if (existingMembership) {
      return { success: true, message: "Already a member of this community" }
    }

    // Add as member
    const { error } = await supabase.from("community_members").insert({
      community_id: communityId,
      user_id: session.user.id,
      role: "member",
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath(`/community/${communityId}`)
    return { success: true, message: "Successfully joined community" }
  } catch (error: any) {
    console.error("Error joining community:", error)
    throw new Error("Failed to join community. Please try again.")
  }
}

// Leave a community
export async function leaveCommunity(communityId: string) {
  const session = await requireAuth()
  const supabase = createServerClient()

  try {
    // Check if the user is the creator of the community
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single()

    if (communityError) {
      throw new Error("Community not found")
    }

    if (community.creator_id === session.user.id) {
      throw new Error("Community creators cannot leave their own community")
    }

    // Remove membership
    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", session.user.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath(`/community/${communityId}`)
    return { success: true, message: "Successfully left community" }
  } catch (error: any) {
    console.error("Error leaving community:", error)
    throw new Error(error.message || "Failed to leave community. Please try again.")
  }
}

// Delete a community (only for creators)
export async function deleteCommunity(communityId: string) {
  const session = await requireAuth()
  const supabase = createServerClient()

  try {
    // Check if the user is the creator of the community
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single()

    if (communityError) {
      throw new Error("Community not found")
    }

    if (community.creator_id !== session.user.id) {
      throw new Error("Only the community creator can delete the community")
    }

    // Delete the community (cascade will handle related records)
    const { error } = await supabase.from("communities").delete().eq("id", communityId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath("/communities")
    redirect("/communities")
  } catch (error: any) {
    console.error("Error deleting community:", error)
    throw new Error(error.message || "Failed to delete community. Please try again.")
  }
}
