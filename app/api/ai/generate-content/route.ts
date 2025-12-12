import { aiController } from "@/lib/controllers";
import { NextRequest } from "next/server";

/**
 * @route POST /api/ai/generate-content
 * @description Generate content using AI (community description, tags, rules, event description, agenda)
 * @access Public (no auth required for content generation)
 */
export async function POST(request: NextRequest) {
  return aiController.generateContent(request);
}
