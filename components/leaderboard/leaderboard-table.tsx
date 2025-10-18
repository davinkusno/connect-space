"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  Flame,
  Star,
  Crown,
  Zap,
  Eye,
  MessageCircle,
} from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/loading-indicators";

interface LeaderboardUser {
  id: number;
  rank: number;
  username: string;
  avatar: string;
  points: number;
  weeklyActivity: number;
  monthlyPosts: number;
  communitiesJoined: number;
  eventsAttended: number;
  achievements: string[];
  streak: number;
  level: number;
  badge: string;
  growth: number;
}

interface LeaderboardTableProps {
  data: LeaderboardUser[];
  isLoading: boolean;
  sortBy: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return (
        <span className="text-sm font-semibold text-muted-foreground">
          #{rank}
        </span>
      );
  }
};

const getBadgeColor = (badge: string) => {
  switch (badge) {
    case "gold":
      return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    case "silver":
      return "bg-gradient-to-r from-gray-300 to-gray-500";
    case "bronze":
      return "bg-gradient-to-r from-amber-600 to-amber-800";
    default:
      return "bg-gradient-to-r from-blue-500 to-purple-600";
  }
};

const getActivityColor = (activity: number) => {
  if (activity >= 90) return "text-green-600";
  if (activity >= 70) return "text-yellow-600";
  if (activity >= 50) return "text-orange-600";
  return "text-red-600";
};

export function LeaderboardTable({
  data,
  isLoading,
  sortBy,
}: LeaderboardTableProps) {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Community Leaderboard
          </CardTitle>
          <CardDescription>
            Top performers ranked by {sortBy.replace("-", " ")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-lg border"
              >
                <LoadingSkeleton className="h-8 w-8 rounded-full" />
                <LoadingSkeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <LoadingSkeleton className="h-4 w-32" />
                  <LoadingSkeleton className="h-3 w-24" />
                </div>
                <LoadingSkeleton className="h-6 w-16" />
                <LoadingSkeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Community Leaderboard
        </CardTitle>
        <CardDescription>
          Top performers ranked by {sortBy.replace("-", " ")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((user, index) => (
            <div
              key={user.id}
              className={`group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
                user.rank <= 3
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20"
                  : "bg-white/50 hover:bg-white/80 dark:bg-gray-800/50 dark:hover:bg-gray-800/80"
              }`}
              onClick={() =>
                setSelectedUser(selectedUser === user.id ? null : user.id)
              }
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-sm">
                  {getRankIcon(user.rank)}
                </div>

                {/* Avatar & Badge */}
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                    <AvatarImage
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.username}
                    />
                    <AvatarFallback>
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {user.badge !== "none" && (
                    <div
                      className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${getBadgeColor(
                        user.badge
                      )} flex items-center justify-center`}
                    >
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">
                      {user.username}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      Level {user.level}
                    </Badge>
                    {user.streak > 7 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {user.streak} day streak
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {user.points.toLocaleString()} points
                    </span>
                    <span
                      className={`flex items-center gap-1 ${getActivityColor(
                        user.weeklyActivity
                      )}`}
                    >
                      <Zap className="h-3 w-3" />
                      {user.weeklyActivity}% active
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />+
                      {user.growth}%
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{user.monthlyPosts}</div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{user.eventsAttended}</div>
                    <div className="text-xs text-muted-foreground">Events</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">
                      {user.communitiesJoined}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Communities
                    </div>
                  </div>
                </div>

              {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <MessageCircle className="h-3 w-3" />
                    Message
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedUser === user.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4 animate-fade-in">
                  {/* Activity Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Weekly Activity</span>
                      <span className={getActivityColor(user.weeklyActivity)}>
                        {user.weeklyActivity}%
                      </span>
                    </div>
                    <Progress value={user.weeklyActivity} className="h-2" />
                  </div>

                  {/* Achievements */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Recent Achievements</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.achievements.map((achievement, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs gap-1"
                        >
                          <Award className="h-3 w-3" />
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="font-semibold text-lg">
                        {user.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Points
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="font-semibold text-lg">
                        {user.monthlyPosts}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Monthly Posts
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="font-semibold text-lg">
                        {user.eventsAttended}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Events Attended
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="font-semibold text-lg">
                        {user.communitiesJoined}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Communities
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-6">
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            Load More Users
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
