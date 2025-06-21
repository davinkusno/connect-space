import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { messageId, feedback } = await request.json()

    // In a real app, you would store this feedback in your database
    // to improve the chatbot's responses over time
    console.log(`Feedback received for message ${messageId}: ${feedback}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Feedback error:", error)
    return NextResponse.json({ error: "Failed to record feedback" }, { status: 500 })
  }
}
