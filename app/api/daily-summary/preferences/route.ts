import { type NextRequest, NextResponse } from "next/server"
import { DailySummaryService } from "@/lib/ai-services/daily-summary-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const summaryService = DailySummaryService.getInstance()
    const preferences = await summaryService.getSummaryPreferences(userId)

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const preferences = await request.json()

    if (!preferences.userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const summaryService = DailySummaryService.getInstance()
    await summaryService.saveSummaryPreferences(preferences)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving preferences:", error)
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 })
  }
}
