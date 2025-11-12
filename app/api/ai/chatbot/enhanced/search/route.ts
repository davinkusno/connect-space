import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query, filters } = await request.json()

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

    if (query.toLowerCase().includes("tech") || query.toLowerCase().includes("technology")) {
      searchResults.communities.push({
        id: "c4",
        name: "Tech Meetup Group",
        description: "Weekly tech discussions and networking",
        memberCount: 456,
        location: "San Francisco",
        category: "Technology",
        relevanceScore: 90,
        tags: ["Technology", "Networking", "Meetup"],
      })
    }

    searchResults.totalResults =
      searchResults.communities.length + searchResults.events.length + searchResults.people.length

    return NextResponse.json(searchResults)
  } catch (error) {
    console.error("Enhanced search error:", error)
    return NextResponse.json({ communities: [], events: [], people: [], totalResults: 0 }, { status: 200 })
  }
}
