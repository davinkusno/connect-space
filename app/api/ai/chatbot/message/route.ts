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
  ]),
  extractedPreferences: z
    .object({
      interests: z.array(z.string()).optional(),
      communitySize: z.string().optional(),
      format: z.string().optional(),
      location: z.string().optional(),
      goals: z.array(z.string()).optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { message, userPreferences } = await request.json()

    const prompt = `You are a friendly, helpful chatbot for a community platform. Your role is to:
1. Help users discover relevant communities, events, and people
2. Extract user preferences through natural conversation
3. Provide personalized recommendations
4. Answer questions about the platform
5. Provide support and guidance

User message: "${message}"
User's current preferences: ${JSON.stringify(userPreferences || {})}

Based on the user's message, provide a natural, helpful response. 

CRITICAL: The actionType field MUST be one of these exact values (no other values allowed):
- "continue_conversation" - for general conversation or when asking clarifying questions
- "show_recommendations" - when user wants to see recommendations
- "search_content" - when user is searching for specific content
- "provide_info" - when answering questions about the platform
- "escalate_support" - when user needs human support

Guidelines:
- If the user mentions specific interests, extract them
- If they mention location, size preferences, or format preferences, extract those
- If they're asking about specific content (like "events tomorrow" or "book clubs in Jakarta"), set actionType to "search_content"
- If you have enough information to make recommendations, set actionType to "show_recommendations"
- If they need support or have questions about the platform, set actionType to "provide_info"
- If asking clarifying questions or general conversation, set actionType to "continue_conversation"
- Always be encouraging and ask follow-up questions to better understand their needs
- IMPORTANT: Always use one of the exact actionType values listed above - never use any other value

REQUIRED JSON STRUCTURE (you MUST follow this exact format):
{
  "response": "Your conversational response text here as a string (NOT an object, NOT a field called 'message')",
  "actionType": "one of the exact values listed above",
  "followUpQuestions": ["optional array of strings"],
  "extractedPreferences": { "optional object" }
}

CRITICAL: The "response" field MUST be a string, not an object. Do NOT use "message" instead of "response".

Extract any new preferences mentioned in the user's message.`

    const response = await aiClient.generateObject(prompt, ConversationResponseSchema, {
      systemPrompt:
        "You are a helpful, friendly chatbot that specializes in community discovery and user support. Always be encouraging and personable.",
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Chatbot message error:", error)
    return NextResponse.json(
      {
        response: "I'm sorry, I'm having trouble processing that right now. Could you try rephrasing your question?",
        actionType: "continue_conversation",
      },
      { status: 200 },
    )
  }
}
