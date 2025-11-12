"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Star, TrendingUp, Target, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import type { DailySummary } from "@/lib/ai-services/daily-summary-service"

interface OptimizedDailySummaryCardProps {
  summary: DailySummary
  compact?: boolean
  className?: string
}

export function OptimizedDailySummaryCard({
  summary,
  compact = false,
  className = "",
}: OptimizedDailySummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)

  const priorityMetrics = summary.keyMetrics.slice(0, 3)
  const topAchievements = summary.achievements.slice(0, 2)
  const topRecommendations = summary.recommendations.slice(0, 3)

  if (compact && !isExpanded) {
    return (
      <Card className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-gray-900">Daily Summary</CardTitle>
                <p className="text-xs text-gray-600">
                  {new Date(summary.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            <p className="text-xs text-gray-700 line-clamp-2">{summary.overview}</p>

            {/* Compact Metrics */}
            <div className="grid grid-cols-3 gap-1">
              {priorityMetrics.map((metric, index) => (
                <div key={index} className="bg-gray-50 rounded-md p-1.5 text-center">
                  <p className="text-xs font-semibold text-gray-900">{metric.value}</p>
                  <p className="text-xs text-gray-600 truncate">{metric.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Indicators */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex space-x-1">
                {topAchievements.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                    <Star className="h-2 w-2 mr-1" />
                    {topAchievements.length}
                  </Badge>
                )}
                {topRecommendations.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                    <Target className="h-2 w-2 mr-1" />
                    {topRecommendations.length}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-5 px-2"
              >
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Daily Summary</CardTitle>
              <p className="text-sm text-gray-600">
                {new Date(summary.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="space-y-4">
          {/* Overview */}
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">{summary.overview}</p>
          </div>

          {/* Key Metrics Grid */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Key Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {priorityMetrics.map((metric, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">{metric.label}</p>
                      <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                    </div>
                    {metric.trend && (
                      <div
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          metric.trend === "up"
                            ? "bg-green-100 text-green-700"
                            : metric.trend === "down"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {metric.trend === "up" ? "↗" : metric.trend === "down" ? "↘" : "→"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          {topAchievements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                <Star className="h-3 w-3" />
                Recent Achievements
              </h4>
              <div className="space-y-1">
                {topAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Star className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{achievement.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-1">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Recommendations */}
          {topRecommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Recommendations
              </h4>
              <ScrollArea className="h-20">
                <div className="space-y-1">
                  {topRecommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div
                        className={`w-1 h-4 rounded-full flex-shrink-0 mt-0.5 ${
                          rec.priority === "high"
                            ? "bg-red-500"
                            : rec.priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900 line-clamp-2">{rec.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
