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

CRITICAL: The actionType field MUST be one of these exact values (no other values allowed):
- "continue_conversation" - for general conversation or when asking clarifying questions
- "show_recommendations" - when user wants to see recommendations
- "search_content" - when user is searching for specific content
- "provide_info" - when answering questions about the platform
- "escalate_support" - when user needs human support
- "show_calendar" - when user asks about events or schedule
- "show_profile" - when user wants to see a profile
- "navigate_to" - when user wants to navigate to a specific page

ANALYSIS GUIDELINES:
- If asking about "my events" or "tomorrow" or specific dates, set actionType to "show_calendar"
- If asking about specific content (like "book clubs in Jakarta"), set actionType to "search_content"
- If asking for recommendations or "show me", set actionType to "show_recommendations"
- If asking about platform features or having issues, set actionType to "provide_info"
- If wanting to go somewhere specific, set actionType to "navigate_to"
- If asking clarifying questions or general conversation, set actionType to "continue_conversation"
- Extract location mentions, time references, category preferences, and format preferences
- Identify any exclusions or negative preferences

RESPONSE REQUIREMENTS:
- Be conversational and helpful
- Answer questions directly and accurately - calculate dates, perform math, provide factual information
- When asked mathematical questions, perform the calculations and provide the answer
- When asked factual questions, provide accurate information
- Ask clarifying questions when needed (use actionType "continue_conversation" for this)
- Provide specific, actionable suggestions
- Extract and update user preferences from their message
- IMPORTANT: Always use one of the exact actionType values listed above - never use any other value

REQUIRED JSON STRUCTURE (you MUST follow this exact format):
{
  "response": "Your conversational response text here as a string (NOT an object, NOT a field called 'message')",
  "actionType": "one of the exact values listed above",
  "followUpQuestions": ["optional array of strings"],
  "extractedPreferences": { "optional object" },
  "navigationTarget": "optional string (omit the field if not needed, do NOT set to null)",
  "calendarQuery": "optional string (omit the field if not needed, do NOT set to null)",
  "searchFilters": { "optional object (omit the field if not needed, do NOT set to null)" }
}

CRITICAL: 
- The "response" field MUST be a string, not an object. Do NOT use "message" instead of "response".
- For optional fields, either omit them entirely or provide a value. Do NOT set optional fields to null.`

    try {
      const response = await aiClient.generateObject(prompt, ConversationResponseSchema, {
        systemPrompt:
          "You are a helpful, intelligent community platform assistant. Be friendly, proactive, and solution-oriented. Always use the exact actionType enum values provided - never invent new values. You are capable of answering any type of question - calculate dates, perform math, provide information, and help with the platform. Always provide actual calculated values and answers, never use placeholders.",
      })

      return NextResponse.json(response)
    } catch (error: any) {
      console.error("Enhanced chatbot message error:", error)
      
      if (error?.message?.includes("invalid_enum_value") || error?.message?.includes("parse")) {
        try {
          return NextResponse.json({
            response: "I'd be happy to help you with that! Could you tell me more about what you're looking for?",
            actionType: "continue_conversation",
            followUpQuestions: [
              "What type of community are you interested in?",
              "Are you looking for events or communities?",
              "What location are you interested in?",
            ],
          })
        } catch {
          // Fall through to default error response
        }
      }
      
      return NextResponse.json(
        {
          response: "I'm having trouble processing that right now. Could you try rephrasing your question?",
          actionType: "continue_conversation",
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("Enhanced chatbot route error:", error)
    return NextResponse.json(
      {
        response: "I'm having trouble processing that right now. Could you try rephrasing your question?",
        actionType: "continue_conversation",
      },
      { status: 200 },
    )
  }
}
