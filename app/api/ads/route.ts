import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireSuperAdmin } from "@/lib/api/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch ads (filtered by community_id if provided)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("community_id");
    const placement = searchParams.get("placement");
    const activeOnly = searchParams.get("active_only") !== "false"; // Default to true

    let query = supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by community_id if provided
    // Show ads that are either:
    // 1. Targeted to this specific community (community_id = communityId)
    // 2. Available for all communities (community_id IS NULL)
    if (communityId) {
      query = query.or(`community_id.eq.${communityId},community_id.is.null`);
    } else {
      // If no community_id provided, only show ads for all communities
      query = query.is("community_id", null);
    }

    // Filter by placement if provided
    if (placement) {
      query = query.eq("placement", placement);
    }

    // Filter active ads only
    if (activeOnly) {
      const now = new Date().toISOString();
      query = query.eq("is_active", true);
      
      // Filter by date range - ad must be within start and end dates (or have no dates)
      // This requires checking both conditions together
      // We'll filter in memory for date ranges to avoid complex query issues
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching ads:", error);
      return NextResponse.json(
        { error: "Failed to fetch ads" },
        { status: 500 }
      );
    }

    // Filter by date range if activeOnly is true
    let filteredAds = data || [];
    if (activeOnly && filteredAds.length > 0) {
      const now = new Date();
      filteredAds = filteredAds.filter((ad: any) => {
        // Check start date
        const startDateValid = !ad.start_date || new Date(ad.start_date) <= now;
        // Check end date
        const endDateValid = !ad.end_date || new Date(ad.end_date) >= now;
        return startDateValid && endDateValid;
      });
    }

    return NextResponse.json({ ads: filteredAds });
  } catch (error: any) {
    console.error("Error in GET /api/ads:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new ad (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      image_url,
      link_url,
      community_id,
      placement,
      start_date,
      end_date,
    } = body;

    // Validation
    if (!title || !image_url || !placement) {
      return NextResponse.json(
        { error: "Title, image_url, and placement are required" },
        { status: 400 }
      );
    }

    if (!["sidebar", "banner", "inline"].includes(placement)) {
      return NextResponse.json(
        { error: "Placement must be 'sidebar', 'banner', or 'inline'" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ads")
      .insert({
        title,
        description,
        image_url,
        link_url,
        community_id: community_id || null,
        placement,
        start_date: start_date || null,
        end_date: end_date || null,
        created_by: authResult.userId!,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating ad:", error);
      return NextResponse.json(
        { error: "Failed to create ad" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ad: data }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/ads:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

