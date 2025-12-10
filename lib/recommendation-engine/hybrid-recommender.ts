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

    const {
      maxRecommendations = 20,
      includePopular = true,
      diversityWeight = 0.3,
      algorithmWeights = {
        collaborative: 0.4,
        contentBased: 0.4,
        popularity: 0.2,
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

  private adjustWeights(
    weights: { collaborative?: number; contentBased?: number; popularity?: number },
    strategy: { useCollaborative: boolean; isNewUser: boolean; dataRichness: number },
  ): { collaborative: number; contentBased: number; popularity: number } {
    let { collaborative = 0.4, contentBased = 0.4, popularity = 0.2 } = weights

    if (!strategy.useCollaborative) {
      // Redistribute collaborative weight to content-based and popularity
      contentBased += collaborative * 0.7
      popularity += collaborative * 0.3
      collaborative = 0
    }

    if (strategy.isNewUser) {
      // Boost popularity for new users
      const boost = 0.2
      popularity += boost
      contentBased -= boost * 0.5
      collaborative -= boost * 0.5
    }

    // Adjust based on data richness
    if (strategy.dataRichness < 0.3) {
      popularity += 0.1
      contentBased -= 0.05
      collaborative -= 0.05
    }

    // Normalize weights
    const total = collaborative + contentBased + popularity
    return {
      collaborative: collaborative / total,
      contentBased: contentBased / total,
      popularity: popularity / total,
    }
  }

  private mergeCollaborativeResults(
    userBased: RecommendationScore[],
    itemBased: RecommendationScore[],
  ): RecommendationScore[] {
    const merged = new Map<string, RecommendationScore>()

    // Add user-based recommendations
    userBased.forEach((rec) => {
      merged.set(rec.communityId, { ...rec, score: rec.score * 0.6 })
    })

    // Add item-based recommendations, combining scores if already exists
    itemBased.forEach((rec) => {
      const existing = merged.get(rec.communityId)
      if (existing) {
        existing.score = (existing.score + rec.score * 0.4) / 2
        existing.confidence = Math.max(existing.confidence, rec.confidence)
        existing.reasons.push(...rec.reasons)
      } else {
        merged.set(rec.communityId, { ...rec, score: rec.score * 0.4 })
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
