import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api/auth";
import { STORAGE_CONFIG, extractPathFromUrl } from "@/config/storage";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET single badge
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from("badges")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update badge (super_admin only)
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

    // Get existing badge to check for old image
    const { data: existingBadge, error: fetchError } = await supabase
      .from("badges")
      .select("image_url")
      .eq("id", params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    // Check if image has changed or been removed
    const oldImageUrl = existingBadge?.image_url;
    const newImageUrl = body.image_url;

    // Delete old image from storage if:
    // 1. Old image exists AND
    // 2. (New image is different OR new image is empty/null)
    if (oldImageUrl && (oldImageUrl !== newImageUrl || !newImageUrl)) {
      try {
        const path = extractPathFromUrl(oldImageUrl, "badges");
        if (path) {
          await supabase.storage.from(STORAGE_CONFIG.bucket).remove([path]);
          console.log("Old badge image deleted:", path);
        }
      } catch (deleteError) {
        // Log error but don't fail the update
        console.error("Failed to delete old image:", deleteError);
      }
    }

    // Update badge
    const { data, error } = await supabase
      .from("badges")
      .update({
        name: body.name,
        description: body.description,
        icon: body.icon,
        price: body.price,
        image_url: body.image_url || null,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE badge (super_admin only)
export async function DELETE(
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

    // First get the badge to get image_url
    const { data: badge, error: fetchError } = await supabase
      .from("badges")
      .select("image_url")
      .eq("id", params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    // Delete image from storage if exists
    if (badge?.image_url) {
      try {
        const path = extractPathFromUrl(badge.image_url, "badges");
        if (path) {
          await supabase.storage.from(STORAGE_CONFIG.bucket).remove([path]);
          console.log("Badge image deleted from storage:", path);
        }
      } catch (storageError) {
        // Log error but continue with badge deletion
        console.error("Failed to delete image from storage:", storageError);
      }
    }

    // Delete badge from database
    const { error: deleteError } = await supabase
      .from("badges")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Badge deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
