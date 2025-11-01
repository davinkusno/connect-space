import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT/PATCH update user points (super_admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const authResult = await requireSuperAdmin(request);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.error?.includes("Super admin") ? 403 : 401 }
      );
    }

    const body = await request.json();
    const { action, amount, reason } = body;

    // Validate action
    if (!action || !["add", "deduct", "set"].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "add", "deduct", or "set"' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json(
        { error: "Amount must be a non-negative number" },
        { status: 400 }
      );
    }

    // Get current user points
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("points")
      .eq("id", params.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentPoints = userData.points || 0;
    let newPoints = currentPoints;

    // Calculate new points based on action
    switch (action) {
      case "add":
        newPoints = currentPoints + amount;
        break;
      case "deduct":
        newPoints = Math.max(0, currentPoints - amount); // Cannot go below 0
        break;
      case "set":
        newPoints = amount;
        break;
    }

    // Update user points
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: newPoints })
      .eq("id", params.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update points" },
        { status: 500 }
      );
    }

    // Log the transaction (optional - for audit trail)
    console.log(
      `[POINTS UPDATE] Admin ${
        authResult.userId
      } ${action} ${amount} points to user ${params.id}. Reason: ${
        reason || "N/A"
      }`
    );

    return NextResponse.json({
      success: true,
      previousPoints: currentPoints,
      newPoints: newPoints,
      action: action,
      amount: amount,
      reason: reason || null,
    });
  } catch (error) {
    console.error("Update points error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH is alias for PUT (same functionality)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}
