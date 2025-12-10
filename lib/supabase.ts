import { extractPathFromUrl, STORAGE_CONFIG } from "@/config/storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function untuk get public URL
export const getPublicUrl = (bucket: string, path: string) => {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

// Helper function untuk upload file ke badges folder via API
export const uploadBadgeImage = async (file: File, authToken: string) => {
  console.log(
    "Starting upload for file:",
    file.name,
    "Size:",
    file.size,
    "Type:",
    file.type
  );

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/badges/upload-image", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Upload failed");
  }

  const data = await response.json();
  console.log("Upload successful! URL:", data.url);

  return data.url;
};

// Helper function untuk delete file
export const deleteBadgeImage = async (imageUrl: string) => {
  // Extract path from URL using config
  const path = extractPathFromUrl(imageUrl, "badges");
  if (!path) throw new Error("Invalid image URL");

  const { error } = await supabase.storage
    .from(STORAGE_CONFIG.bucket)
    .remove([path]);

  if (error) throw error;
};
