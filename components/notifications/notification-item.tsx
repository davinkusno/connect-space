"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Calendar, Award, Settings, Users, Check, RotateCcw, Trash2, ExternalLink } from "lucide-react"

interface Notification {
  id: string
  type: "message" | "event" | "achievement" | "system" | "community"
  title: string
  content: string
  timestamp: string
  isRead: boolean
  community?: string
  actionUrl?: string
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onMarkAsUnread: (id: string) => void
  onDelete: (id: string) => void
  style?: React.CSSProperties
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  style,
}: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "message":
        return <MessageCircle className="h-5 w-5 text-blue-600" />
      case "event":
        return <Calendar className="h-5 w-5 text-green-600" />
      case "achievement":
        return <Award className="h-5 w-5 text-yellow-600" />
      case "system":
        return <Settings className="h-5 w-5 text-gray-600" />
      case "community":
        return <Users className="h-5 w-5 text-purple-600" />
      default:
        return <MessageCircle className="h-5 w-5 text-blue-600" />
    }
  }

  const getTypeColor = () => {
    switch (notification.type) {
      case "message":
        return "bg-blue-100 text-blue-800"
      case "event":
        return "bg-green-100 text-green-800"
      case "achievement":
        return "bg-yellow-100 text-yellow-800"
      case "system":
        return "bg-gray-100 text-gray-800"
      case "community":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const handleAction = () => {
    if (notification.actionUrl) {
      // In a real app, you would navigate to the URL
      console.log(`Navigate to: ${notification.actionUrl}`)
    }
  }

  return (
    <div
      className={`
        p-4 rounded-lg border transition-all duration-200 hover:shadow-md animate-fade-in mb-2
        ${notification.isRead ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500"}
      `}
      style={style}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{notification.title}</h4>
                {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
              </div>

              <p className="text-gray-700 text-sm mb-2 break-words">{notification.content}</p>

              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                <span className="whitespace-nowrap">{notification.timestamp}</span>
                {notification.community && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className={`text-xs ${getTypeColor()}`}>
                      {notification.community}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              {notification.actionUrl && (
                <Button variant="ghost" size="sm" onClick={handleAction} className="h-8 w-8 p-0" title="View details">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => (notification.isRead ? onMarkAsUnread(notification.id) : onMarkAsRead(notification.id))}
                className="h-8 w-8 p-0"
                title={notification.isRead ? "Mark as unread" : "Mark as read"}
              >
                {notification.isRead ? <RotateCcw className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete notification"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
