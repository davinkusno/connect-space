import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireSuperAdmin } from "@/lib/api/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch single ad
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Ad not found" }, { status: 404 });
      }
      console.error("Error fetching ad:", error);
      return NextResponse.json(
        { error: "Failed to fetch ad" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ad: data });
  } catch (error: any) {
    console.error("Error in GET /api/ads/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update ad (superadmin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSuperAdmin(request);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const {
      title,
      description,
      image_url,
      link_url,
      community_id,
      placement,
      is_active,
      start_date,
      end_date,
    } = body;

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (community_id !== undefined) updateData.community_id = community_id;
    if (placement !== undefined) {
      if (!["sidebar", "banner", "inline"].includes(placement)) {
        return NextResponse.json(
          { error: "Placement must be 'sidebar', 'banner', or 'inline'" },
          { status: 400 }
        );
      }
      updateData.placement = placement;
    }
    if (is_active !== undefined) updateData.is_active = is_active;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;

    const { data, error } = await supabase
      .from("ads")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Ad not found" }, { status: 404 });
      }
      console.error("Error updating ad:", error);
      return NextResponse.json(
        { error: "Failed to update ad" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ad: data });
  } catch (error: any) {
    console.error("Error in PATCH /api/ads/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete ad (superadmin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSuperAdmin(request);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { error } = await supabase.from("ads").delete().eq("id", id);

    if (error) {
      console.error("Error deleting ad:", error);
      return NextResponse.json(
        { error: "Failed to delete ad" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Ad deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/ads/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


