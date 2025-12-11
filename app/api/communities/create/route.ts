import {
    generateUniqueFilename, getStoragePath, isValidFileSize, isValidImageType, STORAGE_CONFIG
} from "@/config/storage";
import { communityController } from "@/lib/controllers";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Create Supabase client with service role key for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const interests = JSON.parse(formData.get("interests") as string);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const profileImage = formData.get("profileImage") as File | null;

    if (!interests || !name || !description) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate description word count (max 500 words)
    const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 500) {
      return NextResponse.json(
        { error: "Description must be 500 words or less. Current word count: " + wordCount },
        { status: 400 }
      );
    }

    let profileImageUrl: string | undefined = undefined;

    // Handle profile image upload if provided (using service role for bypassing RLS)
    if (profileImage && profileImage.size > 0) {
      // Validate file type
      if (!isValidImageType(profileImage.type)) {
        return NextResponse.json(
          { error: "File must be an image (JPEG, PNG, GIF, or WebP)" },
          { status: 400 }
        );
      }

      // Validate file size
      if (!isValidFileSize(profileImage.size, "community")) {
        const maxSizeMB = STORAGE_CONFIG.limits.community / (1024 * 1024);
        return NextResponse.json(
          { error: `File size must be less than ${maxSizeMB}MB` },
          { status: 400 }
        );
      }

      // Generate unique filename and path
      const filename = generateUniqueFilename(profileImage.name);
      const path = getStoragePath("communityProfile", filename);

      // Convert File to ArrayBuffer
      const arrayBuffer = await profileImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage (service role bypasses RLS)
      const { data, error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.bucket)
        .upload(path, buffer, {
          contentType: profileImage.type,
          cacheControl: STORAGE_CONFIG.cacheControl,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: uploadError.message || "Upload failed" },
          { status: 500 }
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage
        .from(STORAGE_CONFIG.bucket)
        .getPublicUrl(data.path);

      profileImageUrl = publicUrl;
    }

    // Get category name from interests
    let categoryName: string | undefined = undefined;
    if (Array.isArray(interests) && interests.length > 0) {
      categoryName = interests[0];
    } else if (typeof interests === "string") {
      categoryName = interests;
    }

    // Create community using the service (via controller logic)
    // We create a synthetic request with JSON body for the controller
    const jsonRequest = new NextRequest(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        logoUrl: profileImageUrl,
        categoryName,
      }),
    });

    // Use the controller to create the community
    const result = await communityController.createCommunity(jsonRequest);

    // If successful, also save user interests
    if (result.status === 201 && Array.isArray(interests) && interests.length > 0) {
      // Get all category IDs for the interests
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("id, name")
        .in("name", interests);

      if (categoriesData && categoriesData.length > 0) {
        // Create user_interests records
        const userInterests = categoriesData.map((cat, index) => ({
          user_id: user.id,
          category_id: cat.id,
          weight: 1.0 - (index * 0.1),
        }));

        await supabase
          .from("user_interests")
          .upsert(userInterests, { onConflict: "user_id,category_id" });
      }

      // Mark onboarding as completed
      await supabase
        .from("users")
        .update({
          onboarding_completed: true,
          role_selected: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    // Revalidate paths
    revalidatePath("/communities");
    revalidatePath("/dashboard");

    return result;
  } catch (error) {
    console.error("Error in community creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
