import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/onboarding
 * Get user's onboarding status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { onboarding_completed: false, user_type: null },
        { status: 200 }
      );
    }

    const result = await userService.getOnboardingStatus(user.id);
    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/onboarding
 * Complete user onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await userService.completeOnboarding(user.id);
    return NextResponse.json(
      result.success ? result.data : { error: result.error?.message },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
