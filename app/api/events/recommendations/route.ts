import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { HybridEventRecommendationEngine } from "@/lib/recommendation-engine/hybrid-event-recommender"
import type { User, Event } from "@/lib/recommendation-engine/types"

/**
 * @route GET /api/events/recommendations
 * @description Get recommended events for the current user
 * @access Private
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[EVENT-RECOMMENDATIONS] Unauthorized - no user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id
    console.log("[EVENT-RECOMMENDATIONS] Processing for user:", userId)

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const dateRange = searchParams.get("dateRange") || "all" // all, today, week, month
    const onlineOnly = searchParams.get("onlineOnly") === "true"
    const inPersonOnly = searchParams.get("inPersonOnly") === "true"

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, interests, location")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.log("[EVENT-RECOMMENDATIONS] Failed to fetch user data:", userError)
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      )
    }

    console.log("[EVENT-RECOMMENDATIONS] User data:", {
      userId: userData.id,
      interests: userData.interests,
      location: userData.location,
    })

    // Fetch user's joined communities (approved members only)
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", userId)
      .or("status.is.null,status.eq.true")

    const joinedCommunityIds = (memberships || []).map((m) => m.community_id)
    console.log("[EVENT-RECOMMENDATIONS] User joined communities:", joinedCommunityIds.length)

    // Fetch user's attended events
    const { data: eventAttendances } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", userId)
      .in("status", ["going", "maybe"])

    const attendedEventIds = (eventAttendances || []).map((e) => e.event_id)
    console.log("[EVENT-RECOMMENDATIONS] User attended events:", attendedEventIds.length)

    // Fetch upcoming events (only future events)
    const now = new Date().toISOString()
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        description,
        category,
        community_id,
        communities (
          id,
          name
        ),
        creator_id,
        location,
        is_online,
        start_time,
        end_time,
        max_attendees,
        created_at,
        image_url
      `
      )
      .gte("start_time", now)
      .order("start_time", { ascending: true })

    if (eventsError) {
      console.error("[EVENT-RECOMMENDATIONS] Failed to fetch events:", eventsError)
      return NextResponse.json(
        { error: "Failed to fetch events", details: eventsError.message },
        { status: 500 }
      )
    }

    console.log("[EVENT-RECOMMENDATIONS] Total upcoming events:", eventsData?.length || 0)

    // Fetch attendee counts for all events
    const eventIds = eventsData?.map((e: any) => e.id) || []
    let attendeeCounts: Record<string, number> = {}

    if (eventIds.length > 0) {
      const { data: attendeesData } = await supabase
        .from("event_attendees")
        .select("event_id")
        .in("event_id", eventIds)
        .eq("status", "going")

      if (attendeesData) {
        attendeesData.forEach((att: any) => {
          attendeeCounts[att.event_id] = (attendeeCounts[att.event_id] || 0) + 1
        })
      }
    }

    // Fetch all users for collaborative filtering
    const { data: allUsersData } = await supabase
      .from("users")
      .select("id, interests, location")
      .limit(1000)

    // Fetch their attended events for collaborative filtering
    const { data: allEventAttendances } = await supabase
      .from("event_attendees")
      .select("user_id, event_id")
      .in("status", ["going", "maybe"])

    // Map attended events per user
    const userAttendedEventsMap = new Map<string, string[]>()
    ;(allEventAttendances || []).forEach((att: any) => {
      if (!userAttendedEventsMap.has(att.user_id)) {
        userAttendedEventsMap.set(att.user_id, [])
      }
      userAttendedEventsMap.get(att.user_id)!.push(att.event_id)
    })

    // Fetch all user community memberships for collaborative filtering
    const { data: allMemberships } = await supabase
      .from("community_members")
      .select("user_id, community_id")
      .or("status.is.null,status.eq.true")

    const userCommunitiesMap = new Map<string, string[]>()
    ;(allMemberships || []).forEach((m: any) => {
      if (!userCommunitiesMap.has(m.user_id)) {
        userCommunitiesMap.set(m.user_id, [])
      }
      userCommunitiesMap.get(m.user_id)!.push(m.community_id)
    })

    // Extract preferred categories from user interests
    const preferredCategories = extractCategoriesFromInterests(
      (userData.interests as string[]) || []
    )
    console.log("[EVENT-RECOMMENDATIONS] User preferred categories:", preferredCategories)

    // Transform user data to recommendation engine format
    const recommendationUser: User = {
      id: userId,
      interests: (userData.interests as string[]) || [],
      location: parseLocation(userData.location),
      activityLevel: determineActivityLevel(
        joinedCommunityIds.length,
        attendedEventIds.length
      ),
      joinedCommunities: joinedCommunityIds,
      attendedEvents: attendedEventIds,
      interactions: [],
      preferences: {
        preferredCategories: preferredCategories,
      },
    }

    // Transform all users for collaborative filtering
    const allUsers: User[] = (allUsersData || [])
      .filter((u) => u.id !== userId)
      .map((u) => ({
        id: u.id,
        interests: (u.interests as string[]) || [],
        location: parseLocation(u.location),
        activityLevel: "medium" as const,
        joinedCommunities: userCommunitiesMap.get(u.id) || [],
        attendedEvents: userAttendedEventsMap.get(u.id) || [],
        interactions: [],
        preferences: {
          preferredCategories: extractCategoriesFromInterests(
            (u.interests as string[]) || []
          ),
        },
      }))

    // Transform events to recommendation engine format
    const events: Event[] = (eventsData || []).map((event: any) => {
      const location = parseEventLocation(event.location)
      const categoryName = event.category || "General"
      const contentTopics = extractKeywordsFromText(
        `${event.title || ""} ${event.description || ""} ${categoryName}`
      )

      return {
        id: event.id,
        title: event.title,
        description: event.description || "",
        category: categoryName,
        tags: event.category ? [event.category] : [],
        communityId: event.community_id,
        communityName: (event.communities as any)?.name || undefined,
        creatorId: event.creator_id,
        location: location,
        isOnline: event.is_online || false,
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
        maxAttendees: event.max_attendees || null,
        currentAttendees: attendeeCounts[event.id] || 0,
        createdAt: new Date(event.created_at),
        imageUrl: event.image_url || undefined,
        contentTopics: contentTopics,
      }
    })

    console.log("[EVENT-RECOMMENDATIONS] Transformed events:", events.length)

    // Generate recommendations
    const recommendationEngine = new HybridEventRecommendationEngine()
    const result = await recommendationEngine.generateRecommendations(
      recommendationUser,
      allUsers,
      events,
      joinedCommunityIds,
      {
        maxRecommendations: limit,
        includePopular: true,
        diversityWeight: 0.3,
        dateRangeFilter: dateRange as "all" | "today" | "week" | "month",
        includeOnlineOnly: onlineOnly,
        includeInPersonOnly: inPersonOnly,
      }
    )

    console.log("[EVENT-RECOMMENDATIONS] Results from engine:")
    console.log(`  - Total recommendations: ${result.recommendations.length}`)
    console.log(`  - Algorithms used: ${result.metadata.algorithmsUsed.join(", ")}`)
    console.log(`  - Diversity score: ${result.metadata.diversityScore}`)

    // Log top recommendations
    if (result.recommendations.length > 0) {
      console.log("[EVENT-RECOMMENDATIONS] Top 10 recommendations:")
      result.recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .forEach((rec, i) => {
          const event = events.find((e) => e.id === rec.eventId)
          console.log(
            `  ${i + 1}. ${event?.title || "Unknown"} (score: ${rec.score.toFixed(3)}, category: ${event?.category})`
          )
          if (rec.reasons && rec.reasons.length > 0) {
            rec.reasons.slice(0, 2).forEach((r) => {
              console.log(`      - ${r.description}`)
            })
          }
        })
    }

    // Return recommended event IDs sorted by score
    const recommendedIds = result.recommendations
      .sort((a, b) => b.score - a.score)
      .map((rec) => rec.eventId)

    console.log(
      "[EVENT-RECOMMENDATIONS] Returning",
      recommendedIds.length,
      "recommended event IDs"
    )

    return NextResponse.json({
      recommendedEventIds: recommendedIds,
      recommendations: result.recommendations.map((rec) => ({
        eventId: rec.eventId,
        score: rec.score,
        confidence: rec.confidence,
        reasons: rec.reasons,
      })),
      metadata: result.metadata,
    })
  } catch (error: any) {
    console.error("[EVENT-RECOMMENDATIONS] Error:", error)
    return NextResponse.json(
      { error: "Failed to generate recommendations", details: error.message },
      { status: 500 }
    )
  }
}

// Helper functions
function parseLocation(location: string | null): User["location"] {
  if (!location) return undefined

  try {
    const parsed = JSON.parse(location)
    if (parsed.lat && parsed.lng) {
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        city: parsed.city || parsed.town || parsed.village || "",
        country: parsed.country || "",
      }
    }
  } catch {
    const parts = location.split(",").map((p) => p.trim())
    return {
      lat: 0,
      lng: 0,
      city: parts[0] || "",
      country: parts[1] || "",
    }
  }

  return undefined
}

function parseEventLocation(location: string | null): Event["location"] {
  if (!location) return undefined

  try {
    const parsed = JSON.parse(location)
    return {
      lat: parsed.lat || parsed.latitude || 0,
      lng: parsed.lng || parsed.longitude || 0,
      city: parsed.city || parsed.town || parsed.municipality || "",
      address: parsed.address || "",
      venue: parsed.venue || parsed.name || "",
    }
  } catch {
    return {
      lat: 0,
      lng: 0,
      city: "",
      address: location,
      venue: "",
    }
  }
}

function determineActivityLevel(
  joinedCommunities: number,
  attendedEvents: number
): "low" | "medium" | "high" {
  const totalActivity = joinedCommunities + attendedEvents
  if (totalActivity >= 10) return "high"
  if (totalActivity >= 3) return "medium"
  return "low"
}

function extractKeywordsFromText(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
    "does", "did", "will", "would", "could", "should", "may", "might", "must",
    "this", "that", "these", "those", "i", "you", "we", "they", "it", "he", "she",
    "who", "what", "where", "when", "why", "how", "all", "each", "every", "both",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
    "own", "same", "so", "than", "too", "very", "just", "can", "our", "your",
    "their", "its", "us", "join", "event", "events", "people", "come",
  ])

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))

  return [...new Set(words)]
}

function extractCategoriesFromInterests(interests: string[]): string[] {
  return interests
    .map((interest) => interest.trim().toLowerCase())
    .filter((cat, index, arr) => arr.indexOf(cat) === index)
}

