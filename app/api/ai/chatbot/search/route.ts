import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    // In a real app, this would perform actual search against your database
    const mockResults: any = {
      communities: [],
      events: [],
      people: [],
    }

    // Simple keyword matching for demo
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes("book")) {
      mockResults.communities.push({
        id: "c3",
        name: "Jakarta Book Club",
        description: "Monthly book discussions for literature lovers in Jakarta",
        memberCount: 89,
        location: "Jakarta",
        relevanceScore: 95,
        reasoning: "Matches your search for book clubs in Jakarta",
      })
    }

    if (lowerQuery.includes("tomorrow")) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      mockResults.events.push({
        id: "e3",
        title: "Morning Yoga Session",
        description: "Start your day with mindful movement",
        date: tomorrow.toISOString().split("T")[0],
        time: "7:00 AM",
        location: "Central Park",
        relevanceScore: 85,
        reasoning: "Event happening tomorrow as requested",
      })
    }

    if (lowerQuery.includes("tech") || lowerQuery.includes("programming")) {
      mockResults.communities.push({
        id: "c4",
        name: "Tech Innovators",
        description: "Community for technology enthusiasts and innovators",
        memberCount: 1247,
        category: "Technology",
        relevanceScore: 90,
        reasoning: "Matches your interest in technology",
      })
    }

    return NextResponse.json(mockResults)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Failed to search content" }, { status: 500 })
  }
}
