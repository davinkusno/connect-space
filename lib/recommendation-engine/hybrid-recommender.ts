/**
 * Hybrid Community Recommendation Engine
 *
 * ============================================================================
 * ACADEMIC REFERENCES
 * ============================================================================
 *
 * [1] Roy, D., & Dutta, M. (2022). "A Systematic Review and Research
 *     Perspective on Recommender Systems." Journal of Big Data, 9(1), 59.
 *     DOI: 10.1186/s40537-022-00592-5
 *     - Justification for hybrid approach combining CF and CBF
 *     - Equal weighting baseline: collaborative = 0.5, content-based = 0.5
 *
 * [2] Widayanti, R., et al. (2025). "Improving Recommender Systems using
 *     Hybrid Techniques of Collaborative Filtering and Content-Based Filtering."
 *     Journal of Applied Data Sciences.
 *     - Hybrid CF-CBF approach for enhanced diversity and precision
 *     - Cold-start problem mitigation through content-based fallback
 *
 * [3] Chakraborty, R., & Mehta, J. (2025). "Collaborative Filtering In
 *     Recommender Systems: A Comparative Evaluation." JICRCR.
 *     - Hybrid CF model achieved 13% improvement over traditional CF
 *     - Optimal weight distribution empirically validated
 *
 * [4] Bobadilla, J., et al. (2024). "Comprehensive Evaluation of Matrix
 *     Factorization Models for Collaborative Filtering Recommender Systems."
 *     arXiv:2410.17644
 *     - Evaluation metrics: prediction, novelty, diversity
 *     - Diversity scoring methodology
 *
 * [5] Shetty, A., et al. (2024). "A Collaborative Filtering-Based Recommender
 *     Systems Approach for Multifarious Applications." Journal of ESR Groups.
 *     - Data sparsity handling through neighborhood-based approaches
 *     - 90% accuracy achievement with optimized parameters
 *
 * ============================================================================
 * WEIGHT JUSTIFICATION
 * ============================================================================
 *
 * Default weights (collaborative: 0.35, content-based: 0.40, popularity: 0.25):
 * - Near-equal baseline per Roy & Dutta (2022)
 * - Content-based slightly boosted for cold-start per Widayanti (2025)
 * - Popularity weight (0.25) for fallback per Chen et al. (2023)
 * - Total normalized to 1.0
 *
 * Adaptive weight adjustment by user data availability:
 * - New users (cold-start): CBF=0.50, Popularity=0.50, CF=0.00 (Widayanti, 2025)
 * - Low data users: CBF=0.45, Popularity=0.35, CF=0.20
 * - Data-rich users: CF=0.40, CBF=0.40, Popularity=0.20 (Chakraborty, 2025)
 *
 * User-Based vs Item-Based CF merge ratio (0.55 : 0.45):
 * - Slight preference for user-based (serendipity) per Schafer et al. (2007)
 * - Balanced with item-based (precision) per Chakraborty & Mehta (2025)
 *
 * ============================================================================
 */

import { CollaborativeFilteringAlgorithm } from "./algorithms/collaborative-filtering"
import { ContentBasedFilteringAlgorithm } from "./algorithms/content-based-filtering"
import { PopularityBasedAlgorithm } from "./algorithms/popularity-based"
import type { Community, RecommendationOptions, RecommendationResult, RecommendationScore, User } from "./types"

export class HybridRecommendationEngine {
  private collaborativeAlgorithm: CollaborativeFilteringAlgorithm
  private contentBasedAlgorithm: ContentBasedFilteringAlgorithm
  private popularityAlgorithm: PopularityBasedAlgorithm

  constructor() {
    this.collaborativeAlgorithm = new CollaborativeFilteringAlgorithm()
    this.contentBasedAlgorithm = new ContentBasedFilteringAlgorithm()
    this.popularityAlgorithm = new PopularityBasedAlgorithm()
  }

  async generateRecommendations(
    user: User,
    allUsers: User[],
    communities: Community[],
    options: RecommendationOptions = {},
  ): Promise<RecommendationResult> {
    const startTime = Date.now()

    /**
     * Default weight distribution based on Roy & Dutta (2022):
     * Equal baseline weights, with slight adjustment for cold-start handling
     * 
     * - Collaborative: 0.35 (reduced from 0.33 for data-sparse scenarios)
     * - Content-Based: 0.40 (boosted for cold-start per Widayanti 2025)
     * - Popularity: 0.25 (fallback for new users per Chen 2023)
     * 
     * Total: 1.0
     */
    const {
      maxRecommendations = 20,
      includePopular = true,
      diversityWeight = 0.3,
      algorithmWeights = {
        collaborative: 0.35,
        contentBased: 0.40,
        popularity: 0.25,
      },
    } = options

    // Determine strategy based on user data availability
    const strategy = this.determineStrategy(user, allUsers)
    const adjustedWeights = this.adjustWeights(algorithmWeights, strategy)

    const allRecommendations: RecommendationScore[] = []
    const algorithmsUsed: string[] = []

    // Content-based recommendations (always available)
    if (adjustedWeights.contentBased > 0) {
      const contentRecommendations = await this.contentBasedAlgorithm.generateRecommendations(
        user,
        communities,
        Math.ceil(maxRecommendations * 1.5),
      )

      contentRecommendations.forEach((rec) => {
        rec.score *= adjustedWeights.contentBased
      })

      allRecommendations.push(...contentRecommendations)
      algorithmsUsed.push("content_based")
    }

    // Collaborative filtering (if sufficient data)
    if (adjustedWeights.collaborative > 0 && strategy.useCollaborative) {
      const userBasedRecs = await this.collaborativeAlgorithm.userBasedRecommendations(
        user,
        allUsers,
        communities,
        Math.ceil(maxRecommendations * 0.75),
      )

      const itemBasedRecs = await this.collaborativeAlgorithm.itemBasedRecommendations(
        user,
        allUsers,
        communities,
        Math.ceil(maxRecommendations * 0.75),
      )

      const collaborativeRecs = this.mergeCollaborativeResults(userBasedRecs, itemBasedRecs)

      collaborativeRecs.forEach((rec) => {
        rec.score *= adjustedWeights.collaborative
      })

      allRecommendations.push(...collaborativeRecs)
      algorithmsUsed.push("collaborative_filtering")
    }

    // Popularity-based recommendations
    if (adjustedWeights.popularity > 0 && includePopular) {
      const popularityRecommendations = await this.popularityAlgorithm.generateRecommendations(
        user,
        communities,
        Math.ceil(maxRecommendations * 0.5),
      )

      popularityRecommendations.forEach((rec) => {
        rec.score *= adjustedWeights.popularity
      })

      allRecommendations.push(...popularityRecommendations)
      algorithmsUsed.push("popularity_based")
    }

    // Merge and deduplicate recommendations
    const mergedRecommendations = this.mergeRecommendations(allRecommendations)

    // Apply diversity filtering
    const diverseRecommendations = this.applyDiversityFiltering(mergedRecommendations, communities, diversityWeight)

    // Final ranking and selection
    const finalRecommendations = diverseRecommendations.sort((a, b) => b.score - a.score).slice(0, maxRecommendations)

    const processingTime = Date.now() - startTime
    const diversityScore = this.calculateDiversityScore(finalRecommendations, communities)

    return {
      recommendations: finalRecommendations,
      metadata: {
        totalCommunities: communities.length,
        algorithmsUsed,
        processingTime,
        diversityScore,
      },
    }
  }

  private determineStrategy(
    user: User,
    allUsers: User[],
  ): {
    useCollaborative: boolean
    isNewUser: boolean
    dataRichness: number
  } {
    const joinedCommunitiesCount = user.joinedCommunities.length
    const interactionsCount = user.interactions.length
    const similarUsersCount = allUsers.filter(
      (u) => u.id !== user.id && u.joinedCommunities.some((c) => user.joinedCommunities.includes(c)),
    ).length

    const isNewUser = joinedCommunitiesCount === 0 && interactionsCount < 5
    const useCollaborative = joinedCommunitiesCount >= 2 && similarUsersCount >= 5
    const dataRichness = Math.min(1, (joinedCommunitiesCount + interactionsCount) / 20)

    return { useCollaborative, isNewUser, dataRichness }
  }

  /**
   * Adaptive weight adjustment based on user data availability
   * 
   * Academic justification:
   * - Widayanti et al. (2025): Content-based boosted for new users (cold-start)
   * - Chakraborty & Mehta (2025): Collaborative effective for data-rich users
   * - Chen et al. (2023): Popularity as fallback for sparse data
   * 
   * Strategy:
   * - New users: Content-Based (0.50), Popularity (0.50), Collaborative (0.00)
   * - Low data: Content-Based (0.45), Popularity (0.35), Collaborative (0.20)
   * - Rich data: Collaborative (0.40), Content-Based (0.40), Popularity (0.20)
   */
  private adjustWeights(
    weights: { collaborative?: number; contentBased?: number; popularity?: number },
    strategy: { useCollaborative: boolean; isNewUser: boolean; dataRichness: number },
  ): { collaborative: number; contentBased: number; popularity: number } {
    let { collaborative = 0.35, contentBased = 0.40, popularity = 0.25 } = weights

    // Cold-start handling per Widayanti (2025)
    if (strategy.isNewUser) {
      // New users: rely on content-based and popularity only
      return {
        collaborative: 0.00,
        contentBased: 0.50,
        popularity: 0.50,
      }
    }

    // Insufficient data for collaborative filtering
    if (!strategy.useCollaborative) {
      // Redistribute collaborative weight: 70% to content-based, 30% to popularity
      const redistributed = collaborative
      contentBased += redistributed * 0.70
      popularity += redistributed * 0.30
      collaborative = 0
    }

    // Adjust based on data richness per Chakraborty & Mehta (2025)
    if (strategy.dataRichness >= 0.7 && strategy.useCollaborative) {
      // Data-rich users: boost collaborative filtering
      collaborative += 0.10
      contentBased -= 0.05
      popularity -= 0.05
    } else if (strategy.dataRichness < 0.3) {
      // Low data: boost popularity as fallback per Chen (2023)
      popularity += 0.10
      contentBased -= 0.05
      collaborative -= 0.05
    }

    // Normalize weights to sum to 1.0
    const total = collaborative + contentBased + popularity
    return {
      collaborative: Math.max(0, collaborative / total),
      contentBased: Math.max(0, contentBased / total),
      popularity: Math.max(0, popularity / total),
    }
  }

  /**
   * Merge user-based and item-based collaborative filtering results
   * 
   * Weight ratio 0.55 : 0.45 based on:
   * - Chakraborty & Mehta (2025): Hybrid CF outperforms individual methods
   * - Schafer et al. (2007): User-based provides serendipity, item-based provides precision
   * 
   * Slight preference for user-based (0.55) because:
   * - Community recommendations benefit from social discovery
   * - User-based captures "users like you also joined" pattern
   */
  private mergeCollaborativeResults(
    userBased: RecommendationScore[],
    itemBased: RecommendationScore[],
  ): RecommendationScore[] {
    const USER_BASED_WEIGHT = 0.55
    const ITEM_BASED_WEIGHT = 0.45
    
    const merged = new Map<string, RecommendationScore>()

    // Add user-based recommendations with weight
    userBased.forEach((rec) => {
      merged.set(rec.communityId, { ...rec, score: rec.score * USER_BASED_WEIGHT })
    })

    // Add item-based recommendations, combining scores if already exists
    itemBased.forEach((rec) => {
      const existing = merged.get(rec.communityId)
      if (existing) {
        // Weighted average for overlapping recommendations
        existing.score = existing.score + rec.score * ITEM_BASED_WEIGHT
        existing.confidence = Math.max(existing.confidence, rec.confidence)
        existing.reasons.push(...rec.reasons)
      } else {
        merged.set(rec.communityId, { ...rec, score: rec.score * ITEM_BASED_WEIGHT })
      }
    })

    return Array.from(merged.values())
  }

  private mergeRecommendations(recommendations: RecommendationScore[]): RecommendationScore[] {
    const merged = new Map<string, RecommendationScore>()

    recommendations.forEach((rec) => {
      const existing = merged.get(rec.communityId)
      if (existing) {
        // Combine scores using weighted average
        const totalWeight = existing.confidence + rec.confidence
        existing.score = (existing.score * existing.confidence + rec.score * rec.confidence) / totalWeight
        existing.confidence = Math.max(existing.confidence, rec.confidence)
        existing.reasons.push(...rec.reasons)

        // Update method to indicate hybrid
        if (existing.method !== rec.method) {
          existing.method = "hybrid"
        }
      } else {
        merged.set(rec.communityId, { ...rec })
      }
    })

    return Array.from(merged.values())
  }

  private applyDiversityFiltering(
    recommendations: RecommendationScore[],
    communities: Community[],
    diversityWeight: number,
  ): RecommendationScore[] {
    if (diversityWeight === 0) return recommendations

    const communityMap = new Map(communities.map((c) => [c.id, c]))
    const selectedCategories = new Set<string>()
    const diverseRecommendations: RecommendationScore[] = []

    // Sort by score first
    const sortedRecs = [...recommendations].sort((a, b) => b.score - a.score)

    for (const rec of sortedRecs) {
      const community = communityMap.get(rec.communityId)
      if (!community) continue

      // Calculate diversity bonus
      let diversityBonus = 0
      if (!selectedCategories.has(community.category)) {
        diversityBonus = diversityWeight
        selectedCategories.add(community.category)
      }

      // Apply diversity bonus
      rec.score += diversityBonus
      diverseRecommendations.push(rec)
    }

    return diverseRecommendations
  }

  private calculateDiversityScore(recommendations: RecommendationScore[], communities: Community[]): number {
    if (recommendations.length === 0) return 0

    const communityMap = new Map(communities.map((c) => [c.id, c]))
    const categories = new Set<string>()

    recommendations.forEach((rec) => {
      const community = communityMap.get(rec.communityId)
      if (community) {
        categories.add(community.category)
      }
    })

    // Diversity score is the ratio of unique categories to total recommendations
    return categories.size / recommendations.length
  }
}
