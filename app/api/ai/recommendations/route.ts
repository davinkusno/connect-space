import { type NextRequest, NextResponse } from "next/server"
import { recommendationEngine } from "@/lib/ai-services/recommendation-engine"

export async function POST(request: NextRequest) {
  try {
    const { userId, userProfile, maxRecommendations, types } = await request.json()

    // Mock user activity data - in a real app, this would come from your database
    const mockUserActivity = {
      joinedCommunities: [
        { name: "Tech Innovators", category: "Technology" },
        { name: "Startup Founders", category: "Business" },
      ],
      attendedEvents: [
        { title: "AI Workshop", category: "Technology" },
        { title: "Networking Meetup", category: "Business" },
      ],
      posts: [{ title: "Thoughts on AI in startups" }, { title: "Best practices for team building" }],
      interactions: [],
      searchHistory: ["AI communities", "startup events", "tech meetups"],
    }

    // Mock available data
    const mockCommunities = [
      {
        id: "1",
        name: "AI Enthusiasts",
        description: "Community for AI and machine learning enthusiasts",
        category: "Technology",
        memberCount: 1500,
        tags: ["AI", "Machine Learning", "Deep Learning"],
      },
      {
        id: "2",
        name: "Startup Accelerator",
        description: "Supporting early-stage startups with mentorship and resources",
        category: "Business",
        memberCount: 800,
        tags: ["Startup", "Entrepreneurship", "Funding"],
      },
    ]

    const mockEvents = [
      {
        id: "1",
        title: "Machine Learning Workshop",
        description: "Hands-on workshop covering ML fundamentals",
        date: "2024-02-20",
        format: "online",
        category: "Technology",
      },
      {
        id: "2",
        title: "Startup Pitch Competition",
        description: "Present your startup idea to investors",
        date: "2024-02-25",
        format: "offline",
        category: "Business",
      },
    ]

    const recommendations: Record<string, any[]> = {}

    // Generate recommendations for each requested type
    for (const type of types) {
      switch (type) {
        case "community":
          const communityRecs = await recommendationEngine.generateCommunityRecommendations(
            userProfile || mockUserActivity,
            mockCommunities,
            { maxRecommendations: Math.ceil(maxRecommendations / types.length) },
          )

          if (communityRecs.success) {
            recommendations.communities = communityRecs.data.recommendations.map((rec) => ({
              ...rec,
              metadata: {
                memberCount: mockCommunities.find((c) => c.name === rec.title)?.memberCount || 0,
                activityLevel: "high",
              },
            }))
          }
          break

        case "event":
          const eventRecs = await recommendationEngine.generateEventRecommendations(
            userProfile || mockUserActivity,
            mockEvents,
            { maxRecommendations: Math.ceil(maxRecommendations / types.length) },
          )

          if (eventRecs.success) {
            recommendations.events = eventRecs.data.recommendations.map((rec) => ({
              ...rec,
              metadata: {
                date: mockEvents.find((e) => e.title === rec.title)?.date || "2024-02-20",
                location: "Online",
                format: mockEvents.find((e) => e.title === rec.title)?.format || "online",
              },
            }))
          }
          break

        case "person":
          const mockMembers = [
            {
              name: "Sarah Chen",
              bio: "AI researcher and startup founder",
              skills: ["AI", "Machine Learning", "Entrepreneurship"],
              experienceLevel: "Senior",
            },
          ]

          const personRecs = await recommendationEngine.generatePersonRecommendations(
            userProfile || mockUserActivity,
            mockMembers,
            { maxRecommendations: Math.ceil(maxRecommendations / types.length) },
          )

          if (personRecs.success) {
            recommendations.people = personRecs.data.recommendations.map((rec) => ({
              ...rec,
              metadata: {
                avatar: "/placeholder.svg?height=40&width=40",
                role: "AI Researcher",
                experience: "Senior Level",
              },
            }))
          }
          break

        case "content":
          const mockContent = [
            {
              title: "Getting Started with Machine Learning",
              excerpt: "A comprehensive guide to ML fundamentals",
              type: "article",
              category: "Technology",
            },
          ]

          const contentRecs = await recommendationEngine.generateContentRecommendations(
            userProfile || mockUserActivity,
            mockContent,
            { maxRecommendations: Math.ceil(maxRecommendations / types.length) },
          )

          if (contentRecs.success) {
            recommendations.content = contentRecs.data.recommendations
          }
          break
      }
    }

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("Recommendations error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
