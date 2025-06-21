"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Trophy, TrendingUp, Target } from "lucide-react"
import { AnimatedCounter } from "@/components/ui/animated-counter"

const stats = [
  {
    title: "Total Participants",
    value: 2847,
    change: "+12.5%",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Active This Month",
    value: 1923,
    change: "+8.2%",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Points Awarded",
    value: 45672,
    change: "+15.3%",
    icon: Trophy,
    color: "from-yellow-500 to-orange-500",
  },
  {
    title: "Achievements Unlocked",
    value: 892,
    change: "+22.1%",
    icon: Target,
    color: "from-purple-500 to-pink-500",
  },
]

export function LeaderboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={stat.value} />
                </div>
                <p className="text-xs text-green-600 font-medium">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
