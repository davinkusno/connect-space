import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's community (the one they created)
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select(`
        *,
        user_membership:community_members!inner(role)
      `)
      .eq("creator_id", user.id)
      .eq("user_membership.user_id", user.id)
      .single();

    if (communityError) {
      if (communityError.code === 'PGRST116') {
        // No community found
        return NextResponse.json({ community: null });
      }
      console.error("Error fetching user community:", communityError);
      return NextResponse.json({ error: "Failed to fetch your community" }, { status: 500 });
    }

    // Transform the data to include role
    const communityData = {
      ...community,
      role: community.user_membership?.role || 'admin'
    };

    return NextResponse.json({ community: communityData });

  } catch (error) {
    console.error("Error in my-community API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
