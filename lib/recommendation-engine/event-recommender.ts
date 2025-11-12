export interface EventRecommendation {
  eventId: string
  score: number
  reasons: string[]
  algorithm: "collaborative" | "content" | "popularity" | "hybrid"
  confidence: number
}

export interface UserEventProfile {
  userId: string
  attendedEvents: string[]
  interestedCategories: string[]
  preferredTimes: string[]
  preferredLocations: string[]
  socialConnections: string[]
  engagementHistory: {
    eventId: string
    action: "viewed" | "saved" | "registered" | "attended" | "rated"
    timestamp: string
    rating?: number
  }[]
}

export interface EventFeatures {
  id: string
  title: string
  category: string
  tags: string[]
  location: {
    city: string
    venue: string
    coordinates: [number, number]
  }
  date: string
  time: string
  price: number
  capacity: number
  registered: number
  organizer: string
  description: string
  popularity: number
  rating: number
  reviewCount: number
}

export class EventRecommendationEngine {
  private events: EventFeatures[] = []
  private userProfiles: Map<string, UserEventProfile> = new Map()

  constructor(events: EventFeatures[]) {
    this.events = events
  }

  // Collaborative Filtering - Find similar users and recommend their events
  private collaborativeFiltering(userId: string, limit = 10): EventRecommendation[] {
    const userProfile = this.userProfiles.get(userId)
    if (!userProfile) return []

    const userAttendedEvents = new Set(userProfile.attendedEvents)
    const similarUsers = this.findSimilarUsers(userId)
    const recommendations: Map<string, { score: number; reasons: string[] }> = new Map()

    similarUsers.forEach(({ userId: similarUserId, similarity }) => {
      const similarUserProfile = this.userProfiles.get(similarUserId)
      if (!similarUserProfile) return

      similarUserProfile.attendedEvents.forEach((eventId) => {
        if (!userAttendedEvents.has(eventId)) {
          const existing = recommendations.get(eventId) || { score: 0, reasons: [] }
          existing.score += similarity * 0.8
          existing.reasons.push(`Users with similar interests attended this event`)
          recommendations.set(eventId, existing)
        }
      })
    })

    return Array.from(recommendations.entries())
      .map(([eventId, { score, reasons }]) => ({
        eventId,
        score,
        reasons,
        algorithm: "collaborative" as const,
        confidence: Math.min(score, 1),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  // Content-Based Filtering - Recommend based on event features and user preferences
  private contentBasedFiltering(userId: string, limit = 10): EventRecommendation[] {
    const userProfile = this.userProfiles.get(userId)
    if (!userProfile) return []

    const userAttendedEvents = new Set(userProfile.attendedEvents)
    const recommendations: EventRecommendation[] = []

    this.events.forEach((event) => {
      if (userAttendedEvents.has(event.id)) return

      let score = 0
      const reasons: string[] = []

      // Category preference
      if (userProfile.interestedCategories.includes(event.category)) {
        score += 0.4
        reasons.push(`Matches your interest in ${event.category}`)
      }

      // Tag similarity
      const userTags = this.extractUserTags(userProfile)
      const commonTags = event.tags.filter((tag) => userTags.includes(tag))
      if (commonTags.length > 0) {
        score += commonTags.length * 0.1
        reasons.push(`Related to your interests: ${commonTags.join(", ")}`)
      }

      // Location preference
      const preferredCities = userProfile.preferredLocations
      if (preferredCities.includes(event.location.city)) {
        score += 0.2
        reasons.push(`In your preferred location: ${event.location.city}`)
      }

      // Time preference
      const eventHour = Number.parseInt(event.time.split(":")[0])
      const preferredTimes = userProfile.preferredTimes
      if (this.matchesTimePreference(eventHour, preferredTimes)) {
        score += 0.1
        reasons.push(`Scheduled at your preferred time`)
      }

      // Event quality indicators
      if (event.rating >= 4.5) {
        score += 0.1
        reasons.push(`Highly rated event (${event.rating}/5)`)
      }

      if (score > 0.2) {
        recommendations.push({
          eventId: event.id,
          score,
          reasons,
          algorithm: "content",
          confidence: Math.min(score, 1),
        })
      }
    })

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  // Popularity-Based Filtering - Recommend trending and popular events
  private popularityBasedFiltering(userId: string, limit = 10): EventRecommendation[] {
    const userProfile = this.userProfiles.get(userId)
    const userAttendedEvents = new Set(userProfile?.attendedEvents || [])

    return this.events
      .filter((event) => !userAttendedEvents.has(event.id))
      .map((event) => {
        let score = 0
        const reasons: string[] = []

        // Registration rate
        const registrationRate = event.registered / event.capacity
        if (registrationRate > 0.7) {
          score += 0.3
          reasons.push(`High demand - ${Math.round(registrationRate * 100)}% full`)
        }

        // Overall popularity
        score += event.popularity * 0.4

        // Recent engagement
        if (this.isRecentlyPopular(event.id)) {
          score += 0.2
          reasons.push(`Trending in your area`)
        }

        // High ratings
        if (event.rating >= 4.0 && event.reviewCount >= 10) {
          score += 0.1
          reasons.push(`Well-reviewed by attendees`)
        }

        return {
          eventId: event.id,
          score,
          reasons,
          algorithm: "popularity" as const,
          confidence: Math.min(score, 1),
        }
      })
      .filter((rec) => rec.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  // Hybrid Recommendation - Combine all algorithms
  public getRecommendations(userId: string, limit = 20): EventRecommendation[] {
    const collaborative = this.collaborativeFiltering(userId, Math.ceil(limit * 0.4))
    const contentBased = this.contentBasedFiltering(userId, Math.ceil(limit * 0.4))
    const popularity = this.popularityBasedFiltering(userId, Math.ceil(limit * 0.2))

    // Combine and deduplicate
    const combinedMap = new Map<string, EventRecommendation>()

    // Add collaborative filtering results with higher weight
    collaborative.forEach((rec) => {
      combinedMap.set(rec.eventId, { ...rec, score: rec.score * 1.2 })
    })

    // Add content-based results
    contentBased.forEach((rec) => {
      const existing = combinedMap.get(rec.eventId)
      if (existing) {
        existing.score += rec.score
        existing.reasons = [...new Set([...existing.reasons, ...rec.reasons])]
        existing.algorithm = "hybrid"
      } else {
        combinedMap.set(rec.eventId, rec)
      }
    })

    // Add popularity-based results with lower weight
    popularity.forEach((rec) => {
      const existing = combinedMap.get(rec.eventId)
      if (existing) {
        existing.score += rec.score * 0.8
        existing.reasons = [...new Set([...existing.reasons, ...rec.reasons])]
        existing.algorithm = "hybrid"
      } else {
        combinedMap.set(rec.eventId, { ...rec, score: rec.score * 0.8 })
      }
    })

    return Array.from(combinedMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((rec) => ({
        ...rec,
        confidence: Math.min(rec.score, 1),
      }))
  }

  // Helper methods
  private findSimilarUsers(userId: string): { userId: string; similarity: number }[] {
    const userProfile = this.userProfiles.get(userId)
    if (!userProfile) return []

    const similarities: { userId: string; similarity: number }[] = []

    this.userProfiles.forEach((otherProfile, otherUserId) => {
      if (otherUserId === userId) return

      const similarity = this.calculateUserSimilarity(userProfile, otherProfile)
      if (similarity > 0.3) {
        similarities.push({ userId: otherUserId, similarity })
      }
    })

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 10)
  }

  private calculateUserSimilarity(user1: UserEventProfile, user2: UserEventProfile): number {
    const events1 = new Set(user1.attendedEvents)
    const events2 = new Set(user2.attendedEvents)
    const intersection = new Set([...events1].filter((x) => events2.has(x)))
    const union = new Set([...events1, ...events2])

    const jaccardSimilarity = intersection.size / union.size

    // Category similarity
    const categories1 = new Set(user1.interestedCategories)
    const categories2 = new Set(user2.interestedCategories)
    const categoryIntersection = new Set([...categories1].filter((x) => categories2.has(x)))
    const categoryUnion = new Set([...categories1, ...categories2])
    const categorySimilarity = categoryIntersection.size / categoryUnion.size

    return jaccardSimilarity * 0.7 + categorySimilarity * 0.3
  }

  private extractUserTags(userProfile: UserEventProfile): string[] {
    const tags: string[] = []

    // Extract tags from attended events
    userProfile.attendedEvents.forEach((eventId) => {
      const event = this.events.find((e) => e.id === eventId)
      if (event) {
        tags.push(...event.tags)
      }
    })

    return [...new Set(tags)]
  }

  private matchesTimePreference(eventHour: number, preferredTimes: string[]): boolean {
    return preferredTimes.some((timeRange) => {
      if (timeRange === "morning" && eventHour >= 6 && eventHour < 12) return true
      if (timeRange === "afternoon" && eventHour >= 12 && eventHour < 18) return true
      if (timeRange === "evening" && eventHour >= 18 && eventHour < 24) return true
      return false
    })
  }

  private isRecentlyPopular(eventId: string): boolean {
    // Simulate recent popularity check
    // In real implementation, this would check recent engagement metrics
    return Math.random() > 0.7
  }

  // Public methods for updating user profiles
  public updateUserProfile(userId: string, profile: Partial<UserEventProfile>): void {
    const existing = this.userProfiles.get(userId) || {
      userId,
      attendedEvents: [],
      interestedCategories: [],
      preferredTimes: [],
      preferredLocations: [],
      socialConnections: [],
      engagementHistory: [],
    }

    this.userProfiles.set(userId, { ...existing, ...profile })
  }

  public recordUserEngagement(
    userId: string,
    eventId: string,
    action: UserEventProfile["engagementHistory"][0]["action"],
    rating?: number,
  ): void {
    const profile = this.userProfiles.get(userId)
    if (!profile) return

    profile.engagementHistory.push({
      eventId,
      action,
      timestamp: new Date().toISOString(),
      rating,
    })

    // Update attended events if user registered/attended
    if (action === "attended" || action === "registered") {
      if (!profile.attendedEvents.includes(eventId)) {
        profile.attendedEvents.push(eventId)
      }
    }
  }
}
