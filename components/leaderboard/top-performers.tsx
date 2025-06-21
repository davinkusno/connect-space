"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown, Medal, Award, Star, TrendingUp, Flame } from "lucide-react"
import { AnimatedCounter } from "@/components/ui/animated-counter"

interface TopPerformersProps {
  topUsers: Array<{
    id: number
    rank: number
    username: string
    avatar: string
    points: number
    weeklyActivity: number
    achievements: string[]
    streak: number
    level: number
    badge: string
    growth: number
  }>
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-8 w-8 text-yellow-500" />
    case 2:
      return <Medal className="h-8 w-8 text-gray-400" />
    case 3:
      return <Award className="h-8 w-8 text-amber-600" />
    default:
      return null
  }
}

const getRankGradient = (rank: number) => {
  switch (rank) {
    case 1:
      return "from-yellow-400 via-yellow-500 to-yellow-600"
    case 2:
      return "from-gray-300 via-gray-400 to-gray-500"
    case 3:
      return "from-amber-500 via-amber-600 to-amber-700"
    default:
      return "from-blue-500 to-purple-600"
  }
}

export function TopPerformers({ topUsers }: TopPerformersProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🏆 Top Performers</h2>
        <p className="text-muted-foreground">Celebrating our most active community champions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topUsers.map((user, index) => (
          <Card
            key={user.id}
            className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ${
              user.rank === 1 ? "ring-2 ring-yellow-400 shadow-yellow-100" : ""
            }`}
          >
            {/* Rank Badge */}
            <div
              className={`absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-r ${getRankGradient(user.rank)} flex items-center justify-center shadow-lg`}
            >
              {getRankIcon(user.rank)}
            </div>

            {/* Background Pattern */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getRankGradient(user.rank)} opacity-5`} />

            <CardContent className="p-6 text-center relative">
              {/* Avatar */}
              <div className="relative mb-4">
                <Avatar
                  className={`h-20 w-20 mx-auto ring-4 ring-white shadow-lg ${
                    user.rank === 1 ? "ring-yellow-400" : user.rank === 2 ? "ring-gray-400" : "ring-amber-600"
                  }`}
                >
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                  <AvatarFallback className="text-lg font-bold">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Level Badge */}
                <Badge
                  className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r ${getRankGradient(user.rank)} text-white border-0`}
                >
                  Level {user.level}
                </Badge>
              </div>

              {/* User Info */}
              <h3 className="text-xl font-bold mb-2">{user.username}</h3>

              {/* Points */}
              <div className="mb-4">
                <div className="text-3xl font-bold text-gradient mb-1">
                  <AnimatedCounter value={user.points} />
                </div>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{user.weeklyActivity}%</div>
                  <div className="text-xs text-muted-foreground">Activity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />+{user.growth}%
                  </div>
                  <div className="text-xs text-muted-foreground">Growth</div>
                </div>
              </div>

              {/* Streak */}
              {user.streak > 7 && (
                <div className="mb-4">
                  <Badge variant="outline" className="gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {user.streak} day streak
                  </Badge>
                </div>
              )}

              {/* Top Achievement */}
              {user.achievements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Latest Achievement</p>
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    {user.achievements[0]}
                  </Badge>
                </div>
              )}

              {/* Rank Position */}
              <div className="absolute top-2 left-2">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-r ${getRankGradient(user.rank)} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                >
                  #{user.rank}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
