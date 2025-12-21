"use client";

import { Button } from "@/components/ui/button";
import {
  MEDIA_UPLOAD_CONFIG,
  formatFileSize,
  getMediaTypeCategory,
  getValidationErrorMessage,
  validateImageDimensions,
  validateVideoDuration,
} from "@/lib/config/media-upload.config";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Loader2, Video, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface MediaUploadProps {
  onMediaSelect: (file: File | null) => void;
  currentMedia: File | null;
  disabled?: boolean;
}

export function MediaUpload({ onMediaSelect, currentMedia, disabled }: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsValidating(true);

    try {
      // Basic validation
      const errorMessage = getValidationErrorMessage(file);
      if (errorMessage) {
        toast.error(errorMessage);
        setIsValidating(false);
        return;
      }

      const mediaType = getMediaTypeCategory(file.type);
      if (!mediaType) {
        toast.error("Invalid file type");
        setIsValidating(false);
        return;
      }

      // Additional validation based on type
      if (mediaType === 'image') {
        const isValidDimensions = await validateImageDimensions(file);
        if (!isValidDimensions) {
          toast.error(`Image dimensions must not exceed ${MEDIA_UPLOAD_CONFIG.MAX_DIMENSIONS.WIDTH}x${MEDIA_UPLOAD_CONFIG.MAX_DIMENSIONS.HEIGHT}px`);
          setIsValidating(false);
          return;
        }
      } else if (mediaType === 'video') {
        const isValidDuration = await validateVideoDuration(file);
        if (!isValidDuration) {
          toast.error(`Video duration must not exceed ${MEDIA_UPLOAD_CONFIG.MAX_VIDEO_DURATION / 60} minutes`);
          setIsValidating(false);
          return;
        }
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Pass file to parent
      onMediaSelect(file);
      toast.success(`${mediaType === 'image' ? 'Image' : 'Video'} selected successfully`);
    } catch (error) {
      console.error("Error validating file:", error);
      toast.error("Failed to validate file");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onMediaSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const mediaType = currentMedia ? getMediaTypeCategory(currentMedia.type) : null;

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={[
          ...MEDIA_UPLOAD_CONFIG.ALLOWED_TYPES.IMAGE,
          ...MEDIA_UPLOAD_CONFIG.ALLOWED_TYPES.VIDEO,
        ].join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isValidating}
      />

      {/* Upload Button */}
      {!currentMedia && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled || isValidating}
            className="flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                <Video className="h-4 w-4" />
                Add Image/Video
              </>
            )}
          </Button>
          <span className="text-xs text-gray-500 flex items-center">
            Images up to {MEDIA_UPLOAD_CONFIG.MAX_SIZE_LABEL.IMAGE}, Videos up to {MEDIA_UPLOAD_CONFIG.MAX_SIZE_LABEL.VIDEO}
          </span>
        </div>
      )}

      {/* Preview */}
      {currentMedia && preview && (
        <div className="relative inline-block">
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            {mediaType === 'image' ? (
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-64 object-contain"
              />
            ) : (
              <video
                src={preview}
                controls
                className="max-w-full max-h-64"
              />
            )}
          </div>
          
          {/* File info & Remove button */}
          <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
            <div className="flex items-center gap-2">
              {mediaType === 'image' ? (
                <ImageIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <Video className="h-4 w-4 text-gray-600" />
              )}
              <div className="text-sm">
                <p className="font-medium text-gray-900 truncate max-w-xs">
                  {currentMedia.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(currentMedia.size)}
                </p>
              </div>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

