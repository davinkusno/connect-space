"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClientSession } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2, Image as ImageIcon, Video } from "lucide-react";
import Image from "next/image";

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
  const [manualUrl, setManualUrl] = useState(currentImageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImageUrl changes (e.g., when editing)
  useEffect(() => {
    if (currentImageUrl) {
      setPreviewUrl(currentImageUrl);
      setManualUrl(currentImageUrl);
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

    // Show preview
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For videos, create object URL for preview
      const videoUrl = URL.createObjectURL(file);
      setPreviewUrl(videoUrl);
    }

    // Upload file
    setIsUploading(true);
    try {
      const session = await getClientSession();
      if (!session?.access_token) {
        toast.error("Please log in");
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
      setPreviewUrl(data.url);
      setManualUrl(data.url);
      onImageUrlChange(data.url);
      toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully`);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || `Failed to upload ${isVideo ? 'video' : 'image'}`);
      setPreviewUrl(null);
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
    setPreviewUrl(null);
    setManualUrl("");
    onImageUrlChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleManualUrlChange = (url: string) => {
    setManualUrl(url);
    if (url) {
      setPreviewUrl(url);
      onImageUrlChange(url);
    }
  };

  const isVideoFile = previewUrl && previewUrl.startsWith("blob:");

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
      {previewUrl && (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          {isVideoFile ? (
            <video
              src={previewUrl}
              controls
              className="w-full h-full object-cover"
              onError={() => {
                toast.error("Failed to load video");
                setPreviewUrl(null);
              }}
            />
          ) : (
            <Image
              src={previewUrl}
              alt="Ad preview"
              fill
              className="object-cover"
              onError={() => {
                toast.error("Failed to load image");
                setPreviewUrl(null);
              }}
            />
          )}
        </div>
      )}

      {/* Manual URL Input (Alternative) */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-600">Or enter media URL manually</Label>
        <Input
          type="url"
          value={manualUrl}
          onChange={(e) => handleManualUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg or https://example.com/video.mp4"
          className="h-9 text-sm"
        />
      </div>
    </div>
  );
}

