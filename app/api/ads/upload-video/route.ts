import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api/auth";
import {
  STORAGE_CONFIG,
  getStoragePath,
  generateUniqueFilename,
  isValidFileSize,
} from "@/config/storage";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Allowed video MIME types
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];

function isValidVideoType(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mimeType);
}

// POST upload ad video (super_admin only)
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
    if (!isValidVideoType(file.type)) {
      return NextResponse.json(
        { error: "File must be a video (MP4, WebM, OGG, or QuickTime)" },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit for videos)
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxVideoSize) {
      return NextResponse.json(
        { error: "Video size must be less than 50MB" },
        { status: 400 }
      );
    }

    // Generate unique filename and path
    const filename = generateUniqueFilename(file.name);
    const path = getStoragePath("banners", filename); // Using banners folder for ads

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
    console.error("Ad video upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

