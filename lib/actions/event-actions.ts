"use server"

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/supabase/auth-helpers"
import type { InsertTables, Tables } from "@/lib/supabase/types"

// Create a new event
export async function createEvent(eventData: Omit<InsertTables<"events">, "creator_id">): Promise<Tables<"events">> {
  const session = await requireAuth()
  const supabase = createServerClient()

  try {
    // Check if user is a member of the community
    const { data: membership, error: membershipError } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", eventData.community_id)
      .eq("user_id", session.user.id)
      .maybeSingle()

    if (!membership) {
      throw new Error("You must be a member of the community to create an event")
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        ...eventData,
        creator_id: session.user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    throw new Error(error.message)
  }
}
