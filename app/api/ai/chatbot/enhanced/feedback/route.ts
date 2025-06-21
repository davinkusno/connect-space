import { type NextRequest, NextResponse } from "next/server"
import { aiClient } from "@/lib/ai-client"
import { z } from "zod"

const FeedbackResponseSchema = z.object({
  updatedPreferences: z.object({
    interests: z.array(z.string()).optional(),
    communitySize: z.string().optional(),
    format: z.string().optional(),
    location: z.string().optional(),
    priceRange: z.string().optional(),
    excludedCategories: z.array(z.string()).optional(),
  }),
  response: z.string(),
  newRecommendations: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const { feedback, currentPreferences, lastRecommendations, messageId } = await request.json()

    if (typeof feedback === "string" && currentPreferences && lastRecommendations) {
      // Text feedback for refinement
      const prompt = `The user provided feedback on recommendations: "${feedback}"

Current preferences: ${JSON.stringify(currentPreferences)}
Last recommendations: ${JSON.stringify(lastRecommendations)}

Based on this feedback, update the user's preferences and provide a response. Common feedback patterns:
- "Too big" → prefer smaller communities (communitySize: "small")
- "Too small" → prefer larger communities (communitySize: "large")
- "Online only" → format preference to online
- "In person only" → format preference to offline
- "Too expensive" → prefer free events (priceRange: "free")
- "Not interested in [topic]" → add to excluded categories
- "More [topic]" → add to interests
- "Closer to me" → location preference
- "Different time" → time preference

Provide updated preferences and a helpful response.`

      const response = await aiClient.generateObject(prompt, FeedbackResponseSchema, {
        systemPrompt: "You are helping refine user preferences based on their feedback. Be understanding and adaptive.",
      })

      return NextResponse.json(response)
    } else {
      // Simple positive/negative feedback
      const currentPreferences = {} // Declare currentPreferences variable
      return NextResponse.json({
        success: true,
        message: feedback === "positive" ? "Thanks for the feedback!" : "I'll try to improve",
      })
    }
  } catch (error) {
    console.error("Feedback processing error:", error)
    const currentPreferences = {} // Declare currentPreferences variable
    return NextResponse.json(
      {
        updatedPreferences: currentPreferences || {},
        response: "I understand your feedback. Let me adjust my suggestions for you.",
        newRecommendations: true,
      },
      { status: 200 },
    )
  }
}
