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
    country: string
    address: string
  }
  activityLevel: string
  image: string
  upcomingEvents: number
  memberGrowth: string
  gradient: string
  trending: boolean
  createdAt: string
  lastActivity: string
  engagementScore: number
  isRecommended?: boolean
  recommendationScore?: number
  recommendationReason?: string
  recommendationMethod?: string
  isVerified?: boolean
  isNew?: boolean
  featured?: boolean
  language?: string
  privacy: "public" | "private" | "invite-only"
}



