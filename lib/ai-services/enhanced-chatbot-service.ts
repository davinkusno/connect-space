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
  priceRange: z.enum(["free", "paid", "any"]),
  excludedCategories: z.array(z.string()).optional(),
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

export class EnhancedChatbotService {
  private conversationHistory: Array<{ role: "user" | "assistant"; content: string; timestamp: Date }> = []
  private userContext: any = {}

  async startConversation(context?: string) {
    const contextualWelcome = this.getContextualWelcome(context)

    this.conversationHistory = [
      {
        role: "assistant",
        content: contextualWelcome.message,
        timestamp: new Date(),
      },
    ]

    return {
      message: contextualWelcome.message,
      suggestions: contextualWelcome.suggestions,
      quickActions: contextualWelcome.quickActions,
    }
  }

  private getContextualWelcome(context?: string) {
    switch (context) {
      case "dashboard":
        return {
          message:
            "Hi! 👋 I'm here to help you navigate your dashboard and discover new opportunities. What would you like to explore today?",
          suggestions: [
            "Show me my upcoming events",
            "Find new communities to join",
            "What's trending in my interests?",
            "Help me plan my week",
          ],
          quickActions: [
            { label: "My Calendar", action: "show_calendar" },
            { label: "Recommendations", action: "show_recommendations" },
            { label: "Browse Events", action: "navigate_to", target: "/events" },
          ],
        }
      case "events":
        return {
          message:
            "Looking for events? I can help you find the perfect ones based on your interests, location, and schedule!",
          suggestions: [
            "Events happening this weekend",
            "Tech meetups near me",
            "Free events tomorrow",
            "Online workshops this week",
          ],
          quickActions: [
            { label: "Create Event", action: "navigate_to", target: "/events/create" },
            { label: "My Wishlist", action: "navigate_to", target: "/wishlist" },
          ],
        }
      case "discover":
        return {
          message:
            "Ready to discover amazing communities? Tell me about your interests and I'll help you find the perfect match!",
          suggestions: [
            "I'm interested in technology",
            "Find book clubs in my area",
            "Show me creative communities",
            "I want to learn new skills",
          ],
          quickActions: [
            { label: "Browse All", action: "navigate_to", target: "/discover" },
            { label: "Create Community", action: "navigate_to", target: "/create-community" },
          ],
        }
      default:
        return {
          message:
            "Hi there! 👋 I'm your community assistant. I can help you discover events, find communities, answer questions, and much more!",
          suggestions: [
            "Find events near me",
            "Discover new communities",
            "Help with platform features",
            "Show me recommendations",
          ],
          quickActions: [
            { label: "Dashboard", action: "navigate_to", target: "/dashboard" },
            { label: "Discover", action: "navigate_to", target: "/discover" },
          ],
        }
    }
  }

  async processUserMessage(message: string, userPreferences?: any, context?: string) {
    this.conversationHistory.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    })

    const conversationContext = this.conversationHistory
      .slice(-8)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")

    const prompt = `You are an advanced AI assistant for a community platform. Your capabilities include:

1. CONTENT DISCOVERY: Help users find communities, events, and people
2. CALENDAR QUERIES: Answer questions about user's schedule and upcoming events
3. PLATFORM SUPPORT: Provide help with features, guidelines, and troubleshooting
4. NAVIGATION: Guide users to relevant sections of the platform
5. PERSONALIZATION: Learn and adapt to user preferences

Current context: ${context || "general"}
Conversation history:
${conversationContext}

User's current preferences: ${JSON.stringify(userPreferences || {})}

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

    try {
      const response = await aiClient.generateObject(prompt, ConversationResponseSchema, {
        systemPrompt:
          "You are a helpful, intelligent community platform assistant. Be friendly, proactive, and solution-oriented.",
      })

      this.conversationHistory.push({
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      })

      return response
    } catch (error) {
      console.error("Enhanced chatbot conversation error:", error)
      return {
        response: "I'm having trouble processing that right now. Could you try rephrasing your question?",
        actionType: "continue_conversation" as const,
      }
    }
  }

  async processFeedback(feedback: string, currentPreferences: any, lastRecommendations: any[]) {
    const prompt = `The user provided feedback on recommendations: "${feedback}"

Current preferences: ${JSON.stringify(currentPreferences)}
Last recommendations: ${JSON.stringify(lastRecommendations)}

Based on this feedback, update the user's preferences and provide a response. Common feedback patterns:
- "Too big" → prefer smaller communities
- "Too small" → prefer larger communities  
- "Online only" → format preference to online
- "In person only" → format preference to offline
- "Too expensive" → prefer free events
- "Not interested in [topic]" → add to excluded categories
- "More [topic]" → add to interests
- "Closer to me" → location preference
- "Different time" → time preference

Provide updated preferences and a helpful response.`

    try {
      const response = await aiClient.generateObject(prompt, FeedbackResponseSchema, {
        systemPrompt: "You are helping refine user preferences based on their feedback. Be understanding and adaptive.",
      })

      return response
    } catch (error) {
      console.error("Feedback processing error:", error)
      return {
        updatedPreferences: currentPreferences,
        response: "I understand your feedback. Let me adjust my suggestions for you.",
        newRecommendations: true,
      }
    }
  }

  async generateRecommendations(userPreferences: any, context?: string, excludeIds?: string[]) {
    // Enhanced recommendation logic with context awareness
    const mockRecommendations = {
      communities: [
        {
          id: "c1",
          name: "Jakarta Book Club",
          description: "Monthly book discussions for literature lovers in Jakarta",
          memberCount: 89,
          category: "Literature",
          format: "offline",
          location: "Jakarta",
          relevanceScore: 95,
          reasoning: "Matches your interest in books and Jakarta location",
          tags: ["Books", "Literature", "Discussion"],
          nextEvent: "2024-02-20",
        },
        {
          id: "c2",
          name: "Tech Innovators Online",
          description: "Global community for technology enthusiasts",
          memberCount: 2847,
          category: "Technology",
          format: "online",
          location: "Global",
          relevanceScore: 88,
          reasoning: "Perfect for tech interests with online format",
          tags: ["Technology", "Innovation", "Online"],
          nextEvent: "2024-02-18",
        },
      ],
      events: [
        {
          id: "e1",
          title: "Morning Yoga Session",
          description: "Start your day with mindful movement",
          date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          time: "7:00 AM",
          location: "Central Park",
          format: "offline",
          price: 0,
          category: "Health",
          relevanceScore: 85,
          reasoning: "Tomorrow morning event matching your wellness interests",
          attendees: 15,
          maxAttendees: 20,
        },
        {
          id: "e2",
          title: "Virtual AI Workshop",
          description: "Learn about artificial intelligence fundamentals",
          date: "2024-02-19",
          time: "6:00 PM",
          location: "Online",
          format: "online",
          price: 25,
          category: "Technology",
          relevanceScore: 92,
          reasoning: "Matches your tech interests with online convenience",
          attendees: 45,
          maxAttendees: 100,
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
          communities: ["Tech Innovators", "AI Research Group"],
          availability: "Available for mentoring",
        },
      ],
    }

    // Filter out excluded IDs
    if (excludeIds?.length) {
      mockRecommendations.communities = mockRecommendations.communities.filter((c) => !excludeIds.includes(c.id))
      mockRecommendations.events = mockRecommendations.events.filter((e) => !excludeIds.includes(e.id))
      mockRecommendations.people = mockRecommendations.people.filter((p) => !excludeIds.includes(p.id))
    }

    return mockRecommendations
  }

  async searchContent(query: string, filters?: any) {
    // Enhanced search with better query understanding
    const searchResults = {
      communities: [],
      events: [],
      people: [],
      totalResults: 0,
    }

    // Parse query for specific patterns
    if (query.toLowerCase().includes("book") && query.toLowerCase().includes("jakarta")) {
      searchResults.communities.push({
        id: "c3",
        name: "Jakarta Book Club",
        description: "Monthly book discussions for literature lovers in Jakarta",
        memberCount: 89,
        location: "Jakarta",
        category: "Literature",
        relevanceScore: 95,
        tags: ["Books", "Literature", "Jakarta"],
      })
    }

    if (query.toLowerCase().includes("tomorrow") || query.toLowerCase().includes("events")) {
      searchResults.events.push({
        id: "e3",
        title: "Morning Yoga Session",
        description: "Start your day with mindful movement",
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        time: "7:00 AM",
        location: "Central Park",
        relevanceScore: 85,
        category: "Health",
      })
    }

    searchResults.totalResults =
      searchResults.communities.length + searchResults.events.length + searchResults.people.length

    return searchResults
  }

  async getCalendarEvents(query: string, userEvents?: any[]) {
    // Mock user events - in real app, this would query the user's actual calendar
    const mockEvents = [
      {
        id: "ue1",
        title: "AI & Machine Learning Workshop",
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        time: "6:00 PM",
        location: "WeWork SoHo",
        status: "attending",
        community: "Tech Innovators",
      },
      {
        id: "ue2",
        title: "Book Club Meeting",
        date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
        time: "7:00 PM",
        location: "Local Library",
        status: "attending",
        community: "Jakarta Book Club",
      },
    ]

    // Filter based on query
    if (query.toLowerCase().includes("tomorrow")) {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
      return mockEvents.filter((event) => event.date === tomorrow)
    }

    if (query.toLowerCase().includes("this week")) {
      const weekFromNow = new Date(Date.now() + 7 * 86400000)
      return mockEvents.filter((event) => new Date(event.date) <= weekFromNow)
    }

    return mockEvents
  }

  async handleSupportQuery(query: string) {
    const supportTopics = {
      "join community":
        "To join a community, visit the community page and click the 'Join' button. You may need to answer a few questions or wait for approval depending on the community's settings.",
      "create event":
        "To create an event, go to the Events page and click 'Create Event'. Fill in the details like title, description, date, time, and location. You can also set it as public or private.",
      "community guidelines":
        "Our community guidelines promote respectful interaction, authentic engagement, and inclusive participation. No harassment, spam, or inappropriate content is allowed.",
      "technical issues":
        "For technical issues, try refreshing the page first. If the problem persists, check your internet connection and clear your browser cache. Contact support if issues continue.",
      "privacy settings":
        "You can manage your privacy settings in your profile. Control who can see your activity, send you messages, and invite you to events.",
      notifications:
        "Manage notifications in your settings. You can choose to receive notifications for new events, community updates, messages, and more.",
    }

    const queryLower = query.toLowerCase()
    for (const [topic, answer] of Object.entries(supportTopics)) {
      if (queryLower.includes(topic)) {
        return answer
      }
    }

    return "I'd be happy to help! Could you be more specific about what you need assistance with? You can ask about joining communities, creating events, privacy settings, or any other platform features."
  }

  getConversationHistory() {
    return this.conversationHistory
  }

  clearConversation() {
    this.conversationHistory = []
    this.userContext = {}
  }

  exportConversation() {
    return {
      history: this.conversationHistory,
      context: this.userContext,
      exportedAt: new Date().toISOString(),
    }
  }
}

export const enhancedChatbotService = new EnhancedChatbotService()
