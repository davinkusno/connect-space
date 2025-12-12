import { recommendationController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * @route GET /api/events/recommendations
 * @description Get recommended events for the current user
 * @access Private (authenticated users)
 */
export async function GET(request: NextRequest) {
  return recommendationController.getEventRecommendations(request);
}
