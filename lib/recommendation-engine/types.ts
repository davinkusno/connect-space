export interface User {
  id: string
  interests: string[]
  location?: {
    lat: number
    lng: number 
    city: string
    country?: string
    placeId?: string
  }
  joinedCommunities: string[]
  attendedEvents: string[]
}

export interface Community {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  memberCount: number
  location?: {
    lat: number
    lng: number
    city: string
    country?: string
    placeId?: string
  }
  createdAt: Date
  contentTopics: string[]
}

export interface RecommendationScore {
  communityId: string
  score: number
  confidence: number
  method: string
  reasons: RecommendationReason[]
}

export interface RecommendationReason {
  type: "interest_match" | "location_proximity" | "category_match"
  description: string
  weight: number
  evidence: any
}

export interface RecommendationResult {
  recommendations: RecommendationScore[]
  metadata: {
    totalCommunities: number
    processingTime: number
  }
}

export interface RecommendationOptions {
  maxRecommendations?: number
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
    lng: number // Keep for backwards compatibility
    city: string
    address?: string // Make optional
    venue?: string
    placeId?: string // NEW: OpenStreetMap place_id for precise matching
  }
  isOnline: boolean
  startTime: Date
  endTime: Date | null // Allow null
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
  type: "interest_match" | "community_member" | "location_proximity"
  description: string
  weight: number
  evidence: any
}

export interface EventRecommendationResult {
  recommendations: EventRecommendationScore[]
  metadata: {
    totalEvents: number
    processingTime: number
  }
}

export interface EventRecommendationOptions {
  maxRecommendations?: number
  dateRangeFilter?: "all" | "today" | "week" | "month"
  includeOnlineOnly?: boolean
  includeInPersonOnly?: boolean
}
