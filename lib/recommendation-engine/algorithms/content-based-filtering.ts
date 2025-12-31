/**
 * Content-Based Filtering Algorithm for Community Recommendations
 *
 * ============================================================================
 * ALGORITHM OVERVIEW (4 Main Steps)
 * ============================================================================
 *
 * Step 1: TF-IDF (Term Frequency-Inverse Document Frequency)
 *   - Converts user interests and community content into numerical vectors
 *   - TF: Frequency of term in document
 *   - IDF: log(Total Documents / Documents containing term)
 *   - Result: Weighted vectors where rare terms have higher importance
 *
 * Step 2: Cosine Similarity
 *   - Calculates similarity between user and community vectors
 *   - Formula: cos(θ) = (A · B) / (||A|| × ||B||)
 *   - Result: Similarity score between 0 and 1
 *
 * Step 3: Haversine Distance (Location Proximity)
 *   - Calculates geographic distance between user and community
 *   - Formula: distance = 2R × arctan2(√a, √(1-a)), where:
 *       a = sin²(Δφ/2) + cos(φ₁) × cos(φ₂) × sin²(Δλ/2)
 *   - Converts distance to score: score = max(0, 1 - distance/50km)
 *
 * Step 4: Weighted Scoring
 *   - Combines content and location scores with weights
 *   - Formula: Final Score = w₁ × ContentScore + w₂ × LocationScore
 *   - Default weights: 60% content, 40% location
 *
 * ============================================================================
 * IMPLEMENTATION DETAILS & OPTIMIZATIONS
 * ============================================================================
 *
 * Additional Refinements (not part of main algorithm):
 *   1. Document Length Normalization: Prevents short documents from getting
 *      artificially high cosine similarity scores
 *   2. Category Matching: Additional binary feature for direct category match
 *   3. Content Quality Gate: Prevents location from dominating when content
 *      relevance is very low (<5% similarity)
 *
 * These refinements improve accuracy without changing the core TF-IDF → 
 * Cosine Similarity → Haversine → Weighting pipeline.
 *
 * ============================================================================
 */

import type { Community, RecommendationScore, User } from "../types"

// Keywords mapping for user interests to help match with community content
// NOTE: Avoid overly broad terms like "community", "creative" that match everything
const INTEREST_KEYWORDS: Record<string, string[]> = {
  "hobbies & crafts": ["hobby", "craft", "diy", "handmade", "maker", "gaming", "game", "collection", "collector", "knitting", "sewing", "woodworking", "pottery", "modeling", "cosplay", "handicraft", "crafting"],
  "sports & fitness": ["sport", "fitness", "gym", "workout", "exercise", "running", "cycling", "yoga", "athletic", "health", "basketball", "football", "soccer", "swimming", "tennis", "badminton", "volleyball", "marathon", "triathlon", "crossfit", "martial arts", "boxing", "wrestling", "climbing", "pilates", "cardio", "strength", "training"],
  "career & business": ["career", "business", "professional", "networking", "entrepreneur", "startup", "job", "work", "corporate", "leadership", "management", "consulting", "sales", "marketing", "finance", "strategy", "innovation", "mentorship", "workplace", "entrepreneurship"],
  "tech & innovation": ["tech", "technology", "programming", "coding", "developer", "software", "hardware", "ai", "machine learning", "data", "digital", "innovation", "computer", "it", "web", "app", "blockchain", "cloud", "database", "api", "frontend", "backend", "mobile", "ux", "ui", "devops", "cybersecurity", "automation", "robotics", "iot", "analytics", "python", "javascript", "java", "react", "node"],
  "arts & culture": ["art", "culture", "museum", "gallery", "painting", "sculpture", "artist", "cultural", "heritage", "photography", "illustration", "graphic design", "animation", "digital art", "contemporary", "traditional", "exhibition", "visual arts", "artistic", "fine art"],
  "social & community": ["social", "volunteer", "charity", "nonprofit", "help", "support", "meetup", "gathering", "activism", "advocacy", "outreach", "engagement", "collaboration", "volunteering", "humanitarian", "civic", "grassroots"],
  "education & learning": ["education", "learning", "study", "course", "workshop", "training", "skill", "knowledge", "academic", "school", "university", "teach", "tutorial", "lecture", "seminar", "bootcamp", "certification", "mentoring", "coaching"],
  "travel & adventure": ["travel", "adventure", "explore", "trip", "journey", "hiking", "outdoor", "nature", "tourism", "backpack", "trekking", "camping", "roadtrip", "expedition", "wanderlust", "destination", "exploration"],
  "food & drink": ["food", "drink", "cooking", "culinary", "restaurant", "recipe", "cuisine", "chef", "baking", "coffee", "wine", "beer", "foodie", "gastronomy", "dining", "cafe", "barista", "sommelier", "vegan", "vegetarian", "organic"],
  "entertainment": ["entertainment", "movie", "film", "music", "concert", "show", "theater", "performance", "fun", "party", "event", "comedy", "drama", "festival", "nightlife", "venue", "stage", "screening"],
  // Database category mappings
  "environmental": ["environment", "nature", "sustainability", "green", "eco", "climate", "conservation", "wildlife", "recycling", "renewable", "organic", "pollution", "ecosystem", "biodiversity", "carbon", "zero waste"],
  "music": ["music", "band", "concert", "instrument", "song", "singing", "musician", "guitar", "piano", "dj", "producer", "composer", "melody", "rhythm", "genre", "album", "performance", "live music", "jazz", "rock", "pop", "classical", "electronic"],
  "sports": ["sport", "fitness", "athletic", "game", "team", "competition", "training", "player", "coach", "tournament", "championship", "league", "practice"],
  "hobbies": ["hobby", "craft", "gaming", "collection", "leisure", "pastime", "interest", "activity", "recreation"],
  "education": ["education", "learning", "teaching", "academic", "study", "course", "workshop", "student", "teacher", "instructor", "curriculum"],
  "art": ["art", "artist", "painting", "drawing", "sculpture", "gallery", "canvas", "sketch", "artwork", "exhibition", "studio"],
}

export class ContentBasedFilteringAlgorithm {
  private enableLogging = false
  
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
    this.log(`User: ${user.interests.join(", ")} | Location: ${user.location?.city || "None"}`)
    this.log(`Analyzing ${communities.length} communities`)
    
    // Exclude already joined communities
    const candidateCommunities = communities.filter((c) => !user.joinedCommunities.includes(c.id))

    if (candidateCommunities.length === 0) {
      return []
    }

    // Build vocabulary and calculate IDF
    const vocabulary = this.buildVocabulary(user.interests, candidateCommunities);
    const idf = this.calculateIDF(candidateCommunities, vocabulary);

    // Calculate scores
    const scores = candidateCommunities.map((community) => {
      const score = this.calculateContentBasedScore(user, community, vocabulary, idf)
      return {
        communityId: community.id,
        score: score.score,
        confidence: score.confidence,
        method: "content_based",
        reasons: score.reasons,
      }
    })

    // Sort and filter
    const result = scores
      .filter((s) => s.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations)
    
    this.log(`\n=== Top ${Math.min(5, result.length)} Recommendations ===`)
    result.slice(0, 5).forEach((r, i) => {
      const comm = communities.find(c => c.id === r.communityId)
      this.log(`${i + 1}. ${comm?.name} - Score: ${r.score.toFixed(3)}`)
    })
    
    return result
  }

  private calculateContentBasedScore(
    user: User,
    community: Community,
    vocabulary: string[],
    idf: number[]
  ): {
    score: number
    confidence: number
    reasons: Array<{
      type: "interest_match" | "location_proximity" | "category_match"
      description: string
      weight: number
      evidence: any
    }>
  } {
    /**
     * PURE ALGORITHM: TF-IDF → Cosine Similarity → Haversine → Weighting
     * 
     * - Content Score: 0.60 (TF-IDF + Cosine Similarity)
     * - Location Score: 0.40 (Haversine Distance)
     * 
     * Edge case handling (implementation details):
     * 1. Document length normalization - prevents spam/short content
     * 2. Content quality gate - prevents location dominance for irrelevant content
     */
    const WEIGHTS = {
      content: 0.60,  // TF-IDF + Cosine Similarity
      location: 0.40, // Haversine Distance
    }

    let totalScore = 0
    const reasons: any[] = []

    // ========== STEP 1 & 2: TF-IDF + COSINE SIMILARITY ==========
    
    // Expand user interests using keyword mapping for better matching
    const expandedUserInterests: string[] = [];
    user.interests.forEach(interest => {
      expandedUserInterests.push(interest);
      const keywords = INTEREST_KEYWORDS[interest.toLowerCase()] || [];
      expandedUserInterests.push(...keywords);
    });
    
    // Build TF-IDF vectors
    const userVector = this.buildTFIDFVector(expandedUserInterests, vocabulary, idf);
    const communityVector = this.buildTFIDFVector(
      [
        community.name,
        community.description,
        community.category,
        ...(community.tags || []),
        ...(community.contentTopics || [])
      ],
      vocabulary,
      idf
    );
    
    // Calculate cosine similarity
    let contentScore = this.cosineSimilarity(userVector, communityVector);
    
    // Edge case fix 1: Document length normalization
    // Prevents communities with minimal content  from getting high scores
    const contentLength = communityVector.filter(v => v > 0).length;
    if (contentLength < 10) {
      const lengthPenalty = contentLength / 10;
      contentScore = contentScore * lengthPenalty;
    }
    
    // Apply content weight
    totalScore += contentScore * WEIGHTS.content;
    
    reasons.push({
      type: "interest_match",
      description: `${Math.round(contentScore * 100)}% content similarity`,
      weight: WEIGHTS.content,
      evidence: { 
        similarity: contentScore,
        matchedInterests: user.interests.slice(0, 3).join(", ")
      },
    });

    // ========== STEP 3 & 4: HAVERSINE DISTANCE + WEIGHTING ==========
    
    if (user.location && community.location && community.location.lat !== 0 && community.location.lng !== 0) {
      const locationResult = this.calculateLocationScore(user, community);
      if (locationResult.score > 0) {
        // Edge case fix 2: Content quality gate
        // Prevents location from dominating when content is completely irrelevant
        let locationWeight = WEIGHTS.location;
        
        if (contentScore < 0.05) {  // Very low content match (<5%)
          // Reduce location weight proportionally
          const qualityMultiplier = 0.1 + (0.9 * contentScore / 0.05);
          locationWeight = WEIGHTS.location * qualityMultiplier;
        }
        
        const locationContribution = locationResult.score * locationWeight;
        totalScore += locationContribution;
        
        reasons.push({
          type: "location_proximity",
          description: `Located ${locationResult.distance.toFixed(1)}km from you`,
          weight: locationWeight,
          evidence: { 
            distance: locationResult.distance, 
            score: locationResult.score,
          },
        });
      }
    }

    // Confidence score
    const confidence = Math.min(0.9, totalScore);

    return { score: totalScore, confidence, reasons }
  }

  private calculateLocationScore(user: User, community: Community): { score: number; distance: number} {
    if (!user.location || !community.location) {
      return { score: 0, distance: Number.POSITIVE_INFINITY }
    }

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

    const maxDistance = 50
    const score = Math.max(0, 1 - distance / maxDistance)

    return { score, distance }
  }

  /**
   * Calculate category match score
   * Returns 1.0 if user's interest directly matches community category
   * Returns 0.0 if no match
   */
  private calculateCategoryMatch(userInterests: string[], communityCategory: string): number {
    const normalizedCategory = communityCategory.toLowerCase().trim();
    
    for (const interest of userInterests) {
      const normalizedInterest = interest.toLowerCase().trim();
      
      // Direct match
      if (normalizedInterest === normalizedCategory) {
        return 1.0;
      }
      
      // Partial match (e.g., "tech" matches "tech & innovation")
      if (normalizedCategory.includes(normalizedInterest) || 
          normalizedInterest.includes(normalizedCategory)) {
        return 1.0;
      }
    }
    
    return 0.0;
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
   * Calculate IDF (Inverse Document Frequency) for each term in vocabulary
   * IDF = log(N / df) where N = total documents, df = documents containing term
   * Higher IDF = rarer term = more important
   */
  private calculateIDF(communities: Community[], vocabulary: string[]): number[] {
    const N = communities.length;
    const idf: number[] = [];
    
    for (const term of vocabulary) {
      // Count how many communities contain this term
      let df = 0;
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      
      for (const community of communities) {
        const text = [
          community.name,
          community.description,
          community.category,
          ...(community.tags || []),
          ...(community.contentTopics || [])
        ].join(' ').toLowerCase();
        
        if (regex.test(text)) {
          df++;
        }
      }
      
      // Calculate IDF: log(N / df)
      // Add 1 to df to avoid division by zero
      const idfValue = Math.log(N / (df + 1));
      idf.push(idfValue);
    }
    
    return idf;
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
   * TF-IDF = TF(term) × IDF(term)
   * Returns TF-IDF weighted vector for each term in vocabulary
   */
  private buildTFIDFVector(texts: string[], vocabulary: string[], idf: number[]): number[] {
    const combinedText = texts.join(' ').toLowerCase();
    const vector: number[] = [];
    
    for (let i = 0; i < vocabulary.length; i++) {
      const term = vocabulary[i];
      // Calculate TF (Term Frequency)
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      const matches = combinedText.match(regex);
      const tf = matches ? matches.length : 0;
      
      // Calculate TF-IDF = TF × IDF
      const tfidf = tf * idf[i];
      vector.push(tfidf);
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

