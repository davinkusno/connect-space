"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Calendar, Filter, User } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { TopPerformers } from "@/components/leaderboard/top-performers";
import { PageTransition } from "@/components/ui/page-transition";
import { StaggerContainer } from "@/components/ui/stagger-container";

// Mock data for demonstration
const generateMockUsers = (count: number) => {
  const usernames = [
    "TechGuru2024",
    "CreativeMinds",
    "CodeMaster",
    "DesignPro",
    "DataWizard",
    "StartupFounder",
    "InnovatorX",
    "DigitalNomad",
    "AIEnthusiast",
    "WebDev",
    "UXDesigner",
    "ProductManager",
    "GrowthHacker",
    "ContentCreator",
    "Entrepreneur",
    "Developer",
    "Designer",
    "Marketer",
    "Analyst",
    "Strategist",
  ];

  const achievements = [
    "Community Builder",
    "Content Creator",
    "Event Organizer",
    "Helpful Member",
    "Rising Star",
    "Mentor",
    "Innovator",
    "Collaborator",
    "Leader",
    "Pioneer",
  ];

  const badges = ["gold", "silver", "bronze", "none"];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    rank: i + 1,
    username:
      usernames[i % usernames.length] + (i > 19 ? Math.floor(i / 20) : ""),
    avatar: `/placeholder.svg?height=40&width=40`,
    points: Math.floor(Math.random() * 10000) + 1000 - i * 100,
    weeklyActivity: Math.floor(Math.random() * 40) + 60 - i * 2,
    monthlyPosts: Math.floor(Math.random() * 50) + 10 - Math.floor(i / 2),
    communitiesJoined: Math.floor(Math.random() * 20) + 5,
    eventsAttended: Math.floor(Math.random() * 15) + 2,
    achievements: achievements.slice(0, Math.floor(Math.random() * 3) + 1),
    streak: Math.floor(Math.random() * 30) + 1,
    level: Math.floor(Math.random() * 20) + 1,
    badge: i < 3 ? badges[i] : badges[3],
    growth: Math.floor(Math.random() * 50) + 5,
  }));
};

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("total-points");
  const [timeRange, setTimeRange] = useState("current-month");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    const timer = setTimeout(() => {
      const mockUsers = generateMockUsers(50);

      // Sort users based on selected criteria
      const sortedUsers = mockUsers
        .sort((a, b) => {
          switch (sortBy) {
            case "total-points":
              return b.points - a.points;
            case "weekly-activity":
              return b.weeklyActivity - a.weeklyActivity;
            case "monthly-posts":
              return b.monthlyPosts - a.monthlyPosts;
            case "events-attended":
              return b.eventsAttended - a.eventsAttended;
            case "communities-joined":
              return b.communitiesJoined - a.communitiesJoined;
            case "current-streak":
              return b.streak - a.streak;
            default:
              return b.points - a.points;
          }
        })
        .map((user, index) => ({ ...user, rank: index + 1 }));

      setUsers(sortedUsers);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [sortBy, timeRange, category]);

  const topUsers = users.slice(0, 3);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <StaggerContainer>
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Monthly Leaderboard
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Celebrating our most active members. Compete, collaborate, and
                climb the ranks!
              </p>
            </div>

            {/* Controls */}
            {/* <div className="mt-8 mb-8">
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total-points">
                            Total Points
                          </SelectItem>
                          <SelectItem value="weekly-activity">
                            Weekly Activity
                          </SelectItem>
                          <SelectItem value="monthly-posts">
                            Monthly Posts
                          </SelectItem>
                          <SelectItem value="events-attended">
                            Events Attended
                          </SelectItem>
                          <SelectItem value="communities-joined">
                            Communities Joined
                          </SelectItem>
                          <SelectItem value="current-streak">
                            Current Streak
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[180px]">
                          <Calendar className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Time range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current-month">
                            Current Month
                          </SelectItem>
                          <SelectItem value="last-month">Last Month</SelectItem>
                          <SelectItem value="current-week">
                            Current Week
                          </SelectItem>
                          <SelectItem value="all-time">All Time</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button variant="outline" className="gap-2">
                      <User className="h-4 w-4" />
                      View My Rank
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div> */}

            {/* Main Content */}
            <div className="mt-16 space-y-12">
              {/* Top Performers */}
              {!isLoading && topUsers.length > 0 && (
                <TopPerformers topUsers={topUsers} />
              )}

              {/* Leaderboard Table */}
              <LeaderboardTable
                data={users}
                isLoading={isLoading}
                sortBy={sortBy}
              />
            </div>
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
}
