"use client"

import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { Users, CheckCircle, Clock, TrendingUp } from "lucide-react"

export function SuperadminStats() {
  // Mock statistics data
  const stats = {
    totalCommunities: 42,
    pendingRequests: 7,
    approvedRequests: 35,
    rejectedRequests: 12,
    totalUsers: 1247,
    activeUsers: 876,
    growthRate: 23,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AnimatedCard variant="3d" className="p-8 text-center group">
        <div className="absolute inset-0 gradient-primary opacity-10 rounded-lg"></div>
        <div className="relative z-10">
          <Users className="h-12 w-12 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-sm text-gray-600 mb-2">Total Communities</p>
          <AnimatedCounter
            from={0}
            to={stats.totalCommunities}
            duration={1.5}
            className="text-4xl font-bold text-gradient"
          />
        </div>
      </AnimatedCard>

      <AnimatedCard variant="3d" className="p-8 text-center group">
        <div className="absolute inset-0 gradient-secondary opacity-10 rounded-lg"></div>
        <div className="relative z-10">
          <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-sm text-gray-600 mb-2">Pending Requests</p>
          <AnimatedCounter
            from={0}
            to={stats.pendingRequests}
            duration={1.5}
            className="text-4xl font-bold text-gradient"
          />
        </div>
      </AnimatedCard>

      <AnimatedCard variant="3d" className="p-8 text-center group">
        <div className="absolute inset-0 gradient-tertiary opacity-10 rounded-lg"></div>
        <div className="relative z-10">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-sm text-gray-600 mb-2">Approved</p>
          <AnimatedCounter
            from={0}
            to={stats.approvedRequests}
            duration={1.5}
            className="text-4xl font-bold text-gradient"
          />
        </div>
      </AnimatedCard>

      <AnimatedCard variant="3d" className="p-8 text-center group">
        <div className="absolute inset-0 gradient-quaternary opacity-10 rounded-lg"></div>
        <div className="relative z-10">
          <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-sm text-gray-600 mb-2">Growth Rate</p>
          <p className="text-4xl font-bold text-gradient">+{stats.growthRate}%</p>
        </div>
      </AnimatedCard>
    </div>
  )
}
