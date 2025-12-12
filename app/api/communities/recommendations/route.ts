import { recommendationController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * @route GET /api/communities/recommendations
 * @description Get recommended communities for the current user
 * @access Private (authenticated users)
 */
export async function GET(request: NextRequest) {
  return recommendationController.getCommunityRecommendations(request);
}
