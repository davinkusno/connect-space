"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatItem {
  title: string
  value: string
  change: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  gradient: string
  trend?: "up" | "down" | "stable"
  progress?: number
  target?: string
}

interface EnhancedStatsWidgetProps {
  stats: StatItem[]
  className?: string
}

export function EnhancedStatsWidget({ stats, className }: EnhancedStatsWidgetProps) {
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-600" />
      default:
        return <Minus className="h-3 w-3 text-gray-600" />
    }
  }

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case "up":
        return "text-green-600 bg-green-50"
      case "down":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group bg-white"
        >
          {/* Background Gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-300`}
          />

          {/* Accent Border */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />

          <CardContent className="p-4 relative">
            {/* Header with Icon and Trend */}
            <div className="flex items-center justify-between mb-3">
              <div
                className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getTrendColor(stat.trend)}`}>
                {getTrendIcon(stat.trend)}
                <span className="text-xs font-medium">{stat.change}</span>
              </div>
            </div>

            {/* Main Value */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600 leading-tight">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</p>
            </div>

            {/* Progress Bar (if applicable) */}
            {stat.progress !== undefined && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-gray-700 font-medium">{stat.progress}%</span>
                </div>
                <Progress
                  value={stat.progress}
                  className="h-1.5"
                  style={{
                    background: `linear-gradient(to right, ${stat.gradient.split(" ")[1]}, ${stat.gradient.split(" ")[3]})`,
                  }}
                />
                {stat.target && <p className="text-xs text-gray-500">Target: {stat.target}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
