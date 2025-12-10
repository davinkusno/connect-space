"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DailySummary, SummaryPreferences } from "@/lib/ai-services/daily-summary-service"
import { ChevronDown, ChevronUp, Settings, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { DailySummaryCard } from "./daily-summary-card"
import { SummaryPreferencesDialog } from "./summary-preferences-dialog"

interface DailySummaryWidgetProps {
  userId: string
  className?: string
  compact?: boolean
}

export function DailySummaryWidget({ userId, className = "", compact = false }: DailySummaryWidgetProps) {
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [preferences, setPreferences] = useState<SummaryPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadSummary()
    loadPreferences()
  }, [userId])

  const loadSummary = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/daily-summary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Error loading summary:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPreferences = async () => {
    try {
      const response = await fetch(`/api/daily-summary/preferences?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error("Error loading preferences:", error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadSummary()
    setIsRefreshing(false)
  }

  const handleSavePreferences = async (newPreferences: SummaryPreferences) => {
    try {
      const response = await fetch("/api/daily-summary/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPreferences),
      })

      if (response.ok) {
        setPreferences(newPreferences)
        // Refresh summary with new preferences
        await loadSummary()
      }
    } catch (error) {
      console.error("Error saving preferences:", error)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary || !preferences) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No summary available</p>
            <Button onClick={loadSummary} variant="outline">
              Generate Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact && !isExpanded) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Daily Summary</CardTitle>
                <p className="text-sm text-gray-600">
                  {new Date(summary.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(true)} className="hover:bg-gray-100">
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreferencesOpen(true)}
                className="hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-700 line-clamp-2">{summary.overview}</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              {summary.keyMetrics.slice(0, 2).map((metric, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-600">{metric.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{metric.value}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex space-x-1">
                {summary.achievements.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {summary.achievements.length} achievements
                  </Badge>
                )}
                {summary.recommendations.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {summary.recommendations.length} tips
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                View Full Summary
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {isExpanded && (
        <DailySummaryCard summary={summary} onRefresh={handleRefresh} onSettings={() => setIsPreferencesOpen(true)} />
      )}

      {compact && isExpanded && (
        <div className="flex justify-end mt-4">
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)} className="hover:bg-gray-100">
            <ChevronUp className="h-4 w-4 mr-2" />
            Collapse
          </Button>
        </div>
      )}

      {preferences && (
        <SummaryPreferencesDialog
          isOpen={isPreferencesOpen}
          onClose={() => setIsPreferencesOpen(false)}
          preferences={preferences}
          onSave={handleSavePreferences}
        />
      )}
    </div>
  )
}
