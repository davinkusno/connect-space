import { aiClient } from "../ai-client"
import { z } from "zod"

const RecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["community", "event", "person", "content", "skill"]),
      title: z.string(),
      description: z.string(),
      relevanceScore: z.number(),
      reasoning: z.string(),
      category: z.string(),
      tags: z.array(z.string()),
      metadata: z.record(z.any()).optional(),
    }),
  ),
  explanations: z.object({
    primaryFactors: z.array(z.string()),
    userProfile: z.string(),
    diversityFactors: z.array(z.string()),
  }),
})

const UserInterestSchema = z.object({
  interests: z.array(
    z.object({
      topic: z.string(),
      strength: z.number(),
      category: z.string(),
      keywords: z.array(z.string()),
    }),
  ),
  preferences: z.object({
    communitySize: z.enum(["small", "medium", "large", "any"]),
    activityLevel: z.enum(["low", "moderate", "high", "any"]),
    interactionStyle: z.enum(["lurker", "participant", "leader", "mixed"]),
    contentTypes: z.array(z.string()),
  }),
  goals: z.array(z.string()),
})

export class RecommendationEngine {
  async analyzeUserInterests(userActivity: {
    joinedCommunities: any[]
    attendedEvents: any[]
    posts: any[]
    interactions: any[]
    searchHistory: string[]
  }) {
    const prompt = `Analyze this user's activity to understand their interests and preferences:
    
    Joined Communities: ${userActivity.joinedCommunities.map((c) => `${c.name} (${c.category})`).join(", ")}
    Attended Events: ${userActivity.attendedEvents.map((e) => `${e.title} (${e.category})`).join(", ")}
    Recent Posts: ${userActivity.posts.map((p) => p.title).join(", ")}
    Search History: ${userActivity.searchHistory.join(", ")}
    
    Extract:
    1. Primary interests with strength scores
    2. Preferred community characteristics
    3. Interaction patterns
    4. Likely goals and motivations`

    return aiClient.generateObject(prompt, UserInterestSchema, {
      systemPrompt:
        "You are an expert user behavior analyst who understands what drives user engagement and can identify patterns in user preferences.",
    })
  }

  async generateCommunityRecommendations(
    userProfile: any,
    availableCommunities: any[],
    options?: {
      maxRecommendations?: number
      diversityWeight?: number
      excludeJoined?: boolean
    },
  ) {
    const { maxRecommendations = 10, diversityWeight = 0.3, excludeJoined = true } = options || {}

    const prompt = `Recommend communities for this user based on their profile and interests:
    
    User Profile:
    - Interests: ${userProfile.interests?.map((i: any) => `${i.topic} (${i.strength})`).join(", ")}
    - Current communities: ${userProfile.joinedCommunities?.map((c: any) => c.name).join(", ")}
    - Preferred community size: ${userProfile.preferences?.communitySize}
    - Activity level preference: ${userProfile.preferences?.activityLevel}
    
    Available Communities:
    ${availableCommunities
      .slice(0, 20)
      .map((c) => `${c.name}: ${c.description} (${c.category}, ${c.memberCount} members)`)
      .join("\n")}
    
    Provide ${maxRecommendations} recommendations with:
    - Relevance scores
    - Clear reasoning for each recommendation
    - Diverse mix of communities
    - Consider user's growth potential`

    return aiClient.generateObject(prompt, RecommendationSchema, {
      systemPrompt:
        "You are an expert community matchmaker who understands what makes communities successful for different types of users.",
    })
  }

  async generateEventRecommendations(
    userProfile: any,
    upcomingEvents: any[],
    options?: {
      maxRecommendations?: number
      timeHorizon?: "week" | "month" | "quarter"
      includeOnline?: boolean
    },
  ) {
    const { maxRecommendations = 8, timeHorizon = "month", includeOnline = true } = options || {}

    const prompt = `Recommend events for this user:
    
    User Profile:
    - Interests: ${userProfile.interests?.map((i: any) => `${i.topic} (${i.strength})`).join(", ")}
    - Location: ${userProfile.location || "not specified"}
    - Attended events: ${userProfile.attendedEvents?.map((e: any) => e.title).join(", ")}
    - Preferred format: ${includeOnline ? "online and offline" : "offline only"}
    - Time horizon: ${timeHorizon}
    
    Upcoming Events:
    ${upcomingEvents
      .slice(0, 20)
      .map((e) => `${e.title}: ${e.description} (${e.date}, ${e.format})`)
      .join("\n")}
    
    Recommend ${maxRecommendations} events considering:
    - Interest alignment
    - Schedule compatibility
    - Skill level appropriateness
    - Networking opportunities
    - Learning potential`

    return aiClient.generateObject(prompt, RecommendationSchema, {
      systemPrompt:
        "You are an expert event curator who understands what events will provide the most value to different users.",
    })
  }

  async generateContentRecommendations(
    userProfile: any,
    availableContent: any[],
    options?: {
      contentTypes?: string[]
      maxRecommendations?: number
      recencyWeight?: number
    },
  ) {
    const {
      contentTypes = ["post", "article", "discussion"],
      maxRecommendations = 15,
      recencyWeight = 0.2,
    } = options || {}

    const prompt = `Recommend content for this user:
    
    User Profile:
    - Interests: ${userProfile.interests?.map((i: any) => `${i.topic} (${i.strength})`).join(", ")}
    - Reading preferences: ${userProfile.preferences?.contentTypes?.join(", ")}
    - Engagement history: ${userProfile.engagementHistory || "limited data"}
    
    Available Content:
    ${availableContent
      .slice(0, 30)
      .map((c) => `${c.title}: ${c.excerpt} (${c.type}, ${c.category})`)
      .join("\n")}
    
    Recommend ${maxRecommendations} pieces of content considering:
    - Interest relevance
    - Content quality and engagement
    - Diversity of perspectives
    - Learning progression
    - Recency (weight: ${recencyWeight})`

    return aiClient.generateObject(prompt, RecommendationSchema, {
      systemPrompt:
        "You are an expert content curator who understands what content will engage and educate users effectively.",
    })
  }

  async generatePersonRecommendations(
    userProfile: any,
    communityMembers: any[],
    options?: {
      connectionType?: "mentor" | "peer" | "mentee" | "collaborator"
      maxRecommendations?: number
    },
  ) {
    const { connectionType = "peer", maxRecommendations = 8 } = options || {}

    const prompt = `Recommend people for this user to connect with:
    
    User Profile:
    - Interests: ${userProfile.interests?.map((i: any) => `${i.topic} (${i.strength})`).join(", ")}
    - Experience level: ${userProfile.experienceLevel || "not specified"}
    - Goals: ${userProfile.goals?.join(", ") || "not specified"}
    - Connection type sought: ${connectionType}
    
    Community Members:
    ${communityMembers
      .slice(0, 25)
      .map((m) => `${m.name}: ${m.bio} (${m.skills?.join(", ")}, ${m.experienceLevel})`)
      .join("\n")}
    
    Recommend ${maxRecommendations} people considering:
    - Complementary skills and interests
    - Experience level compatibility
    - Mutual benefit potential
    - Communication style fit
    - Shared communities or events`

    return aiClient.generateObject(prompt, RecommendationSchema, {
      systemPrompt:
        "You are an expert networker who understands what makes professional relationships successful and mutually beneficial.",
    })
  }

  async explainRecommendation(recommendation: any, userProfile: any) {
    const prompt = `Explain why this recommendation is good for the user:
    
    Recommendation: ${recommendation.title} (${recommendation.type})
    Description: ${recommendation.description}
    
    User Profile Summary:
    - Primary interests: ${userProfile.interests
      ?.slice(0, 3)
      .map((i: any) => i.topic)
      .join(", ")}
    - Goals: ${userProfile.goals?.join(", ") || "not specified"}
    - Experience level: ${userProfile.experienceLevel || "not specified"}
    
    Provide a clear, personalized explanation of:
    1. Why this matches their interests
    2. How it helps achieve their goals
    3. What specific benefits they'll get
    4. Next steps they should take`

    return aiClient.generateText(prompt, {
      systemPrompt:
        "You are a helpful advisor who explains recommendations in a personal, actionable way that motivates users to take action.",
    })
  }
}

export const recommendationEngine = new RecommendationEngine()
