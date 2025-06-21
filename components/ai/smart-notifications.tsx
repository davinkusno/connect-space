"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Sparkles, Users, Calendar, TrendingUp, X, Settings, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface SmartNotification {
  id: string
  type: "recommendation" | "trending" | "social" | "event" | "achievement"
  title: string
  message: string
  priority: "low" | "medium" | "high"
  timestamp: Date
  read: boolean
  actionable: boolean
  metadata?: any
  aiGenerated: boolean
}

interface SmartNotificationsProps {
  userId?: string
  className?: string
  maxNotifications?: number
}

export function SmartNotifications({ userId, className, maxNotifications = 10 }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    loadNotifications()
  }, [userId])

  const loadNotifications = async () => {
    setIsLoading(true)

    try {
      // Mock AI-generated notifications
      const mockNotifications: SmartNotification[] = [
        {
          id: "1",
          type: "recommendation",
          title: "New Community Match",
          message: 'Based on your interest in AI, you might like "Machine Learning Researchers" community',
          priority: "medium",
          timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          read: false,
          actionable: true,
          aiGenerated: true,
          metadata: { communityId: "ml-researchers" },
        },
        {
          id: "2",
          type: "trending",
          title: "Trending Discussion",
          message: 'The topic "Future of AI" is trending in your communities',
          priority: "low",
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
          read: false,
          actionable: true,
          aiGenerated: true,
          metadata: { topicId: "future-ai" },
        },
        {
          id: "3",
          type: "event",
          title: "Recommended Event",
          message: "AI Workshop tomorrow matches your learning goals",
          priority: "high",
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          read: false,
          actionable: true,
          aiGenerated: true,
          metadata: { eventId: "ai-workshop-2024" },
        },
        {
          id: "4",
          type: "social",
          title: "Connection Suggestion",
          message: "Sarah Chen from Tech Innovators has similar interests",
          priority: "medium",
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          read: true,
          actionable: true,
          aiGenerated: true,
          metadata: { userId: "sarah-chen" },
        },
        {
          id: "5",
          type: "achievement",
          title: "Engagement Milestone",
          message: "Your posts have received 100+ likes this month!",
          priority: "low",
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          read: true,
          actionable: false,
          aiGenerated: true,
        },
      ]

      setNotifications(mockNotifications)
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)))
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "recommendation":
        return Sparkles
      case "trending":
        return TrendingUp
      case "social":
        return Users
      case "event":
        return Calendar
      case "achievement":
        return TrendingUp
      default:
        return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-blue-500"
      default:
        return "border-l-gray-300"
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true
    if (filter === "unread") return !notif.read
    if (filter === "ai") return notif.aiGenerated
    return notif.type === filter
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Smart Notifications
            {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount}</Badge>}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-3">
          {["all", "unread", "ai", "recommendation", "social"].map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(filterType)}
              className="text-xs capitalize"
            >
              {filterType === "ai" && <Sparkles className="h-3 w-3 mr-1" />}
              {filterType}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3 p-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No notifications found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.slice(0, maxNotifications).map((notification) => {
                const IconComponent = getNotificationIcon(notification.type)

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-l-4 hover:bg-gray-50 transition-colors cursor-pointer",
                      getPriorityColor(notification.priority),
                      !notification.read && "bg-blue-50",
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-full",
                          notification.type === "recommendation" && "bg-purple-100 text-purple-600",
                          notification.type === "trending" && "bg-orange-100 text-orange-600",
                          notification.type === "social" && "bg-blue-100 text-blue-600",
                          notification.type === "event" && "bg-green-100 text-green-600",
                          notification.type === "achievement" && "bg-yellow-100 text-yellow-600",
                        )}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={cn("text-sm font-medium", !notification.read && "font-semibold")}>
                            {notification.title}
                          </h4>

                          <div className="flex items-center gap-1 ml-2">
                            {notification.aiGenerated && <Sparkles className="h-3 w-3 text-purple-500" />}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                dismissNotification(notification.id)
                              }}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {notification.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          {notification.actionable && (
                            <Button variant="outline" size="sm">
                              Action
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
