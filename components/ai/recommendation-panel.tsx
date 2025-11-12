"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sparkles,
  Users,
  Calendar,
  FileText,
  User,
  TrendingUp,
  MapPin,
  Clock,
  Star,
  RefreshCw,
  Info,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface RecommendationPanelProps {
  userId?: string
  userProfile?: any
  className?: string
  maxRecommendations?: number
  showExplanations?: boolean
}

interface Recommendation {
  id: string
  type: "community" | "event" | "person" | "content"
  title: string
  description: string
  relevanceScore: number
  reasoning: string
  category: string
  tags: string[]
  metadata?: any
}

export function RecommendationPanel({
  userId,
  userProfile,
  className,
  maxRecommendations = 8,
  showExplanations = true,
}: RecommendationPanelProps) {
  const [recommendations, setRecommendations] = useState<Record<string, Recommendation[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("communities")
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (userId || userProfile) {
      loadRecommendations()
    }
  }, [userId, userProfile])

  const loadRecommendations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userProfile,
          maxRecommendations,
          types: ["community", "event", "person", "content"],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to load recommendations")
      }

      const data = await response.json()
      setRecommendations(data.recommendations)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshRecommendations = () => {
    loadRecommendations()
  }

  const handleRecommendationClick = async (recommendation: Recommendation) => {
    // Track recommendation interaction
    try {
      await fetch("/api/ai/recommendation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          recommendationId: recommendation.id,
          action: "click",
          type: recommendation.type,
        }),
      })
    } catch (error) {
      console.error("Failed to track recommendation interaction:", error)
    }
  }

  const RecommendationCard = ({
    recommendation,
    showReasoning = false,
  }: {
    recommendation: Recommendation
    showReasoning?: boolean
  }) => {
    const getIcon = () => {
      switch (recommendation.type) {
        case "community":
          return Users
        case "event":
          return Calendar
        case "person":
          return User
        case "content":
          return FileText
        default:
          return Sparkles
      }
    }

    const getTypeColor = () => {
      switch (recommendation.type) {
        case "community":
          return "bg-blue-500"
        case "event":
          return "bg-green-500"
        case "person":
          return "bg-purple-500"
        case "content":
          return "bg-orange-500"
        default:
          return "bg-gray-500"
      }
    }

    const IconComponent = getIcon()

    return (
      <Card
        className="group hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 hover:border-purple-300"
        onClick={() => handleRecommendationClick(recommendation)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", getTypeColor())}>
              <IconComponent className="h-4 w-4 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                  {recommendation.title}
                </h4>
                <div className="flex items-center gap-1 ml-2">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-gray-500">{Math.round(recommendation.relevanceScore * 100)}%</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{recommendation.description}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {recommendation.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>

              {showReasoning && showExplanations && (
                <div className="mt-3 p-2 bg-purple-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-purple-700">{recommendation.reasoning}</p>
                  </div>
                </div>
              )}

              {/* Type-specific metadata */}
              {recommendation.type === "event" && recommendation.metadata && (
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {recommendation.metadata.date}
                  </div>
                  {recommendation.metadata.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {recommendation.metadata.location}
                    </div>
                  )}
                </div>
              )}

              {recommendation.type === "community" && recommendation.metadata && (
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {recommendation.metadata.memberCount} members
                  </div>
                  {recommendation.metadata.activityLevel && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {recommendation.metadata.activityLevel} activity
                    </div>
                  )}
                </div>
              )}

              {recommendation.type === "person" && recommendation.metadata && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={recommendation.metadata.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{recommendation.title.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-gray-500">
                    {recommendation.metadata.role} • {recommendation.metadata.experience}
                  </div>
                </div>
              )}
            </div>

            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <Sparkles className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load recommendations</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshRecommendations} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalRecommendations = Object.values(recommendations).reduce((sum, recs) => sum + recs.length, 0)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Recommendations
            {totalRecommendations > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalRecommendations} new
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshRecommendations}
              className="text-gray-600 hover:text-purple-600"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {totalRecommendations === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600 mb-4">
              Interact with communities and events to get personalized recommendations
            </p>
            <Button onClick={refreshRecommendations} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check for recommendations
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger
                value="communities"
                className="flex items-center gap-1 text-xs"
                disabled={!recommendations.communities?.length}
              >
                <Users className="h-3 w-3" />
                Communities
                {recommendations.communities?.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {recommendations.communities.length}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="events"
                className="flex items-center gap-1 text-xs"
                disabled={!recommendations.events?.length}
              >
                <Calendar className="h-3 w-3" />
                Events
                {recommendations.events?.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {recommendations.events.length}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="people"
                className="flex items-center gap-1 text-xs"
                disabled={!recommendations.people?.length}
              >
                <User className="h-3 w-3" />
                People
                {recommendations.people?.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {recommendations.people.length}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="content"
                className="flex items-center gap-1 text-xs"
                disabled={!recommendations.content?.length}
              >
                <FileText className="h-3 w-3" />
                Content
                {recommendations.content?.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {recommendations.content.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="communities" className="space-y-3">
              {recommendations.communities?.map((recommendation) => (
                <Link key={recommendation.id} href={`/community/${recommendation.id}`}>
                  <RecommendationCard recommendation={recommendation} showReasoning={showExplanations} />
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="events" className="space-y-3">
              {recommendations.events?.map((recommendation) => (
                <Link key={recommendation.id} href={`/events/${recommendation.id}`}>
                  <RecommendationCard recommendation={recommendation} showReasoning={showExplanations} />
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="people" className="space-y-3">
              {recommendations.people?.map((recommendation) => (
                <div key={recommendation.id}>
                  <RecommendationCard recommendation={recommendation} showReasoning={showExplanations} />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="content" className="space-y-3">
              {recommendations.content?.map((recommendation) => (
                <div key={recommendation.id}>
                  <RecommendationCard recommendation={recommendation} showReasoning={showExplanations} />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
