import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

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
    const { community_id } = body

    if (!community_id) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      )
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from("community_members")
      .select("id, status")
      .eq("community_id", community_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingMember) {
      const memberStatus = existingMember.status
      if (memberStatus === false) {
        return NextResponse.json(
          { message: "Join request is already pending", member: existingMember },
          { status: 200 }
        )
      } else {
        return NextResponse.json(
          { message: "Already a member", member: existingMember },
          { status: 200 }
        )
      }
    }

    // Insert with status = false (pending approval)
    const { data: insertData, error: insertError } = await supabase
      .from("community_members")
      .insert({
        community_id: community_id,
        user_id: user.id,
        role: "member",
        status: false  // Pending approval
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting community member:", insertError)
      
      // Handle specific error codes
      if (insertError.code === "23505") {
        // Unique constraint violation - already exists
        return NextResponse.json(
          { error: "You already have a pending request or are a member" },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: insertError.message || "Failed to join community" },
        { status: 500 }
      )
    }

    // Verify that status was inserted as false
    if (!insertData) {
      return NextResponse.json(
        { error: "Failed to create join request" },
        { status: 500 }
      )
    }

    // Double-check status is false
    const memberStatus = insertData.status
    if (memberStatus !== false) {
      console.warn("Status is not false after insert, attempting to update:", memberStatus)
      // Try direct update
      const { error: updateError } = await supabase
        .from("community_members")
        .update({ status: false })
        .eq("id", insertData.id)
        .eq("community_id", community_id)

      if (updateError) {
        console.error("Failed to update status to false:", updateError)
      } else {
        // Reload to get updated status
        const { data: reloadedData } = await supabase
          .from("community_members")
          .select("*")
          .eq("id", insertData.id)
          .single()
        
        if (reloadedData) {
          return NextResponse.json(
            { message: "Join request sent", member: reloadedData },
            { status: 201 }
          )
        }
      }
    }

    return NextResponse.json(
      { message: "Join request sent", member: insertData },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error in join community endpoint:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

