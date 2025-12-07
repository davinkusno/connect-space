import type { User, Community, RecommendationScore } from "../types"

export class ContentBasedFilteringAlgorithm {
  /**
   * Content-based recommendations using user interests and community attributes
   */
  async generateRecommendations(
    user: User,
    communities: Community[],
    maxRecommendations = 10,
  ): Promise<RecommendationScore[]> {
    // Filter out communities user has already joined
    const candidateCommunities = communities.filter((c) => !user.joinedCommunities.includes(c.id))

    const scores = candidateCommunities.map((community) => {
      const score = this.calculateContentBasedScore(user, community)
      return {
        communityId: community.id,
        score: score.score,
        confidence: score.confidence,
        method: "content_based",
        reasons: score.reasons,
      }
    })

    return scores.sort((a, b) => b.score - a.score).slice(0, maxRecommendations)
  }

  private calculateContentBasedScore(
    user: User,
    community: Community,
  ): {
    score: number
    confidence: number
    reasons: Array<{
      type: "interest_match" | "location_proximity" | "activity_match" | "demographic_match"
      description: string
      weight: number
      evidence: any
    }>
  } {
    let totalScore = 0
    let totalWeight = 0
    const reasons: any[] = []

    // Interest matching
    const interestScore = this.calculateInterestMatch(user.interests, community.tags, community.contentTopics)
    if (interestScore.score > 0) {
      totalScore += interestScore.score * 0.4
      totalWeight += 0.4
      reasons.push({
        type: "interest_match",
        description: `Matches your interests: ${interestScore.matchedInterests.join(", ")}`,
        weight: 0.4,
        evidence: { matchedInterests: interestScore.matchedInterests, score: interestScore.score },
      })
    }

    // Category preference
    if (user.preferences.preferredCategories.includes(community.category)) {
      totalScore += 0.8 * 0.2
      totalWeight += 0.2
      reasons.push({
        type: "interest_match",
        description: `Matches your preferred category: ${community.category}`,
        weight: 0.2,
        evidence: { category: community.category },
      })
    }

    // Location proximity (only if both user and community have location)
    // For online communities without location, this factor is skipped
    if (user.location && community.location) {
      const locationScore = this.calculateLocationScore(user, community)
      if (locationScore.score > 0) {
        totalScore += locationScore.score * 0.2
        totalWeight += 0.2
        reasons.push({
          type: "location_proximity",
          description: `Located ${locationScore.distance.toFixed(1)}km from you`,
          weight: 0.2,
          evidence: { distance: locationScore.distance, score: locationScore.score },
        })
      }
    } else if (!community.location && interestScore.score > 0) {
      // For online communities without location, boost interest matching slightly
      // This ensures online communities aren't penalized for not having location
      totalScore += interestScore.score * 0.1 // Small boost for online communities
      totalWeight += 0.1
      reasons.push({
        type: "interest_match",
        description: `Online community - matches your interests`,
        weight: 0.1,
        evidence: { isOnline: true, matchedInterests: interestScore.matchedInterests },
      })
    }

    // Activity level matching
    const activityScore = this.calculateActivityMatch(user, community)
    if (activityScore > 0) {
      totalScore += activityScore * 0.1
      totalWeight += 0.1
      reasons.push({
        type: "activity_match",
        description: `Activity level matches your preference`,
        weight: 0.1,
        evidence: { userLevel: user.activityLevel, communityLevel: community.activityLevel },
      })
    }

    // Community size preference
    if (user.preferences.communitySize) {
      const sizeScore = this.calculateSizeMatch(user.preferences.communitySize, community.memberCount)
      if (sizeScore > 0) {
        totalScore += sizeScore * 0.1
        totalWeight += 0.1
        reasons.push({
          type: "demographic_match",
          description: `Community size matches your preference`,
          weight: 0.1,
          evidence: { preferredSize: user.preferences.communitySize, actualSize: community.memberCount },
        })
      }
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0
    const confidence = Math.min(0.9, totalWeight) // Confidence based on how many factors we could evaluate

    return { score: finalScore, confidence, reasons }
  }

  private calculateInterestMatch(
    userInterests: string[],
    communityTags: string[],
    contentTopics: string[],
  ): { score: number; matchedInterests: string[] } {
    const userInterestsLower = userInterests.map((i) => i.toLowerCase())
    const communityTerms = [...communityTags, ...contentTopics].map((t) => t.toLowerCase())

    const matchedInterests: string[] = []
    let totalMatches = 0

    userInterestsLower.forEach((interest) => {
      // Exact matches
      const exactMatches = communityTerms.filter((term) => term === interest)
      if (exactMatches.length > 0) {
        matchedInterests.push(interest)
        totalMatches += exactMatches.length
      } else {
        // Partial matches (contains)
        const partialMatches = communityTerms.filter((term) => term.includes(interest) || interest.includes(term))
        if (partialMatches.length > 0) {
          matchedInterests.push(interest)
          totalMatches += partialMatches.length * 0.5 // Lower weight for partial matches
        }
      }
    })

    const score = Math.min(1, totalMatches / Math.max(userInterests.length, communityTerms.length))
    return { score, matchedInterests }
  }

  private calculateLocationScore(user: User, community: Community): { score: number; distance: number } {
    if (!user.location || !community.location) {
      return { score: 0, distance: Number.POSITIVE_INFINITY }
    }

    const distance = this.calculateDistance(
      user.location.lat,
      user.location.lng,
      community.location.lat,
      community.location.lng,
    )

    const maxDistance = user.preferences.maxDistance || 50
    const score = Math.max(0, 1 - distance / maxDistance)

    return { score, distance }
  }

  private calculateActivityMatch(user: User, community: Community): number {
    const activityLevels = { low: 1, medium: 2, high: 3 }
    const userLevel = activityLevels[user.activityLevel]
    const communityLevel = activityLevels[community.activityLevel]

    const difference = Math.abs(userLevel - communityLevel)
    return Math.max(0, 1 - difference / 2)
  }

  private calculateSizeMatch(preferredSize: string, memberCount: number): number {
    const sizeRanges = {
      small: [0, 100],
      medium: [100, 1000],
      large: [1000, Number.POSITIVE_INFINITY],
    }

    const range = sizeRanges[preferredSize as keyof typeof sizeRanges]
    if (!range) return 0

    if (memberCount >= range[0] && memberCount < range[1]) {
      return 1
    }

    // Partial score for nearby ranges
    if (preferredSize === "small" && memberCount < 200) return 0.5
    if (preferredSize === "medium" && memberCount >= 100 && memberCount < 2000) return 0.5
    if (preferredSize === "large" && memberCount > 1000) return 0.5

    return 0
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
}
