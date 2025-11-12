import { NextResponse } from "next/server"

export async function POST() {
  try {
    const welcomeMessage =
      "Hi there! 👋 I'm here to help you discover amazing communities and events that match your interests. What are you hoping to gain from joining a community?"

    const suggestions = [
      "Learn new skills",
      "Meet like-minded people",
      "Find networking opportunities",
      "Explore hobbies",
      "Get career guidance",
    ]

    return NextResponse.json({
      message: welcomeMessage,
      suggestions,
    })
  } catch (error) {
    console.error("Chatbot start error:", error)
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 })
  }
}
