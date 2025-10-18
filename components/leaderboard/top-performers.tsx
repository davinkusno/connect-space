"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Medal, Award } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface TopPerformersProps {
  topUsers: Array<{
    id: number;
    rank: number;
    username: string;
    avatar: string;
    points: number;
    weeklyActivity: number;
    achievements: string[];
    streak: number;
    level: number;
    badge: string;
    growth: number;
  }>;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-white" />;
    case 2:
      return <Medal className="h-6 w-6 text-white" />;
    case 3:
      return <Award className="h-6 w-6 text-white" />;
    default:
      return null;
  }
};

const getRankGradient = (rank: number) => {
  switch (rank) {
    case 1:
      return "from-yellow-400 via-amber-500 to-yellow-600"; // Gold
    case 2:
      return "from-slate-300 via-gray-400 to-slate-500"; // Silver
    case 3:
      return "from-orange-400 via-amber-600 to-orange-700"; // Bronze
    default:
      return "from-blue-500 to-purple-600";
  }
};

const getRankBorderColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "border-yellow-400 dark:border-yellow-600";
    case 2:
      return "border-slate-400 dark:border-slate-600";
    case 3:
      return "border-orange-400 dark:border-orange-600";
    default:
      return "border-gray-200 dark:border-gray-700";
  }
};

export function TopPerformers({ topUsers }: TopPerformersProps) {
  return (
    <div className="relative">
      {/* Background Gradient Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100 dark:from-yellow-900/20 dark:via-amber-900/10 dark:to-orange-900/20 rounded-3xl blur-3xl opacity-60"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse delay-700"></div>

      <div className="relative space-y-8 p-8 rounded-3xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 dark:from-amber-400 dark:via-yellow-400 dark:to-orange-400 bg-clip-text text-transparent mb-3">
            Top Performers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topUsers.map((user, index) => (
            <Card
              key={user.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl bg-white dark:bg-gray-800 border-2 ${getRankBorderColor(
                user.rank
              )}`}
            >
              {/* Rank Badge */}
              <div
                className={`absolute top-3 right-3 w-12 h-12 rounded-full flex items-center justify-center ${
                  user.rank === 1
                    ? "bg-yellow-400"
                    : user.rank === 2
                    ? "bg-slate-400"
                    : "bg-orange-400"
                }`}
              >
                {getRankIcon(user.rank)}
              </div>

              <CardContent className="p-6 text-center">
                {/* Avatar */}
                <div className="relative mb-5 mt-2">
                  <Avatar
                    className={`h-24 w-24 mx-auto ring-4 ${
                      user.rank === 1
                        ? "ring-yellow-400"
                        : user.rank === 2
                        ? "ring-slate-400"
                        : "ring-orange-400"
                    }`}
                  >
                    <AvatarImage
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.username}
                    />
                    <AvatarFallback className="text-lg font-bold">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* User Info */}
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                  {user.username}
                </h3>

                {/* Points */}
                <div className="mb-4">
                  <div
                    className={`text-4xl font-extrabold mb-1 ${
                      user.rank === 1
                        ? "text-yellow-600 dark:text-yellow-400"
                        : user.rank === 2
                        ? "text-slate-600 dark:text-slate-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    <AnimatedCounter end={user.points} />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Points
                  </p>
                </div>

                {/* Rank Position */}
                <div className="absolute top-3 left-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base ${
                      user.rank === 1
                        ? "bg-yellow-500"
                        : user.rank === 2
                        ? "bg-slate-500"
                        : "bg-orange-500"
                    }`}
                  >
                    #{user.rank}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
