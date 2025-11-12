import type { User, Community, RecommendationScore } from "../types"

export class CollaborativeFilteringAlgorithm {
  /**
   * User-based collaborative filtering
   * Finds users with similar preferences and recommends communities they joined
   */
  async userBasedRecommendations(
    targetUser: User,
    allUsers: User[],
    communities: Community[],
    maxRecommendations = 10,
  ): Promise<RecommendationScore[]> {
    // Find similar users based on joined communities and interactions
    const similarUsers = this.findSimilarUsers(targetUser, allUsers)

    // Get communities joined by similar users but not by target user
    const candidateCommunities = this.getCandidateCommunitiesFromSimilarUsers(targetUser, similarUsers, communities)

    // Score communities based on similarity weights
    const scores = candidateCommunities.map((community) => {
      const score = this.calculateUserBasedScore(targetUser, community, similarUsers)
      return {
        communityId: community.id,
        score: score.score,
        confidence: score.confidence,
        method: "collaborative_user_based",
        reasons: [
          {
            type: "similar_users" as const,
            description: `${score.similarUserCount} similar users joined this community`,
            weight: 0.8,
            evidence: { similarUserCount: score.similarUserCount, avgSimilarity: score.avgSimilarity },
          },
        ],
      }
    })

    return scores.sort((a, b) => b.score - a.score).slice(0, maxRecommendations)
  }

  /**
   * Item-based collaborative filtering
   * Recommends communities similar to ones the user has already joined
   */
  async itemBasedRecommendations(
    targetUser: User,
    allUsers: User[],
    communities: Community[],
    maxRecommendations = 10,
  ): Promise<RecommendationScore[]> {
    const userCommunities = communities.filter((c) => targetUser.joinedCommunities.includes(c.id))

    if (userCommunities.length === 0) {
      return []
    }

    // Find communities similar to user's joined communities
    const candidateCommunities = communities.filter((c) => !targetUser.joinedCommunities.includes(c.id))

    const scores = candidateCommunities.map((candidate) => {
      const similarity = this.calculateCommunitySimilarity(candidate, userCommunities, allUsers)

      return {
        communityId: candidate.id,
        score: similarity.score,
        confidence: similarity.confidence,
        method: "collaborative_item_based",
        reasons: [
          {
            type: "similar_users" as const,
            description: `Similar to communities you've joined: ${similarity.similarCommunities.join(", ")}`,
            weight: 0.7,
            evidence: {
              similarCommunities: similarity.similarCommunities,
              avgSimilarity: similarity.score,
            },
          },
        ],
      }
    })

    return scores.sort((a, b) => b.score - a.score).slice(0, maxRecommendations)
  }

  private findSimilarUsers(targetUser: User, allUsers: User[]): Array<{ user: User; similarity: number }> {
    return allUsers
      .filter((user) => user.id !== targetUser.id)
      .map((user) => ({
        user,
        similarity: this.calculateUserSimilarity(targetUser, user),
      }))
      .filter((item) => item.similarity > 0.1) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 50) // Top 50 similar users
  }

  private calculateUserSimilarity(user1: User, user2: User): number {
    let similarity = 0
    let factors = 0

    // Jaccard similarity for joined communities
    const communities1 = new Set(user1.joinedCommunities)
    const communities2 = new Set(user2.joinedCommunities)
    const intersection = new Set([...communities1].filter((x) => communities2.has(x)))
    const union = new Set([...communities1, ...communities2])

    if (union.size > 0) {
      similarity += (intersection.size / union.size) * 0.4
      factors += 0.4
    }

    // Interest overlap
    const interests1 = new Set(user1.interests.map((i) => i.toLowerCase()))
    const interests2 = new Set(user2.interests.map((i) => i.toLowerCase()))
    const interestIntersection = new Set([...interests1].filter((x) => interests2.has(x)))
    const interestUnion = new Set([...interests1, ...interests2])

    if (interestUnion.size > 0) {
      similarity += (interestIntersection.size / interestUnion.size) * 0.3
      factors += 0.3
    }

    // Location proximity
    if (user1.location && user2.location) {
      const distance = this.calculateDistance(
        user1.location.lat,
        user1.location.lng,
        user2.location.lat,
        user2.location.lng,
      )
      const locationSimilarity = Math.max(0, 1 - distance / 100) // 100km max distance
      similarity += locationSimilarity * 0.2
      factors += 0.2
    }

    // Activity level similarity
    const activityLevels = { low: 1, medium: 2, high: 3 }
    const activityDiff = Math.abs(activityLevels[user1.activityLevel] - activityLevels[user2.activityLevel])
    const activitySimilarity = 1 - activityDiff / 2
    similarity += activitySimilarity * 0.1
    factors += 0.1

    return factors > 0 ? similarity / factors : 0
  }

  private getCandidateCommunitiesFromSimilarUsers(
    targetUser: User,
    similarUsers: Array<{ user: User; similarity: number }>,
    communities: Community[],
  ): Community[] {
    const candidateIds = new Set<string>()

    similarUsers.forEach(({ user, similarity }) => {
      user.joinedCommunities.forEach((communityId) => {
        if (!targetUser.joinedCommunities.includes(communityId)) {
          candidateIds.add(communityId)
        }
      })
    })

    return communities.filter((c) => candidateIds.has(c.id))
  }

  private calculateUserBasedScore(
    targetUser: User,
    community: Community,
    similarUsers: Array<{ user: User; similarity: number }>,
  ): { score: number; confidence: number; similarUserCount: number; avgSimilarity: number } {
    const usersWhoJoined = similarUsers.filter(({ user }) => user.joinedCommunities.includes(community.id))

    if (usersWhoJoined.length === 0) {
      return { score: 0, confidence: 0, similarUserCount: 0, avgSimilarity: 0 }
    }

    const totalSimilarity = usersWhoJoined.reduce((sum, { similarity }) => sum + similarity, 0)
    const avgSimilarity = totalSimilarity / usersWhoJoined.length
    const score = avgSimilarity * Math.min(1, usersWhoJoined.length / 5) // Boost for more users

    // Confidence based on number of similar users and their similarity
    const confidence = Math.min(0.9, (usersWhoJoined.length / 10) * avgSimilarity)

    return {
      score,
      confidence,
      similarUserCount: usersWhoJoined.length,
      avgSimilarity,
    }
  }

  private calculateCommunitySimilarity(
    targetCommunity: Community,
    userCommunities: Community[],
    allUsers: User[],
  ): { score: number; confidence: number; similarCommunities: string[] } {
    let maxSimilarity = 0
    const similarCommunities: string[] = []

    userCommunities.forEach((userCommunity) => {
      const similarity = this.calculateCommunityPairSimilarity(targetCommunity, userCommunity, allUsers)
      if (similarity > 0.3) {
        // Threshold for considering communities similar
        maxSimilarity = Math.max(maxSimilarity, similarity)
        similarCommunities.push(userCommunity.name)
      }
    })

    const confidence = Math.min(0.8, similarCommunities.length / userCommunities.length)

    return {
      score: maxSimilarity,
      confidence,
      similarCommunities,
    }
  }

  private calculateCommunityPairSimilarity(community1: Community, community2: Community, allUsers: User[]): number {
    let similarity = 0
    let factors = 0

    // Category similarity
    if (community1.category === community2.category) {
      similarity += 0.3
    }
    factors += 0.3

    // Tag overlap
    const tags1 = new Set(community1.tags.map((t) => t.toLowerCase()))
    const tags2 = new Set(community2.tags.map((t) => t.toLowerCase()))
    const tagIntersection = new Set([...tags1].filter((x) => tags2.has(x)))
    const tagUnion = new Set([...tags1, ...tags2])

    if (tagUnion.size > 0) {
      similarity += (tagIntersection.size / tagUnion.size) * 0.4
    }
    factors += 0.4

    // Member overlap (users who joined both communities)
    const members1 = new Set(allUsers.filter((u) => u.joinedCommunities.includes(community1.id)).map((u) => u.id))
    const members2 = new Set(allUsers.filter((u) => u.joinedCommunities.includes(community2.id)).map((u) => u.id))
    const memberIntersection = new Set([...members1].filter((x) => members2.has(x)))
    const memberUnion = new Set([...members1, ...members2])

    if (memberUnion.size > 0) {
      similarity += (memberIntersection.size / memberUnion.size) * 0.3
    }
    factors += 0.3

    return factors > 0 ? similarity / factors : 0
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
