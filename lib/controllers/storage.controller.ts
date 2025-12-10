import {
    extractPathFromUrl, generateProfileFilename
} from "@/config/storage";
import { adminService, storageService, StorageService, userService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, BaseController, ForbiddenError } from "./base.controller";

// ==================== Response Types ====================

interface UploadResponse {
  url: string;
  path: string;
}

interface ProfilePictureResponse {
  success: boolean;
  avatar_url: string;
  message: string;
}

// ==================== Storage Controller Class ====================

/**
 * Controller for storage/upload API endpoints
 * Handles file uploads for ads, events, profiles, etc.
 */
export class StorageController extends BaseController {
  private readonly service: StorageService;

  constructor() {
    super();
    this.service = storageService;
  }

  /**
   * Verify user is a super admin
   */
  private async requireSuperAdmin(): Promise<User> {
    const user: User = await this.requireAuth();
    const isAdmin: boolean = await adminService.isSuperAdmin(user.id);
    if (!isAdmin) {
      throw new ForbiddenError("Super admin access required");
    }
    return user;
  }

  /**
   * POST /api/ads/upload-image
   * Upload ad image (super admin only)
   */
  public async uploadAdImage(
    request: NextRequest
  ): Promise<NextResponse<UploadResponse | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();

      const formData: FormData = await request.formData();
      const file: File | null = formData.get("file") as File | null;

      if (!file) {
        return this.badRequest("No file provided");
      }

      const result: ServiceResult<UploadResponse> = await this.service.uploadImage(file, {
        folder: "banners",
        maxSizeKey: "banner",
      });

      if (result.success) {
        return this.json<UploadResponse>(result.data as UploadResponse, result.status);
      }

      return this.error(result.error?.message || "Upload failed", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/ads/upload-video
   * Upload ad video (super admin only)
   */
  public async uploadAdVideo(
    request: NextRequest
  ): Promise<NextResponse<UploadResponse | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();

      const formData: FormData = await request.formData();
      const file: File | null = formData.get("file") as File | null;

      if (!file) {
        return this.badRequest("No file provided");
      }

      const result: ServiceResult<UploadResponse> = await this.service.uploadVideo(file, "banners");

      if (result.success) {
        return this.json<UploadResponse>(result.data as UploadResponse, result.status);
      }

      return this.error(result.error?.message || "Upload failed", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/events/upload-image
   * Upload event image (requires auth)
   */
  public async uploadEventImage(
    request: NextRequest
  ): Promise<NextResponse<UploadResponse | ApiErrorResponse>> {
    try {
      await this.requireAuth();

      const formData: FormData = await request.formData();
      const file: File | null = formData.get("file") as File | null;

      if (!file) {
        return this.badRequest("No file provided");
      }

      const result: ServiceResult<UploadResponse> = await this.service.uploadImage(file, {
        folder: "events",
        maxSizeKey: "event",
      });

      if (result.success) {
        return this.json<UploadResponse>(result.data as UploadResponse, result.status);
      }

      return this.error(result.error?.message || "Upload failed", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/user/profile-picture
   * Upload user profile picture
   */
  public async uploadProfilePicture(
    request: NextRequest
  ): Promise<NextResponse<ProfilePictureResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();

      const formData: FormData = await request.formData();
      const file: File | null = formData.get("file") as File | null;

      if (!file) {
        return this.badRequest("No file provided");
      }

      // Get username for filename
      const username: string = await userService.getUsername(user.id);
      const profileFilename: string = generateProfileFilename(username, file.name);

      // Upload file
      const result: ServiceResult<UploadResponse> = await this.service.uploadImage(file, {
        folder: "avatars",
        maxSizeKey: "avatar",
      });

      if (!result.success) {
        return this.error(result.error?.message || "Upload failed", result.status);
      }

      // Update user avatar
      const updateResult = await userService.updateAvatar(user.id, result.data!.url);
      
      if (!updateResult.success) {
        return this.error(updateResult.error?.message || "Failed to update profile", updateResult.status);
      }

      return this.json<ProfilePictureResponse>({
        success: true,
        avatar_url: result.data!.url,
        message: "Profile picture uploaded successfully",
      });
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/user/profile-picture
   * Delete user profile picture
   */
  public async deleteProfilePicture(
    request: NextRequest
  ): Promise<NextResponse<ProfilePictureResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();

      const imageUrl: string | null = this.getQueryParam(request, "imageUrl");
      if (!imageUrl) {
        return this.badRequest("No image URL provided");
      }

      const isPlaceholder: boolean = 
        imageUrl.startsWith("/placeholder") || imageUrl.includes("placeholder-user");

      if (!isPlaceholder) {
        const storagePath: string | null = extractPathFromUrl(imageUrl, "userProfile");
        if (storagePath) {
          await this.service.deleteFile(storagePath);
        }
      }

      // Reset to placeholder
      const placeholderUrl: string = "/placeholder-user.jpg";
      const updateResult = await userService.updateAvatar(user.id, placeholderUrl);

      if (!updateResult.success) {
        return this.error(updateResult.error?.message || "Failed to update profile", updateResult.status);
      }

      return this.json<ProfilePictureResponse>({
        success: true,
        avatar_url: placeholderUrl,
        message: "Profile picture deleted successfully",
      });
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const storageController: StorageController = new StorageController();

