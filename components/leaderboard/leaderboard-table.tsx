"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  User,
  Flame,
  Star,
  Crown,
  Zap,
  Eye,
  MessageCircle,
} from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/loading-indicators";
import { createClient } from "@/lib/supabase/client";

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
  const router = useRouter();
  const supabase = createClient();

  const handleViewMyRank = async () => {
    // Check if user is logged in
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // Redirect to login page if not logged in
      router.push("/auth/login");
      return;
    }

    // TODO: Implement scroll to user's position or highlight user
    // For now, just log the user info
    console.log("User logged in:", session.user);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Community Leaderboard
            </CardTitle>
            <CardDescription>
              Top performers ranked by {sortBy.replace("-", " ")}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            className="gap-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700 hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30"
            onClick={handleViewMyRank}
          >
            <User className="h-4 w-4" />
            View My Rank
          </Button>
        </div>
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
                  {user.rank <= 3 && (
                    <div
                      className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${
                        user.rank === 1
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                          : user.rank === 2
                          ? "bg-gradient-to-r from-gray-300 to-gray-500"
                          : "bg-gradient-to-r from-amber-600 to-amber-800"
                      } flex items-center justify-center`}
                    >
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg truncate">
                      {user.username}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      Level {user.level}
                    </Badge>
                  </div>
                </div>

                {/* Total Points */}
                <div className="flex items-center gap-3 px-5 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Star className="h-4 w-4 text-purple-500" />
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-xl text-gray-900 dark:text-gray-100">
                      {user.points.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      pts
                    </span>
                  </div>
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
