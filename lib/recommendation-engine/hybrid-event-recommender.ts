import type {
    Event, EventRecommendationOptions, EventRecommendationReason, EventRecommendationResult, EventRecommendationScore, User
} from "./types"

// Keywords mapping for matching interests to event categories
const INTEREST_KEYWORDS: Record<string, string[]> = {
  "hobbies & crafts": ["hobby", "craft", "diy", "handmade", "creative", "maker", "gaming", "game", "collection", "collector", "workshop"],
  "sports & fitness": ["sport", "fitness", "gym", "workout", "exercise", "running", "cycling", "yoga", "athletic", "health", "basketball", "football", "soccer", "swimming", "tennis", "badminton", "volleyball", "marathon", "tournament"],
  "career & business": ["career", "business", "professional", "networking", "entrepreneur", "startup", "job", "work", "corporate", "leadership", "management", "conference", "seminar"],
  "tech & innovation": ["tech", "technology", "programming", "coding", "developer", "software", "hardware", "ai", "machine learning", "data", "digital", "innovation", "computer", "it", "web", "app", "hackathon"],
  "arts & culture": ["art", "culture", "museum", "gallery", "painting", "sculpture", "design", "creative", "artist", "cultural", "heritage", "exhibition", "performance"],
  "social & community": ["social", "community", "volunteer", "charity", "nonprofit", "help", "support", "connect", "meetup", "gathering", "festival"],
  "education & learning": ["education", "learning", "study", "course", "workshop", "training", "skill", "knowledge", "academic", "school", "university", "teach", "lecture", "webinar"],
  "travel & adventure": ["travel", "adventure", "explore", "trip", "journey", "hiking", "outdoor", "nature", "tourism", "backpack", "expedition"],
  "food & drink": ["food", "drink", "cooking", "culinary", "restaurant", "recipe", "cuisine", "chef", "baking", "coffee", "wine", "beer", "tasting", "foodie"],
  "entertainment": ["entertainment", "movie", "film", "music", "concert", "show", "theater", "performance", "fun", "party", "event", "festival", "comedy"],
  "music": ["music", "band", "concert", "instrument", "song", "singing", "musician", "guitar", "piano", "dj", "live", "festival"],
  "environmental": ["environment", "nature", "sustainability", "green", "eco", "climate", "conservation", "wildlife", "recycling", "cleanup"],
}

export class HybridEventRecommendationEngine {
  private enableLogging = true

  private log(...args: any[]) {
    if (this.enableLogging) {
      console.log("[EVENT-RECOMMENDER]", ...args)
    }
  }

  async generateRecommendations(
    user: User,
    allUsers: User[],
    events: Event[],
    userCommunityIds: string[],
    options: EventRecommendationOptions = {}
  ): Promise<EventRecommendationResult> {
    const startTime = Date.now()

    const {
      maxRecommendations = 20,
      includePopular = true,
      diversityWeight = 0.3,
      dateRangeFilter = "all",
      includeOnlineOnly = false,
      includeInPersonOnly = false,
      algorithmWeights = {
        collaborative: 0.25,
        contentBased: 0.35,
        popularity: 0.15,
        community: 0.25,
      },
    } = options

    // Filter events based on options
    let filteredEvents = this.filterEvents(events, {
      dateRangeFilter,
      includeOnlineOnly,
      includeInPersonOnly,
    })

    this.log("=== Starting Event Recommendations ===")
    this.log("Total events:", events.length)
    this.log("After filtering:", filteredEvents.length)
    this.log("User interests:", user.interests)
    this.log("User attended events:", user.attendedEvents.length)
    this.log("User communities:", userCommunityIds.length)

    // Exclude events user has already attended/registered
    const candidateEvents = filteredEvents.filter(
      (e) => !user.attendedEvents.includes(e.id)
    )
    this.log("Candidate events (excluding attended):", candidateEvents.length)

    // Determine strategy based on user data
    const strategy = this.determineStrategy(user, allUsers, userCommunityIds)
    const adjustedWeights = this.adjustWeights(algorithmWeights, strategy)

    const allRecommendations: EventRecommendationScore[] = []
    const algorithmsUsed: string[] = []

    // 1. Content-based recommendations (always available)
    if (adjustedWeights.contentBased > 0) {
      const contentRecs = this.contentBasedFiltering(user, candidateEvents)
      contentRecs.forEach((rec) => {
        rec.score *= adjustedWeights.contentBased
      })
      allRecommendations.push(...contentRecs)
      algorithmsUsed.push("content_based")
      this.log("Content-based recommendations:", contentRecs.length)
    }

    // 2. Community-based recommendations (events from user's communities)
    if (adjustedWeights.community > 0 && userCommunityIds.length > 0) {
      const communityRecs = this.communityBasedFiltering(
        candidateEvents,
        userCommunityIds
      )
      communityRecs.forEach((rec) => {
        rec.score *= adjustedWeights.community
      })
      allRecommendations.push(...communityRecs)
      algorithmsUsed.push("community_based")
      this.log("Community-based recommendations:", communityRecs.length)
    }

    // 3. Collaborative filtering (if sufficient data)
    if (adjustedWeights.collaborative > 0 && strategy.useCollaborative) {
      const collaborativeRecs = this.collaborativeFiltering(
        user,
        allUsers,
        candidateEvents
      )
      collaborativeRecs.forEach((rec) => {
        rec.score *= adjustedWeights.collaborative
      })
      allRecommendations.push(...collaborativeRecs)
      algorithmsUsed.push("collaborative_filtering")
      this.log("Collaborative recommendations:", collaborativeRecs.length)
    }

    // 4. Popularity-based recommendations
    if (adjustedWeights.popularity > 0 && includePopular) {
      const popularityRecs = this.popularityBasedFiltering(user, candidateEvents)
      popularityRecs.forEach((rec) => {
        rec.score *= adjustedWeights.popularity
      })
      allRecommendations.push(...popularityRecs)
      algorithmsUsed.push("popularity_based")
      this.log("Popularity-based recommendations:", popularityRecs.length)
    }

    // Merge and deduplicate recommendations
    const mergedRecommendations = this.mergeRecommendations(allRecommendations)

    // Apply timing boost (sooner events get slight boost)
    this.applyTimingBoost(mergedRecommendations, candidateEvents)

    // Apply diversity filtering
    const diverseRecommendations = this.applyDiversityFiltering(
      mergedRecommendations,
      candidateEvents,
      diversityWeight
    )

    // Final ranking and selection
    const finalRecommendations = diverseRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations)

    const processingTime = Date.now() - startTime
    const diversityScore = this.calculateDiversityScore(
      finalRecommendations,
      candidateEvents
    )

    this.log("=== Recommendation Results ===")
    this.log("Total recommendations:", finalRecommendations.length)
    this.log("Processing time:", processingTime, "ms")
    this.log("Diversity score:", diversityScore.toFixed(3))

    // Log top recommendations
    if (finalRecommendations.length > 0) {
      this.log("Top 5 recommendations:")
      finalRecommendations.slice(0, 5).forEach((rec, i) => {
        const event = candidateEvents.find((e) => e.id === rec.eventId)
        this.log(
          `  ${i + 1}. ${event?.title || "Unknown"} (score: ${rec.score.toFixed(3)}, category: ${event?.category})`
        )
      })
    }

    return {
      recommendations: finalRecommendations,
      metadata: {
        totalEvents: candidateEvents.length,
        algorithmsUsed,
        processingTime,
        diversityScore,
      },
    }
  }

  private filterEvents(
    events: Event[],
    options: {
      dateRangeFilter: string
      includeOnlineOnly: boolean
      includeInPersonOnly: boolean
    }
  ): Event[] {
    const now = new Date()
    let filtered = events.filter((e) => e.startTime >= now) // Only future events

    if (options.dateRangeFilter !== "all") {
      const endDate = new Date()
      if (options.dateRangeFilter === "today") {
        endDate.setHours(23, 59, 59, 999)
      } else if (options.dateRangeFilter === "week") {
        endDate.setDate(endDate.getDate() + 7)
      } else if (options.dateRangeFilter === "month") {
        endDate.setMonth(endDate.getMonth() + 1)
      }
      filtered = filtered.filter((e) => e.startTime <= endDate)
    }

    if (options.includeOnlineOnly) {
      filtered = filtered.filter((e) => e.isOnline)
    }

    if (options.includeInPersonOnly) {
      filtered = filtered.filter((e) => !e.isOnline)
    }

    return filtered
  }

  private determineStrategy(
    user: User,
    allUsers: User[],
    userCommunityIds: string[]
  ): {
    useCollaborative: boolean
    isNewUser: boolean
    dataRichness: number
  } {
    const attendedEventsCount = user.attendedEvents.length
    const interactionsCount = user.interactions.length
    const similarUsersCount = allUsers.filter(
      (u) =>
        u.id !== user.id &&
        u.attendedEvents.some((e) => user.attendedEvents.includes(e))
    ).length

    const isNewUser = attendedEventsCount === 0 && interactionsCount < 3
    const useCollaborative = attendedEventsCount >= 2 && similarUsersCount >= 3
    const dataRichness = Math.min(
      1,
      (attendedEventsCount + userCommunityIds.length + interactionsCount) / 15
    )

    return { useCollaborative, isNewUser, dataRichness }
  }

  private adjustWeights(
    weights: {
      collaborative?: number
      contentBased?: number
      popularity?: number
      community?: number
    },
    strategy: { useCollaborative: boolean; isNewUser: boolean; dataRichness: number }
  ): {
    collaborative: number
    contentBased: number
    popularity: number
    community: number
  } {
    let {
      collaborative = 0.25,
      contentBased = 0.35,
      popularity = 0.15,
      community = 0.25,
    } = weights

    if (!strategy.useCollaborative) {
      // Redistribute collaborative weight
      contentBased += collaborative * 0.5
      community += collaborative * 0.3
      popularity += collaborative * 0.2
      collaborative = 0
    }

    if (strategy.isNewUser) {
      // Boost popularity and community for new users
      const boost = 0.15
      popularity += boost
      community += boost * 0.5
      contentBased -= boost * 0.5
      collaborative -= boost * 0.5
    }

    // Adjust based on data richness
    if (strategy.dataRichness < 0.3) {
      popularity += 0.1
      community += 0.05
      contentBased -= 0.075
      collaborative -= 0.075
    }

    // Normalize weights
    const total = collaborative + contentBased + popularity + community
    return {
      collaborative: Math.max(0, collaborative / total),
      contentBased: Math.max(0, contentBased / total),
      popularity: Math.max(0, popularity / total),
      community: Math.max(0, community / total),
    }
  }

  // Content-based filtering using user interests
  private contentBasedFiltering(
    user: User,
    events: Event[]
  ): EventRecommendationScore[] {
    const userInterests = user.interests.map((i) => i.toLowerCase())
    const preferredCategories = user.preferences.preferredCategories.map((c) =>
      c.toLowerCase()
    )

    return events
      .map((event) => {
        let score = 0
        const reasons: EventRecommendationReason[] = []

        // Category match
        const categoryMatch = this.checkCategoryMatch(
          preferredCategories,
          event.category
        )
        if (categoryMatch.matched) {
          score += 0.4
          reasons.push({
            type: "interest_match",
            description: `Matches your interest in ${event.category}`,
            weight: 0.4,
            evidence: { category: event.category },
          })
        }

        // Interest/keyword match
        const interestMatch = this.calculateInterestMatch(
          userInterests,
          event
        )
        if (interestMatch.score > 0) {
          score += interestMatch.score * 0.35
          reasons.push({
            type: "interest_match",
            description: `Related to: ${interestMatch.matchedKeywords.slice(0, 3).join(", ")}`,
            weight: 0.35,
            evidence: { matchedKeywords: interestMatch.matchedKeywords },
          })
        }

        // Location proximity
        if (user.location && event.location && !event.isOnline) {
          const locationScore = this.calculateLocationScore(user, event)
          if (locationScore.score > 0) {
            score += locationScore.score * 0.15
            reasons.push({
              type: "location_proximity",
              description: `${locationScore.distance.toFixed(1)}km away`,
              weight: 0.15,
              evidence: { distance: locationScore.distance },
            })
          }
        }

        // Online event bonus for users without location
        if (event.isOnline && !user.location) {
          score += 0.1
          reasons.push({
            type: "location_proximity",
            description: "Online event - accessible from anywhere",
            weight: 0.1,
            evidence: { isOnline: true },
          })
        }

        const confidence = Math.min(0.9, score)

        return {
          eventId: event.id,
          score,
          confidence,
          method: "content_based",
          reasons,
        }
      })
      .filter((rec) => rec.score > 0.1)
  }

  // Community-based filtering
  private communityBasedFiltering(
    events: Event[],
    userCommunityIds: string[]
  ): EventRecommendationScore[] {
    const communitySet = new Set(userCommunityIds)

    return events
      .filter((e) => communitySet.has(e.communityId))
      .map((event) => ({
        eventId: event.id,
        score: 0.7, // Base score for community events
        confidence: 0.85,
        method: "community_based",
        reasons: [
          {
            type: "community_member" as const,
            description: `From ${event.communityName || "your community"}`,
            weight: 0.7,
            evidence: { communityId: event.communityId },
          },
        ],
      }))
  }

  // Collaborative filtering based on similar users
  private collaborativeFiltering(
    user: User,
    allUsers: User[],
    events: Event[]
  ): EventRecommendationScore[] {
    // Find similar users
    const similarUsers = this.findSimilarUsers(user, allUsers)
    if (similarUsers.length === 0) return []

    // Get events attended by similar users
    const eventScores = new Map<
      string,
      { score: number; userCount: number; avgSimilarity: number }
    >()

    similarUsers.forEach(({ user: similarUser, similarity }) => {
      similarUser.attendedEvents.forEach((eventId) => {
        if (!user.attendedEvents.includes(eventId)) {
          const existing = eventScores.get(eventId) || {
            score: 0,
            userCount: 0,
            avgSimilarity: 0,
          }
          existing.score += similarity
          existing.userCount += 1
          existing.avgSimilarity =
            (existing.avgSimilarity * (existing.userCount - 1) + similarity) /
            existing.userCount
          eventScores.set(eventId, existing)
        }
      })
    })

    // Map to available events
    const eventSet = new Set(events.map((e) => e.id))

    return Array.from(eventScores.entries())
      .filter(([eventId]) => eventSet.has(eventId))
      .map(([eventId, data]) => ({
        eventId,
        score: data.score / similarUsers.length,
        confidence: Math.min(0.8, data.userCount / 5),
        method: "collaborative",
        reasons: [
          {
            type: "similar_users" as const,
            description: `${data.userCount} similar users attended`,
            weight: 0.7,
            evidence: {
              userCount: data.userCount,
              avgSimilarity: data.avgSimilarity,
            },
          },
        ],
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
  }

  // Popularity-based filtering
  private popularityBasedFiltering(
    user: User,
    events: Event[]
  ): EventRecommendationScore[] {
    return events
      .map((event) => {
        let score = 0
        const reasons: EventRecommendationReason[] = []

        // Attendance rate
        if (event.maxAttendees && event.maxAttendees > 0) {
          const attendanceRate = event.currentAttendees / event.maxAttendees
          if (attendanceRate > 0.5) {
            score += attendanceRate * 0.4
            reasons.push({
              type: "popularity",
              description: `${Math.round(attendanceRate * 100)}% full`,
              weight: 0.4,
              evidence: { attendanceRate },
            })
          }
        } else if (event.currentAttendees > 10) {
          // No max, but has significant attendance
          score += Math.min(0.4, event.currentAttendees / 100)
          reasons.push({
            type: "popularity",
            description: `${event.currentAttendees} people attending`,
            weight: 0.3,
            evidence: { attendees: event.currentAttendees },
          })
        }

        // Recency boost (newly created events)
        const daysSinceCreated =
          (Date.now() - event.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceCreated < 7) {
          score += 0.15
          reasons.push({
            type: "popularity",
            description: "New event",
            weight: 0.15,
            evidence: { daysSinceCreated },
          })
        }

        // Category preference boost
        const userCategories = user.preferences.preferredCategories.map((c) =>
          c.toLowerCase()
        )
        if (
          userCategories.some(
            (cat) =>
              event.category.toLowerCase().includes(cat) ||
              cat.includes(event.category.toLowerCase())
          )
        ) {
          score += 0.1
        }

        const confidence = Math.min(0.75, score)

        return {
          eventId: event.id,
          score,
          confidence,
          method: "popularity",
          reasons,
        }
      })
      .filter((rec) => rec.score > 0.1)
  }

  private findSimilarUsers(
    targetUser: User,
    allUsers: User[]
  ): Array<{ user: User; similarity: number }> {
    return allUsers
      .filter((user) => user.id !== targetUser.id)
      .map((user) => ({
        user,
        similarity: this.calculateUserSimilarity(targetUser, user),
      }))
      .filter((item) => item.similarity > 0.15)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 30)
  }

  private calculateUserSimilarity(user1: User, user2: User): number {
    let similarity = 0
    let factors = 0

    // Attended events overlap (Jaccard)
    const events1 = new Set(user1.attendedEvents)
    const events2 = new Set(user2.attendedEvents)
    const eventIntersection = new Set([...events1].filter((x) => events2.has(x)))
    const eventUnion = new Set([...events1, ...events2])

    if (eventUnion.size > 0) {
      similarity += (eventIntersection.size / eventUnion.size) * 0.4
      factors += 0.4
    }

    // Community overlap
    const communities1 = new Set(user1.joinedCommunities)
    const communities2 = new Set(user2.joinedCommunities)
    const commIntersection = new Set(
      [...communities1].filter((x) => communities2.has(x))
    )
    const commUnion = new Set([...communities1, ...communities2])

    if (commUnion.size > 0) {
      similarity += (commIntersection.size / commUnion.size) * 0.3
      factors += 0.3
    }

    // Interest overlap
    const interests1 = new Set(user1.interests.map((i) => i.toLowerCase()))
    const interests2 = new Set(user2.interests.map((i) => i.toLowerCase()))
    const interestIntersection = new Set(
      [...interests1].filter((x) => interests2.has(x))
    )
    const interestUnion = new Set([...interests1, ...interests2])

    if (interestUnion.size > 0) {
      similarity += (interestIntersection.size / interestUnion.size) * 0.3
      factors += 0.3
    }

    return factors > 0 ? similarity / factors : 0
  }

  private checkCategoryMatch(
    preferredCategories: string[],
    eventCategory: string
  ): { matched: boolean; matchedPreference: string | null } {
    const categoryLower = eventCategory.toLowerCase()

    for (const pref of preferredCategories) {
      const prefLower = pref.toLowerCase()

      // Direct match
      if (prefLower === categoryLower) {
        return { matched: true, matchedPreference: pref }
      }

      // Contains match
      if (prefLower.includes(categoryLower) || categoryLower.includes(prefLower)) {
        return { matched: true, matchedPreference: pref }
      }

      // Keyword-based mapping
      const prefKeywords = INTEREST_KEYWORDS[prefLower] || []
      if (prefKeywords.some((kw) => categoryLower.includes(kw))) {
        return { matched: true, matchedPreference: pref }
      }
    }

    return { matched: false, matchedPreference: null }
  }

  private calculateInterestMatch(
    userInterests: string[],
    event: Event
  ): { score: number; matchedKeywords: string[] } {
    const eventText = [
      event.title,
      event.description,
      event.category,
      ...event.tags,
      ...event.contentTopics,
    ]
      .join(" ")
      .toLowerCase()

    const matchedKeywords: string[] = []
    let matchCount = 0

    for (const interest of userInterests) {
      const keywords = INTEREST_KEYWORDS[interest] || []
      const interestWords = interest.split(/[\s&]+/).filter((w) => w.length > 2)
      const allKeywords = [...keywords, ...interestWords]

      for (const keyword of allKeywords) {
        const regex = new RegExp(
          `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "i"
        )
        if (regex.test(eventText) && !matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword)
          matchCount++
          break // Only count once per interest
        }
      }
    }

    const score =
      userInterests.length > 0 ? matchCount / userInterests.length : 0
    return { score: Math.min(1, score), matchedKeywords }
  }

  private calculateLocationScore(
    user: User,
    event: Event
  ): { score: number; distance: number } {
    if (!user.location || !event.location) {
      return { score: 0, distance: Infinity }
    }

    const distance = this.calculateDistance(
      user.location.lat,
      user.location.lng,
      event.location.lat,
      event.location.lng
    )

    const maxDistance = user.preferences.maxDistance || 50
    const score = Math.max(0, 1 - distance / maxDistance)

    return { score, distance }
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private mergeRecommendations(
    recommendations: EventRecommendationScore[]
  ): EventRecommendationScore[] {
    const merged = new Map<string, EventRecommendationScore>()

    recommendations.forEach((rec) => {
      const existing = merged.get(rec.eventId)
      if (existing) {
        // Combine scores
        const totalWeight = existing.confidence + rec.confidence
        existing.score =
          (existing.score * existing.confidence + rec.score * rec.confidence) /
          totalWeight
        existing.confidence = Math.max(existing.confidence, rec.confidence)
        existing.reasons.push(...rec.reasons)
        if (existing.method !== rec.method) {
          existing.method = "hybrid"
        }
      } else {
        merged.set(rec.eventId, { ...rec })
      }
    })

    return Array.from(merged.values())
  }

  private applyTimingBoost(
    recommendations: EventRecommendationScore[],
    events: Event[]
  ): void {
    const eventMap = new Map(events.map((e) => [e.id, e]))
    const now = Date.now()

    recommendations.forEach((rec) => {
      const event = eventMap.get(rec.eventId)
      if (!event) return

      const daysUntilEvent =
        (event.startTime.getTime() - now) / (1000 * 60 * 60 * 24)

      // Boost events happening soon (within 2 weeks)
      if (daysUntilEvent <= 14) {
        const timingBoost = Math.max(0, 0.1 * (1 - daysUntilEvent / 14))
        rec.score += timingBoost
        if (timingBoost > 0.05) {
          rec.reasons.push({
            type: "timing",
            description:
              daysUntilEvent <= 1
                ? "Happening very soon!"
                : `Coming up in ${Math.ceil(daysUntilEvent)} days`,
            weight: timingBoost,
            evidence: { daysUntilEvent },
          })
        }
      }
    })
  }

  private applyDiversityFiltering(
    recommendations: EventRecommendationScore[],
    events: Event[],
    diversityWeight: number
  ): EventRecommendationScore[] {
    if (diversityWeight === 0) return recommendations

    const eventMap = new Map(events.map((e) => [e.id, e]))
    const selectedCategories = new Set<string>()
    const selectedCommunities = new Set<string>()
    const diverseRecommendations: EventRecommendationScore[] = []

    const sortedRecs = [...recommendations].sort((a, b) => b.score - a.score)

    for (const rec of sortedRecs) {
      const event = eventMap.get(rec.eventId)
      if (!event) continue

      let diversityBonus = 0

      // Category diversity
      if (!selectedCategories.has(event.category)) {
        diversityBonus += diversityWeight * 0.6
        selectedCategories.add(event.category)
      }

      // Community diversity
      if (!selectedCommunities.has(event.communityId)) {
        diversityBonus += diversityWeight * 0.4
        selectedCommunities.add(event.communityId)
      }

      rec.score += diversityBonus
      diverseRecommendations.push(rec)
    }

    return diverseRecommendations
  }

  private calculateDiversityScore(
    recommendations: EventRecommendationScore[],
    events: Event[]
  ): number {
    if (recommendations.length === 0) return 0

    const eventMap = new Map(events.map((e) => [e.id, e]))
    const categories = new Set<string>()
    const communities = new Set<string>()

    recommendations.forEach((rec) => {
      const event = eventMap.get(rec.eventId)
      if (event) {
        categories.add(event.category)
        communities.add(event.communityId)
      }
    })

    // Diversity is the average of category and community diversity
    const categoryDiversity = categories.size / recommendations.length
    const communityDiversity = communities.size / recommendations.length

    return (categoryDiversity + communityDiversity) / 2
  }
}

