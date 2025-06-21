import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

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
      {
        id: "ue3",
        title: "Morning Yoga",
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        time: "8:00 AM",
        location: "Central Park",
        status: "maybe",
        community: "Wellness Group",
      },
    ]

    // Filter based on query
    let filteredEvents = mockEvents

    if (query.toLowerCase().includes("tomorrow")) {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
      filteredEvents = mockEvents.filter((event) => event.date === tomorrow)
    } else if (query.toLowerCase().includes("this week")) {
      const weekFromNow = new Date(Date.now() + 7 * 86400000)
      filteredEvents = mockEvents.filter((event) => new Date(event.date) <= weekFromNow)
    } else if (query.toLowerCase().includes("today")) {
      const today = new Date().toISOString().split("T")[0]
      filteredEvents = mockEvents.filter((event) => event.date === today)
    }

    return NextResponse.json(filteredEvents)
  } catch (error) {
    console.error("Calendar events error:", error)
    return NextResponse.json([], { status: 200 })
  }
}
