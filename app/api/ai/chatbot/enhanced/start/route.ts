import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()

    const getContextualWelcome = (context?: string) => {
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

    const welcome = getContextualWelcome(context)
    return NextResponse.json(welcome)
  } catch (error) {
    console.error("Chatbot start error:", error)
    return NextResponse.json(
      {
        message: "Hi there! 👋 I'm your community assistant. How can I help you today?",
        suggestions: [
          "Find events near me",
          "Discover new communities",
          "Help with platform features",
          "Show me recommendations",
        ],
        quickActions: [],
      },
      { status: 200 },
    )
  }
}
