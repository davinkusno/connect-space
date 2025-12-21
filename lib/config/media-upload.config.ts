/**
 * Media Upload Configuration for Discussion Forum
 * Defines limits and constraints for image/video uploads
 */

export const MEDIA_UPLOAD_CONFIG = {
  // Allowed media types
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    VIDEO: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
  },

  // File size limits (in bytes)
  MAX_SIZE: {
    IMAGE: 5 * 1024 * 1024,  // 5MB for images
    VIDEO: 50 * 1024 * 1024, // 50MB for videos
  },

  // File size limits (human readable)
  MAX_SIZE_LABEL: {
    IMAGE: '5MB',
    VIDEO: '50MB',
  },

  // Dimensions limits for images
  MAX_DIMENSIONS: {
    WIDTH: 4096,
    HEIGHT: 4096,
  },

  // Video duration limit (in seconds)
  MAX_VIDEO_DURATION: 300, // 5 minutes

  // Storage paths
  STORAGE_PATHS: {
    IMAGE: 'community-media/images',
    VIDEO: 'community-media/videos',
  },
} as const;

/**
 * Validate if file type is allowed
 */
export function isAllowedMediaType(file: File): boolean {
  const allAllowedTypes = [
    ...MEDIA_UPLOAD_CONFIG.ALLOWED_TYPES.IMAGE,
    ...MEDIA_UPLOAD_CONFIG.ALLOWED_TYPES.VIDEO,
  ];
  return allAllowedTypes.includes(file.type);
}

/**
 * Get media type category from MIME type
 */
export function getMediaTypeCategory(mimeType: string): 'image' | 'video' | null {
  if (MEDIA_UPLOAD_CONFIG.ALLOWED_TYPES.IMAGE.includes(mimeType)) {
    return 'image';
  }
  if (MEDIA_UPLOAD_CONFIG.ALLOWED_TYPES.VIDEO.includes(mimeType)) {
    return 'video';
  }
  return null;
}

/**
 * Validate file size based on type
 */
export function isValidFileSize(file: File): boolean {
  const mediaType = getMediaTypeCategory(file.type);
  if (!mediaType) return false;

  const maxSize = MEDIA_UPLOAD_CONFIG.MAX_SIZE[mediaType.toUpperCase() as 'IMAGE' | 'VIDEO'];
  return file.size <= maxSize;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get max size label for a given media type
 */
export function getMaxSizeLabel(mediaType: 'image' | 'video'): string {
  return MEDIA_UPLOAD_CONFIG.MAX_SIZE_LABEL[mediaType.toUpperCase() as 'IMAGE' | 'VIDEO'];
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { WIDTH, HEIGHT } = MEDIA_UPLOAD_CONFIG.MAX_DIMENSIONS;
      resolve(img.width <= WIDTH && img.height <= HEIGHT);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    
    img.src = url;
  });
}

/**
 * Validate video duration
 */
export async function validateVideoDuration(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration <= MEDIA_UPLOAD_CONFIG.MAX_VIDEO_DURATION);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    
    video.src = url;
  });
}

/**
 * Get error message for file validation
 */
export function getValidationErrorMessage(file: File): string | null {
  // Check if file type is allowed
  if (!isAllowedMediaType(file)) {
    return 'File type not supported. Please upload images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM, MOV, AVI).';
  }

  // Check file size
  if (!isValidFileSize(file)) {
    const mediaType = getMediaTypeCategory(file.type);
    if (mediaType) {
      const maxSize = getMaxSizeLabel(mediaType);
      return `File size exceeds the ${maxSize} limit for ${mediaType}s.`;
    }
  }

  return null;
}

