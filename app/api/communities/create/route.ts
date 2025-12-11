import { communityService } from "@/lib/services";
import { storageService } from "@/lib/services/storage.service";
import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

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

    // Parse form data
    const formData = await request.formData();
    const interests = JSON.parse(formData.get("interests") as string);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const profileImage = formData.get("profileImage") as File | null;

    // Validate required fields
    if (!interests || !name || !description) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Handle profile image upload if provided
    let profileImageUrl: string | undefined = undefined;
    if (profileImage && profileImage.size > 0) {
      const uploadResult = await storageService.uploadImage(profileImage, "community");
      
      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error?.message || "Failed to upload image" },
          { status: uploadResult.status }
        );
      }
      
      profileImageUrl = uploadResult.data?.url;
    }

    // Get category name from interests
    const interestsArray = Array.isArray(interests) ? interests : [interests];
    const categoryName = interestsArray[0];

    // Create community using the service
    const result = await communityService.createCommunity(
      {
        name,
        description,
        logoUrl: profileImageUrl,
        categoryName,
        interests: interestsArray,
        completeOnboarding: true,
      },
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || "Failed to create community" },
        { status: result.status }
      );
    }

    // Revalidate paths
    revalidatePath("/communities");
    revalidatePath("/dashboard");

    return NextResponse.json({
      communityId: result.data?.id,
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
