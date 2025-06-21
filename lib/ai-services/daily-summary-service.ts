import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export interface UserActivityData {
  userId: string
  date: string
  messages: {
    sent: number
    received: number
    communities: string[]
    topContacts: Array<{ name: string; count: number }>
  }
  communities: {
    joined: number
    left: number
    postsCreated: number
    postsLiked: number
    commentsPosted: number
    activeIn: Array<{ name: string; activity: number }>
  }
  events: {
    attended: number
    created: number
    rsvped: number
    cancelled: number
    upcoming: Array<{ title: string; date: string; type: string }>
  }
  achievements: Array<{
    type: string
    title: string
    description: string
    earnedAt: string
  }>
  connections: {
    newFollowers: number
    newFollowing: number
    profileViews: number
  }
  engagement: {
    totalInteractions: number
    likesReceived: number
    commentsReceived: number
    sharesReceived: number
  }
  goals: {
    completed: number
    inProgress: number
    overdue: number
  }
  streaks: {
    dailyLogin: number
    eventAttendance: number
    communityEngagement: number
  }
}

export interface SummaryPreferences {
  userId: string
  frequency: "daily" | "weekly" | "monthly"
  includeMetrics: boolean
  includeTrends: boolean
  includeRecommendations: boolean
  includeGoals: boolean
  includeAchievements: boolean
  includeUpcoming: boolean
  tone: "professional" | "casual" | "enthusiastic" | "motivational"
  length: "brief" | "detailed" | "comprehensive"
  focusAreas: string[]
  notificationTime: string
  emailDelivery: boolean
  pushNotification: boolean
}

export interface DailySummary {
  id: string
  userId: string
  date: string
  title: string
  overview: string
  keyMetrics: Array<{
    label: string
    value: string | number
    change: string
    trend: "up" | "down" | "stable"
    icon: string
  }>
  highlights: string[]
  trends: Array<{
    category: string
    description: string
    insight: string
    actionable: boolean
  }>
  achievements: Array<{
    type: string
    title: string
    description: string
    impact: string
  }>
  recommendations: Array<{
    type: "community" | "event" | "connection" | "goal"
    title: string
    description: string
    action: string
    priority: "high" | "medium" | "low"
  }>
  upcomingEvents: Array<{
    title: string
    date: string
    time: string
    type: string
    community: string
    priority: string
  }>
  goals: {
    completed: Array<{ title: string; completedAt: string }>
    inProgress: Array<{ title: string; progress: number; dueDate: string }>
    suggestions: Array<{ title: string; reason: string }>
  }
  socialInsights: {
    topInteractions: Array<{ person: string; type: string; count: number }>
    communityGrowth: Array<{ community: string; newMembers: number; yourContribution: string }>
    networkExpansion: { newConnections: number; mutualConnections: number }
  }
  createdAt: string
  readAt?: string
}

export class DailySummaryService {
  private static instance: DailySummaryService

  public static getInstance(): DailySummaryService {
    if (!DailySummaryService.instance) {
      DailySummaryService.instance = new DailySummaryService()
    }
    return DailySummaryService.instance
  }

  async generateDailySummary(
    activityData: UserActivityData,
    preferences: SummaryPreferences,
    previousSummaries?: DailySummary[],
  ): Promise<DailySummary> {
    try {
      // Analyze trends from previous summaries
      const trends = this.analyzeTrends(activityData, previousSummaries)

      // Generate AI-powered insights
      const aiInsights = await this.generateAIInsights(activityData, preferences, trends)

      // Create key metrics
      const keyMetrics = this.generateKeyMetrics(activityData, previousSummaries)

      // Generate recommendations
      const recommendations = await this.generateRecommendations(activityData, preferences)

      // Create the summary
      const summary: DailySummary = {
        id: `summary_${activityData.userId}_${activityData.date}`,
        userId: activityData.userId,
        date: activityData.date,
        title: aiInsights.title,
        overview: aiInsights.overview,
        keyMetrics,
        highlights: aiInsights.highlights,
        trends: trends,
        achievements: activityData.achievements.map((achievement) => ({
          ...achievement,
          impact: this.calculateAchievementImpact(achievement, activityData),
        })),
        recommendations,
        upcomingEvents: activityData.events.upcoming.map((event) => ({
          ...event,
          priority: this.calculateEventPriority(event, activityData),
        })),
        goals: {
          completed: [], // Would be populated from actual goal data
          inProgress: [], // Would be populated from actual goal data
          suggestions: await this.generateGoalSuggestions(activityData),
        },
        socialInsights: {
          topInteractions: activityData.messages.topContacts.map((contact) => ({
            person: contact.name,
            type: "message",
            count: contact.count,
          })),
          communityGrowth: activityData.communities.activeIn.map((community) => ({
            community: community.name,
            newMembers: Math.floor(Math.random() * 10), // Would be actual data
            yourContribution: this.calculateCommunityContribution(community, activityData),
          })),
          networkExpansion: {
            newConnections: activityData.connections.newFollowers,
            mutualConnections: Math.floor(activityData.connections.newFollowers * 0.3),
          },
        },
        createdAt: new Date().toISOString(),
      }

      return summary
    } catch (error) {
      console.error("Error generating daily summary:", error)
      throw new Error("Failed to generate daily summary")
    }
  }

  private async generateAIInsights(activityData: UserActivityData, preferences: SummaryPreferences, trends: any[]) {
    const prompt = this.buildInsightPrompt(activityData, preferences, trends)

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    })

    // Parse the AI response
    const sections = text.split("\n\n")
    return {
      title: sections[0]?.replace("Title: ", "") || "Your Daily Summary",
      overview: sections[1]?.replace("Overview: ", "") || "Here's what happened today.",
      highlights: sections
        .slice(2)
        .filter((section) => section.startsWith("•"))
        .map((h) => h.replace("• ", "")),
    }
  }

  private buildInsightPrompt(activityData: UserActivityData, preferences: SummaryPreferences, trends: any[]): string {
    const toneInstructions = {
      professional: "Use a professional, business-like tone",
      casual: "Use a friendly, conversational tone",
      enthusiastic: "Use an upbeat, energetic tone with positive language",
      motivational: "Use an inspiring, encouraging tone that motivates action",
    }

    const lengthInstructions = {
      brief: "Keep it concise and to the point",
      detailed: "Provide moderate detail with explanations",
      comprehensive: "Include comprehensive analysis and context",
    }

    return `
Generate a personalized daily summary for a community platform user. ${toneInstructions[preferences.tone]}. ${lengthInstructions[preferences.length]}.

User Activity Data:
- Messages: ${activityData.messages.sent} sent, ${activityData.messages.received} received
- Communities: Active in ${activityData.communities.activeIn.length} communities, ${activityData.communities.postsCreated} posts created
- Events: ${activityData.events.attended} attended, ${activityData.events.rsvped} upcoming RSVPs
- Engagement: ${activityData.engagement.totalInteractions} total interactions
- Achievements: ${activityData.achievements.length} new achievements
- Streaks: ${activityData.streaks.dailyLogin} day login streak

Focus Areas: ${preferences.focusAreas.join(", ")}

Format the response as:
Title: [Engaging title for the day]

Overview: [2-3 sentence overview of the day's activity]

• [Key highlight 1]
• [Key highlight 2]
• [Key highlight 3]
• [Additional insights based on data patterns]

Make it personal, actionable, and encouraging. Focus on progress and opportunities.
    `
  }

  private generateKeyMetrics(activityData: UserActivityData, previousSummaries?: DailySummary[]) {
    const previousData = previousSummaries?.[0]

    return [
      {
        label: "Messages",
        value: activityData.messages.sent + activityData.messages.received,
        change: this.calculateChange(
          activityData.messages.sent + activityData.messages.received,
          previousData ? 50 : 0, // Would use actual previous data
        ),
        trend: "up" as const,
        icon: "MessageCircle",
      },
      {
        label: "Community Posts",
        value: activityData.communities.postsCreated,
        change: this.calculateChange(activityData.communities.postsCreated, 0),
        trend: activityData.communities.postsCreated > 0 ? "up" : ("stable" as const),
        icon: "Users",
      },
      {
        label: "Event Participation",
        value: activityData.events.attended + activityData.events.rsvped,
        change: this.calculateChange(activityData.events.attended + activityData.events.rsvped, 0),
        trend: "up" as const,
        icon: "Calendar",
      },
      {
        label: "Engagement Score",
        value: activityData.engagement.totalInteractions,
        change: this.calculateChange(activityData.engagement.totalInteractions, 0),
        trend: "up" as const,
        icon: "TrendingUp",
      },
    ]
  }

  private calculateChange(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? `+${current}` : "0"
    const change = ((current - previous) / previous) * 100
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`
  }

  private analyzeTrends(activityData: UserActivityData, previousSummaries?: DailySummary[]) {
    // Analyze patterns and trends
    const trends = []

    // Community engagement trend
    if (activityData.communities.postsCreated > 0) {
      trends.push({
        category: "Community Engagement",
        description: "Increased posting activity in communities",
        insight: "Your community contributions are helping build stronger connections",
        actionable: true,
      })
    }

    // Event participation trend
    if (activityData.events.rsvped > 0) {
      trends.push({
        category: "Event Participation",
        description: "Active event participation",
        insight: "Regular event attendance is expanding your network",
        actionable: true,
      })
    }

    // Messaging trend
    if (activityData.messages.sent > activityData.messages.received) {
      trends.push({
        category: "Communication",
        description: "High outbound communication",
        insight: "You're actively reaching out and initiating conversations",
        actionable: false,
      })
    }

    return trends
  }

  private async generateRecommendations(activityData: UserActivityData, preferences: SummaryPreferences) {
    const recommendations = []

    // Community recommendations
    if (activityData.communities.activeIn.length < 3) {
      recommendations.push({
        type: "community" as const,
        title: "Explore New Communities",
        description: "Discover communities that match your interests",
        action: "Browse recommended communities",
        priority: "medium" as const,
      })
    }

    // Event recommendations
    if (activityData.events.rsvped === 0) {
      recommendations.push({
        type: "event" as const,
        title: "Join Upcoming Events",
        description: "Connect with others through local events",
        action: "View upcoming events",
        priority: "high" as const,
      })
    }

    // Connection recommendations
    if (activityData.connections.newFollowers === 0) {
      recommendations.push({
        type: "connection" as const,
        title: "Expand Your Network",
        description: "Connect with like-minded community members",
        action: "Find people to follow",
        priority: "medium" as const,
      })
    }

    return recommendations
  }

  private async generateGoalSuggestions(activityData: UserActivityData) {
    // Generate personalized goal suggestions based on activity
    const suggestions = []

    if (activityData.communities.postsCreated === 0) {
      suggestions.push({
        title: "Share your first community post",
        reason: "Engage with your communities by sharing insights or questions",
      })
    }

    if (activityData.events.attended === 0) {
      suggestions.push({
        title: "Attend your first event this week",
        reason: "Events are a great way to meet new people and learn",
      })
    }

    return suggestions
  }

  private calculateAchievementImpact(achievement: any, activityData: UserActivityData): string {
    // Calculate the impact of achievements on user engagement
    return "Boosted your community reputation and unlocked new features"
  }

  private calculateEventPriority(event: any, activityData: UserActivityData): string {
    // Calculate event priority based on user preferences and activity
    return Math.random() > 0.5 ? "high" : "medium"
  }

  private calculateCommunityContribution(community: any, activityData: UserActivityData): string {
    // Calculate user's contribution to community growth
    const contributions = ["active discussions", "helpful posts", "event organization", "member mentoring"]
    return contributions[Math.floor(Math.random() * contributions.length)]
  }

  async saveSummaryPreferences(preferences: SummaryPreferences): Promise<void> {
    // Save user preferences (would integrate with database)
    console.log("Saving preferences:", preferences)
  }

  async getSummaryPreferences(userId: string): Promise<SummaryPreferences> {
    // Get user preferences (would integrate with database)
    return {
      userId,
      frequency: "daily",
      includeMetrics: true,
      includeTrends: true,
      includeRecommendations: true,
      includeGoals: true,
      includeAchievements: true,
      includeUpcoming: true,
      tone: "casual",
      length: "detailed",
      focusAreas: ["communities", "events", "networking"],
      notificationTime: "09:00",
      emailDelivery: false,
      pushNotification: true,
    }
  }

  async getUserActivityData(userId: string, date: string): Promise<UserActivityData> {
    // Fetch user activity data (would integrate with database)
    return {
      userId,
      date,
      messages: {
        sent: Math.floor(Math.random() * 20),
        received: Math.floor(Math.random() * 25),
        communities: ["Tech Innovators", "Outdoor Adventures"],
        topContacts: [
          { name: "Sarah Chen", count: 5 },
          { name: "Mike Johnson", count: 3 },
          { name: "Lisa Wang", count: 2 },
        ],
      },
      communities: {
        joined: 0,
        left: 0,
        postsCreated: Math.floor(Math.random() * 5),
        postsLiked: Math.floor(Math.random() * 15),
        commentsPosted: Math.floor(Math.random() * 10),
        activeIn: [
          { name: "Tech Innovators", activity: 8 },
          { name: "Outdoor Adventures", activity: 5 },
        ],
      },
      events: {
        attended: Math.floor(Math.random() * 3),
        created: Math.floor(Math.random() * 2),
        rsvped: Math.floor(Math.random() * 4),
        cancelled: 0,
        upcoming: [
          { title: "AI Workshop", date: "2024-01-15", type: "Workshop" },
          { title: "Hiking Trip", date: "2024-01-18", type: "Outdoor" },
        ],
      },
      achievements: [
        {
          type: "engagement",
          title: "Active Member",
          description: "Posted 5 times this week",
          earnedAt: new Date().toISOString(),
        },
      ],
      connections: {
        newFollowers: Math.floor(Math.random() * 5),
        newFollowing: Math.floor(Math.random() * 3),
        profileViews: Math.floor(Math.random() * 20),
      },
      engagement: {
        totalInteractions: Math.floor(Math.random() * 50),
        likesReceived: Math.floor(Math.random() * 25),
        commentsReceived: Math.floor(Math.random() * 15),
        sharesReceived: Math.floor(Math.random() * 5),
      },
      goals: {
        completed: Math.floor(Math.random() * 3),
        inProgress: Math.floor(Math.random() * 5),
        overdue: Math.floor(Math.random() * 2),
      },
      streaks: {
        dailyLogin: Math.floor(Math.random() * 30),
        eventAttendance: Math.floor(Math.random() * 10),
        communityEngagement: Math.floor(Math.random() * 15),
      },
    }
  }
}
