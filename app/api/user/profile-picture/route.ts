import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  STORAGE_CONFIG,
  getStoragePath,
  generateProfileFilename,
  isValidImageType,
  isValidFileSize,
  getPublicUrl,
  extractPathFromUrl,
} from "@/config/storage";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/user/profile-picture
 * Upload user profile picture
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!isValidImageType(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    if (!isValidFileSize(file.size, "avatar")) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${STORAGE_CONFIG.limits.avatar / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    // Get username for filename
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("username, email")
      .eq("id", user.id)
      .single();

    const username = userData?.username || user.email?.split("@")[0] || user.id.slice(0, 8);
    const profileFilename = generateProfileFilename(username, file.name);
    const storagePath = getStoragePath("userProfile", profileFilename);

    // Upload file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_CONFIG.bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: STORAGE_CONFIG.cacheControl,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload profile picture: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const publicUrl = getPublicUrl(storagePath);

    // Update user metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { user_metadata: { avatar_url: publicUrl } }
    );

    if (updateError) {
      await supabaseAdmin.storage.from(STORAGE_CONFIG.bucket).remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to update user metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
      message: "Profile picture uploaded successfully",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/profile-picture
 * Delete user profile picture
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("imageUrl");

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    const isPlaceholder =
      imageUrl.startsWith("/placeholder") || imageUrl.includes("placeholder-user");

    if (!isPlaceholder) {
      const storagePath = extractPathFromUrl(imageUrl, "userProfile");
      if (!storagePath) {
        return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
      }

      const { error: deleteError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.bucket)
        .remove([storagePath]);

      if (deleteError) {
        return NextResponse.json(
          { error: "Failed to delete profile picture" },
          { status: 500 }
        );
      }
    }

    const placeholderUrl = "/placeholder-user.jpg";
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { user_metadata: { avatar_url: placeholderUrl } }
    );

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update user metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatar_url: placeholderUrl,
      message: "Profile picture deleted successfully",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
