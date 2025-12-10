"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

interface QuickAction {
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
  badge?: string
  priority?: "high" | "medium" | "low"
}

interface EnhancedQuickActionsProps {
  actions: QuickAction[]
  className?: string
}

export function EnhancedQuickActions({ actions, className }: EnhancedQuickActionsProps) {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="p-1.5 bg-yellow-100 rounded-lg">
            <Zap className="h-4 w-4 text-yellow-600" />
          </div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-2.5 ${action.color} rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                    >
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    {action.priority && (
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(action.priority)}`}>
                        {action.priority}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>

                    {action.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
                    )}

                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
