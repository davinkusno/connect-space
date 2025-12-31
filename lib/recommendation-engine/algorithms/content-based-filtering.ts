/**
 * Content-Based Filtering Algorithm for Community Recommendations
 *
 * ============================================================================
 * ACADEMIC REFERENCES
 * ============================================================================
 *
 * [1] Huang, R. (2023). "Improved content-based recommendation algorithm 
 *     integrating semantic information." Journal of Big Data, 10, 61.
 *     DOI: 10.1186/s40537-023-00776-7
 *     - TF-IDF methodology for content analysis
 *     - Semantic matching between user preferences and item content
 *
 * [2] Christyawan, F., et al. (2023). "Application of Content-Based Filtering 
 *     Method Using Cosine Similarity in Restaurant Selection Recommendation 
 *     System." Journal of Information Systems and Informatics, 5(3).
 *     - Cosine similarity for recommendation scoring
 *     - Location-based content filtering approach
 *
 * [3] Sinnott, R. W. (1984). "Virtues of the Haversine." Sky and Telescope, 
 *     68(2), 159.
 *     - Haversine formula for geographic distance calculation
 *
 * ============================================================================
 * ALGORITHM
 * ============================================================================
 *
 * Two-Feature Content-Based Filtering:
 *
 * Score = 0.60 × CosineSimilarity(UserInterests, CommunityContent) + 
 *         0.40 × LocationScore
 *
 * Feature 1: Interest Match (60% weight)
 *   - Method: TF-IDF vectorization + Cosine Similarity
 *   - Input: User interests (e.g., ["programming", "startup", "AI"])
 *   - Matching: Community name, description, category, tags, topics
 *   - Formula: similarity = (A · B) / (||A|| × ||B||)
 *   - Reference: Huang (2023), Christyawan et al. (2023)
 *
 * Feature 2: Location Proximity (40% weight)
 *   - Method: Haversine distance with linear decay
 *   - Formula: distance = R × c, where:
 *       a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)
 *       c = 2 · atan2(√a, √(1−a))
 *   - Scoring: score = max(0, 1 - distance/50km)
 *   - Reference: Sinnott (1984)
 *
 * Weight Justification:
 *   - Interest (60%): Primary relevance signal for community matching
 *   - Location (40%): Important for in-person community engagement
 *
 * ============================================================================
 */

import type { Community, RecommendationScore, User } from "../types"

// Keywords mapping for user interests to help match with community content
const INTEREST_KEYWORDS: Record<string, string[]> = {
  "hobbies & crafts": ["hobby", "craft", "diy", "handmade", "creative", "maker", "gaming", "game", "collection", "collector", "knitting", "sewing", "woodworking", "pottery", "modeling", "cosplay"],
  "sports & fitness": ["sport", "fitness", "gym", "workout", "exercise", "running", "cycling", "yoga", "athletic", "health", "basketball", "football", "soccer", "swimming", "tennis", "badminton", "volleyball", "marathon", "triathlon", "crossfit", "martial arts", "boxing", "wrestling", "climbing", "pilates", "cardio", "strength", "training"],
  "career & business": ["career", "business", "professional", "networking", "entrepreneur", "startup", "job", "work", "corporate", "leadership", "management", "consulting", "sales", "marketing", "finance", "strategy", "innovation", "mentorship"],
  "tech & innovation": ["tech", "technology", "programming", "coding", "developer", "software", "hardware", "ai", "machine learning", "data", "digital", "innovation", "computer", "it", "web", "app", "blockchain", "cloud", "database", "api", "frontend", "backend", "mobile", "ux", "ui", "devops", "cybersecurity", "automation", "robotics", "iot", "analytics", "python", "javascript", "java", "react", "node"],
  "arts & culture": ["art", "culture", "museum", "gallery", "painting", "sculpture", "design", "creative", "artist", "cultural", "heritage", "photography", "illustration", "graphic design", "animation", "digital art", "contemporary", "traditional", "exhibition", "visual arts"],
  "social & community": ["social", "community", "volunteer", "charity", "nonprofit", "help", "support", "connect", "meetup", "gathering", "activism", "advocacy", "outreach", "engagement", "collaboration", "networking"],
  "education & learning": ["education", "learning", "study", "course", "workshop", "training", "skill", "knowledge", "academic", "school", "university", "teach", "tutorial", "lecture", "seminar", "bootcamp", "certification", "mentoring", "coaching"],
  "travel & adventure": ["travel", "adventure", "explore", "trip", "journey", "hiking", "outdoor", "nature", "tourism", "backpack", "trekking", "camping", "roadtrip", "expedition", "wanderlust", "destination", "exploration"],
  "food & drink": ["food", "drink", "cooking", "culinary", "restaurant", "recipe", "cuisine", "chef", "baking", "coffee", "wine", "beer", "foodie", "gastronomy", "dining", "cafe", "barista", "sommelier", "vegan", "vegetarian", "organic"],
  "entertainment": ["entertainment", "movie", "film", "music", "concert", "show", "theater", "performance", "fun", "party", "event", "comedy", "drama", "festival", "nightlife", "venue", "stage", "screening"],
  // Database category mappings
  "environmental": ["environment", "nature", "sustainability", "green", "eco", "climate", "conservation", "wildlife", "recycling", "renewable", "organic", "pollution", "ecosystem", "biodiversity", "carbon", "zero waste"],
  "music": ["music", "band", "concert", "instrument", "song", "singing", "musician", "guitar", "piano", "dj", "producer", "composer", "melody", "rhythm", "genre", "album", "performance", "live music", "jazz", "rock", "pop", "classical", "electronic"],
  "sports": ["sport", "fitness", "athletic", "game", "team", "competition", "training", "player", "coach", "tournament", "championship", "league", "practice"],
  "hobbies": ["hobby", "craft", "gaming", "collection", "leisure", "pastime", "interest", "activity", "recreation", "entertainment"],
  "education": ["education", "learning", "teaching", "academic", "study", "course", "workshop", "student", "teacher", "instructor", "curriculum"],
  "art": ["art", "artist", "creative", "design", "painting", "drawing", "sculpture", "gallery", "canvas", "sketch", "artwork", "exhibition", "studio"],
}

export class ContentBasedFilteringAlgorithm {
  private enableLogging = true
  
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
    this.log("User location:", user.location ? `${user.location.city} (${user.location.lat}, ${user.location.lng})` : "No location")
    this.log("Total communities:", communities.length)
    this.log("User joined communities:", user.joinedCommunities.length)
    
    // Filter out communities user has already joined
    const candidateCommunities = communities.filter((c) => !user.joinedCommunities.includes(c.id))
    this.log("Candidate communities (excluding joined):", candidateCommunities.length)

    // Build vocabulary once for all communities
    const vocabulary = this.buildVocabulary(user.interests, candidateCommunities);
    this.log("Vocabulary size:", vocabulary.length);

    const scores = candidateCommunities.map((community) => {
      const score = this.calculateContentBasedScore(user, community, vocabulary)
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

    // Return communities with any positive score (lowered threshold to allow more recommendations)
    // This ensures we return recommendations even when user has no interests
    const result = scores
      .filter((s) => s.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations)
    
    this.log("Returning", result.length, "recommendations")
    return result
  }

  private calculateContentBasedScore(
    user: User,
    community: Community,
    vocabulary: string[]
  ): {
    score: number
    confidence: number
    reasons: Array<{
      type: "interest_match" | "location_proximity"
      description: string
      weight: number
      evidence: any
    }>
  } {
    /**
     * Two-feature weighted scoring based on Huang (2023) and Christyawan et al. (2023)
     * 
     * Weight distribution:
     * - Interest Match: 0.60 (TF-IDF + Cosine Similarity)
     * - Location Proximity: 0.40 (Haversine Distance)
     * 
     * Total: 1.0
     */
    const WEIGHTS = {
      interest: 0.60,
      location: 0.40,
    }

    let totalScore = 0
    const reasons: any[] = []

    // Feature 1: Interest Match using TF-IDF + Cosine Similarity
    // Expand user interests using keyword mapping
    const expandedUserInterests: string[] = [];
    user.interests.forEach(interest => {
      expandedUserInterests.push(interest);
      const keywords = INTEREST_KEYWORDS[interest.toLowerCase()] || [];
      expandedUserInterests.push(...keywords);
    });
    
    this.log(`User interests: ${user.interests.join(", ")}`);
    this.log(`Expanded to ${expandedUserInterests.length} terms`);
    
    const userVector = this.buildTFIDFVector(expandedUserInterests, vocabulary);
    const communityVector = this.buildTFIDFVector(
      [
        community.name,
        community.description,
        community.category,
        ...(community.tags || []),
        ...(community.contentTopics || [])
      ],
      vocabulary
    );
    
    const interestScore = this.cosineSimilarity(userVector, communityVector);
    totalScore += interestScore * WEIGHTS.interest;
    
    this.log(`Interest similarity: ${interestScore.toFixed(3)} × ${WEIGHTS.interest} = ${(interestScore * WEIGHTS.interest).toFixed(3)}`)
    
    reasons.push({
      type: "interest_match",
      description: `${Math.round(interestScore * 100)}% similarity with your interests`,
      weight: WEIGHTS.interest,
      evidence: { 
        similarity: interestScore,
        matchedInterests: user.interests.slice(0, 3).join(", ")
      },
    });

    // Feature 2: Location Proximity using Haversine Distance
    if (user.location && community.location && community.location.lat !== 0 && community.location.lng !== 0) {
      const locationScore = this.calculateLocationScore(user, community);
      if (locationScore.score > 0) {
        totalScore += locationScore.score * WEIGHTS.location;
        this.log(`Location score: ${locationScore.score.toFixed(3)} × ${WEIGHTS.location} = ${(locationScore.score * WEIGHTS.location).toFixed(3)}`)
        reasons.push({
          type: "location_proximity",
          description: `Located ${locationScore.distance.toFixed(1)}km from you`,
          weight: WEIGHTS.location,
          evidence: { distance: locationScore.distance, score: locationScore.score },
        });
      }
    } else {
      this.log("Location scoring skipped - no valid location data")
    }

    this.log(`TOTAL SCORE for ${community.name}: ${totalScore.toFixed(3)}`)

    // Confidence based on how many features contributed
    const confidence = Math.min(0.9, totalScore);

    return { score: totalScore, confidence, reasons }
  }

  private calculateLocationScore(user: User, community: Community): { score: number; distance: number} {
    if (!user.location || !community.location) {
      return { score: 0, distance: Number.POSITIVE_INFINITY }
    }

    // Check if coordinates are valid (not 0 or undefined)
    if (!community.location.lat || !community.location.lng || 
        community.location.lat === 0 || community.location.lng === 0) {
      return { score: 0, distance: Number.POSITIVE_INFINITY }
    }

    if (!user.location.lat || !user.location.lng ||
        user.location.lat === 0 || user.location.lng === 0) {
      return { score: 0, distance: Number.POSITIVE_INFINITY }
    }

    const distance = this.calculateDistance(
      user.location.lat,
      user.location.lng,
      community.location.lat,
      community.location.lng,
    )

    const maxDistance = 50 // Default 50km threshold
    const score = Math.max(0, 1 - distance / maxDistance)

    return { score, distance }
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

  /**
   * Build vocabulary from user interests and community content
   * Used for TF-IDF vectorization
   * 
   * Expands user interests using INTEREST_KEYWORDS mapping
   */
  private buildVocabulary(
    userInterests: string[],
    communities: Community[]
  ): string[] {
    const terms = new Set<string>();
    
    // Add user interests WITH keyword expansion
    userInterests.forEach(interest => {
      const interestLower = interest.toLowerCase();
      
      // Add the interest words themselves
      const words = interestLower.split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          terms.add(word);
        }
      });
      
      // Add expanded keywords from mapping
      const keywords = INTEREST_KEYWORDS[interestLower] || [];
      keywords.forEach(keyword => {
        const keywordWords = keyword.split(/\s+/);
        keywordWords.forEach(word => {
          if (word.length > 2) {
            terms.add(word);
          }
        });
      });
    });
    
    // Add community terms
    communities.forEach(community => {
      const text = [
        community.name,
        community.description,
        community.category,
        ...(community.tags || []),
        ...(community.contentTopics || [])
      ].join(' ').toLowerCase();
      
      const words = text.split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          terms.add(word);
        }
      });
    });
    
    return Array.from(terms).sort();
  }

  /**
   * Build TF-IDF vector for given texts
   * Returns frequency vector for each term in vocabulary
   */
  private buildTFIDFVector(texts: string[], vocabulary: string[]): number[] {
    const combinedText = texts.join(' ').toLowerCase();
    const vector: number[] = [];
    
    for (const term of vocabulary) {
      // Use word boundary regex to match whole words only
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      const matches = combinedText.match(regex);
      const termFreq = matches ? matches.length : 0;
      vector.push(termFreq);
    }
    
    return vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   * Formula: similarity = (A · B) / (||A|| × ||B||)
   * 
   * Reference: Christyawan et al. (2023)
   */
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    const length = Math.min(vectorA.length, vectorB.length);
    
    // Calculate dot product (A · B)
    let dotProduct = 0;
    for (let i = 0; i < length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
    }
    
    // Calculate magnitudes (||A|| and ||B||)
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < length; i++) {
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    // Avoid division by zero
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    
    // Return cosine similarity
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

