"use client"

import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Activity, CheckCircle, XCircle, UserPlus, Settings, AlertTriangle } from "lucide-react"

export function RecentActivities() {
  // Mock recent activities data
  const recentActivities = [
    {
      id: "log-001",
      action: "community_request_approved",
      description: "Approved community creation request: Tech Enthusiasts Network",
      performedBy: {
        id: "admin-001",
        name: "Admin User",
        role: "superadmin",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      timestamp: "2025-06-09T10:30:00Z",
    },
    {
      id: "log-002",
      action: "community_request_rejected",
      description: "Rejected community creation request: Gaming Legends",
      performedBy: {
        id: "admin-002",
        name: "Moderator User",
        role: "admin",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      timestamp: "2025-06-09T09:15:00Z",
    },
    {
      id: "log-005",
      action: "community_request_submitted",
      description: "New community creation request submitted: Photography Masters",
      performedBy: {
        id: "user-007",
        name: "James Wilson",
        role: "user",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      timestamp: "2025-06-08T11:20:00Z",
    },
    {
      id: "log-010",
      action: "security_alert",
      description: "Multiple failed login attempts detected",
      performedBy: {
        id: "system",
        name: "System",
        role: "system",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      timestamp: "2025-06-06T22:15:00Z",
    },
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getActionIcon = (action: string) => {
    if (action.includes("approved")) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (action.includes("rejected")) {
      return <XCircle className="h-4 w-4 text-red-500" />
    } else if (action.includes("created") || action.includes("submitted")) {
      return <UserPlus className="h-4 w-4 text-blue-500" />
    } else if (action.includes("updated") || action.includes("settings")) {
      return <Settings className="h-4 w-4 text-purple-500" />
    } else if (action.includes("alert")) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    } else {
      return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <AnimatedCard variant="glass" className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-purple-600" />
        Recent Activities
      </h3>
      <div className="space-y-6">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 group">
            <div className="p-2 rounded-full bg-gray-100 group-hover:bg-purple-100 transition-colors">
              {getActionIcon(activity.action)}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={activity.performedBy.avatar || "/placeholder.svg"}
                    alt={activity.performedBy.name}
                  />
                  <AvatarFallback>{activity.performedBy.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-xs text-gray-500">{activity.performedBy.name}</p>
                <span className="text-xs text-gray-400">•</span>
                <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <AnimatedButton variant="glass" size="sm" className="w-full">
          View All Activities
        </AnimatedButton>
      </div>
    </AnimatedCard>
  )
}
