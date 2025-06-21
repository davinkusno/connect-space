import { type NextRequest, NextResponse } from "next/server"
import { aiClient } from "@/lib/ai-client"
import { z } from "zod"

const ConversationResponseSchema = z.object({
  response: z.string(),
  followUpQuestions: z.array(z.string()).optional(),
  actionType: z.enum([
    "continue_conversation",
    "show_recommendations",
    "search_content",
    "provide_info",
    "escalate_support",
    "show_calendar",
    "show_profile",
    "navigate_to",
  ]),
  extractedPreferences: z
    .object({
      interests: z.array(z.string()).optional(),
      communitySize: z.string().optional(),
      format: z.string().optional(),
      location: z.string().optional(),
      goals: z.array(z.string()).optional(),
      priceRange: z.string().optional(),
      excludedCategories: z.array(z.string()).optional(),
    })
    .optional(),
  navigationTarget: z.string().optional(),
  calendarQuery: z.string().optional(),
  searchFilters: z
    .object({
      category: z.string().optional(),
      location: z.string().optional(),
      timeframe: z.string().optional(),
      format: z.string().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { message, userPreferences, context, excludedRecommendations } = await request.json()

    const prompt = `You are an advanced AI assistant for a community platform. Your capabilities include:

1. CONTENT DISCOVERY: Help users find communities, events, and people
2. CALENDAR QUERIES: Answer questions about user's schedule and upcoming events
3. PLATFORM SUPPORT: Provide help with features, guidelines, and troubleshooting
4. NAVIGATION: Guide users to relevant sections of the platform
5. PERSONALIZATION: Learn and adapt to user preferences

Current context: ${context || "general"}
User's current preferences: ${JSON.stringify(userPreferences || {})}
Excluded recommendations: ${JSON.stringify(excludedRecommendations || [])}

User message: "${message}"

ANALYSIS GUIDELINES:
- If asking about "my events" or "tomorrow" or specific dates, set actionType to "show_calendar"
- If asking about specific content (like "book clubs in Jakarta"), set actionType to "search_content"
- If asking for recommendations or "show me", set actionType to "show_recommendations"
- If asking about platform features or having issues, set actionType to "provide_info"
- If wanting to go somewhere specific, set actionType to "navigate_to"
- Extract location mentions, time references, category preferences, and format preferences
- Identify any exclusions or negative preferences

RESPONSE REQUIREMENTS:
- Be conversational and helpful
- Ask clarifying questions when needed
- Provide specific, actionable suggestions
- Extract and update user preferences from their message`

    const response = await aiClient.generateObject(prompt, ConversationResponseSchema, {
      systemPrompt:
        "You are a helpful, intelligent community platform assistant. Be friendly, proactive, and solution-oriented.",
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Enhanced chatbot message error:", error)
    return NextResponse.json(
      {
        response: "I'm having trouble processing that right now. Could you try rephrasing your question?",
        actionType: "continue_conversation",
      },
      { status: 200 },
    )
  }
}
