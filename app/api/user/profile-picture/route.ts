import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  STORAGE_CONFIG,
  getStoragePath,
  generateUniqueFilename,
  generateProfileFilename,
  isValidImageType,
  isValidFileSize,
  getPublicUrl,
  extractPathFromUrl,
} from "@/config/storage";

// Initialize Supabase client with service role key (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * POST /api/user/profile-picture
 * Upload user profile picture to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    console.log("📸 Profile picture upload started");

    // Get authenticated user
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      console.error("❌ No authorization header");
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("❌ Authentication failed:", authError);
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    console.log("✅ User authenticated:", user.email);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const oldImageUrl = formData.get("oldImageUrl") as string | null;

    if (!file) {
      console.error("❌ No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("📁 File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file type
    if (!isValidImageType(file.type)) {
      console.error("❌ Invalid file type:", file.type);
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidFileSize(file.size, "avatar")) {
      console.error("❌ File too large:", file.size);
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${
            STORAGE_CONFIG.limits.avatar / (1024 * 1024)
          }MB.`,
        },
        { status: 400 }
      );
    }

    console.log("✅ File validation passed");

    // Get username from database (fallback to user_id if no username)
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("username, email")
      .eq("id", user.id)
      .single();

    const username =
      userData?.username || user.email?.split("@")[0] || user.id.slice(0, 8);

    console.log("👤 Username for filename:", username);

    // Generate filename based on username (e.g., rueayna_profile_picture.jpg)
    const profileFilename = generateProfileFilename(username, file.name);
    const storagePath = getStoragePath("userProfile", profileFilename);

    console.log("📝 Generated filename:", profileFilename);

    console.log("📦 Storage path:", storagePath);
    console.log("🪣 Bucket:", STORAGE_CONFIG.bucket);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("📤 Uploading to Supabase Storage...");

    // Upload to Supabase Storage (upsert: true to replace existing file)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_CONFIG.bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: STORAGE_CONFIG.cacheControl,
        upsert: true, // Auto-replace if file with same name exists
      });

    if (uploadError) {
      console.error("❌ Upload error:", {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError,
      });
      return NextResponse.json(
        { error: `Failed to upload profile picture: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log("✅ Upload successful:", uploadData);

    // Get public URL
    const publicUrl = getPublicUrl(storagePath);
    console.log("🔗 Public URL:", publicUrl);

    // Update user metadata with new avatar URL
    console.log("💾 Updating user metadata...");

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          avatar_url: publicUrl,
        },
      });

    if (updateError) {
      console.error("❌ Metadata update error:", updateError);
      // Clean up uploaded file
      await supabaseAdmin.storage
        .from(STORAGE_CONFIG.bucket)
        .remove([storagePath]);

      return NextResponse.json(
        { error: "Failed to update user metadata" },
        { status: 500 }
      );
    }

    console.log("✅ Metadata updated successfully");
    console.log("🎉 Upload complete!");

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
      message: "Profile picture uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/profile-picture
 * Delete user profile picture from Supabase Storage
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("imageUrl");

    console.log("🗑️ DELETE request for imageUrl:", imageUrl);

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL provided" },
        { status: 400 }
      );
    }

    // Check if it's a placeholder image (no need to delete from storage)
    const isPlaceholder =
      imageUrl.startsWith("/placeholder") ||
      imageUrl.includes("placeholder-user");

    console.log("🔍 Is placeholder?", isPlaceholder);

    if (!isPlaceholder) {
      // Extract path from URL
      const storagePath = extractPathFromUrl(imageUrl, "userProfile");
      console.log("📂 Extracted storage path:", storagePath);

      if (!storagePath) {
        return NextResponse.json(
          { error: "Invalid image URL" },
          { status: 400 }
        );
      }

      // Delete from storage
      console.log(
        "🗑️ Deleting from storage:",
        STORAGE_CONFIG.bucket,
        "/",
        storagePath
      );
      const { error: deleteError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.bucket)
        .remove([storagePath]);

      if (deleteError) {
        console.error("❌ Delete error:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete profile picture from storage" },
          { status: 500 }
        );
      }

      console.log("✅ Successfully deleted from storage");
    } else {
      console.log("⏭️ Skipping storage deletion (placeholder image)");
    }

    // Update user metadata to set placeholder avatar URL
    const placeholderUrl = "/placeholder-user.jpg";
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          avatar_url: placeholderUrl,
        },
      });

    if (updateError) {
      console.error("Metadata update error:", updateError);
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
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
