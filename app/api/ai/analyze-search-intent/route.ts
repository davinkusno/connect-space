import { type NextRequest, NextResponse } from "next/server"
import { smartSearch } from "@/lib/ai-services/smart-search"

export async function POST(request: NextRequest) {
  try {
    const { query, userContext } = await request.json()

    const result = await smartSearch.analyzeSearchIntent(query, userContext)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("Search intent analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze search intent" }, { status: 500 })
  }
}
