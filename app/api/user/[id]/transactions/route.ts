import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET user's purchase transactions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Users can only view their own transactions (unless super_admin)
    if (
      authResult.userId !== params.id &&
      authResult.userRole !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "You can only view your own transactions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user's badge purchases with badge details
    const { data, error, count } = await supabase
      .from("user_badges")
      .select(
        `
        id,
        badge_id,
        purchased_at,
        purchase_price,
        badge:badges (
          id,
          name,
          description,
          image_url,
          category
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", params.id)
      .order("purchased_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Fetch transactions error:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend
    const transactions = data?.map((item: any) => ({
      id: item.id,
      badgeId: item.badge_id,
      purchasedAt: item.purchased_at,
      purchasePrice: item.purchase_price,
      badge: item.badge
        ? {
            id: item.badge.id,
            name: item.badge.name,
            description: item.badge.description,
            imageUrl: item.badge.image_url,
            category: item.badge.category,
          }
        : null,
    }));

    return NextResponse.json({
      data: transactions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
