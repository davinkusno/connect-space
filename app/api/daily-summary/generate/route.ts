import { type NextRequest, NextResponse } from "next/server"
import { DailySummaryService } from "@/lib/ai-services/daily-summary-service"

export async function POST(request: NextRequest) {
  try {
    const { userId, date } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const summaryService = DailySummaryService.getInstance()

    // Get user preferences
    const preferences = await summaryService.getSummaryPreferences(userId)

    // Get user activity data
    const activityData = await summaryService.getUserActivityData(
      userId,
      date || new Date().toISOString().split("T")[0],
    )

    // Generate the daily summary
    const summary = await summaryService.generateDailySummary(activityData, preferences)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("Error generating daily summary:", error)
    return NextResponse.json({ error: "Failed to generate daily summary" }, { status: 500 })
  }
}
