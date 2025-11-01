import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET user points
export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get user points from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("points")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user points:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user points" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      points: userData?.points || 0,
      userId: user.id,
    });
  } catch (error) {
    console.error("Get user points error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
