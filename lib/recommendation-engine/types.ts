export interface User {
  id: string
  interests: string[]
  location?: {
    lat: number
    lng: number
    city: string
    country: string
  }
  demographics?: {
    age?: number
    profession?: string
    education?: string
  }
  activityLevel: "low" | "medium" | "high"
  joinedCommunities: string[]
  attendedEvents: string[]
  interactions: UserInteraction[]
  preferences: UserPreferences
}

export interface UserInteraction {
  type: "view" | "like" | "comment" | "share" | "join" | "leave"
  targetId: string
  targetType: "community" | "event" | "post" | "user"
  timestamp: Date
  duration?: number
  rating?: number
}

export interface UserPreferences {
  preferredCategories: string[]
  maxDistance?: number
  communitySize?: "small" | "medium" | "large" | "any"
  activityFrequency?: "daily" | "weekly" | "monthly" | "occasional"
  contentTypes?: string[]
  languagePreferences?: string[]
}

export interface Community {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  memberCount: number
  activityLevel: "low" | "medium" | "high"
  location?: {
    lat: number
    lng: number
    city: string
    country: string
  }
  createdAt: Date
  lastActivity: Date
  growthRate: number
  engagementScore: number
  contentTopics: string[]
  memberDemographics: {
    ageGroups: Record<string, number>
    professions: Record<string, number>
    locations: Record<string, number>
  }
}

export interface RecommendationScore {
  communityId: string
  score: number
  confidence: number
  method: string
  reasons: RecommendationReason[]
}

export interface RecommendationReason {
  type:
    | "interest_match"
    | "location_proximity"
    | "similar_users"
    | "popularity"
    | "activity_match"
    | "demographic_match"
  description: string
  weight: number
  evidence: any
}

export interface RecommendationResult {
  recommendations: RecommendationScore[]
  metadata: {
    totalCommunities: number
    algorithmsUsed: string[]
    processingTime: number
    diversityScore: number
  }
}

export interface RecommendationOptions {
  maxRecommendations?: number
  includePopular?: boolean
  diversityWeight?: number
  algorithmWeights?: {
    collaborative?: number
    contentBased?: number
    popularity?: number
  }
}

// Event Recommendation Types
export interface Event {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  communityId: string
  communityName?: string
  creatorId: string
  location?: {
    lat: number
    lng: number
    city: string
    address: string
    venue?: string
  }
  isOnline: boolean
  startTime: Date
  endTime: Date
  maxAttendees: number | null
  currentAttendees: number
  createdAt: Date
  imageUrl?: string
  contentTopics: string[]
}

export interface EventRecommendationScore {
  eventId: string
  score: number
  confidence: number
  method: string
  reasons: EventRecommendationReason[]
}

export interface EventRecommendationReason {
  type:
    | "interest_match"
    | "community_member"
    | "location_proximity"
    | "similar_users"
    | "popularity"
    | "timing"
    | "social_connection"
  description: string
  weight: number
  evidence: any
}

export interface EventRecommendationResult {
  recommendations: EventRecommendationScore[]
  metadata: {
    totalEvents: number
    algorithmsUsed: string[]
    processingTime: number
    diversityScore: number
  }
}

export interface EventRecommendationOptions {
  maxRecommendations?: number
  includePopular?: boolean
  diversityWeight?: number
  dateRangeFilter?: "all" | "today" | "week" | "month"
  includeOnlineOnly?: boolean
  includeInPersonOnly?: boolean
  algorithmWeights?: {
    collaborative?: number
    contentBased?: number
    popularity?: number
    community?: number
  }
}
