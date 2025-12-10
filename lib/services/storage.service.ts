import {
    generateUniqueFilename, getStoragePath, isValidFileSize, isValidImageType, isValidVideoType, STORAGE_CONFIG
} from "@/config/storage";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";

// ==================== Storage Service Types ====================

type StorageFolder = "avatars" | "banners" | "logos" | "events" | "posts";

interface UploadResult {
  url: string;
  path: string;
}

interface UploadOptions {
  folder: StorageFolder;
  maxSizeKey?: "avatar" | "banner" | "logo" | "event" | "post";
}

// ==================== Storage Service Class ====================

/**
 * Service for handling file uploads to Supabase Storage
 * Handles image and video uploads with validation
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
   * Upload an image file
   * @param file - The file to upload
   * @param options - Upload options (folder, maxSizeKey)
   * @returns ServiceResult containing upload result (url, path)
   */
  public async uploadImage(
    file: File,
    options: UploadOptions
  ): Promise<ServiceResult<UploadResult>> {
    // Validate file type
    if (!isValidImageType(file.type)) {
      return ApiResponse.badRequest("File must be an image (JPEG, PNG, GIF, or WebP)");
    }

    // Validate file size
    const sizeKey = options.maxSizeKey || "banner";
    if (!isValidFileSize(file.size, sizeKey)) {
      const maxSizeMB = STORAGE_CONFIG.limits[sizeKey] / (1024 * 1024);
      return ApiResponse.badRequest(`File size must be less than ${maxSizeMB}MB`);
    }

    return this.uploadFile(file, options.folder);
  }

  /**
   * Upload a video file
   * @param file - The file to upload
   * @param folder - The storage folder
   * @returns ServiceResult containing upload result (url, path)
   */
  public async uploadVideo(
    file: File,
    folder: StorageFolder = "banners"
  ): Promise<ServiceResult<UploadResult>> {
    // Validate file type
    if (!isValidVideoType(file.type)) {
      return ApiResponse.badRequest("File must be a video (MP4, WebM, or OGG)");
    }

    // Videos have larger size limits
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return ApiResponse.badRequest("Video must be less than 100MB");
    }

    return this.uploadFile(file, folder);
  }

  /**
   * Upload a file to Supabase Storage
   * @param file - The file to upload
   * @param folder - The storage folder
   * @returns ServiceResult containing upload result
   */
  private async uploadFile(
    file: File,
    folder: StorageFolder
  ): Promise<ServiceResult<UploadResult>> {
    try {
      // Generate unique filename and path
      const filename: string = generateUniqueFilename(file.name);
      const path: string = getStoragePath(folder, filename);

      // Convert File to ArrayBuffer then Buffer
      const arrayBuffer: ArrayBuffer = await file.arrayBuffer();
      const buffer: Buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const { data, error } = await this.supabaseAdmin.storage
        .from(STORAGE_CONFIG.bucket)
        .upload(path, buffer, {
          contentType: file.type,
          cacheControl: STORAGE_CONFIG.cacheControl,
          upsert: false,
        });

      if (error) {
        return ApiResponse.error(error.message || "Upload failed", 500);
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabaseAdmin.storage
        .from(STORAGE_CONFIG.bucket)
        .getPublicUrl(data.path);

      return ApiResponse.success<UploadResult>({
        url: publicUrl,
        path: data.path,
      });
    } catch (error) {
      return ApiResponse.error("Upload failed", 500);
    }
  }

  /**
   * Delete a file from storage
   * @param path - The file path to delete
   * @returns ServiceResult indicating success
   */
  public async deleteFile(path: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin.storage
      .from(STORAGE_CONFIG.bucket)
      .remove([path]);

    if (error) {
      return ApiResponse.error("Failed to delete file", 500);
    }

    return ApiResponse.success<void>(undefined);
  }
}

// Export singleton instance
export const storageService: StorageService = StorageService.getInstance();

