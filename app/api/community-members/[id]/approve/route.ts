import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("Approve endpoint called")
    const supabase = await createServerClient()
    
    if (!supabase) {
      console.error("Supabase client initialization failed")
      return NextResponse.json(
        { error: "Failed to initialize Supabase client" },
        { status: 500 }
      )
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("Authentication failed:", authError)
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        { status: 401 }
      )
    }

    console.log("User authenticated:", user.id)
    const { id: memberId } = await params
    console.log("Member ID:", memberId)
    
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      console.error("Failed to parse request body:", jsonError)
      return NextResponse.json(
        { error: "Invalid request body", details: jsonError.message },
        { status: 400 }
      )
    }
    
    const { community_id } = body
    console.log("Community ID:", community_id)

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

    // First, verify the member exists and has status = false
    const { data: memberData, error: fetchError } = await supabase
      .from("community_members")
      .select("id, status")
      .eq("id", memberId)
      .eq("community_id", community_id)
      .single()

    if (fetchError || !memberData) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    // Update status to true using RPC function (bypasses RLS)
    console.log("Attempting to update member:", { 
      memberId, 
      community_id, 
      currentStatus: memberData.status,
      memberData: memberData,
      userId: user.id
    })
    
    // Try RPC function first (bypasses RLS)
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc("approve_community_member", {
        p_member_id: memberId,
        p_community_id: community_id,
        p_admin_user_id: user.id
      })

    console.log("RPC result:", { rpcResult, rpcError })

    let updateError = rpcError
    let updatedRecord = null

    if (rpcError) {
      console.log("RPC failed, trying direct update:", rpcError.message)
      
      // Fallback to direct update
      const { error: directUpdateError } = await supabase
        .from("community_members")
        .update({ status: true })
        .eq("id", memberId)

      updateError = directUpdateError
      console.log("Direct update error:", directUpdateError)
    } else {
      // RPC succeeded
      updatedRecord = typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult
      console.log("RPC succeeded, updated record:", updatedRecord)
    }

    if (updateError) {
      console.error("Failed to update status - Full error:", {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        fullError: JSON.stringify(updateError, null, 2)
      })
      
      // Check if it's a permission/RLS issue
      if (updateError.code === "42501" || updateError.message?.includes("permission") || updateError.message?.includes("policy")) {
        return NextResponse.json(
          { 
            error: "Permission denied",
            details: "You may not have permission to update this record. Check RLS policies.",
            code: updateError.code,
            hint: updateError.hint
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { 
          error: "Failed to update status",
          details: updateError.message || "Unknown error",
          code: updateError.code,
          hint: updateError.hint
        },
        { status: 500 }
      )
    }

    if (updateError) {
      console.error("Failed to update status - Full error:", {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        fullError: JSON.stringify(updateError, null, 2)
      })
      
      // Check if it's a permission/RLS issue
      if (updateError.code === "42501" || updateError.message?.includes("permission") || updateError.message?.includes("policy")) {
        return NextResponse.json(
          { 
            error: "Permission denied",
            details: "You may not have permission to update this record. Check RLS policies.",
            code: updateError.code,
            hint: updateError.hint
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { 
          error: "Failed to update status",
          details: updateError.message || "Unknown error",
          code: updateError.code,
          hint: updateError.hint
        },
        { status: 500 }
      )
    }

    // If RPC succeeded, use the result directly
    if (updatedRecord && updatedRecord.status === true) {
      console.log("Status successfully updated via RPC")
      return NextResponse.json(
        { 
          message: "Request approved successfully",
          member: updatedRecord
        },
        { status: 200 }
      )
    }

    // Wait a bit for database to commit (if using direct update)
    await new Promise(resolve => setTimeout(resolve, 300))

    // Verify the update worked by fetching the record again
    const { data: verifyData, error: verifyError } = await supabase
      .from("community_members")
      .select("id, status, role, user_id, community_id")
      .eq("id", memberId)
      .eq("community_id", community_id)
      .single()

    if (verifyError) {
      console.error("Failed to verify update:", verifyError)
      return NextResponse.json(
        { 
          error: "Failed to verify update",
          details: verifyError.message
        },
        { status: 500 }
      )
    }

    if (!verifyData) {
      console.error("No data found after update")
      return NextResponse.json(
        { error: "Member not found after update" },
        { status: 404 }
      )
    }

    console.log("Verification data:", verifyData)
    console.log("Status value:", verifyData.status, "Type:", typeof verifyData.status)

    // Verify the status was updated to true
    const statusValue = verifyData.status
    const isStatusTrue = statusValue === true || statusValue === "true" || statusValue === 1
    
    if (!isStatusTrue) {
      console.error("Status verification failed - Update did not work:", {
        expected: true,
        actual: statusValue,
        type: typeof statusValue,
        verifyData: verifyData,
        memberId: memberId,
        community_id: community_id
      })
      
      return NextResponse.json(
        { 
          error: "Status was not updated correctly",
          details: `Expected true, got ${statusValue} (${typeof statusValue}). Update may have been blocked by RLS policy.`,
          verifyData: verifyData
        },
        { status: 500 }
      )
    }

    console.log("Status successfully updated to true")

    return NextResponse.json(
      { 
        message: "Request approved successfully",
        member: updatedRecord
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error in approve endpoint:", error)
    console.error("Error stack:", error.stack)
    console.error("Error name:", error.name)
    
    // Return detailed error information
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        details: error.toString(),
        name: error.name,
        code: error.code
      },
      { status: 500 }
    )
  }
}

