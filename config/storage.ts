/**
 * Storage Configuration
 * Centralized configuration for Supabase Storage buckets and paths
 */

export type StorageType = "community" | "event" | "user" | "banner" | "badge" | "avatar";

export const STORAGE_CONFIG = {
  // Main bucket name
  bucket: "ConnectSpace",

  // Folder paths within the bucket
  folders: {
    badges: "badges",
    avatars: "avatars",
    events: "events",
    communities: "communities",
    banners: "banners",
    communityProfile: "community-profile",
    userProfile: "user-profile",
    communityMedia: "community-media", // For discussion forum images/videos
  },

  // File size limits (in bytes)
  limits: {
    badge: 5 * 1024 * 1024, // 5MB
    avatar: 2 * 1024 * 1024, // 2MB
    event: 10 * 1024 * 1024, // 10MB
    community: 10 * 1024 * 1024, // 10MB
    banner: 5 * 1024 * 1024, // 5MB
    communityProfile: 5 * 1024 * 1024, // 5MB for forum images
    communityMedia: 50 * 1024 * 1024, // 50MB for forum videos
  },

  // Allowed MIME types
  allowedTypes: {
    images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    videos: ["video/mp4", "video/webm", "video/ogg"],
  },

  // Cache control settings (in seconds)
  cacheControl: "3600", // 1 hour
} as const;

/**
 * Helper function to get full path for a file
 */
export function getStoragePath(
  folder: keyof typeof STORAGE_CONFIG.folders,
  filename: string
): string {
  return `${STORAGE_CONFIG.folders[folder]}/${filename}`;
}

/**
 * Helper function to generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${timestamp}-${sanitized}`;
}

/**
 * Helper function to generate profile picture filename based on username
 */
export function generateProfileFilename(
  username: string,
  originalFilename: string
): string {
  // Sanitize username (remove special chars, convert to lowercase)
  const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, "_");

  // Extract file extension
  const extension = originalFilename.split(".").pop()?.toLowerCase() || "jpg";

  // Format: username_profile_picture.ext
  return `${sanitizedUsername}_profile_picture.${extension}`;
}

/**
 * Helper function to extract path from storage URL
 */
export function extractPathFromUrl(
  url: string,
  folder: keyof typeof STORAGE_CONFIG.folders
): string | null {
  console.log("🔍 Extracting path from URL:", url);
  console.log("📁 Looking for folder:", folder);

  // Remove query parameters (e.g., ?t=1234567890)
  const urlWithoutParams = url.split("?")[0];
  console.log("🧹 URL without params:", urlWithoutParams);

  const folderPath = STORAGE_CONFIG.folders[folder];
  console.log("📂 Folder path:", folderPath);

  const pathMatch = urlWithoutParams.match(new RegExp(`${folderPath}\\/.+`));
  console.log("✨ Path match result:", pathMatch);

  const extractedPath = pathMatch ? pathMatch[0] : null;
  console.log("📍 Extracted path:", extractedPath);

  return extractedPath;
}

/**
 * Helper function to validate image file type
 */
export function isValidImageType(mimeType: string): boolean {
  return STORAGE_CONFIG.allowedTypes.images.includes(mimeType as any);
}

/**
 * Helper function to validate video file type
 */
export function isValidVideoType(mimeType: string): boolean {
  return STORAGE_CONFIG.allowedTypes.videos.includes(mimeType as any);
}

/**
 * Helper function to validate file size
 */
export function isValidFileSize(
  size: number,
  type: keyof typeof STORAGE_CONFIG.limits
): boolean {
  return size <= STORAGE_CONFIG.limits[type];
}

/**
 * Helper function to get public URL
 */
export function getPublicUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_CONFIG.bucket}/${path}`;
}
