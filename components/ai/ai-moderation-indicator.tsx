"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Shield, AlertTriangle, CheckCircle, Clock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIModerationIndicatorProps {
  content: string
  contentType: "post" | "comment" | "message" | "profile"
  className?: string
  showDetails?: boolean
}

interface ModerationResult {
  decision: "approve" | "flag" | "reject"
  confidence: number
  reasons: string[]
  severity: "low" | "medium" | "high" | "critical"
  requiresHumanReview: boolean
}

export function AIModerationIndicator({
  content,
  contentType,
  className,
  showDetails = false,
}: AIModerationIndicatorProps) {
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    if (content && content.length > 10) {
      analyzeContent()
    }
  }, [content])

  const analyzeContent = async () => {
    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/ai/moderate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          contentType,
          context: {
            communityGuidelines: [
              "Be respectful and professional",
              "No spam or promotional content",
              "Stay on topic",
              "No harassment or hate speech",
            ],
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setModerationResult(result)
      }
    } catch (error) {
      console.error("Content moderation error:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getStatusIcon = () => {
    if (isAnalyzing) return Clock
    if (!moderationResult) return Shield

    switch (moderationResult.decision) {
      case "approve":
        return CheckCircle
      case "flag":
        return AlertTriangle
      case "reject":
        return AlertTriangle
      default:
        return Shield
    }
  }

  const getStatusColor = () => {
    if (isAnalyzing) return "text-blue-500"
    if (!moderationResult) return "text-gray-500"

    switch (moderationResult.decision) {
      case "approve":
        return "text-green-500"
      case "flag":
        return "text-yellow-500"
      case "reject":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusText = () => {
    if (isAnalyzing) return "Analyzing..."
    if (!moderationResult) return "Not analyzed"

    switch (moderationResult.decision) {
      case "approve":
        return "Content approved"
      case "flag":
        return "Content flagged"
      case "reject":
        return "Content rejected"
      default:
        return "Unknown status"
    }
  }

  const StatusIcon = getStatusIcon()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", className)}>
            <Badge variant="outline" className={cn("flex items-center gap-1 text-xs", getStatusColor())}>
              <StatusIcon className="h-3 w-3" />
              {isAnalyzing ? <Sparkles className="h-3 w-3 animate-pulse" /> : <span>AI</span>}
            </Badge>

            {showDetails && moderationResult && (
              <div className="text-xs text-gray-500">{Math.round(moderationResult.confidence * 100)}% confidence</div>
            )}
          </div>
        </TooltipTrigger>

        <TooltipContent>
          <div className="space-y-2">
            <p className="font-medium">{getStatusText()}</p>

            {moderationResult && (
              <>
                <p className="text-sm">Confidence: {Math.round(moderationResult.confidence * 100)}%</p>

                {moderationResult.reasons.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Reasons:</p>
                    <ul className="text-xs space-y-1">
                      {moderationResult.reasons.map((reason, index) => (
                        <li key={index}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {moderationResult.requiresHumanReview && (
                  <p className="text-xs text-yellow-600">⚠️ Requires human review</p>
                )}
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
