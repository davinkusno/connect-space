/**
 * Storage Configuration
 * Centralized configuration for Supabase Storage buckets and paths
 */

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
  },

  // File size limits (in bytes)
  limits: {
    badge: 5 * 1024 * 1024, // 5MB
    avatar: 2 * 1024 * 1024, // 2MB
    event: 10 * 1024 * 1024, // 10MB
    community: 10 * 1024 * 1024, // 10MB
    banner: 5 * 1024 * 1024, // 5MB
  },

  // Allowed MIME types
  allowedTypes: {
    images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
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
 * Helper function to extract path from storage URL
 */
export function extractPathFromUrl(
  url: string,
  folder: keyof typeof STORAGE_CONFIG.folders
): string | null {
  const folderPath = STORAGE_CONFIG.folders[folder];
  const pathMatch = url.match(new RegExp(`${folderPath}\\/.+`));
  return pathMatch ? pathMatch[0] : null;
}

/**
 * Helper function to validate file type
 */
export function isValidImageType(mimeType: string): boolean {
  return STORAGE_CONFIG.allowedTypes.images.includes(mimeType);
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
