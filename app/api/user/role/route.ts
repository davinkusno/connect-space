import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST save user role
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    // Validate userId matches authenticated user
    if (userId !== authResult.userId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // Validate role
    if (!role || !["user", "community_admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'user' or 'community_admin'" },
        { status: 400 }
      );
    }

    // Update user role
    const { error: updateError } = await supabase
      .from("users")
      .update({
        user_type: role,
        role_selected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return NextResponse.json(
        { error: "Failed to save role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Role saved successfully",
      role: role,
    });
  } catch (error) {
    console.error("Save role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
