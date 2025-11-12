import { type NextRequest, NextResponse } from "next/server"
import { smartSearch } from "@/lib/ai-services/smart-search"

export async function POST(request: NextRequest) {
  try {
    const { query, userContext } = await request.json()

    const result = await smartSearch.generateSearchSuggestions(query, userContext)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Parse the AI response into structured suggestions
    const suggestions = result.data
      .split("\n")
      .filter(Boolean)
      .map((suggestion: string) => suggestion.trim())
      .slice(0, 8)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Search suggestions error:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
