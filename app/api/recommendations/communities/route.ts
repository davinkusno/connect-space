import { type NextRequest, NextResponse } from "next/server"
import { HybridRecommendationEngine } from "@/lib/recommendation-engine/hybrid-recommender"
import type { User, Community } from "@/lib/recommendation-engine/types"

const recommendationEngine = new HybridRecommendationEngine()

export async function POST(request: NextRequest) {
  try {
    const { userId, preferences, maxRecommendations = 20 } = await request.json()

    // Mock user data - in production, fetch from database
    const mockUser: User = {
      id: userId || "user_123",
      interests: ["technology", "artificial intelligence", "startups", "programming"],
      location: {
        lat: 40.7128,
        lng: -74.006,
        city: "New York",
        country: "USA",
      },
      demographics: {
        age: 28,
        profession: "Software Engineer",
        education: "Bachelor's Degree",
      },
      activityLevel: "high",
      joinedCommunities: ["tech_innovators", "ai_enthusiasts"],
      attendedEvents: ["ai_workshop_2024", "startup_meetup"],
      interactions: [
        {
          type: "view",
          targetId: "blockchain_community",
          targetType: "community",
          timestamp: new Date("2024-01-15"),
          duration: 120,
        },
        {
          type: "like",
          targetId: "ml_post_456",
          targetType: "post",
          timestamp: new Date("2024-01-14"),
        },
      ],
      preferences: {
        preferredCategories: ["Technology", "Business", "Science"],
        maxDistance: 50,
        communitySize: "medium",
        activityFrequency: "weekly",
        contentTypes: ["discussions", "events", "resources"],
        languagePreferences: ["English"],
      },
    }

    // Mock all users data
    const mockAllUsers: User[] = [
      mockUser,
      {
        id: "user_456",
        interests: ["technology", "machine learning", "data science"],
        location: { lat: 40.7589, lng: -73.9851, city: "New York", country: "USA" },
        activityLevel: "medium",
        joinedCommunities: ["tech_innovators", "data_science_hub", "ml_practitioners"],
        attendedEvents: ["data_conference_2024"],
        interactions: [],
        preferences: {
          preferredCategories: ["Technology", "Science"],
          maxDistance: 30,
          communitySize: "large",
          activityFrequency: "daily",
          contentTypes: ["discussions", "tutorials"],
          languagePreferences: ["English"],
        },
      },
    ]

    // Mock communities data
    const mockCommunities: Community[] = [
      {
        id: "ai_researchers",
        name: "AI Researchers Network",
        description: "A community for AI researchers and practitioners to share knowledge and collaborate",
        category: "Technology",
        tags: ["artificial intelligence", "machine learning", "research", "deep learning"],
        memberCount: 2500,
        activityLevel: "high",
        location: {
          lat: 40.7505,
          lng: -73.9934,
          city: "New York",
          country: "USA",
        },
        createdAt: new Date("2023-06-01"),
        lastActivity: new Date("2024-01-16"),
        averageRating: 4.7,
        growthRate: 0.15,
        engagementScore: 85,
        contentTopics: ["neural networks", "computer vision", "natural language processing"],
        memberDemographics: {
          ageGroups: { "25-34": 45, "35-44": 30, "18-24": 15, "45+": 10 },
          professions: { "Software Engineer": 40, "Data Scientist": 30, Researcher: 20, Student: 10 },
          locations: { "New York": 60, "San Francisco": 25, Boston: 10, Other: 5 },
        },
      },
      {
        id: "startup_founders_nyc",
        name: "NYC Startup Founders",
        description: "Connect with fellow entrepreneurs and startup founders in New York City",
        category: "Business",
        tags: ["startups", "entrepreneurship", "networking", "funding"],
        memberCount: 1800,
        activityLevel: "high",
        location: {
          lat: 40.7282,
          lng: -74.0776,
          city: "New York",
          country: "USA",
        },
        createdAt: new Date("2023-03-15"),
        lastActivity: new Date("2024-01-15"),
        averageRating: 4.5,
        growthRate: 0.22,
        engagementScore: 78,
        contentTopics: ["venture capital", "product development", "team building"],
        memberDemographics: {
          ageGroups: { "25-34": 50, "35-44": 35, "18-24": 10, "45+": 5 },
          professions: { Entrepreneur: 60, "Product Manager": 20, "Software Engineer": 15, Other: 5 },
          locations: { "New York": 80, "New Jersey": 15, Connecticut: 5 },
        },
      },
      {
        id: "blockchain_developers",
        name: "Blockchain Developers Guild",
        description: "Learn and build with blockchain technology, smart contracts, and Web3",
        category: "Technology",
        tags: ["blockchain", "cryptocurrency", "smart contracts", "web3"],
        memberCount: 3200,
        activityLevel: "medium",
        location: {
          lat: 37.7749,
          lng: -122.4194,
          city: "San Francisco",
          country: "USA",
        },
        createdAt: new Date("2023-01-10"),
        lastActivity: new Date("2024-01-14"),
        averageRating: 4.3,
        growthRate: 0.18,
        engagementScore: 72,
        contentTopics: ["ethereum", "solidity", "defi", "nft"],
        memberDemographics: {
          ageGroups: { "25-34": 55, "18-24": 25, "35-44": 15, "45+": 5 },
          professions: { "Software Engineer": 70, "Product Manager": 15, Designer: 10, Other: 5 },
          locations: { "San Francisco": 40, "New York": 25, Austin: 15, Other: 20 },
        },
      },
      {
        id: "ux_designers_collective",
        name: "UX Designers Collective",
        description: "A space for UX/UI designers to share work, get feedback, and grow together",
        category: "Design",
        tags: ["ux design", "ui design", "user research", "prototyping"],
        memberCount: 1500,
        activityLevel: "medium",
        location: {
          lat: 40.7128,
          lng: -74.006,
          city: "New York",
          country: "USA",
        },
        createdAt: new Date("2023-08-20"),
        lastActivity: new Date("2024-01-13"),
        averageRating: 4.6,
        growthRate: 0.12,
        engagementScore: 80,
        contentTopics: ["design systems", "user testing", "accessibility", "figma"],
        memberDemographics: {
          ageGroups: { "25-34": 60, "18-24": 20, "35-44": 15, "45+": 5 },
          professions: { "UX Designer": 50, "UI Designer": 30, "Product Designer": 15, Other: 5 },
          locations: { "New York": 45, "San Francisco": 30, "Los Angeles": 15, Other: 10 },
        },
      },
      {
        id: "data_science_hub",
        name: "Data Science Hub",
        description: "Data scientists, analysts, and ML engineers sharing insights and best practices",
        category: "Technology",
        tags: ["data science", "machine learning", "analytics", "python"],
        memberCount: 4100,
        activityLevel: "high",
        location: {
          lat: 37.7749,
          lng: -122.4194,
          city: "San Francisco",
          country: "USA",
        },
        createdAt: new Date("2022-11-05"),
        lastActivity: new Date("2024-01-16"),
        averageRating: 4.8,
        growthRate: 0.08,
        engagementScore: 88,
        contentTopics: ["pandas", "tensorflow", "statistics", "visualization"],
        memberDemographics: {
          ageGroups: { "25-34": 45, "35-44": 30, "18-24": 15, "45+": 10 },
          professions: { "Data Scientist": 60, "ML Engineer": 25, Analyst: 10, Other: 5 },
          locations: { "San Francisco": 35, "New York": 30, Seattle: 20, Other: 15 },
        },
      },
    ]

    // Generate recommendations
    const result = await recommendationEngine.generateRecommendations(mockUser, mockAllUsers, mockCommunities, {
      maxRecommendations,
      includePopular: true,
      diversityWeight: 0.3,
      algorithmWeights: {
        collaborative: 0.3,
        contentBased: 0.5,
        popularity: 0.2,
      },
    })

    // Enrich recommendations with community data
    const enrichedRecommendations = result.recommendations
      .map((rec) => {
        const community = mockCommunities.find((c) => c.id === rec.communityId)
        return {
          ...rec,
          community: community
            ? {
                id: community.id,
                name: community.name,
                description: community.description,
                category: community.category,
                tags: community.tags,
                memberCount: community.memberCount,
                averageRating: community.averageRating,
                location: community.location,
                activityLevel: community.activityLevel,
              }
            : null,
        }
      })
      .filter((rec) => rec.community !== null)

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        recommendations: enrichedRecommendations,
      },
    })
  } catch (error) {
    console.error("Recommendation API error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate recommendations" }, { status: 500 })
  }
}
