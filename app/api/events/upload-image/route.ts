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
 * @route POST /api/events/upload-image
 * @description Upload event image
 * @access Private
 */
export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const image = formData.get("image") as File | null;

    if (!image || image.size === 0) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidImageType(image.type)) {
      return NextResponse.json(
        { error: "Image must be JPEG, PNG, GIF, or WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidFileSize(image.size, "event")) {
      const maxSizeMB = STORAGE_CONFIG.limits.event / (1024 * 1024);
      return NextResponse.json(
        { error: `Image size must be less than ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename and path
    const filename = generateUniqueFilename(image.name);
    const path = getStoragePath("events", filename);

    // Convert File to ArrayBuffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_CONFIG.bucket)
      .upload(path, buffer, {
        contentType: image.type,
        cacheControl: STORAGE_CONFIG.cacheControl,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from(STORAGE_CONFIG.bucket)
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    });
  } catch (error: any) {
    console.error("Error uploading event image:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}




