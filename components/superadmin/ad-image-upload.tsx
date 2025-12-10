"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getClientSession } from "@/lib/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AdImageUploadProps {
  onImageUrlChange: (url: string) => void;
  currentImageUrl?: string;
}

export function AdImageUpload({
  onImageUrlChange,
  currentImageUrl,
}: AdImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [tempPreviewUrl, setTempPreviewUrl] = useState<string | null>(null); // Temporary preview during upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImageUrl changes (e.g., when editing)
  useEffect(() => {
    if (currentImageUrl) {
      setPreviewUrl(currentImageUrl);
    }
  }, [currentImageUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (image or video)
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) {
      toast.error("Please select an image or video file");
      return;
    }

    // Validate file size (5MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for videos, 5MB for images
    if (file.size > maxSize) {
      const maxSizeMB = isVideo ? 50 : 5;
      toast.error(`${isVideo ? 'Video' : 'Image'} size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Show temporary preview (local preview only, not uploaded yet)
    let tempUrl: string | null = null;
    
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setTempPreviewUrl(url);
      };
      reader.readAsDataURL(file);
      // For images, tempUrl is a data URL, no need to revoke
    } else {
      // For videos, create object URL for preview
      tempUrl = URL.createObjectURL(file);
      setTempPreviewUrl(tempUrl);
    }

    // Upload file
    setIsUploading(true);
    try {
      const session = await getClientSession();
      if (!session?.access_token) {
        toast.error("Please log in");
        // Clean up temp preview (only for videos/blobs)
        if (tempUrl) {
          URL.revokeObjectURL(tempUrl);
        }
        setTempPreviewUrl(null);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const endpoint = isVideo ? "/api/ads/upload-video" : "/api/ads/upload-image";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const data = await response.json();
      
      // Clean up temporary preview (only for videos/blobs)
      if (tempUrl) {
        URL.revokeObjectURL(tempUrl);
      }
      setTempPreviewUrl(null);
      
      // Set the actual uploaded URL - only call onImageUrlChange after successful upload
      setPreviewUrl(data.url);
      onImageUrlChange(data.url);
      toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully`);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || `Failed to upload ${isVideo ? 'video' : 'image'}`);
      // Clean up temp preview on error (only for videos/blobs)
      if (tempUrl) {
        URL.revokeObjectURL(tempUrl);
      }
      setTempPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    // Clean up object URL if it's a video
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    if (tempPreviewUrl && tempPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(tempPreviewUrl);
    }
    setPreviewUrl(null);
    setTempPreviewUrl(null);
    onImageUrlChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Determine if we should show video player
  const displayUrl = tempPreviewUrl || previewUrl;
  const isVideoFile = displayUrl && (
    displayUrl.startsWith("blob:") || 
    displayUrl.match(/\.(mp4|webm|ogg|mov|quicktime)$/i) ||
    displayUrl.includes("/video/")
  );

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Ad Media (Image or Video) *</Label>
      
      {/* Upload Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload from Device
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {previewUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Upload an image (JPEG, PNG, GIF, WebP, max 5MB) or video (MP4, WebM, max 50MB) from your device
        </p>
      </div>

      {/* Preview */}
      {displayUrl && (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          {isVideoFile ? (
            <video
              src={displayUrl}
              controls
              className="w-full h-full object-cover"
              onError={() => {
                toast.error("Failed to load video");
                setPreviewUrl(null);
                setTempPreviewUrl(null);
              }}
            />
          ) : (
            <Image
              src={displayUrl}
              alt="Ad preview"
              fill
              className="object-cover"
              onError={() => {
                toast.error("Failed to load image");
                setPreviewUrl(null);
                setTempPreviewUrl(null);
              }}
            />
          )}
          {tempPreviewUrl && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Uploading...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

