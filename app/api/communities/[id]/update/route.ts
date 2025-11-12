import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import {
  STORAGE_CONFIG,
  getStoragePath,
  generateUniqueFilename,
  isValidImageType,
  isValidFileSize,
} from "@/config/storage";

// Create Supabase client with service role key for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * @route POST /api/communities/[id]/update
 * @description Update community logo, banner, and location
 * @access Private (community admins only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin of the community
    const { data: membership, error: membershipError } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", params.id)
      .eq("user_id", user.id)
      .single();

    // Also check if user is creator
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("creator_id")
      .eq("id", params.id)
      .single();

    const isAdmin = membership && membership.role === "admin";
    const isCreator = community && community.creator_id === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "You don't have permission to update this community" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const profileImage = formData.get("profileImage") as File | null;
    const bannerImage = formData.get("bannerImage") as File | null;
    const location = formData.get("location") as string | null;

    let logoUrl: string | null = null;
    let bannerUrl: string | null = null;

    // Handle profile image upload
    if (profileImage && profileImage.size > 0) {
      // Validate file type
      if (!isValidImageType(profileImage.type)) {
        return NextResponse.json(
          { error: "Profile image must be an image (JPEG, PNG, GIF, or WebP)" },
          { status: 400 }
        );
      }

      // Validate file size
      if (!isValidFileSize(profileImage.size, "community")) {
        const maxSizeMB = STORAGE_CONFIG.limits.community / (1024 * 1024);
        return NextResponse.json(
          { error: `Profile image size must be less than ${maxSizeMB}MB` },
          { status: 400 }
        );
      }

      // Generate unique filename and path
      const filename = generateUniqueFilename(profileImage.name);
      const path = getStoragePath("communityProfile", filename);

      // Convert File to ArrayBuffer
      const arrayBuffer = await profileImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.bucket)
        .upload(path, buffer, {
          contentType: profileImage.type,
          cacheControl: STORAGE_CONFIG.cacheControl,
          upsert: true, // Replace if exists
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: uploadError.message || "Failed to upload profile image" },
          { status: 500 }
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage
        .from(STORAGE_CONFIG.bucket)
        .getPublicUrl(data.path);

      logoUrl = publicUrl;
    }

    // Handle banner image upload
    if (bannerImage && bannerImage.size > 0) {
      // Validate file type
      if (!isValidImageType(bannerImage.type)) {
        return NextResponse.json(
          { error: "Banner image must be an image (JPEG, PNG, GIF, or WebP)" },
          { status: 400 }
        );
      }

      // Validate file size
      if (!isValidFileSize(bannerImage.size, "banner")) {
        const maxSizeMB = STORAGE_CONFIG.limits.banner / (1024 * 1024);
        return NextResponse.json(
          { error: `Banner image size must be less than ${maxSizeMB}MB` },
          { status: 400 }
        );
      }

      // Generate unique filename and path
      const filename = generateUniqueFilename(bannerImage.name);
      const path = getStoragePath("banners", filename);

      // Convert File to ArrayBuffer
      const arrayBuffer = await bannerImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.bucket)
        .upload(path, buffer, {
          contentType: bannerImage.type,
          cacheControl: STORAGE_CONFIG.cacheControl,
          upsert: true, // Replace if exists
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: uploadError.message || "Failed to upload banner image" },
          { status: 500 }
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage
        .from(STORAGE_CONFIG.bucket)
        .getPublicUrl(data.path);

      bannerUrl = publicUrl;
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Update location in communities table if provided
    if (location) {
      updateData.location = location;
    }

    // Update logo_url and banner_url
    // Try to update in community_details table first, if it exists
    // Otherwise update in communities table
    if (logoUrl || bannerUrl) {
      // Try community_details table first
      const communityDetailsUpdate: any = {};
      if (logoUrl) communityDetailsUpdate.logo_url = logoUrl;
      if (bannerUrl) communityDetailsUpdate.banner_url = bannerUrl;

      try {
        const { error: detailsError } = await supabase
          .from("community_details")
          .upsert({
            community_id: params.id,
            ...communityDetailsUpdate,
          }, {
            onConflict: "community_id"
          });

        // If community_details doesn't exist or has error, update communities table
        if (detailsError) {
          // Table doesn't exist or other error, update communities table instead
          if (logoUrl) updateData.logo_url = logoUrl;
          if (bannerUrl) updateData.banner_url = bannerUrl;
        }
      } catch (error: any) {
        // If table doesn't exist (42P01) or any other error, fallback to communities table
        console.log("community_details table not available, using communities table:", error.message);
        if (logoUrl) updateData.logo_url = logoUrl;
        if (bannerUrl) updateData.banner_url = bannerUrl;
      }
    }

    // Check if there's anything to update
    const hasUpdates = logoUrl || bannerUrl || location || Object.keys(updateData).length > 1;

    if (!hasUpdates) {
      return NextResponse.json(
        { error: "No changes to save" },
        { status: 400 }
      );
    }

    // Update communities table if there's location or fallback logo/banner
    if (Object.keys(updateData).length > 1) { // More than just updated_at
      const { error: updateError } = await supabase
        .from("communities")
        .update(updateData)
        .eq("id", params.id);

      if (updateError) {
        console.error("Error updating community:", updateError);
        return NextResponse.json(
          { error: "Failed to update community", details: updateError.message },
          { status: 500 }
        );
      }
    }

    // Return success even if only logo/banner was updated (via community_details)
    return NextResponse.json({
      success: true,
      message: "Community updated successfully",
      data: {
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
        location: location || null,
      },
    });
  } catch (error: any) {
    console.error("Error updating community:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

