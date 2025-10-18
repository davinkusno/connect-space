import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
    const location = formData.get("location") as string;
    const interests = JSON.parse(formData.get("interests") as string);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const profileImage = formData.get("profileImage") as File | null;

    if (!location || !interests || !name || !description) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    let profileImageUrl = null;

    // Handle profile image upload if provided
    if (profileImage && profileImage.size > 0) {
      const fileExt = profileImage.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `community-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("community-assets")
        .upload(filePath, profileImage);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload profile image" },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("community-assets").getPublicUrl(filePath);

      profileImageUrl = publicUrl;
    }

    // For now, return a mock response since database schema needs to be set up
    // TODO: Set up proper database schema in Supabase
    const mockCommunityId = `community_${Date.now()}`;

    return NextResponse.json({
      communityId: mockCommunityId,
      message:
        "Community created successfully (mock response - database setup needed)",
    });
  } catch (error) {
    console.error("Error in community creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
