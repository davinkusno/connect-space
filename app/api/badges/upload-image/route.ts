import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api/auth";
import {
  STORAGE_CONFIG,
  getStoragePath,
  generateUniqueFilename,
  isValidImageType,
  isValidFileSize,
} from "@/config/storage";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST upload badge image (super_admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await requireSuperAdmin(request);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.error?.includes("Super admin") ? 403 : 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
      return NextResponse.json(
        { error: "File must be an image (JPEG, PNG, GIF, or WebP)" },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidFileSize(file.size, "badge")) {
      const maxSizeMB = STORAGE_CONFIG.limits.badge / (1024 * 1024);
      return NextResponse.json(
        { error: `File size must be less than ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename and path
    const filename = generateUniqueFilename(file.name);
    const path = getStoragePath("badges", filename);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage (service role bypasses RLS)
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: STORAGE_CONFIG.cacheControl,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { error: error.message || "Upload failed" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_CONFIG.bucket).getPublicUrl(data.path);

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("Badge image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
