import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST save onboarding data
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
    const { userId, interests, location, onboardingCompleted } = body;

    // Validate userId matches authenticated user
    if (userId !== authResult.userId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // Validate interests
    if (!interests || !Array.isArray(interests) || interests.length < 3) {
      return NextResponse.json(
        { error: "At least 3 interests are required" },
        { status: 400 }
      );
    }

    // Update user profile with onboarding data
    const { error: updateError } = await supabase
      .from("users")
      .update({
        interests: interests,
        location: location || null,
        onboarding_completed: onboardingCompleted || true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user onboarding:", updateError);
      return NextResponse.json(
        { error: "Failed to save onboarding data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET check onboarding status
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user onboarding status
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        "onboarding_completed, interests, location, role_selected, user_type"
      )
      .eq("id", authResult.userId)
      .single();

    if (userError) {
      console.error("Error fetching user onboarding status:", userError);
      return NextResponse.json(
        { error: "Failed to fetch onboarding status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      onboardingCompleted: userData?.onboarding_completed || false,
      roleSelected: userData?.role_selected || false,
      userType: userData?.user_type || "user",
      interests: userData?.interests || [],
      location: userData?.location || null,
    });
  } catch (error) {
    console.error("Get onboarding status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
