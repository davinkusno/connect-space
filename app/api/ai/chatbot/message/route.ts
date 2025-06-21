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

Guidelines:
- If the user mentions specific interests, extract them
- If they mention location, size preferences, or format preferences, extract those
- If they're asking about specific content (like "events tomorrow" or "book clubs in Jakarta"), set actionType to "search_content"
- If you have enough information to make recommendations, set actionType to "show_recommendations"
- If they need support or have questions about the platform, set actionType to "provide_info"
- Always be encouraging and ask follow-up questions to better understand their needs

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
