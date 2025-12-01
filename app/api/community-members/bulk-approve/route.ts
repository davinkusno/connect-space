import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Helper function to create notification when a user is approved
async function createApprovalNotification(
  supabase: any,
  userId: string,
  communityId: string
) {
  try {
    // Get community name
    const { data: community } = await supabase
      .from("communities")
      .select("name")
      .eq("id", communityId)
      .single()

    if (!community) {
      console.error("Community not found for notification")
      return
    }

    // Create notification
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: "community_update",
        content: `Your join request to "${community.name}" has been approved! You can now access the community.`,
        is_read: false,
        reference_id: communityId,
        reference_type: "community"
      })

    if (notifError) {
      console.error("Error creating approval notification:", notifError)
    }
  } catch (error) {
    console.error("Error in createApprovalNotification:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize Supabase client" },
        { status: 500 }
      )
    }
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { community_id, member_ids } = body

    if (!community_id) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      )
    }

    // Verify user is admin of the community
    const { data: membership, error: membershipError } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", community_id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "You don't have permission to approve requests" },
        { status: 403 }
      )
    }

    // Get pending members
    let query = supabase
      .from("community_members")
      .select("id, user_id")
      .eq("community_id", community_id)
      .eq("status", false)

    if (member_ids && Array.isArray(member_ids) && member_ids.length > 0) {
      query = query.in("id", member_ids)
    }

    const { data: pendingMembers, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch pending members" },
        { status: 500 }
      )
    }

    if (!pendingMembers || pendingMembers.length === 0) {
      return NextResponse.json(
        { message: "No pending members to approve" },
        { status: 200 }
      )
    }

    // Update all pending members to approved
    const memberIds = pendingMembers.map(m => m.id)
    const { error: updateError } = await supabase
      .from("community_members")
      .update({ status: true })
      .in("id", memberIds)
      .eq("community_id", community_id)

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to approve members" },
        { status: 500 }
      )
    }

    // Create notifications for all approved users
    const notificationPromises = pendingMembers.map(member =>
      createApprovalNotification(supabase, member.user_id, community_id)
    )
    
    await Promise.all(notificationPromises)

    return NextResponse.json(
      { 
        message: `Successfully approved ${pendingMembers.length} member(s)`,
        approved_count: pendingMembers.length
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error in bulk approve endpoint:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}



