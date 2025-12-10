"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { DailySummary } from "@/lib/ai-services/daily-summary-service"
import { cn } from "@/lib/utils"
import {
    ArrowRight, Award, Calendar, ChevronRight, Clock, Eye,
    EyeOff, Lightbulb, MessageCircle, Minus, RefreshCw, Settings, Star,
    Target, TrendingDown, TrendingUp, Users
} from "lucide-react"
import { useState } from "react"

interface DailySummaryCardProps {
  summary: DailySummary
  onRefresh?: () => void
  onSettings?: () => void
  className?: string
}

export function DailySummaryCard({ summary, onRefresh, onSettings, className }: DailySummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hiddenSections, setHiddenSections] = useState<string[]>([])

  const toggleSection = (sectionId: string) => {
    setHiddenSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons = {
      MessageCircle,
      Users,
      Calendar,
      TrendingUp,
      Star,
      Target,
      Award,
    }
    const Icon = icons[iconName as keyof typeof icons] || MessageCircle
    return <Icon className="h-4 w-4" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className={cn("border-0 shadow-lg hover:shadow-xl transition-all duration-300", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">{summary.title}</CardTitle>
              <p className="text-sm text-gray-600">
                {new Date(summary.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh} className="hover:bg-gray-100">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {onSettings && (
              <Button variant="ghost" size="sm" onClick={onSettings} className="hover:bg-gray-100">
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <p className="text-gray-800 leading-relaxed">{summary.overview}</p>
        </div>

        {/* Key Metrics */}
        {!hiddenSections.includes("metrics") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Key Metrics
              </h3>
              <Button variant="ghost" size="sm" onClick={() => toggleSection("metrics")} className="hover:bg-gray-100">
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {summary.keyMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-gray-50 rounded-lg">{getIconComponent(metric.icon)}</div>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                    <p className="text-xs text-green-600 font-medium">{metric.change}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hiddenSections.includes("metrics") && (
          <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Key Metrics (Hidden)</span>
            <Button variant="ghost" size="sm" onClick={() => toggleSection("metrics")} className="hover:bg-gray-100">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Highlights */}
        {summary.highlights.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Today's Highlights
            </h3>
            <div className="space-y-2">
              {summary.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                >
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-800 text-sm leading-relaxed">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {summary.achievements.length > 0 && !hiddenSections.includes("achievements") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                New Achievements
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection("achievements")}
                className="hover:bg-gray-100"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {summary.achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-100"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                    <p className="text-sm text-gray-600 mb-1">{achievement.description}</p>
                    <p className="text-xs text-purple-600 font-medium">{achievement.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trends */}
        {summary.trends.length > 0 && !hiddenSections.includes("trends") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Trends & Insights
              </h3>
              <Button variant="ghost" size="sm" onClick={() => toggleSection("trends")} className="hover:bg-gray-100">
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {summary.trends.map((trend, index) => (
                <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-white border-green-200 text-green-800">
                      {trend.category}
                    </Badge>
                    {trend.actionable && <Badge className="bg-green-500 text-white text-xs">Actionable</Badge>}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{trend.description}</h4>
                  <p className="text-sm text-gray-600">{trend.insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {summary.recommendations.length > 0 && !hiddenSections.includes("recommendations") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-orange-600" />
                Recommendations
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection("recommendations")}
                className="hover:bg-gray-100"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {summary.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-xs text-orange-600 font-medium">{rec.action}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {summary.upcomingEvents.length > 0 && !hiddenSections.includes("events") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Upcoming Events
              </h3>
              <Button variant="ghost" size="sm" onClick={() => toggleSection("events")} className="hover:bg-gray-100">
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {summary.upcomingEvents.slice(0, isExpanded ? undefined : 3).map((event, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <Badge className={getPriorityColor(event.priority)}>{event.priority}</Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.date} • {event.time}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {event.community}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              ))}
              {summary.upcomingEvents.length > 3 && (
                <Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)} className="w-full hover:bg-blue-50">
                  {isExpanded ? "Show Less" : `Show ${summary.upcomingEvents.length - 3} More Events`}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Social Insights */}
        {!hiddenSections.includes("social") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Social Insights
              </h3>
              <Button variant="ghost" size="sm" onClick={() => toggleSection("social")} className="hover:bg-gray-100">
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Interactions */}
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <h4 className="font-medium text-gray-900 mb-3">Top Interactions</h4>
                <div className="space-y-2">
                  {summary.socialInsights.topInteractions.slice(0, 3).map((interaction, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{interaction.person.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-700">{interaction.person}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {interaction.count} messages
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Growth */}
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <h4 className="font-medium text-gray-900 mb-3">Network Growth</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Connections</span>
                    <span className="font-semibold text-indigo-600">
                      +{summary.socialInsights.networkExpansion.newConnections}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mutual Connections</span>
                    <span className="font-semibold text-indigo-600">
                      {summary.socialInsights.networkExpansion.mutualConnections}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Generated {new Date(summary.createdAt).toLocaleTimeString()}</span>
          {summary.readAt && <span>Read {new Date(summary.readAt).toLocaleTimeString()}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
