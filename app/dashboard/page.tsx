"use client"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar"
import { NotificationModal } from "@/components/notifications/notification-modal"
import { WishlistSummary } from "@/components/wishlist/wishlist-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RecommendationPanel } from "@/components/ai/recommendation-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CalendarIcon,
  Users,
  MessageCircle,
  Bell,
  TrendingUp,
  Plus,
  Search,
  Sparkles,
  Star,
  Activity,
  Home,
  Compass,
  ChevronRight,
  BarChart3,
  Calendar,
  BookOpen,
  Award,
  Lightbulb,
  Bookmark,
} from "lucide-react"
import Link from "next/link"
import { MemberAchievements } from "@/components/community/member-achievements"
import { EnhancedChatbotWidget } from "@/components/ai/enhanced-chatbot-widget"
import { DailySummaryWidget } from "@/components/daily-summary/daily-summary-widget"

// Import new enhanced components
import { EnhancedStatsWidget } from "@/components/dashboard/enhanced-stats-widget"
import { EnhancedQuickActions } from "@/components/dashboard/enhanced-quick-actions"
import { EnhancedActivityFeed } from "@/components/dashboard/enhanced-activity-feed"
import { EnhancedCommunityCard } from "@/components/dashboard/enhanced-community-card"
import { EnhancedEventCard } from "@/components/dashboard/enhanced-event-card"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home")

  const userCommunities = [
    {
      id: 1,
      name: "Tech Innovators",
      role: "Member",
      members: 1247,
      unreadMessages: 5,
      lastActivity: "2 hours ago",
      image: "/placeholder.svg?height=60&width=60",
      gradient: "from-blue-500 to-purple-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      description:
        "A community for technology enthusiasts and innovators to share ideas and collaborate on cutting-edge projects.",
      engagement: 87,
      upcomingEvents: 3,
      newMembers: 12,
    },
    {
      id: 2,
      name: "Outdoor Adventures",
      role: "Moderator",
      members: 892,
      unreadMessages: 12,
      lastActivity: "1 hour ago",
      image: "/placeholder.svg?height=60&width=60",
      gradient: "from-green-500 to-teal-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      description:
        "Join fellow outdoor enthusiasts for hiking, camping, and adventure activities in beautiful locations.",
      engagement: 92,
      upcomingEvents: 5,
      newMembers: 8,
    },
    {
      id: 3,
      name: "Creative Writers",
      role: "Admin",
      members: 634,
      unreadMessages: 3,
      lastActivity: "30 minutes ago",
      image: "/placeholder.svg?height=60&width=60",
      gradient: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-700",
      description: "A supportive community for writers of all levels to share their work and improve their craft.",
      engagement: 78,
      upcomingEvents: 2,
      newMembers: 5,
    },
  ]

  const upcomingEvents = [
    {
      id: 1,
      title: "AI & Machine Learning Workshop",
      community: "Tech Innovators",
      date: "2024-01-15",
      time: "6:00 PM",
      location: "WeWork SoHo",
      status: "attending" as const,
      attendees: 45,
      capacity: 60,
      type: "Workshop",
      priority: "high" as const,
      image: "/placeholder.svg?height=120&width=200",
      description: "Learn the fundamentals of AI and machine learning with hands-on exercises and real-world examples.",
      organizer: {
        name: "Sarah Chen",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      tags: ["AI", "Machine Learning", "Workshop", "Beginner-Friendly"],
    },
    {
      id: 2,
      title: "Hiking at Bear Mountain",
      community: "Outdoor Adventures",
      date: "2024-01-18",
      time: "8:00 AM",
      location: "Bear Mountain State Park",
      status: "maybe" as const,
      attendees: 23,
      capacity: 30,
      type: "Outdoor",
      priority: "medium" as const,
      image: "/placeholder.svg?height=120&width=200",
      description: "Join us for a scenic hike through Bear Mountain with beautiful views and great company.",
      organizer: {
        name: "Mike Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      tags: ["Hiking", "Nature", "Exercise", "Photography"],
    },
    {
      id: 3,
      title: "Poetry Reading Night",
      community: "Creative Writers",
      date: "2024-01-20",
      time: "7:30 PM",
      location: "Local Coffee Shop",
      status: "attending" as const,
      attendees: 18,
      capacity: 25,
      type: "Cultural",
      priority: "low" as const,
      image: "/placeholder.svg?height=120&width=200",
      description: "Share your poetry and listen to works from fellow writers in a cozy, supportive environment.",
      organizer: {
        name: "Emma Davis",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      tags: ["Poetry", "Reading", "Community", "Art"],
    },
  ]

  const recentActivity = [
    {
      id: "1",
      type: "message" as const,
      content: "Sarah Chen replied to your post about AI trends",
      timestamp: "5 min ago",
      community: "Tech Innovators",
      icon: MessageCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      avatar: "/placeholder.svg?height=32&width=32",
      user: "Sarah Chen",
      metadata: {
        likes: 12,
        comments: 3,
        shares: 2,
      },
    },
    {
      id: "2",
      type: "event" as const,
      content: "New event: Startup Pitch Night has been scheduled",
      timestamp: "1 hour ago",
      community: "Tech Innovators",
      icon: CalendarIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
      avatar: "/placeholder.svg?height=32&width=32",
      user: "Event System",
      metadata: {
        likes: 8,
        comments: 1,
      },
    },
    {
      id: "3",
      type: "member" as const,
      content: "3 new members joined Outdoor Adventures",
      timestamp: "2 hours ago",
      community: "Outdoor Adventures",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      metadata: {
        likes: 5,
      },
    },
    {
      id: "4",
      type: "achievement" as const,
      content: "You earned the 'Active Member' badge in Creative Writers",
      timestamp: "3 hours ago",
      community: "Creative Writers",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      metadata: {
        likes: 15,
        comments: 4,
      },
    },
  ]

  const stats = [
    {
      title: "Communities",
      value: "3",
      change: "+1 this month",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      gradient: "from-blue-500 to-blue-600",
      trend: "up" as const,
      progress: 75,
      target: "5 communities",
    },
    {
      title: "Events Attended",
      value: "12",
      change: "+4 this month",
      icon: CalendarIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
      gradient: "from-green-500 to-green-600",
      trend: "up" as const,
      progress: 60,
      target: "20 events",
    },
    {
      title: "Connections",
      value: "89",
      change: "+12 this month",
      icon: MessageCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      gradient: "from-purple-500 to-purple-600",
      trend: "up" as const,
      progress: 89,
      target: "100 connections",
    },
    {
      title: "Engagement",
      value: "94%",
      change: "+8% this month",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      gradient: "from-orange-500 to-orange-600",
      trend: "up" as const,
      progress: 94,
      target: "95% engagement",
    },
  ]

  const quickActions = [
    {
      title: "Create Event",
      description: "Organize a new community event",
      icon: Plus,
      href: "/events/create",
      color: "bg-blue-500 hover:bg-blue-600",
      badge: "Popular",
      priority: "high" as const,
    },
    {
      title: "Join Community",
      description: "Discover and join new communities",
      icon: Users,
      href: "/discover",
      color: "bg-green-500 hover:bg-green-600",
      priority: "medium" as const,
    },
    {
      title: "Browse Events",
      description: "Find interesting events to attend",
      icon: Search,
      href: "/events",
      color: "bg-purple-500 hover:bg-purple-600",
      priority: "medium" as const,
    },
    {
      title: "View Messages",
      description: "Check your community messages",
      icon: MessageCircle,
      href: "/messages",
      color: "bg-pink-500 hover:bg-pink-600",
      badge: "3 new",
      priority: "high" as const,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Compact Header with Inline Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Good morning, John! 👋</h1>
            <p className="text-sm text-gray-600">Here's your activity overview</p>
          </div>
          <div className="mt-2 sm:mt-0 flex space-x-2">
            <Link href="/events/create">
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Refined Tabbed Interface with Enhanced Widgets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Communities</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Home Tab - Enhanced with new widgets */}
          <TabsContent value="home" className="space-y-6">
            {/* Enhanced Stats Widget */}
            <EnhancedStatsWidget stats={stats} />

            {/* Second Row: Enhanced Quick Actions + Daily Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <EnhancedQuickActions actions={quickActions} />
              </div>
              <div className="lg:col-span-1">
                <DailySummaryWidget userId="current-user" compact={true} className="h-full" />
              </div>
            </div>

            {/* Third Row: Enhanced Activity Feed */}
            <EnhancedActivityFeed activities={recentActivity} showFilters={false} maxHeight="h-64" />

            {/* Fourth Row: Upcoming Events Preview */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <CalendarIcon className="h-4 w-4 text-green-600" />
                    </div>
                    Upcoming Events
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveTab("events")}>
                    View All
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <EnhancedEventCard key={event.id} event={event} variant="compact" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab - Enhanced event cards with calendar */}
          <TabsContent value="events" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Enhanced Calendar */}
              <Card className="border-0 shadow-sm lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <CalendarIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <EnhancedCalendar />
                </CardContent>
              </Card>

              {/* Enhanced Event List */}
              <div className="lg:col-span-3 space-y-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <div className="p-1.5 bg-green-100 rounded-lg">
                            <BookOpen className="h-4 w-4 text-green-600" />
                          </div>
                          Upcoming Events
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-500 mt-1">
                          Your scheduled events for the next 30 days
                        </CardDescription>
                      </div>
                      <Link href="/events">
                        <Button variant="outline" size="sm">
                          Browse All Events
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {upcomingEvents.map((event) => (
                        <EnhancedEventCard key={event.id} event={event} variant="detailed" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Wishlist Section */}
            <WishlistSummary />
          </TabsContent>

          {/* Communities Tab - Enhanced community cards */}
          <TabsContent value="communities" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      My Communities
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      Communities you've joined and your role in each
                    </CardDescription>
                  </div>
                  <Link href="/discover">
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Join More
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {userCommunities.map((community) => (
                    <EnhancedCommunityCard key={community.id} community={community} variant="detailed" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Member Achievements */}
            <MemberAchievements />
          </TabsContent>

          {/* Activity Tab - Enhanced activity feed */}
          <TabsContent value="activity" className="space-y-6">
            <EnhancedActivityFeed
              activities={[...recentActivity, ...recentActivity]}
              showFilters={true}
              maxHeight="h-96"
            />

            {/* Achievements and Saved Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-100 rounded-lg">
                      <Award className="h-4 w-4 text-yellow-600" />
                    </div>
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((index) => (
                      <Card key={index} className="border border-gray-100 hover:shadow-sm transition-all duration-300">
                        <CardContent className="p-3 text-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Star className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xs font-medium">Achievement {index}</h3>
                          <p className="text-xs text-gray-500">Earned 3 days ago</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Bookmark className="h-4 w-4 text-blue-600" />
                    </div>
                    Saved Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3].map((index) => (
                      <Card key={index} className="border border-gray-100 hover:shadow-sm transition-all duration-300">
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium">Saved Item {index}</h3>
                              <p className="text-xs text-gray-500">Saved 2 days ago</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab - AI-powered insights and recommendations */}
          <TabsContent value="insights" className="space-y-6">
            {/* Daily Summary - Full Version */}
            <DailySummaryWidget userId="current-user" compact={false} className="mb-6" />

            {/* AI Recommendations */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                  </div>
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <RecommendationPanel
                  userId="current-user"
                  userProfile={{
                    interests: [
                      { topic: "Technology", strength: 0.9, category: "Tech" },
                      { topic: "Startups", strength: 0.8, category: "Business" },
                      { topic: "AI", strength: 0.7, category: "Tech" },
                    ],
                    joinedCommunities: ["Tech Innovators", "Startup Founders"],
                    location: "New York",
                    goals: ["Learn new skills", "Network with peers", "Find mentors"],
                  }}
                  maxRecommendations={6}
                  showExplanations={true}
                />
              </CardContent>
            </Card>

            {/* Engagement Analytics */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                  </div>
                  Engagement Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Participation Rate", value: "87%", change: "+5%", trend: "up" },
                    { title: "Response Time", value: "2.4h", change: "-10%", trend: "down" },
                    { title: "Content Quality", value: "High", change: "Stable", trend: "stable" },
                  ].map((metric, index) => (
                    <Card key={index} className="border border-gray-100 hover:shadow-sm transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-700">{metric.title}</h3>
                          <div
                            className={`text-xs px-2 py-1 rounded-full ${
                              metric.trend === "up"
                                ? "bg-green-100 text-green-700"
                                : metric.trend === "down"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {metric.change}
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                        <p className="text-xs text-gray-500 mt-1">vs last month</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <EnhancedChatbotWidget context="dashboard" size="normal" />
    </div>
  )
}
