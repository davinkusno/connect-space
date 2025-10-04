"use client";

import { useState, useRef, useEffect } from "react";
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
import { Trophy, Medal, Award, Users, User, Star, Crown } from "lucide-react";
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

export function LeaderboardTable({
  data,
  isLoading,
  sortBy,
}: LeaderboardTableProps) {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [highlightedUser, setHighlightedUser] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const userRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Get current user email on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setCurrentUserEmail(session.user.email);
      }
    };
    getCurrentUser();
  }, [supabase]);

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

    // Find user in the leaderboard by email
    // For mock data, we'll use the email to match with username
    const userEmail = session.user.email;
    const searchUsername = userEmail?.split("@")[0].toLowerCase() || "";

    console.log("🔍 Searching for user:", searchUsername);
    console.log("📊 Total users in data:", data.length);
    console.log(
      "📊 Available users:",
      data.map((u) => u.username)
    );
    console.log("📊 User refs:", Object.keys(userRefs.current));

    const userInLeaderboard = data.find(
      (user) =>
        user.username.toLowerCase() === searchUsername ||
        user.username.toLowerCase().includes(searchUsername)
    );

    console.log("✅ Found user:", userInLeaderboard);

    if (userInLeaderboard) {
      console.log(
        "✅ User ref exists:",
        !!userRefs.current[userInLeaderboard.id]
      );

      if (userRefs.current[userInLeaderboard.id]) {
        // Scroll to user's position
        userRefs.current[userInLeaderboard.id]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Highlight the user
        setHighlightedUser(userInLeaderboard.id);

        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedUser(null);
        }, 3000);
      } else {
        console.log("❌ User ref not available for ID:", userInLeaderboard.id);
      }
    } else {
      console.log("❌ User not found in leaderboard");
      alert(
        `User '${searchUsername}' not found in leaderboard. Make sure you're logged in!`
      );
    }
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
          {data.map((user, index) => {
            const isCurrentUser =
              currentUserEmail &&
              user.username.toLowerCase() ===
                currentUserEmail.split("@")[0].toLowerCase();
            const isHighlighted = highlightedUser === user.id;

            return (
              <div
                key={user.id}
                ref={(el) => {
                  if (el) userRefs.current[user.id] = el;
                }}
                className={`group relative p-4 rounded-xl border transition-all duration-500 ${
                  isHighlighted
                    ? "bg-gradient-to-r from-purple-100 to-blue-100 border-purple-400 dark:from-purple-900/40 dark:to-blue-900/40 dark:border-purple-500 ring-4 ring-purple-300 dark:ring-purple-700"
                    : isCurrentUser
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700"
                    : user.rank === 1
                    ? "bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 border-yellow-300 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-yellow-900/30 dark:border-yellow-600"
                    : user.rank === 2
                    ? "bg-gradient-to-r from-slate-50 via-gray-50 to-slate-100 border-slate-300 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-slate-900/30 dark:border-slate-600"
                    : user.rank === 3
                    ? "bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 border-orange-300 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-orange-900/30 dark:border-orange-600"
                    : "bg-white/50 dark:bg-gray-800/50"
                }`}
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
                    <h3 className="font-semibold text-lg truncate">
                      {user.username}
                    </h3>
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
              </div>
            );
          })}
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
