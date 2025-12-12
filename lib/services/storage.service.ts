import {
  generateUniqueFilename,
  getStoragePath,
  isValidFileSize,
  isValidImageType,
  STORAGE_CONFIG,
  StorageType,
} from "@/config/storage";
import { ApiResponse, BaseService, ServiceResult } from "./base.service";

// ==================== Storage Service Types ====================

interface UploadResult {
  url: string;
  path: string;
}

// ==================== Storage Service Class ====================

/**
 * Service for handling file storage operations
 */
export class StorageService extends BaseService {
  private static instance: StorageService;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance of StorageService
   */
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Upload an image file to storage
   * @param file - The file to upload
   * @param type - The storage type (determines folder path)
   * @returns ServiceResult containing the public URL
   */
  public async uploadImage(
    file: File,
    type: StorageType
  ): Promise<ServiceResult<UploadResult>> {
    // Validate file type
    if (!isValidImageType(file.type)) {
      return ApiResponse.badRequest(
        "File must be an image (JPEG, PNG, GIF, or WebP)"
      );
    }

    // Validate file size
    if (!isValidFileSize(file.size, type)) {
      const maxSizeMB = STORAGE_CONFIG.limits[type] / (1024 * 1024);
      return ApiResponse.badRequest(
        `File size must be less than ${maxSizeMB}MB`
      );
    }

    // Generate unique filename and path
    const filename = generateUniqueFilename(file.name);
    const folderMap: Record<StorageType, keyof typeof STORAGE_CONFIG.folders> = {
      "community": "communityProfile",
      "event": "events",
      "user": "avatars",
      "banner": "banners",
      "badge": "badges",
      "avatar": "avatars",
    };
    const path = getStoragePath(folderMap[type] || "communityProfile", filename);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage (service role bypasses RLS)
    const { data, error: uploadError } = await this.supabaseAdmin.storage
      .from(STORAGE_CONFIG.bucket)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: STORAGE_CONFIG.cacheControl,
        upsert: false,
      });

    if (uploadError) {
      console.error("[StorageService] Upload error:", uploadError);
      return ApiResponse.error(uploadError.message || "Upload failed", 500);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = this.supabaseAdmin.storage
      .from(STORAGE_CONFIG.bucket)
      .getPublicUrl(data.path);

    return ApiResponse.success<UploadResult>({
      url: publicUrl,
      path: data.path,
    });
  }

  /**
   * Delete a file from storage
   * @param path - The file path to delete
   * @returns ServiceResult indicating success or failure
   */
  public async deleteFile(path: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin.storage
      .from(STORAGE_CONFIG.bucket)
      .remove([path]);

    if (error) {
      console.error("[StorageService] Delete error:", error);
      return ApiResponse.error(error.message || "Delete failed", 500);
    }

    return ApiResponse.success(undefined);
  }
}

// Export singleton instance
export const storageService: StorageService = StorageService.getInstance();
