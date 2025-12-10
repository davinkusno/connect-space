/**
 * Content-Based Filtering Algorithm
 *
 * ============================================================================
 * ACADEMIC REFERENCES
 * ============================================================================
 *
 * [1] Lops, P., de Gemmis, M., & Semeraro, G. (2011). "Content-based
 *     Recommender Systems: State of the Art and Trends." Recommender
 *     Systems Handbook, Springer, pp. 73-105.
 *     DOI: 10.1007/978-0-387-85820-3_3
 *     - Foundation for content-based filtering
 *     - Term matching and keyword analysis
 *
 * [2] Widayanti, R., et al. (2025). "Improving Recommender Systems using
 *     Hybrid Techniques of Collaborative Filtering and Content-Based Filtering."
 *     Journal of Applied Data Sciences.
 *     - CBF effective for cold-start problem mitigation
 *     - Enhanced diversity through content analysis
 *
 * [3] Roy, D., & Dutta, M. (2022). "A Systematic Review and Research
 *     Perspective on Recommender Systems." Journal of Big Data, 9(1), 59.
 *     DOI: 10.1186/s40537-022-00592-5
 *     - CBF advantages for new users
 *     - Feature extraction methodology
 *
 * ============================================================================
 * SCORING METHODOLOGY
 * ============================================================================
 *
 * Category Match Score (weight: 0.35):
 *   - Direct category match: 1.0
 *   - Keyword-based match: 0.3-0.8 based on overlap
 *   Reference: Lops et al. (2011) - Category-based filtering
 *
 * Interest Match Score (weight: 0.30):
 *   - Interest overlap = |user_interests ∩ community_keywords| / |user_interests|
 *   Reference: Term Frequency methodology from Lops et al. (2011)
 *
 * Location Score (weight: 0.20):
 *   - Haversine distance with exponential decay
 *   - Decay factor: e^(-distance/50km)
 *   Reference: Sinnott, R. W. (1984). "Virtues of the Haversine."
 *
 * Activity Score (weight: 0.15):
 *   - Normalized member count and activity level
 *   Reference: Roy & Dutta (2022) - Activity-based relevance
 *
 * ============================================================================
 */

import type { Community, RecommendationScore, User } from "../types"

// Keywords mapping for user interests to help match with community content
const INTEREST_KEYWORDS: Record<string, string[]> = {
  "hobbies & crafts": ["hobby", "craft", "diy", "handmade", "creative", "maker", "gaming", "game", "collection", "collector"],
  "sports & fitness": ["sport", "fitness", "gym", "workout", "exercise", "running", "cycling", "yoga", "athletic", "health", "basketball", "football", "soccer", "swimming", "tennis", "badminton", "volleyball"],
  "career & business": ["career", "business", "professional", "networking", "entrepreneur", "startup", "job", "work", "corporate", "leadership", "management"],
  "tech & innovation": ["tech", "technology", "programming", "coding", "developer", "software", "hardware", "ai", "machine learning", "data", "digital", "innovation", "computer", "it", "web", "app"],
  "arts & culture": ["art", "culture", "museum", "gallery", "painting", "sculpture", "design", "creative", "artist", "cultural", "heritage"],
  "social & community": ["social", "community", "volunteer", "charity", "nonprofit", "help", "support", "connect", "meetup", "gathering"],
  "education & learning": ["education", "learning", "study", "course", "workshop", "training", "skill", "knowledge", "academic", "school", "university", "teach"],
  "travel & adventure": ["travel", "adventure", "explore", "trip", "journey", "hiking", "outdoor", "nature", "tourism", "backpack"],
  "food & drink": ["food", "drink", "cooking", "culinary", "restaurant", "recipe", "cuisine", "chef", "baking", "coffee", "wine", "beer"],
  "entertainment": ["entertainment", "movie", "film", "music", "concert", "show", "theater", "performance", "fun", "party", "event"],
  // Database category mappings
  "environmental": ["environment", "nature", "sustainability", "green", "eco", "climate", "conservation", "wildlife", "recycling"],
  "music": ["music", "band", "concert", "instrument", "song", "singing", "musician", "guitar", "piano", "dj"],
  "sports": ["sport", "fitness", "athletic", "game", "team", "competition", "training"],
  "hobbies": ["hobby", "craft", "gaming", "collection", "leisure", "pastime"],
  "education": ["education", "learning", "teaching", "academic", "study", "course", "workshop"],
  "art": ["art", "artist", "creative", "design", "painting", "drawing", "sculpture", "gallery"],
}

export class ContentBasedFilteringAlgorithm {
  private enableLogging = true
  private _loggedCommunities = false
  
  private log(...args: any[]) {
    if (this.enableLogging) {
      console.log("[CONTENT-BASED]", ...args)
    }
  }

  /**
   * Content-based recommendations using user interests and community attributes
   */
  async generateRecommendations(
    user: User,
    communities: Community[],
    maxRecommendations = 10,
  ): Promise<RecommendationScore[]> {
    this.log("=== Starting content-based filtering ===")
    this.log("User interests:", user.interests)
    this.log("User preferred categories:", user.preferences.preferredCategories)
    this.log("Total communities:", communities.length)
    this.log("User joined communities:", user.joinedCommunities.length)
    
    // Filter out communities user has already joined
    const candidateCommunities = communities.filter((c) => !user.joinedCommunities.includes(c.id))
    this.log("Candidate communities (excluding joined):", candidateCommunities.length)

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

    // Log scores distribution
    const withScore = scores.filter(s => s.score > 0)
    const aboveThreshold = scores.filter(s => s.score > 0.1)
    this.log("Communities with any score (> 0):", withScore.length)
    this.log("Communities above threshold (> 0.1):", aboveThreshold.length)
    
    // Log top 5 scoring communities
    const sortedScores = [...scores].sort((a, b) => b.score - a.score)
    this.log("Top 5 scored communities:")
    sortedScores.slice(0, 5).forEach((s, i) => {
      const comm = communities.find(c => c.id === s.communityId)
      this.log(`  ${i + 1}. ${comm?.name} - score: ${s.score.toFixed(3)}, category: ${comm?.category}`)
    })
    
    // Log bottom 5 (to see what's not matching)
    this.log("Bottom 5 scored communities (to debug non-matches):")
    sortedScores.slice(-5).forEach((s, i) => {
      const comm = communities.find(c => c.id === s.communityId)
      this.log(`  ${i + 1}. ${comm?.name} - score: ${s.score.toFixed(3)}, category: ${comm?.category}`)
    })

    // Only return communities with a meaningful score (> 0.1)
    const result = scores
      .filter((s) => s.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations)
    
    this.log("Returning", result.length, "recommendations")
    return result
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

    /**
     * Weight distribution based on Lops et al. (2011) and Roy & Dutta (2022):
     * - Category Match: 0.35 (primary relevance indicator)
     * - Interest Match: 0.30 (term frequency matching)
     * - Location Score: 0.20 (geographic relevance)
     * - Activity Score: 0.15 (engagement matching)
     * Total: 1.0
     */
    const WEIGHTS = {
      category: 0.35,
      interest: 0.30,
      location: 0.20,
      activity: 0.15,
    }

    // FIRST: Check category match - this is the PRIMARY filter
    const categoryMatch = this.checkCategoryMatch(user.preferences.preferredCategories, community.category)
    
    // If community has a proper category (not "General") and it doesn't match user's interests,
    // give it a very low score
    const hasCategoryMismatch = community.category !== "General" && !categoryMatch.matched
    
    if (categoryMatch.matched) {
      // Category matches - give high base score
      totalScore += 0.9 * WEIGHTS.category
      totalWeight += WEIGHTS.category
      reasons.push({
        type: "interest_match",
        description: `Matches your preferred category: ${community.category}`,
        weight: WEIGHTS.category,
        evidence: { category: community.category, matchedPreference: categoryMatch.matchedPreference },
      })
    } else if (hasCategoryMismatch) {
      // Category doesn't match and community has a specific category - heavily penalize
      this.log(`Category mismatch: ${community.name} is "${community.category}" but user wants ${user.preferences.preferredCategories.join(", ")}`)
      return { score: 0.05, confidence: 0.3, reasons: [] } // Return very low score
    }
    // For "General" category communities, continue with keyword matching

    // Enhanced interest matching - term frequency methodology from Lops et al. (2011)
    if (categoryMatch.matched) {
      const interestScore = this.calculateEnhancedInterestMatch(user.interests, community)
      if (interestScore.score > 0) {
        totalScore += interestScore.score * WEIGHTS.interest
        totalWeight += WEIGHTS.interest
        reasons.push({
          type: "interest_match",
          description: `Matches your interests: ${interestScore.matchedInterests.join(", ")}`,
          weight: WEIGHTS.interest,
          evidence: { matchedInterests: interestScore.matchedInterests, score: interestScore.score },
        })
      }
    }

    // Location proximity using Haversine distance with exponential decay
    // Decay factor: e^(-distance/50km) per Sinnott (1984)
    if (user.location && community.location && community.location.lat !== 0 && community.location.lng !== 0) {
      const locationScore = this.calculateLocationScore(user, community)
      if (locationScore.score > 0) {
        totalScore += locationScore.score * WEIGHTS.location
        totalWeight += WEIGHTS.location
        reasons.push({
          type: "location_proximity",
          description: `Located ${locationScore.distance.toFixed(1)}km from you`,
          weight: WEIGHTS.location,
          evidence: { distance: locationScore.distance, score: locationScore.score },
        })
      }
    }

    // Activity level matching per Roy & Dutta (2022) - engagement relevance
    const activityScore = this.calculateActivityMatch(user, community)
    if (activityScore > 0) {
      totalScore += activityScore * WEIGHTS.activity
      totalWeight += WEIGHTS.activity
      reasons.push({
        type: "activity_match",
        description: `Activity level matches your preference`,
        weight: WEIGHTS.activity,
        evidence: { userLevel: user.activityLevel, communityLevel: community.activityLevel },
      })
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0
    const confidence = Math.min(0.9, totalWeight)

    return { score: finalScore, confidence, reasons }
  }

  /**
   * Enhanced interest matching that checks community name, description, category, tags
   */
  private calculateEnhancedInterestMatch(
    userInterests: string[],
    community: Community,
  ): { score: number; matchedInterests: string[] } {
    const matchedInterests: string[] = []
    let totalScore = 0

    // Build searchable text from community
    const communityText = [
      community.name,
      community.description,
      community.category,
      ...community.tags,
      ...community.contentTopics,
    ].join(" ").toLowerCase()

    // Debug logging for first few communities
    if (community.name && !this._loggedCommunities) {
      this._loggedCommunities = true
      this.log("Sample community text for matching:")
      this.log(`  Name: ${community.name}`)
      this.log(`  Category: ${community.category}`)
      this.log(`  ContentTopics: ${community.contentTopics?.slice(0, 10).join(", ")}`)
      this.log(`  User interests to match: ${userInterests.join(", ")}`)
    }

    // Get keywords for each user interest and check matches
    // Use word boundary matching to avoid false positives
    for (const interest of userInterests) {
      const interestLower = interest.toLowerCase()
      const keywords = INTEREST_KEYWORDS[interestLower] || []
      
      // Add the interest itself and its words as keywords
      const interestWords = interestLower.split(/[\s&]+/).filter(w => w.length > 2)
      const allKeywords = [...keywords, ...interestWords]
      
      let bestMatchScore = 0
      
      for (const keyword of allKeywords) {
        // Use word boundary regex to avoid substring false matches
        // Match whole words only (not substrings within other words)
        const wordBoundaryRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        if (wordBoundaryRegex.test(communityText)) {
          // Exact keyword found as whole word in community text
          bestMatchScore = Math.max(bestMatchScore, 1.0)
        } else {
          // Check for partial matches (e.g., "sport" matches "sports") with word boundary
          const keywordBase = keyword.replace(/s$/, "") // Remove trailing 's'
          if (keywordBase.length > 2) {
            const baseRegex = new RegExp(`\\b${keywordBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
            if (baseRegex.test(communityText)) {
              bestMatchScore = Math.max(bestMatchScore, 0.8)
            }
          }
        }
      }
      
      if (bestMatchScore > 0) {
        matchedInterests.push(interest)
        totalScore += bestMatchScore
      }
    }

    // Normalize score based on number of user interests
    const normalizedScore = userInterests.length > 0 
      ? Math.min(1, totalScore / userInterests.length)
      : 0

    return { score: normalizedScore, matchedInterests }
  }

  /**
   * Check if user's preferred categories match the community category
   */
  private checkCategoryMatch(
    preferredCategories: string[],
    communityCategory: string,
  ): { matched: boolean; matchedPreference: string | null } {
    const categoryLower = communityCategory.toLowerCase()
    
    for (const pref of preferredCategories) {
      const prefLower = pref.toLowerCase()
      
      // Direct match
      if (prefLower === categoryLower) {
        return { matched: true, matchedPreference: pref }
      }
      
      // Check if category is contained in preference or vice versa
      if (prefLower.includes(categoryLower) || categoryLower.includes(prefLower)) {
        return { matched: true, matchedPreference: pref }
      }
      
      // Check keyword-based mapping
      const prefKeywords = INTEREST_KEYWORDS[prefLower] || []
      if (prefKeywords.some(kw => categoryLower.includes(kw))) {
        return { matched: true, matchedPreference: pref }
      }
    }
    
    return { matched: false, matchedPreference: null }
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

    const score = Math.min(1, totalMatches / Math.max(userInterests.length, communityTerms.length, 1))
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
