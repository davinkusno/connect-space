import { aiClient } from "../ai-client"
import { z } from "zod"

const UserPreferencesSchema = z.object({
  interests: z.array(z.string()),
  communitySize: z.enum(["small", "medium", "large", "any"]),
  format: z.enum(["online", "offline", "hybrid", "any"]),
  activityLevel: z.enum(["low", "moderate", "high", "any"]),
  goals: z.array(z.string()),
  location: z.string().optional(),
  experience: z.enum(["beginner", "intermediate", "advanced", "any"]),
  timeCommitment: z.enum(["minimal", "moderate", "high", "any"]),
})

const RecommendationResponseSchema = z.object({
  communities: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      memberCount: z.number(),
      category: z.string(),
      format: z.string(),
      relevanceScore: z.number(),
      reasoning: z.string(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      date: z.string(),
      time: z.string(),
      location: z.string(),
      format: z.string(),
      relevanceScore: z.number(),
      reasoning: z.string(),
    }),
  ),
  people: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      bio: z.string(),
      skills: z.array(z.string()),
      location: z.string(),
      relevanceScore: z.number(),
      reasoning: z.string(),
    }),
  ),
})

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

export class ChatbotService {
  private conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []

  async startConversation() {
    const welcomeMessage =
      "Hi there! 👋 I'm here to help you discover amazing communities and events that match your interests. What are you hoping to gain from joining a community?"

    this.conversationHistory = [{ role: "assistant", content: welcomeMessage }]

    return {
      message: welcomeMessage,
      suggestions: [
        "Learn new skills",
        "Meet like-minded people",
        "Find networking opportunities",
        "Explore hobbies",
        "Get career guidance",
      ],
    }
  }

  async processUserMessage(message: string, userPreferences?: any) {
    this.conversationHistory.push({ role: "user", content: message })

    const conversationContext = this.conversationHistory
      .slice(-6) // Keep last 6 messages for context
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")

    const prompt = `You are a friendly, helpful chatbot for a community platform. Your role is to:
1. Help users discover relevant communities, events, and people
2. Extract user preferences through natural conversation
3. Provide personalized recommendations
4. Answer questions about the platform
5. Provide support and guidance

Current conversation:
${conversationContext}

User's current preferences: ${JSON.stringify(userPreferences || {})}

Based on the user's latest message, provide a natural, helpful response. If the user is asking about specific content (events, communities, people), set actionType to "search_content". If you have enough information to make recommendations, set actionType to "show_recommendations". If the user needs support, set actionType to "provide_info" or "escalate_support".

Extract any new preferences mentioned in the user's message.`

    try {
      const response = await aiClient.generateObject(prompt, ConversationResponseSchema, {
        systemPrompt:
          "You are a helpful, friendly chatbot that specializes in community discovery and user support. Always be encouraging and personable.",
      })

      this.conversationHistory.push({ role: "assistant", content: response.response })

      return response
    } catch (error) {
      console.error("Chatbot conversation error:", error)
      return {
        response: "I'm sorry, I'm having trouble processing that right now. Could you try rephrasing your question?",
        actionType: "continue_conversation" as const,
      }
    }
  }

  async generateRecommendations(userPreferences: any, feedback?: string) {
    const prompt = `Generate personalized recommendations for a user with these preferences:
${JSON.stringify(userPreferences, null, 2)}

${feedback ? `User feedback on previous recommendations: "${feedback}"` : ""}

Provide 3-5 communities, 3-5 upcoming events, and 2-3 people they should connect with. Include relevance scores (0-100) and brief reasoning for each recommendation.

Consider:
- User's interests and goals
- Preferred community size and format
- Location preferences
- Experience level
- Time commitment preferences
${feedback ? "- Adjust based on the feedback provided" : ""}`

    try {
      // In a real app, this would query your actual database
      const mockRecommendations = {
        communities: [
          {
            id: "c1",
            name: "AI & Machine Learning Hub",
            description: "A community for AI enthusiasts to share knowledge and collaborate on projects",
            memberCount: 2847,
            category: "Technology",
            format: "hybrid",
            relevanceScore: 95,
            reasoning: "Matches your interest in AI and preference for active learning communities",
          },
          {
            id: "c2",
            name: "Local Tech Meetup",
            description: "Weekly meetups for tech professionals in your area",
            memberCount: 156,
            category: "Technology",
            format: "offline",
            relevanceScore: 88,
            reasoning: "Perfect size for networking and matches your location preference",
          },
        ],
        events: [
          {
            id: "e1",
            title: "Introduction to Neural Networks",
            description: "Beginner-friendly workshop on neural network fundamentals",
            date: "2024-02-15",
            time: "6:00 PM",
            location: "Tech Hub Downtown",
            format: "offline",
            relevanceScore: 92,
            reasoning: "Matches your beginner level and interest in hands-on learning",
          },
        ],
        people: [
          {
            id: "p1",
            name: "Dr. Sarah Chen",
            bio: "AI researcher and mentor, loves helping newcomers",
            skills: ["Machine Learning", "Mentoring", "Python"],
            location: "San Francisco",
            relevanceScore: 90,
            reasoning: "Experienced mentor in your field of interest",
          },
        ],
      }

      return mockRecommendations
    } catch (error) {
      console.error("Recommendation generation error:", error)
      throw error
    }
  }

  async handleSupportQuery(query: string) {
    const prompt = `You are a support chatbot for a community platform. Answer this user query helpfully and concisely:

"${query}"

If this is a common question, provide a direct answer. If it requires human support, suggest escalating to a human agent. Cover topics like:
- Account management
- Community guidelines
- Technical issues
- Platform features
- Safety and moderation
- Event management
- Privacy settings`

    try {
      const response = await aiClient.generateText(prompt, {
        systemPrompt:
          "You are a helpful support agent. Be concise, friendly, and solution-oriented. If you can't help, suggest escalating to human support.",
      })

      return response
    } catch (error) {
      console.error("Support query error:", error)
      return "I'm having trouble processing your request right now. Please try again or contact our support team directly."
    }
  }

  async searchContent(query: string, contentType: "communities" | "events" | "people" | "all" = "all") {
    const prompt = `Search for ${contentType} based on this query: "${query}"

Return relevant results with brief descriptions and relevance scores. Consider:
- Keywords in the query
- Location mentions
- Time preferences
- Skill level indicators
- Format preferences (online/offline)`

    try {
      // In a real app, this would perform actual search
      const mockResults = {
        communities: query.toLowerCase().includes("book")
          ? [
              {
                id: "c3",
                name: "Jakarta Book Club",
                description: "Monthly book discussions for literature lovers in Jakarta",
                memberCount: 89,
                location: "Jakarta",
                relevanceScore: 95,
              },
            ]
          : [],
        events: query.toLowerCase().includes("tomorrow")
          ? [
              {
                id: "e2",
                title: "Morning Yoga Session",
                description: "Start your day with mindful movement",
                date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
                time: "7:00 AM",
                location: "Central Park",
                relevanceScore: 85,
              },
            ]
          : [],
        people: [],
      }

      return mockResults
    } catch (error) {
      console.error("Content search error:", error)
      throw error
    }
  }

  getConversationHistory() {
    return this.conversationHistory
  }

  clearConversation() {
    this.conversationHistory = []
  }
}

export const chatbotService = new ChatbotService()
