import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
  STORAGE_CONFIG,
  getStoragePath,
  generateUniqueFilename,
  isValidImageType,
  isValidFileSize,
} from "@/config/storage";

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
    const locationInput = formData.get("location") as string;
    const locationType = (formData.get("location_type") as string) || "physical";
    const interests = JSON.parse(formData.get("interests") as string);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const profileImage = formData.get("profileImage") as File | null;

    if (!locationInput || !interests || !name || !description) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Handle location - parse and store as JSON for coordinates
    let location: any;
    try {
      // Try to parse as JSON (for locations with coordinates)
      const locationJson = JSON.parse(locationInput);
      // Store the full JSON object with coordinates
      location = locationJson;
    } catch {
      // Not JSON, use as string or create basic object
      location = { address: locationInput };
    }

    let profileImageUrl = null;

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

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Get category_id from first interest
    let categoryId: string | null = null;
    
    if (Array.isArray(interests) && interests.length > 0) {
      // Get the first interest and find its category_id
      const firstInterest = interests[0];
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("name", firstInterest)
        .single();
      
      categoryId = categoryData?.id || null;
    } else if (typeof interests === 'string') {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("name", interests)
        .single();
      
      categoryId = categoryData?.id || null;
    }

    // Create community in database
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .insert({
        name,
        description,
        slug,
        location,
        logo_url: profileImageUrl,
        creator_id: user.id,
        is_private: false,
        member_count: 1,
        category_id: categoryId, // Use category_id instead of category
      })
      .select()
      .single();

    if (communityError) {
      console.error("Error creating community:", communityError);
      return NextResponse.json(
        { error: "Failed to create community in database" },
        { status: 500 }
      );
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from("community_members")
      .insert({
        community_id: community.id,
        user_id: user.id,
        role: "admin",
      });

    if (memberError) {
      console.error("Error adding creator as member:", memberError);
      // Continue anyway, community is created
    }

    // Save all user interests to user_interests table
    if (Array.isArray(interests) && interests.length > 0) {
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
          weight: 1.0 - (index * 0.1), // Decreasing weight for each interest
        }));

        const { error: interestsError } = await supabase
          .from("user_interests")
          .upsert(userInterests, { onConflict: "user_id,category_id" });

        if (interestsError) {
          console.error("Error saving user interests:", interestsError);
          // Continue anyway, community is created
        }
      }
    }

    // Mark onboarding as completed (no need to set user_type anymore)
    // User is now admin of this community via community_members table
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        onboarding_completed: true,
        role_selected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (userUpdateError) {
      console.error("Error updating user:", userUpdateError);
      // Continue anyway, community is created
    }

    // Revalidate paths
    revalidatePath("/communities");
    revalidatePath("/dashboard");

    return NextResponse.json({
      communityId: community.id,
      message: "Community created successfully",
    });
  } catch (error) {
    console.error("Error in community creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
