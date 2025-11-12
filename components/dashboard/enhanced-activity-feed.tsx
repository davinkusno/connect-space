"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Filter, ChevronRight, MessageCircle, Heart, Share, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  type: "message" | "event" | "member" | "achievement" | "like" | "comment"
  content: string
  timestamp: string
  community: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  avatar?: string
  user?: string
  metadata?: {
    likes?: number
    comments?: number
    shares?: number
  }
}

interface EnhancedActivityFeedProps {
  activities: ActivityItem[]
  className?: string
  showFilters?: boolean
  maxHeight?: string
}

export function EnhancedActivityFeed({
  activities,
  className,
  showFilters = true,
  maxHeight = "h-80",
}: EnhancedActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState("all")
  const [showAll, setShowAll] = useState(false)

  const filterOptions = [
    { value: "all", label: "All Activity" },
    { value: "message", label: "Messages" },
    { value: "event", label: "Events" },
    { value: "achievement", label: "Achievements" },
  ]

  const filteredActivities = activities.filter((activity) => activeFilter === "all" || activity.type === activeFilter)

  const displayedActivities = showAll ? filteredActivities : filteredActivities.slice(0, 6)

  const getTimeAgo = (timestamp: string) => {
    // Simple time ago calculation
    return timestamp
  }

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
            Recent Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            {showFilters && (
              <Button variant="ghost" size="sm" className="text-xs h-7">
                <Filter className="h-3 w-3 mr-1" />
                Filter
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-xs h-7">
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-8">
              {filterOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value} className="text-xs py-1">
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <ScrollArea className={maxHeight}>
          <div className="space-y-3">
            {displayedActivities.map((activity) => (
              <div
                key={activity.id}
                className="group flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-100"
              >
                {/* Activity Icon */}
                <div className="relative flex-shrink-0">
                  <div className={`p-2 rounded-lg ${activity.bgColor} shadow-sm`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  {activity.avatar && (
                    <Avatar className="absolute -bottom-1 -right-1 h-5 w-5 border-2 border-white">
                      <AvatarImage src={activity.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{activity.user?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-900 leading-relaxed group-hover:text-gray-700 transition-colors">
                      {activity.content}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs px-2 py-0 h-5 border-gray-200 bg-white">
                        {activity.community}
                      </Badge>
                      <span className="text-xs text-gray-500">{getTimeAgo(activity.timestamp)}</span>
                    </div>

                    {activity.metadata && (
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        {activity.metadata.likes && (
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {activity.metadata.likes}
                          </span>
                        )}
                        {activity.metadata.comments && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {activity.metadata.comments}
                          </span>
                        )}
                        {activity.metadata.shares && (
                          <span className="flex items-center gap-1">
                            <Share className="h-3 w-3" />
                            {activity.metadata.shares}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {filteredActivities.length > 6 && !showAll && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              Show {filteredActivities.length - 6} more activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
