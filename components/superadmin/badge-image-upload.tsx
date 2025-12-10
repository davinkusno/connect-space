"use client";

import { Input } from "@/components/ui/input";
import { uploadBadgeImage } from "@/lib/supabase";
import { getClientSession } from "@/lib/supabase/client";
import { AlertCircle, Loader2, Upload, X } from "lucide-react";
import { useState } from "react";

interface BadgeImageUploadProps {
  onImageUrlChange: (url: string) => void;
  currentImageUrl?: string;
}

export function BadgeImageUpload({
  onImageUrlChange,
  currentImageUrl,
}: BadgeImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    currentImageUrl || null
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file type
    if (!file.type.startsWith("image/")) {
      const errorMsg = "Please select an image file";
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = "File size must be less than 5MB";
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      console.log("Starting upload...");
      setIsUploading(true);
      setError(null);

      // Get auth token
      const session = await getClientSession();
      if (!session?.access_token) {
        throw new Error("No authentication token available");
      }

      // Upload to Supabase Storage via API
      const publicUrl = await uploadBadgeImage(file, session.access_token);
      console.log("Upload successful! URL:", publicUrl);

      // Update preview and callback
      setPreview(publicUrl);
      onImageUrlChange(publicUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      console.error("Upload error:", errorMessage, err);
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    onImageUrlChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Badge Image
          </label>
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              id="badge-image-input"
            />
            <label
              htmlFor="badge-image-input"
              className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-sm text-gray-600">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Click to upload image
                  </span>
                </>
              )}
            </label>
          </div>
        </div>

        {preview && (
          <div className="flex-shrink-0 relative">
            <img
              src={preview}
              alt="Badge preview"
              className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {preview && (
        <div className="text-xs text-gray-500">
          Image URL: <span className="break-all font-mono">{preview}</span>
        </div>
      )}
    </div>
  );
}
