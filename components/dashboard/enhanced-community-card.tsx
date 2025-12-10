"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Bell, Calendar, ExternalLink, MoreHorizontal, Settings, Users } from "lucide-react"
import Link from "next/link"

interface CommunityData {
  id: number
  name: string
  role: string
  members: number
  lastActivity: string
  image: string
  gradient: string
  bgColor: string
  textColor: string
  description?: string
  engagement?: number
  upcomingEvents?: number
  newMembers?: number
}

interface EnhancedCommunityCardProps {
  community: CommunityData
  variant?: "compact" | "detailed"
  className?: string
}

export function EnhancedCommunityCard({ community, variant = "detailed", className }: EnhancedCommunityCardProps) {
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-700 border-red-200"
      case "moderator":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "member":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  if (variant === "compact") {
    return (
      <Link href={`/community/${community.id}`}>
        <Card
          className={cn(
            "border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 group cursor-pointer h-full",
            className,
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex-shrink-0">
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${community.gradient} opacity-20 rounded-full blur-sm`}
                />
                <Avatar className="h-12 w-12 relative z-10 ring-2 ring-white shadow-sm">
                  <AvatarImage src={community.image || "/placeholder.svg"} />
                  <AvatarFallback className={`bg-gradient-to-r ${community.gradient} text-white font-bold`}>
                    {community.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {community.name}
                  </h3>
                  <Badge variant="outline" className={`text-xs ${getRoleColor(community.role)}`}>
                    {community.role}
                  </Badge>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {community.members.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">{community.lastActivity}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Card
      className={cn(
        "border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 group h-full",
        className,
      )}
    >
      {/* Header with gradient background */}
      <div className={`relative h-20 bg-gradient-to-r ${community.gradient} rounded-t-lg overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-3 right-3 flex space-x-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20">
            <Bell className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 -mt-6 relative">
        {/* Avatar and basic info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
              <AvatarImage src={community.image || "/placeholder.svg"} />
              <AvatarFallback className={`bg-gradient-to-r ${community.gradient} text-white font-bold text-lg`}>
                {community.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {community.name}
              </h3>
              <Badge variant="outline" className={`text-xs ${getRoleColor(community.role)} mt-1`}>
                {community.role}
              </Badge>
            </div>
          </div>

        </div>

        {/* Description */}
        {community.description && <p className="text-sm text-gray-600 mb-4 leading-relaxed">{community.description}</p>}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Members</span>
              <Users className="h-3 w-3 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-gray-900">{community.members.toLocaleString()}</p>
            {community.newMembers && <p className="text-xs text-green-600">+{community.newMembers} this week</p>}
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Events</span>
              <Calendar className="h-3 w-3 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-gray-900">{community.upcomingEvents || 0}</p>
            <p className="text-xs text-gray-500">upcoming</p>
          </div>
        </div>

        {/* Engagement Progress */}
        {community.engagement !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Engagement Level</span>
              <span className="text-gray-900 font-medium">{community.engagement}%</span>
            </div>
            <Progress value={community.engagement} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link href={`/community/${community.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-3 w-3 mr-1" />
              View Community
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="px-3">
            <Settings className="h-3 w-3" />
          </Button>
        </div>

        {/* Last Activity */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">Last activity: {community.lastActivity}</p>
        </div>
      </CardContent>
    </Card>
  )
}
