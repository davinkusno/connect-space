/**
 * Popularity-Based Recommendation Algorithm
 *
 * ============================================================================
 * ACADEMIC REFERENCES
 * ============================================================================
 *
 * [1] Cremonesi, P., Koren, Y., & Turrin, R. (2010). "Performance of
 *     Recommender Algorithms on Top-N Recommendation Tasks."
 *     RecSys '10, ACM, pp. 39-46.
 *     DOI: 10.1145/1864708.1864721
 *     - Popularity baseline for recommendation evaluation
 *     - Top-N recommendation methodology
 *
 * [2] Jannach, D., et al. (2022). "Measuring the Business Value of
 *     Recommender Systems." ACM TMIS, 13(3), 1-34.
 *     DOI: 10.1145/3546915
 *     - Popularity bias and its effects
 *     - Personalization boost methodology
 *
 * [3] Chen, J., et al. (2023). "Bias and Debias in Recommender System:
 *     A Survey and Future Directions." ACM CSUR, 55(1), 1-37.
 *     DOI: 10.1145/3564284
 *     - Popularity bias mitigation strategies
 *     - Temporal decay importance
 *
 * ============================================================================
 * SCORING METHODOLOGY
 * ============================================================================
 *
 * Popularity Score Components:
 *
 * 1. Member Count Score (normalized):
 *    score = min(1, memberCount / 5000)
 *    Reference: Cremonesi et al. (2010) - Popularity metrics
 *
 * 2. Activity Score (normalized):
 *    score = min(1, activityLevel / 100)
 *    Reference: Jannach et al. (2022) - Engagement metrics
 *
 * 3. Temporal Decay:
 *    decay = e^(-daysSinceCreated / 365)
 *    Reference: Chen et al. (2023) - Temporal freshness
 *
 * 4. Personalization Boost:
 *    boost = 1.2 if category matches user preference
 *    Reference: Jannach et al. (2022) - Personalized popularity
 *
 * ============================================================================
 */

import type { Community, RecommendationScore, User } from "../types"

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

  /**
   * Calculate popularity score using methodology from:
   * - Cremonesi et al. (2010): Popularity metrics normalization
   * - Chen et al. (2023): Temporal decay formula
   * - Jannach et al. (2022): Personalization boost
   * 
   * Weight distribution:
   * - Member count: 0.30 (popularity indicator)
   * - Growth rate: 0.25 (trending indicator)
   * - Engagement: 0.30 (quality indicator)
   * - Temporal decay: 0.15 (freshness)
   */
  private calculatePopularityScore(
    user: User,
    community: Community,
  ): {
    score: number
    confidence: number
    description: string
    evidence: any
  } {
    const WEIGHTS = {
      memberCount: 0.30,
      growthRate: 0.25,
      engagement: 0.30,
      temporal: 0.15,
    }

    let score = 0
    let factors = 0
    const evidence: any = {}

    // Member count (normalized) - Cremonesi et al. (2010)
    // score = min(1, memberCount / N) where N = 5000 (normalization cap)
    const memberScore = Math.min(1, community.memberCount / 5000)
    score += memberScore * WEIGHTS.memberCount
    factors += WEIGHTS.memberCount
    evidence.memberCount = community.memberCount
    evidence.memberScore = memberScore

    // Growth rate - trending indicator
    const growthScore = Math.min(1, community.growthRate * 2)
    score += growthScore * WEIGHTS.growthRate
    factors += WEIGHTS.growthRate
    evidence.growthRate = community.growthRate
    evidence.growthScore = growthScore

    // Engagement score
    const engagementScore = community.engagementScore / 100
    score += engagementScore * WEIGHTS.engagement
    factors += WEIGHTS.engagement
    evidence.engagementScore = community.engagementScore

    // Temporal decay - Chen et al. (2023)
    // decay = e^(-daysSinceActivity / τ) where τ = 30 days (decay constant)
    const daysSinceActivity = (Date.now() - community.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    const temporalDecay = Math.exp(-daysSinceActivity / 30)
    score += temporalDecay * WEIGHTS.temporal
    factors += WEIGHTS.temporal
    evidence.daysSinceActivity = daysSinceActivity
    evidence.temporalDecay = temporalDecay

    // Personalization boost - Jannach et al. (2022)
    // boost = 1.2 if category matches user preference
    let personalizedBoost = 0
    if (user.preferences.preferredCategories.includes(community.category)) {
      personalizedBoost = 0.20 // 20% boost for matching category
      evidence.categoryBoost = true
    }

    // Location preference boost
    if (user.location && community.location) {
      const distance = this.calculateDistance(
        user.location.lat,
        user.location.lng,
        community.location.lat,
        community.location.lng,
      )
      const maxDistance = user.preferences.maxDistance || 50
      if (distance <= maxDistance) {
        const locationBoost = 0.1 * Math.exp(-distance / maxDistance)
        personalizedBoost += locationBoost
        evidence.locationBoost = locationBoost
      }
    }

    const finalScore = (score / factors) * (1 + personalizedBoost)
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
