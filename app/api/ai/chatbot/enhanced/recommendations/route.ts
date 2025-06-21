import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userPreferences, context, excludeIds } = await request.json()

    // Enhanced recommendation logic with context awareness
    const mockRecommendations = {
      communities: [
        {
          id: "c1",
          name: "Jakarta Book Club",
          description: "Monthly book discussions for literature lovers in Jakarta",
          memberCount: 89,
          category: "Literature",
          format: "offline",
          location: "Jakarta",
          relevanceScore: 95,
          reasoning: "Matches your interest in books and Jakarta location",
          tags: ["Books", "Literature", "Discussion"],
          nextEvent: "2024-02-20",
        },
        {
          id: "c2",
          name: "Tech Innovators Online",
          description: "Global community for technology enthusiasts",
          memberCount: 2847,
          category: "Technology",
          format: "online",
          location: "Global",
          relevanceScore: 88,
          reasoning: "Perfect for tech interests with online format",
          tags: ["Technology", "Innovation", "Online"],
          nextEvent: "2024-02-18",
        },
      ],
      events: [
        {
          id: "e1",
          title: "Morning Yoga Session",
          description: "Start your day with mindful movement",
          date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          time: "7:00 AM",
          location: "Central Park",
          format: "offline",
          price: 0,
          category: "Health",
          relevanceScore: 85,
          reasoning: "Tomorrow morning event matching your wellness interests",
          attendees: 15,
          maxAttendees: 20,
        },
        {
          id: "e2",
          title: "Virtual AI Workshop",
          description: "Learn about artificial intelligence fundamentals",
          date: "2024-02-19",
          time: "6:00 PM",
          location: "Online",
          format: "online",
          price: 25,
          category: "Technology",
          relevanceScore: 92,
          reasoning: "Matches your tech interests with online convenience",
          attendees: 45,
          maxAttendees: 100,
        },
      ],
      people: [
        {
          id: "p1",
          name: "Dr. Sarah Chen",
          bio: "AI researcher and mentor, loves helping newcomers",
          skills: ["Machine Learning", "Mentoring", "Python"],
          location: "San Francisco",
          relevanceScore: 90,
          reasoning: "Experienced mentor in your field of interest",
          communities: ["Tech Innovators", "AI Research Group"],
          availability: "Available for mentoring",
        },
      ],
    }

    // Filter out excluded IDs
    if (excludeIds?.length) {
      mockRecommendations.communities = mockRecommendations.communities.filter((c) => !excludeIds.includes(c.id))
      mockRecommendations.events = mockRecommendations.events.filter((e) => !excludeIds.includes(e.id))
      mockRecommendations.people = mockRecommendations.people.filter((p) => !excludeIds.includes(p.id))
    }

    return NextResponse.json(mockRecommendations)
  } catch (error) {
    console.error("Enhanced recommendations error:", error)
    return NextResponse.json({ communities: [], events: [], people: [] }, { status: 200 })
  }
}
