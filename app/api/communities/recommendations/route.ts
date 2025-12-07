import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { HybridRecommendationEngine } from "@/lib/recommendation-engine/hybrid-recommender"
import type { User, Community } from "@/lib/recommendation-engine/types"

/**
 * @route GET /api/communities/recommendations
 * @description Get recommended communities for the current user
 * @access Private
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerClient()
    
    // Get current user (using getUser() for security instead of getSession())
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = user.id

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, interests, location")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      )
    }

    // Fetch user's joined communities (approved members only)
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", userId)
      .or("status.is.null,status.eq.true")

    const joinedCommunityIds = (memberships || []).map((m) => m.community_id)

    // Fetch user's attended events
    const { data: eventAttendances } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", userId)
      .eq("status", "going")

    const attendedEventIds = (eventAttendances || []).map((e) => e.event_id)

    // Fetch all active communities (excluding suspended ones)
    const { data: communitiesData, error: communitiesError } = await supabase
      .from("communities")
      .select(
        `
        id,
        name,
        description,
        category_id,
        categories (
          id,
          name
        ),
        logo_url,
        banner_url,
        member_count,
        created_at,
        location,
        is_private,
        status
      `
      )
      .or("status.is.null,status.eq.active")
      .order("created_at", { ascending: false })

    if (communitiesError) {
      return NextResponse.json(
        { error: "Failed to fetch communities" },
        { status: 500 }
      )
    }

    // Fetch all users for collaborative filtering (limited to active users)
    const { data: allUsersData } = await supabase
      .from("users")
      .select("id, interests, location")
      .limit(1000) // Limit for performance

    // Transform user data to recommendation engine format
    const recommendationUser: User = {
      id: userId,
      interests: (userData.interests as string[]) || [],
      location: parseLocation(userData.location),
      activityLevel: determineActivityLevel(joinedCommunityIds.length, attendedEventIds.length),
      joinedCommunities: joinedCommunityIds,
      attendedEvents: attendedEventIds,
      interactions: [], // Can be enhanced with actual interaction data
      preferences: {
        preferredCategories: extractCategoriesFromInterests(userData.interests as string[]),
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
        joinedCommunities: [], // Will be populated if needed
        attendedEvents: [],
        interactions: [],
        preferences: {
          preferredCategories: extractCategoriesFromInterests(u.interests as string[]),
        },
      }))

    // Fetch joined communities for all users (for collaborative filtering)
    if (allUsers.length > 0) {
      const allUserIds = allUsers.map((u) => u.id)
      const { data: allMemberships } = await supabase
        .from("community_members")
        .select("user_id, community_id")
        .in("user_id", allUserIds)
        .or("status.is.null,status.eq.true")

      // Map memberships to users
      const membershipMap = new Map<string, string[]>()
      ;(allMemberships || []).forEach((m: any) => {
        if (!membershipMap.has(m.user_id)) {
          membershipMap.set(m.user_id, [])
        }
        membershipMap.get(m.user_id)!.push(m.community_id)
      })

      allUsers.forEach((u) => {
        u.joinedCommunities = membershipMap.get(u.id) || []
      })
    }

    // Transform communities to recommendation engine format
    const communities: Community[] = (communitiesData || []).map((comm: any) => {
      // Parse location - for online communities, location may be null/empty
      const location = parseLocation(comm.location)
      const categoryName = (comm.categories as any)?.name || "General"

      return {
        id: comm.id,
        name: comm.name,
        description: comm.description || "",
        category: categoryName,
        tags: [], // Can be enhanced with actual tags
        memberCount: comm.member_count || 0,
        activityLevel: determineCommunityActivityLevel(comm.member_count || 0),
        location: location, // undefined for online communities without location
        createdAt: new Date(comm.created_at),
        lastActivity: new Date(comm.created_at), // Can be enhanced with actual last activity
        averageRating: 4.5, // Default, can be calculated from reviews
        growthRate: 0, // Can be calculated from historical data
        engagementScore: calculateEngagementScore(comm.member_count || 0),
        contentTopics: [], // Can be extracted from posts/events
        memberDemographics: {
          ageGroups: {},
          professions: {},
          locations: {},
        },
      }
    })

    // Generate recommendations
    const recommendationEngine = new HybridRecommendationEngine()
    const result = await recommendationEngine.generateRecommendations(
      recommendationUser,
      allUsers,
      communities,
      {
        maxRecommendations: 50, // Get more recommendations, frontend can filter
        includePopular: true,
        diversityWeight: 0.3,
      }
    )

    // Return recommended community IDs sorted by score
    const recommendedIds = result.recommendations
      .sort((a, b) => b.score - a.score)
      .map((rec) => rec.communityId)

    return NextResponse.json({
      recommendedCommunityIds: recommendedIds,
      recommendations: result.recommendations.map((rec) => ({
        communityId: rec.communityId,
        score: rec.score,
        confidence: rec.confidence,
        reasons: rec.reasons,
      })),
      metadata: result.metadata,
    })
  } catch (error: any) {
    console.error("Recommendation error:", error)
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
    // Try to parse as JSON
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
    // If not JSON, try to extract city from string
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

function determineActivityLevel(
  joinedCommunities: number,
  attendedEvents: number
): "low" | "medium" | "high" {
  const totalActivity = joinedCommunities + attendedEvents
  if (totalActivity >= 10) return "high"
  if (totalActivity >= 3) return "medium"
  return "low"
}

function determineCommunityActivityLevel(memberCount: number): "low" | "medium" | "high" {
  if (memberCount >= 100) return "high"
  if (memberCount >= 20) return "medium"
  return "low"
}

function calculateEngagementScore(memberCount: number): number {
  // Simple engagement score based on member count
  // Can be enhanced with actual engagement metrics
  return Math.min(100, (memberCount / 10) * 10)
}

function extractCategoriesFromInterests(interests: string[]): string[] {
  // Map interests to actual database category names
  // Database categories: "Environmental", "Music", "Sports", "Hobbies", "Education", "Art"
  const categoryMap: Record<string, string> = {
    // Direct matches (case-sensitive)
    "Education": "Education",
    "Environmental": "Environmental",
    "Music": "Music",
    "Sports": "Sports",
    "Hobbies": "Hobbies",
    "Art": "Art",
    // Common variations (from onboarding/UI)
    "Tech & Innovation": "Hobbies", // Tech communities are in Hobbies category
    "Technology": "Hobbies",
    "Tech": "Hobbies",
    "Education & Learning": "Education",
    "Sports & Fitness": "Sports",
    "Hobbies & Crafts": "Hobbies",
    "Arts & Culture": "Art",
    "Career & Business": "Education", // Business/Professional development
    "Travel & Adventure": "Sports", // Outdoor activities
    "Food & Drink": "Hobbies",
    "Entertainment": "Hobbies",
    "Social & Community": "Hobbies",
  }

  const validCategories = ["Environmental", "Music", "Sports", "Hobbies", "Education", "Art"];

  return interests
    .map((interest) => {
      // Normalize interest (trim and handle case)
      const normalizedInterest = interest.trim();
      
      // Try exact match first
      if (categoryMap[normalizedInterest]) {
        return categoryMap[normalizedInterest];
      }
      
      // Try case-insensitive match
      const lowerInterest = normalizedInterest.toLowerCase();
      for (const [key, value] of Object.entries(categoryMap)) {
        if (key.toLowerCase() === lowerInterest) {
          return value;
        }
      }
      
      // Check if it contains keywords
      if (lowerInterest.includes("tech") || lowerInterest.includes("technology") || lowerInterest.includes("innovation")) {
        return "Hobbies";
      }
      if (lowerInterest.includes("education") || lowerInterest.includes("learning") || lowerInterest.includes("business") || lowerInterest.includes("career")) {
        return "Education";
      }
      if (lowerInterest.includes("sport") || lowerInterest.includes("fitness") || lowerInterest.includes("travel") || lowerInterest.includes("adventure")) {
        return "Sports";
      }
      if (lowerInterest.includes("art") || lowerInterest.includes("culture") || lowerInterest.includes("music")) {
        return lowerInterest.includes("music") ? "Music" : "Art";
      }
      if (lowerInterest.includes("hobbie") || lowerInterest.includes("craft") || lowerInterest.includes("food") || lowerInterest.includes("gaming") || lowerInterest.includes("entertainment")) {
        return "Hobbies";
      }
      if (lowerInterest.includes("environment") || lowerInterest.includes("sustainability") || lowerInterest.includes("nature")) {
        return "Environmental";
      }
      
      // If no match, check if it's already a valid category name (case-insensitive)
      const matchedCategory = validCategories.find(cat => cat.toLowerCase() === lowerInterest);
      if (matchedCategory) {
        return matchedCategory;
      }
      
      // Default fallback - return null to filter out
      return null;
    })
    .filter((cat): cat is string => cat !== null) // Remove nulls
    .filter((cat, index, arr) => arr.indexOf(cat) === index) // Remove duplicates
}

