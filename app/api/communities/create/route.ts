import { communityController } from "@/lib/controllers";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * @route POST /api/communities/create
 * @description Create a new community with image upload (FormData)
 * @access Private (authenticated users)
 */
export async function POST(request: NextRequest) {
  const response = await communityController.createCommunityWithImage(request);
  
  // Revalidate paths on successful creation
  if (response.status === 201) {
    revalidatePath("/communities");
    revalidatePath("/dashboard");
  }
  
  return response;
}
