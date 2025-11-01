"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoverScale, AnimatedIcon } from "@/components/ui/micro-interactions"
import { Coins, CheckCircle, Clock, Sparkles } from "lucide-react"

interface StoreBadge {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: "achievement" | "cosmetic" | "special" | "seasonal"
  price: number
  isOwned: boolean
}

interface BadgeCardProps {
  badge: StoreBadge
  userPoints: number
  onPurchase: () => void
}

export function BadgeCard({ badge, userPoints, onPurchase }: BadgeCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "achievement":
        return "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600"
      case "cosmetic":
        return "text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600"
      case "special":
        return "text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600"
      case "seasonal":
        return "text-green-600 border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-600"
      default:
        return "text-gray-600 border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "seasonal":
        return <Sparkles className="h-3 w-3" />
      case "special":
        return <Clock className="h-3 w-3" />
      default:
        return null
    }
  }

  const canAfford = userPoints >= badge.price

  return (
    <HoverScale scale={1.02}>
      <Card
        className={`relative overflow-hidden border-2 transition-all duration-300 ${
          badge.isOwned
            ? "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-600"
            : getCategoryColor(badge.category)
        } ${!badge.isOwned && canAfford ? "hover:shadow-lg" : ""}`}
      >
        {/* Limited/Special Indicators */}

        {badge.isOwned && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-green-600 text-white rounded-full p-1">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
        )}

        <CardContent className="p-6 text-center space-y-4">
          {/* Badge Icon */}
          <div
            className={`mx-auto w-16 h-16 rounded-full border-2 flex items-center justify-center ${
              badge.isOwned
                ? "border-green-300 bg-green-100 dark:bg-green-900/30 dark:border-green-600"
                : getCategoryColor(badge.category)
            }`}
          >
            <AnimatedIcon icon={badge.icon} animationType={badge.isOwned ? "bounce" : "pulse"} />
          </div>

          {/* Badge Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{badge.name}</h3>
              {getCategoryIcon(badge.category)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 min-h-[2rem]">{badge.description}</p>
          </div>

          {/* Category */}
          <div className="flex items-center justify-center gap-2">
            <Badge
              variant="outline"
              className="text-xs border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            >
              {badge.category}
            </Badge>
          </div>


          {/* Price and Purchase */}
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-1">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">{badge.price}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">points</span>
            </div>

            {badge.isOwned ? (
              <Button disabled className="w-full bg-green-600 text-white">
                <CheckCircle className="h-4 w-4 mr-2" />
                Owned
              </Button>
            ) : (
              <Button
                onClick={onPurchase}
                disabled={!canAfford}
                className={`w-full ${
                  canAfford
                    ? "bg-violet-700 hover:bg-violet-800 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {canAfford ? "Purchase" : "Insufficient Points"}
              </Button>
            )}

            {!canAfford && !badge.isOwned && (
              <div className="text-xs text-red-600 dark:text-red-400">Need {badge.price - userPoints} more points</div>
            )}
          </div>

        </CardContent>
      </Card>
    </HoverScale>
  )
}
