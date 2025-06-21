"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Bell,
  MessageCircle,
  Calendar,
  UserPlus,
  Heart,
  HighlighterIcon as Mention,
  Settings,
  Check,
  CheckCheck,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatNotification {
  id: string
  type: "message" | "mention" | "reaction" | "join" | "event" | "direct_message"
  title: string
  content: string
  timestamp: Date
  isRead: boolean
  avatar?: string
  chatId?: string
  chatType?: "direct" | "group"
  actionable?: boolean
}

interface ChatNotificationsProps {
  onNotificationClick?: (notification: ChatNotification) => void
  className?: string
}

export function ChatNotifications({ onNotificationClick, className }: ChatNotificationsProps) {
  const [notifications, setNotifications] = useState<ChatNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Mock notifications
    const mockNotifications: ChatNotification[] = [
      {
        id: "notif-1",
        type: "mention",
        title: "Sarah Chen mentioned you",
        content: "Hey @you, what do you think about the new React features?",
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        isRead: false,
        avatar: "/placeholder.svg?height=32&width=32",
        chatId: "group-1",
        chatType: "group",
        actionable: true,
      },
      {
        id: "notif-2",
        type: "direct_message",
        title: "New message from Alex Rodriguez",
        content: "Let's schedule that coffee meeting for tomorrow",
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        isRead: false,
        avatar: "/placeholder.svg?height=32&width=32",
        chatId: "dm-2",
        chatType: "direct",
        actionable: true,
      },
      {
        id: "notif-3",
        type: "reaction",
        title: "Mike Johnson reacted to your message",
        content: "Reacted with 👍 to: 'Great idea for the hackathon!'",
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        isRead: false,
        avatar: "/placeholder.svg?height=32&width=32",
        chatId: "group-1",
        chatType: "group",
      },
      {
        id: "notif-4",
        type: "join",
        title: "New member joined Tech Innovators",
        content: "Emma Thompson joined the community",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        isRead: true,
        avatar: "/placeholder.svg?height=32&width=32",
        chatId: "group-1",
        chatType: "group",
      },
      {
        id: "notif-5",
        type: "event",
        title: "Event reminder",
        content: "AI & Machine Learning Workshop starts in 2 hours",
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        isRead: true,
        chatId: "group-1",
        chatType: "group",
      },
    ]

    setNotifications(mockNotifications)

    // Simulate real-time notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newNotification: ChatNotification = {
          id: `notif-${Date.now()}`,
          type: "message",
          title: "New message in Tech Innovators",
          content: "Someone shared a new resource in the chat",
          timestamp: new Date(),
          isRead: false,
          avatar: "/placeholder.svg?height=32&width=32",
          chatId: "group-1",
          chatType: "group",
          actionable: true,
        }
        setNotifications((prev) => [newNotification, ...prev])
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = (notificationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const removeNotification = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  const handleNotificationClick = (notification: ChatNotification) => {
    markAsRead(notification.id)
    onNotificationClick?.(notification)
    setIsOpen(false)
  }

  const getNotificationIcon = (type: ChatNotification["type"]) => {
    switch (type) {
      case "mention":
        return <Mention className="h-4 w-4 text-violet-600" />
      case "direct_message":
        return <MessageCircle className="h-4 w-4 text-blue-600" />
      case "reaction":
        return <Heart className="h-4 w-4 text-red-500" />
      case "join":
        return <UserPlus className="h-4 w-4 text-green-600" />
      case "event":
        return <Calendar className="h-4 w-4 text-orange-600" />
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("relative text-gray-600 hover:text-violet-700", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs min-w-[18px] h-[18px] flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-violet-600 hover:text-violet-700"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">
                You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "group p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                          !notification.isRead && "bg-violet-50 border-l-2 border-violet-500",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            {notification.avatar ? (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={notification.avatar || "/placeholder.svg"} />
                                <AvatarFallback>{notification.title[0]}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                {getNotificationIcon(notification.type)}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1">{getNotificationIcon(notification.type)}</div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900 mb-1">{notification.title}</p>
                                <p className="text-sm text-gray-600 line-clamp-2">{notification.content}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatTimestamp(notification.timestamp)}</p>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => markAsRead(notification.id, e)}
                                    className="h-6 w-6 p-0 text-violet-600 hover:text-violet-700"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => removeNotification(notification.id, e)}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {notification.actionable && !notification.isRead && (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  className="bg-violet-700 hover:bg-violet-800 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleNotificationClick(notification)
                                  }}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => markAsRead(notification.id, e)}
                                  className="border-gray-200"
                                >
                                  Dismiss
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
