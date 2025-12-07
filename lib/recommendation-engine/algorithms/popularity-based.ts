import type { User, Community, RecommendationScore } from "../types"

export class PopularityBasedAlgorithm {
  /**
   * Popularity-based recommendations with personalization
   */
  async generateRecommendations(
    user: User,
    communities: Community[],
    maxRecommendations = 10,
  ): Promise<RecommendationScore[]> {
    // Filter out communities user has already joined
    const candidateCommunities = communities.filter((c) => !user.joinedCommunities.includes(c.id))

    const scores = candidateCommunities.map((community) => {
      const score = this.calculatePopularityScore(user, community)
      return {
        communityId: community.id,
        score: score.score,
        confidence: score.confidence,
        method: "popularity_based",
        reasons: [
          {
            type: "popularity" as const,
            description: score.description,
            weight: 1.0,
            evidence: score.evidence,
          },
        ],
      }
    })

    return scores.sort((a, b) => b.score - a.score).slice(0, maxRecommendations)
  }

  private calculatePopularityScore(
    user: User,
    community: Community,
  ): {
    score: number
    confidence: number
    description: string
    evidence: any
  } {
    let score = 0
    let factors = 0
    const evidence: any = {}

    // Member count (normalized)
    const memberScore = Math.min(1, community.memberCount / 5000) // Cap at 5000 members
    score += memberScore * 0.3
    factors += 0.3
    evidence.memberCount = community.memberCount
    evidence.memberScore = memberScore

    // Growth rate
    const growthScore = Math.min(1, community.growthRate * 2) // Cap at 50% growth
    score += growthScore * 0.25
    factors += 0.25
    evidence.growthRate = community.growthRate
    evidence.growthScore = growthScore

    // Engagement score
    const engagementScore = community.engagementScore / 100
    score += engagementScore * 0.35
    factors += 0.35
    evidence.engagementScore = community.engagementScore

    // Recency of activity
    const daysSinceActivity = (Date.now() - community.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    const activityScore = Math.max(0, 1 - daysSinceActivity / 30) // Decay over 30 days
    score += activityScore * 0.1
    factors += 0.1
    evidence.daysSinceActivity = daysSinceActivity

    // Personalization boost based on user preferences
    let personalizedBoost = 0
    if (user.preferences.preferredCategories.includes(community.category)) {
      personalizedBoost += 0.2
    }

    // Location preference
    if (user.location && community.location) {
      const distance = this.calculateDistance(
        user.location.lat,
        user.location.lng,
        community.location.lat,
        community.location.lng,
      )
      const maxDistance = user.preferences.maxDistance || 50
      if (distance <= maxDistance) {
        personalizedBoost += 0.1 * (1 - distance / maxDistance)
      }
    }

    const finalScore = score / factors + personalizedBoost
    const confidence = 0.8 // High confidence for popularity-based recommendations

    let description = `Popular community with ${community.memberCount} members`
    if (community.growthRate > 0.1) {
      description += ` and ${(community.growthRate * 100).toFixed(0)}% growth`
    }

    return {
      score: Math.min(1, finalScore),
      confidence,
      description,
      evidence,
    }
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
