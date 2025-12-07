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

    // Check RLS by trying to count communities
    const { count: communityCount, error: countError } = await supabase
      .from("communities")
      .select("*", { count: "exact", head: true })
    
    console.log("[RECOMMENDATIONS] RLS Check - Community count:", communityCount, "Error:", countError)
    
    if (countError) {
      console.error("[RECOMMENDATIONS] RLS Policy Error:", countError)
      console.error("[RECOMMENDATIONS] This might be due to is_private column being removed from RLS policies")
    }

    if (authError || !user) {
      console.log("[RECOMMENDATIONS] Unauthorized - no user found")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = user.id
    console.log("[RECOMMENDATIONS] Processing for user:", userId)

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, interests, location")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.log("[RECOMMENDATIONS] Failed to fetch user data:", userError)
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      )
    }

    console.log("[RECOMMENDATIONS] User data:", {
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
    console.log("[RECOMMENDATIONS] User joined communities:", joinedCommunityIds.length)

    // Fetch user's attended events
    const { data: eventAttendances } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", userId)
      .eq("status", "going")

    const attendedEventIds = (eventAttendances || []).map((e) => e.event_id)

    // First, try a simple query to check if communities exist at all
    const { data: simpleCheck, error: simpleError } = await supabase
      .from("communities")
      .select("id, name")
      .limit(5)
    
    console.log("[RECOMMENDATIONS] Simple communities check:", {
      count: simpleCheck?.length || 0,
      error: simpleError,
      sample: simpleCheck?.[0]
    })

    // Fetch all active communities (excluding suspended ones)
    // Note: If status column doesn't exist, this will return all communities
    // Try with nested relationship first
    let { data: communitiesData, error: communitiesError } = await supabase
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
        status
      `
      )
      .order("created_at", { ascending: false })
    
    // If query fails or returns empty, try without nested relationship
    if (communitiesError || !communitiesData || communitiesData.length === 0) {
      console.log("[RECOMMENDATIONS] Query with nested relationship failed or returned empty, trying simple query...")
      const { data: simpleData, error: simpleError } = await supabase
        .from("communities")
        .select("id, name, description, category_id, logo_url, banner_url, member_count, created_at, location, status")
        .order("created_at", { ascending: false })
      
      if (simpleError) {
        console.error("[RECOMMENDATIONS] Simple query also failed:", simpleError)
        return NextResponse.json(
          { error: "Failed to fetch communities", details: simpleError.message },
          { status: 500 }
        )
      }
      
      if (simpleData && simpleData.length > 0) {
        console.log("[RECOMMENDATIONS] Simple query succeeded, fetching categories separately...")
        // Fetch categories separately
        const categoryIds = [...new Set(simpleData.map((c: any) => c.category_id).filter(Boolean))]
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("id, name")
          .in("id", categoryIds)
        
        const categoryMap = new Map((categoriesData || []).map((c: any) => [c.id, c]))
        
        // Merge categories into communities
        communitiesData = simpleData.map((c: any) => ({
          ...c,
          categories: c.category_id ? categoryMap.get(c.category_id) : null
        })) as any
        communitiesError = null
      } else {
        communitiesData = simpleData as any
      }
    }
    
    if (communitiesError) {
      console.error("[RECOMMENDATIONS] Failed to fetch communities:", communitiesError)
      console.error("[RECOMMENDATIONS] Error details:", JSON.stringify(communitiesError, null, 2))
      return NextResponse.json(
        { error: "Failed to fetch communities", details: communitiesError.message },
        { status: 500 }
      )
    }

    console.log("[RECOMMENDATIONS] Raw communities data:", {
      count: communitiesData?.length || 0,
      hasData: !!communitiesData,
      firstCommunity: communitiesData?.[0] ? {
        id: communitiesData[0].id,
        name: communitiesData[0].name,
        category_id: communitiesData[0].category_id,
        hasCategory: !!communitiesData[0].categories
      } : null
    })
    
    // Filter out suspended communities in JavaScript if status column exists
    // This is safer than using .or() which might fail if column doesn't exist
    const activeCommunities = (communitiesData || []).filter((c: any) => {
      // If status column doesn't exist or is null, include the community
      if (c.status === null || c.status === undefined) return true
      // Only include active communities
      return c.status === 'active'
    })

    console.log("[RECOMMENDATIONS] Total communities in DB (before filtering):", communitiesData?.length || 0)
    console.log("[RECOMMENDATIONS] Active communities (after filtering):", activeCommunities.length)

    // Log ALL communities and their categories to debug
    if (activeCommunities && activeCommunities.length > 0) {
      console.log("[RECOMMENDATIONS] ALL active communities with categories:")
      activeCommunities.forEach((c: any) => {
        const catName = (c.categories as any)?.name || 'none'
        console.log(`  - ${c.name}: category_id=${c.category_id || 'NULL'}, category_name="${catName}", status="${c.status || 'null'}"`)
      })
    } else {
      console.log("[RECOMMENDATIONS] WARNING: No active communities found!")
      if (communitiesData && communitiesData.length > 0) {
        console.log("[RECOMMENDATIONS] All communities (including suspended):")
        communitiesData.forEach((c: any) => {
          const catName = (c.categories as any)?.name || 'none'
          console.log(`  - ${c.name}: status="${c.status || 'null'}", category="${catName}"`)
        })
      }
    }

    // Fetch all users for collaborative filtering (limited to active users)
    const { data: allUsersData } = await supabase
      .from("users")
      .select("id, interests, location")
      .limit(1000) // Limit for performance

    // Extract preferred categories from user interests
    const preferredCategories = extractCategoriesFromInterests((userData.interests as string[]) || [])
    console.log("[RECOMMENDATIONS] User preferred categories (from interests):", preferredCategories)

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
        preferredCategories: preferredCategories,
      },
    }
    
    console.log("[RECOMMENDATIONS] Recommendation user built:", {
      interests: recommendationUser.interests,
      preferredCategories: recommendationUser.preferences.preferredCategories,
      joinedCommunities: recommendationUser.joinedCommunities.length,
    })

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
    const communities: Community[] = activeCommunities.map((comm: any) => {
      // Parse location - for online communities, location may be null/empty
      const location = parseLocation(comm.location)
      // Read category from the categories relationship
      const categoryName = (comm.categories as any)?.name || "General"

      // Extract keywords from name and description for better matching
      const contentTopics = extractKeywordsFromText(
        `${comm.name || ""} ${comm.description || ""} ${categoryName}`
      )

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
        contentTopics: contentTopics, // Keywords extracted from name and description
        memberDemographics: {
          ageGroups: {},
          professions: {},
          locations: {},
        },
      }
    })

    // Generate recommendations
    console.log("[RECOMMENDATIONS] Starting recommendation engine...")
    console.log("[RECOMMENDATIONS] Total communities to evaluate:", communities.length)
    
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

    console.log("[RECOMMENDATIONS] Results from engine:")
    console.log(`  - Total recommendations: ${result.recommendations.length}`)
    console.log(`  - Algorithms used: ${result.metadata.algorithmsUsed.join(", ")}`)
    console.log(`  - Diversity score: ${result.metadata.diversityScore}`)

    // Log top recommendations with scores
    if (result.recommendations.length > 0) {
      console.log("[RECOMMENDATIONS] Top 10 recommendations:")
      result.recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .forEach((rec, i) => {
          const community = communities.find(c => c.id === rec.communityId)
          console.log(`  ${i + 1}. ${community?.name || 'Unknown'} (score: ${rec.score.toFixed(3)}, category: ${community?.category})`)
          if (rec.reasons && rec.reasons.length > 0) {
            rec.reasons.slice(0, 2).forEach(r => {
              console.log(`      - ${r.description}`)
            })
          }
        })
    } else {
      console.log("[RECOMMENDATIONS] WARNING: No recommendations generated!")
    }

    // Return recommended community IDs sorted by score
    const recommendedIds = result.recommendations
      .sort((a, b) => b.score - a.score)
      .map((rec) => rec.communityId)

    console.log("[RECOMMENDATIONS] Returning", recommendedIds.length, "recommended community IDs")

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

function extractKeywordsFromText(text: string): string[] {
  // Extract meaningful keywords from text
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
    "does", "did", "will", "would", "could", "should", "may", "might", "must",
    "this", "that", "these", "those", "i", "you", "we", "they", "it", "he", "she",
    "who", "what", "where", "when", "why", "how", "all", "each", "every", "both",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
    "own", "same", "so", "than", "too", "very", "just", "can", "our", "your",
    "their", "its", "us", "join", "community", "group", "members", "people",
  ])

  // Split text into words, lowercase, and filter
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
  
  // Return unique keywords
  return [...new Set(words)]
}

function extractCategoriesFromInterests(interests: string[]): string[] {
  // User interests from onboarding and community categories are the same:
  // "Hobbies & Crafts", "Sports & Fitness", "Career & Business", "Tech & Innovation",
  // "Arts & Culture", "Social & Community", "Education & Learning", "Travel & Adventure",
  // "Food & Drink", "Entertainment"
  // 
  // They are stored lowercase in the database, so we just normalize them
  return interests
    .map((interest) => interest.trim().toLowerCase())
    .filter((cat, index, arr) => arr.indexOf(cat) === index) // Remove duplicates
}

