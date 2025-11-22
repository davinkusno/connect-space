"use client";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { NotificationModal } from "@/components/notifications/notification-modal";
import { WishlistSummary } from "@/components/wishlist/wishlist-summary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RecommendationPanel } from "@/components/ai/recommendation-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabaseBrowser, getClientSession } from "@/lib/supabase/client";
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
  Home,
  Compass,
  ChevronRight,
  BarChart3,
  Calendar,
  BookOpen,
  Award,
  Lightbulb,
  Bookmark,
  Clock,
  MapPin,
  Building2,
  Crown,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { EnhancedChatbotWidget } from "@/components/ai/enhanced-chatbot-widget";
import { DailySummaryWidget } from "@/components/daily-summary/daily-summary-widget";

// Import new enhanced components
import { EnhancedStatsWidget } from "@/components/dashboard/enhanced-stats-widget";
import { EnhancedQuickActions } from "@/components/dashboard/enhanced-quick-actions";
import { EnhancedActivityFeed } from "@/components/dashboard/enhanced-activity-feed";
import { EnhancedEventCard } from "@/components/dashboard/enhanced-event-card";

interface Community {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  created_at?: string;
  role?: "admin" | "moderator" | "member";
  member_count?: number;
  isCreator?: boolean;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [username, setUsername] = useState<string>("there");
  const [userPoints, setUserPoints] = useState<number>(0);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 4;
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);
<<<<<<< Updated upstream
  const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
=======
  const [adminCommunities, setAdminCommunities] = useState<any[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
>>>>>>> Stashed changes

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: userData, error } = await supabase
            .from("users")
            .select("username, full_name, points")
            .eq("id", user.id)
            .single();

          if (!error && userData) {
            setUsername(userData.username || userData.full_name || "there");
            setUserPoints(userData.points || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchCommunities = async () => {
      setIsLoadingCommunities(true);
      try {
        const session = await getClientSession();
        if (!session?.user) {
          setIsLoadingCommunities(false);
          return;
        }

        const supabase = getSupabaseBrowser();

        // Fetch communities created by user
        const { data: createdData, error: createdError } = await supabase
          .from("communities")
          .select(`
            id,
            name,
            description,
            logo_url,
            banner_url,
            created_at,
            member_count
          `)
          .eq("creator_id", session.user.id)
          .order("created_at", { ascending: false });

        if (!createdError && createdData) {
          setCreatedCommunities(
            createdData.map((comm) => ({ ...comm, isCreator: true }))
          );
        }

        // Fetch communities where user is a member (but not creator)
        const { data: memberData, error: memberError } = await supabase
          .from("community_members")
          .select(`
            community_id,
            role,
            communities (
              id,
              name,
              description,
              logo_url,
              banner_url,
              created_at,
              member_count
            )
          `)
          .eq("user_id", session.user.id)
          .order("joined_at", { ascending: false });

        if (!memberError && memberData) {
          // Filter out communities where user is creator (already in createdCommunities)
          const createdIds = new Set(createdData?.map((c) => c.id) || []);
          const joined = memberData
            .filter((m: any) => m.communities && !createdIds.has(m.communities.id))
            .map((m: any) => ({
              ...m.communities,
              role: m.role,
            }));
          setJoinedCommunities(joined);
        }
      } catch (error) {
        console.error("Error fetching communities:", error);
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    // Fetch communities when dashboard loads
    fetchCommunities();
  }, []);

  useEffect(() => {
    const fetchJoinedEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const session = await getClientSession();
        if (!session?.user) {
          setIsLoadingEvents(false);
          return;
        }

        const supabase = getSupabaseBrowser();

        // Fetch events where user has RSVP'd (going or maybe)
        const { data: attendeeData, error: attendeeError } = await supabase
          .from("event_attendees")
          .select(`
            event_id,
            status,
            registered_at,
            events (
              id,
              title,
              description,
              start_time,
              end_time,
              location,
              image_url,
              category,
              community_id,
              communities (
                id,
                name,
                logo_url
              )
            )
          `)
          .eq("user_id", session.user.id)
          .in("status", ["going", "maybe"])
          .order("registered_at", { ascending: false });

        if (!attendeeError && attendeeData) {
          // Filter to only upcoming events
          const now = new Date();
          const upcomingEvents = attendeeData
            .filter((item: any) => {
              if (!item.events || !item.events.start_time) return false;
              const eventStart = new Date(item.events.start_time);
              return eventStart >= now;
            })
            .map((item: any) => ({
              id: item.events.id,
              title: item.events.title,
              description: item.events.description,
              date: item.events.start_time,
              time: new Date(item.events.start_time).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              location: item.events.location,
              image: item.events.image_url,
              category: item.events.category,
              community: item.events.communities?.name || "Community",
              communityId: item.events.community_id,
              communityLogo: item.events.communities?.logo_url,
              status: item.status, // 'going' or 'maybe'
              registeredAt: item.registered_at,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5); // Limit to 5 most recent

          setJoinedEvents(upcomingEvents);
        }
      } catch (error) {
        console.error("Error fetching joined events:", error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    if (activeTab === "home" || activeTab === "events") {
      fetchJoinedEvents();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchUserBadges = async () => {
      if (activeTab !== "achievements") return;

      setIsLoadingBadges(true);
      try {
        const response = await fetch("/api/user-badges");
        if (response.ok) {
          const data = await response.json();
          setUserBadges(data || []);
        }
      } catch (error) {
        console.error("Error fetching user badges:", error);
      } finally {
        setIsLoadingBadges(false);
      }
    };

    fetchUserBadges();
  }, [activeTab]);

<<<<<<< Updated upstream
  // Calculate total communities count
  const totalCommunities = createdCommunities.length + joinedCommunities.length;
=======
  // Fetch communities where user is admin
  useEffect(() => {
    const fetchAdminCommunities = async () => {
      setIsLoadingCommunities(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoadingCommunities(false);
          return;
        }

        // Get communities where user is creator
        let { data: creatorCommunities } = await supabase
          .from("communities")
          .select("id, name, logo_url, banner_url, description, created_at")
          .eq("creator_id", user.id);

        // Get communities where user is admin
        const { data: adminMemberships } = await supabase
          .from("community_members")
          .select("community_id, communities(id, name, logo_url, banner_url, description, created_at)")
          .eq("user_id", user.id)
          .eq("role", "admin");

        const communities: any[] = [];

        // Add creator communities
        if (creatorCommunities) {
          for (const comm of creatorCommunities) {
            // Get member count
            const { count: memberCount } = await supabase
              .from("community_members")
              .select("*", { count: "exact", head: true })
              .eq("community_id", comm.id);

            // Get event count
            const { count: eventCount } = await supabase
              .from("events")
              .select("*", { count: "exact", head: true })
              .eq("community_id", comm.id);

            communities.push({
              id: comm.id,
              name: comm.name,
              image: comm.logo_url || "/placeholder.svg?height=60&width=60",
              members: memberCount || 0,
              upcomingEvents: eventCount || 0,
              description: comm.description || "",
              role: "Admin",
            });
          }
        }

        // Add admin communities (avoid duplicates)
        if (adminMemberships) {
          for (const membership of adminMemberships) {
            const comm = membership.communities;
            if (comm && !communities.find(c => c.id === comm.id)) {
              // Get member count
              const { count: memberCount } = await supabase
                .from("community_members")
                .select("*", { count: "exact", head: true })
                .eq("community_id", comm.id);

              // Get event count
              const { count: eventCount } = await supabase
                .from("events")
                .select("*", { count: "exact", head: true })
                .eq("community_id", comm.id);

              communities.push({
                id: comm.id,
                name: comm.name,
                image: comm.logo_url || "/placeholder.svg?height=60&width=60",
                members: memberCount || 0,
                upcomingEvents: eventCount || 0,
                description: comm.description || "",
                role: "Admin",
              });
            }
          }
        }

        setAdminCommunities(communities);
      } catch (error) {
        console.error("Error fetching admin communities:", error);
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    if (activeTab === "communities") {
      fetchAdminCommunities();
    }
  }, [activeTab]);

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
      description:
        "A supportive community for writers of all levels to share their work and improve their craft.",
      engagement: 78,
      upcomingEvents: 2,
      newMembers: 5,
    },
  ];
>>>>>>> Stashed changes

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
      description:
        "Learn the fundamentals of AI and machine learning with hands-on exercises and real-world examples.",
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
      status: "saved" as const,
      attendees: 23,
      capacity: 30,
      type: "Outdoor",
      priority: "medium" as const,
      image: "/placeholder.svg?height=120&width=200",
      description:
        "Join us for a scenic hike through Bear Mountain with beautiful views and great company.",
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
      description:
        "Share your poetry and listen to works from fellow writers in a cozy, supportive environment.",
      organizer: {
        name: "Emma Davis",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      tags: ["Poetry", "Reading", "Community", "Art"],
    },
    {
      id: 4,
      title: "Startup Networking Mixer",
      community: "Tech Innovators",
      date: "2024-01-22",
      time: "6:00 PM",
      location: "Innovation Hub Downtown",
      status: "saved" as const,
      attendees: 67,
      capacity: 80,
      type: "Networking",
      priority: "high" as const,
      image: "/placeholder.svg?height=120&width=200",
      description:
        "Connect with fellow entrepreneurs, investors, and innovators in the startup ecosystem.",
      organizer: {
        name: "David Park",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      tags: ["Startup", "Networking", "Business", "Innovation"],
    },
    {
      id: 5,
      title: "Digital Art Exhibition",
      community: "Creative Writers",
      date: "2024-01-25",
      time: "5:00 PM",
      location: "Modern Art Gallery",
      status: "attending" as const,
      attendees: 42,
      capacity: 50,
      type: "Art",
      priority: "medium" as const,
      image: "/placeholder.svg?height=120&width=200",
      description:
        "Explore stunning digital artworks from local and international artists in this exclusive exhibition.",
      organizer: {
        name: "Lisa Martinez",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      tags: ["Art", "Digital", "Exhibition", "Creative"],
    },
  ];

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
  ];

  const stats = [
    {
      title: "Communities",
      value: totalCommunities.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      gradient: "from-blue-500 to-blue-600",
      trend: "up" as const,
    },
    {
      title: "Created",
      value: createdCommunities.length.toString(),
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      gradient: "from-purple-500 to-purple-600",
      trend: "up" as const,
    },
    {
      title: "Points",
      value: userPoints.toString(),
      icon: Star,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      gradient: "from-amber-500 to-amber-600",
      trend: "up" as const,
    },
  ];

  const quickActions = [
    {
      title: "Create Community",
      description: "Start your own community",
      icon: Plus,
      href: "/create-community",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Join Community",
      description: "Discover and join new communities",
      icon: Users,
      href: "/communities",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Browse Events",
      description: "Find interesting events to attend",
      icon: Search,
      href: "/events",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Saved Events",
      description: "View your saved events and wishlist",
      icon: Bookmark,
      href: "/wishlist",
      color: "bg-amber-500 hover:bg-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Compact Header with Inline Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {isLoadingUser ? (
                <span className="inline-block animate-pulse bg-gray-200 rounded h-8 w-64"></span>
              ) : (
                <>Good morning, {username}! 👋</>
              )}
            </h1>
            <p className="text-sm text-gray-600">
              Here's your activity overview
            </p>
          </div>
          {/* Removed Create Event button - only for community admins */}
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
            <TabsTrigger
              value="communities"
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Communities</span>
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Achievements</span>
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
                <DailySummaryWidget
                  userId="current-user"
                  compact={true}
                  className="h-full"
                />
              </div>
            </div>

            {/* Third Row: Recent Communities + Upcoming Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Communities Preview */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      My Communities
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setActiveTab("communities")}
                    >
                      View All
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isLoadingCommunities ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    </div>
                  ) : totalCommunities === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Start by creating or joining a community
                      </p>
                      <Link href="/create-community">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                          <Plus className="h-4 w-4 mr-1" />
                          Create Community
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Show created communities first */}
                      {createdCommunities.slice(0, 2).map((community) => (
                        <Link
                          key={community.id}
                          href={`/community/${community.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                        >
                          <Avatar className="h-10 w-10 ring-2 ring-purple-200">
                            <AvatarImage src={community.logo_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-600 text-white text-sm">
                              {community.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                {community.name}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Creator
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {community.member_count || 0} members
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </Link>
                      ))}
                      {/* Show joined communities */}
                      {joinedCommunities.slice(0, 2 - createdCommunities.slice(0, 2).length).map((community) => (
                        <Link
                          key={community.id}
                          href={`/community/${community.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                        >
                          <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                            <AvatarImage src={community.logo_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                              {community.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                {community.name}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {community.role === "admin" ? (
                                  <>
                                    <Crown className="h-3 w-3 mr-1" />
                                    Admin
                                  </>
                                ) : community.role === "moderator" ? (
                                  "Mod"
                                ) : (
                                  "Member"
                                )}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {community.member_count || 0} members
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </Link>
                      ))}
                      {totalCommunities > 3 && (
                        <Button
                          variant="ghost"
                          className="w-full text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          onClick={() => setActiveTab("communities")}
                        >
                          View {totalCommunities - 2} more communities
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Events I'm Attending Preview */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 rounded-lg">
                        <CalendarIcon className="h-4 w-4 text-green-600" />
                      </div>
                      Events I'm Attending
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setActiveTab("events")}
                    >
                      View All
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isLoadingEvents ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    </div>
                  ) : joinedEvents.length > 0 ? (
                    <div className="space-y-3">
                      {joinedEvents.slice(0, 3).map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all group"
                        >
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CalendarIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-1">
                                {event.title}
                              </h4>
                              {event.status === "maybe" && (
                                <Badge variant="secondary" className="text-xs">
                                  Maybe
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <CalendarIcon className="h-3 w-3" />
                              <span>
                                {new Date(event.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {event.communityLogo && (
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={event.communityLogo} />
                                  <AvatarFallback className="text-xs">
                                    {event.community.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {event.community}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors mt-1" />
                        </Link>
                      ))}
                      {joinedEvents.length > 3 && (
                        <Button
                          variant="ghost"
                          className="w-full text-sm text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => setActiveTab("events")}
                        >
                          View {joinedEvents.length - 3} more events
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CalendarIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        No events you're attending yet
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Join events from your communities to see them here
                      </p>
                      <Link href="/events">
                        <Button size="sm" variant="outline">
                          <Compass className="h-4 w-4 mr-1" />
                          Discover Events
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Fourth Row: Enhanced Activity Feed */}
            <EnhancedActivityFeed
              activities={recentActivity}
              showFilters={false}
              maxHeight="h-64"
            />
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {upcomingEvents
                        .slice(
                          (currentPage - 1) * eventsPerPage,
                          currentPage * eventsPerPage
                        )
                        .map((event) => (
                          <Card
                            key={event.id}
                            className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
                          >
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={event.image || "/placeholder.svg"}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />

                              {/* Status Badge */}
                              <div className="absolute top-3 left-3">
                                <Badge
                                  className={
                                    event.status === "attending"
                                      ? "bg-green-500 hover:bg-green-600 text-white border-0"
                                      : event.status === "saved"
                                      ? "bg-blue-500 hover:bg-blue-600 text-white border-0"
                                      : "bg-gray-500 hover:bg-gray-600 text-white border-0"
                                  }
                                >
                                  {event.status === "attending"
                                    ? "Attending"
                                    : event.status === "saved"
                                    ? "Saved"
                                    : "Not Going"}
                                </Badge>
                              </div>

                              {/* Save Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-3 right-3 h-8 w-8 p-0 bg-white/90 hover:bg-white rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Bookmark className="h-4 w-4 text-gray-600" />
                              </Button>
                            </div>

                            <CardContent className="p-4">
                              {/* Category Badge */}
                              <Badge variant="secondary" className="mb-3">
                                {event.type}
                              </Badge>

                              {/* Title */}
                              <Link href={`/events/${event.id}`}>
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2 mb-2">
                                  {event.title}
                                </h3>
                              </Link>

                              {/* Description */}
                              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                {event.description}
                              </p>

                              {/* Event Info */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>
                                    {new Date(event.date).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                      }
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="h-4 w-4" />
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  <span className="truncate">
                                    {event.location}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Users className="h-4 w-4" />
                                  <span>{event.attendees} attending</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Award className="h-4 w-4" />
                                  <span className="truncate">
                                    {event.organizer?.name || event.community}
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  className="flex-1 border-gray-300 hover:bg-gray-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <Bookmark className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Link
                                  href={`/events/${event.id}`}
                                  className="flex-1"
                                >
                                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                    View Event
                                  </Button>
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {upcomingEvents.length > eventsPerPage && (
                      <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="h-9"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                          Previous
                        </Button>

                        <div className="flex items-center gap-2">
                          {Array.from(
                            {
                              length: Math.ceil(
                                upcomingEvents.length / eventsPerPage
                              ),
                            },
                            (_, i) => i + 1
                          ).map((page) => (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={`h-9 w-9 ${
                                currentPage === page
                                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                                  : ""
                              }`}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(
                                prev + 1,
                                Math.ceil(upcomingEvents.length / eventsPerPage)
                              )
                            )
                          }
                          disabled={
                            currentPage ===
                            Math.ceil(upcomingEvents.length / eventsPerPage)
                          }
                          className="h-9"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Saved Events Section */}
            <WishlistSummary />
          </TabsContent>

          {/* Communities Tab - Enhanced community cards with Created and Joined sections */}
          <TabsContent value="communities" className="space-y-6">
            {/* Create Community CTA */}
            <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Start Your Own Community
                      </h3>
                      <p className="text-sm text-gray-600">
                        Create a space for like-minded people to connect and grow together
                      </p>
                    </div>
                  </div>
                  <Link href="/create-community">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Community
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Communities Created Section */}
            {createdCommunities.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <Crown className="h-4 w-4 text-purple-600" />
                      </div>
                        Communities I Created ({createdCommunities.length})
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                        Communities you created and manage
                    </CardDescription>
                  </div>
                    <Link href="/create-community">
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                        Create Another
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
<<<<<<< Updated upstream
                  {isLoadingCommunities ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading communities...</p>
                      </div>
                    </div>
                  ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {createdCommunities.map((community) => (
                    <Card
                      key={community.id}
                          className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow border border-purple-200 bg-purple-50/30"
                    >
                      <CardContent className="p-5">
                        {/* Community Avatar and Info */}
                        <div className="flex items-start gap-3 mb-4">
                              <Avatar className="h-14 w-14 ring-2 ring-purple-200">
                            <AvatarImage
                                  src={community.logo_url || "/placeholder.svg"}
                            />
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold">
                              {community.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <Link href={`/community/${community.id}`}>
                              <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                                {community.name}
                              </h3>
                            </Link>
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Creator
                                </Badge>
=======
                {isLoadingCommunities ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm text-gray-500">Loading communities...</p>
                    </div>
                  </div>
                ) : adminCommunities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No communities yet
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      You don't have any communities where you're an admin.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {adminCommunities.map((community) => (
                      <Card
                        key={community.id}
                        className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
                      >
                        <CardContent className="p-5">
                          {/* Community Avatar and Info */}
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar className="h-14 w-14 ring-2 ring-purple-100">
                              <AvatarImage
                                src={community.image || "/placeholder.svg"}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold">
                                {community.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <Link href="/community-admin">
                                <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                                  {community.name}
                                </h3>
                              </Link>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {community.role}
                              </Badge>
                            </div>
>>>>>>> Stashed changes
                          </div>

<<<<<<< Updated upstream
                            {/* Description */}
                            {community.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                {community.description}
                              </p>
                            )}

                        {/* Stats */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>
                                  {community.member_count || 0} members
                            </span>
                          </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Link
                                href={`/community/${community.id}`}
                                className="flex-1"
                              >
                                <Button variant="outline" className="w-full">
                                  View
                                </Button>
                              </Link>
                              <Link
                                href={`/community/${community.id}/manage`}
                                className="flex-1"
                              >
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                  Manage
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Communities Joined Section */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <UserPlus className="h-4 w-4 text-blue-600" />
                      </div>
                      My Communities ({joinedCommunities.length})
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      Communities you're part of
                    </CardDescription>
                  </div>
                  <Link href="/communities">
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Join More
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isLoadingCommunities ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm text-gray-500">Loading communities...</p>
                    </div>
                  </div>
                ) : joinedCommunities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No communities yet
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Join communities to connect with like-minded people
                    </p>
                    <Link href="/communities">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Compass className="h-4 w-4 mr-2" />
                        Discover Communities
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {joinedCommunities.map((community) => (
                      <Card
                        key={community.id}
                        className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
                      >
                        <CardContent className="p-5">
                          {/* Community Avatar and Info */}
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar className="h-14 w-14 ring-2 ring-blue-100">
                              <AvatarImage
                                src={community.logo_url || "/placeholder.svg"}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                                {community.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <Link href={`/community/${community.id}`}>
                                <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                                  {community.name}
                                </h3>
                              </Link>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {community.role === "admin" && (
                                  <Crown className="h-3 w-3 mr-1" />
                                )}
                                {community.role === "admin"
                                  ? "Admin"
                                  : community.role === "moderator"
                                  ? "Moderator"
                                  : "Member"}
                              </Badge>
                            </div>
                          </div>

                          {/* Description */}
                          {community.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                              {community.description}
                            </p>
                          )}

                          {/* Stats */}
                          <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                            <span>
                                {community.member_count || 0} members
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Link
                          href={`/community/${community.id}`}
                          className="block"
                        >
                          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                            View Community
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
=======
                          {/* Stats */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>
                                {community.members.toLocaleString()} members
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CalendarIcon className="h-4 w-4" />
                              <span>
                                {community.upcomingEvents || 0} upcoming events
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Link
                            href="/community-admin"
                            className="block"
                          >
                            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                              Manage Community
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
>>>>>>> Stashed changes
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab - Badges purchased by user */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="p-1.5 bg-yellow-100 rounded-lg">
                        <Award className="h-4 w-4 text-yellow-600" />
                      </div>
                      My Badges
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      Badges you've earned and purchased
                    </CardDescription>
                  </div>
                  <Link href="/store">
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Get More Badges
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isLoadingBadges ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm text-gray-500">Loading badges...</p>
                    </div>
                  </div>
                ) : userBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No badges yet
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Visit the store to get your first badge!
                    </p>
                    <Link href="/store">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Star className="h-4 w-4 mr-2" />
                        Browse Badges
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {userBadges.map((userBadge) => (
                      <Card
                        key={userBadge.id}
                        className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200"
                      >
                        <CardContent className="p-4 text-center">
                          {/* Badge Image */}
                          <div className="relative mb-3">
                            {userBadge.badge?.image_url ? (
                              <img
                                src={userBadge.badge.image_url}
                                alt={userBadge.badge.name}
                                className="w-20 h-20 mx-auto object-contain group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Star className="h-10 w-10 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Badge Info */}
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">
                            {userBadge.badge?.name || "Badge"}
                          </h3>

                          {/* Category Badge */}
                          {userBadge.badge?.category && (
                            <Badge variant="secondary" className="text-xs mb-2">
                              {userBadge.badge.category}
                            </Badge>
                          )}

                          {/* Purchased Date */}
                          <p className="text-xs text-gray-500">
                            Earned{" "}
                            {new Date(
                              userBadge.purchased_at
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab - AI-powered insights and recommendations */}
          <TabsContent value="insights" className="space-y-6">
            {/* Daily Summary - Full Version */}
            <DailySummaryWidget
              userId="current-user"
              compact={false}
              className="mb-6"
            />

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
                      {
                        topic: "Education",
                        strength: 0.9,
                        category: "Education",
                      },
                      {
                        topic: "Sports",
                        strength: 0.8,
                        category: "Sports",
                      },
                      { topic: "Art", strength: 0.7, category: "Art" },
                    ],
                    joinedCommunities: ["Tech Innovators", "Startup Founders"],
                    location: "New York",
                    goals: [
                      "Learn new skills",
                      "Network with peers",
                      "Find mentors",
                    ],
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
                    {
                      title: "Participation Rate",
                      value: "87%",
                      change: "+5%",
                      trend: "up",
                    },
                    {
                      title: "Response Time",
                      value: "2.4h",
                      change: "-10%",
                      trend: "down",
                    },
                    {
                      title: "Content Quality",
                      value: "High",
                      change: "Stable",
                      trend: "stable",
                    },
                  ].map((metric, index) => (
                    <Card
                      key={index}
                      className="border border-gray-100 hover:shadow-sm transition-all duration-300"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-700">
                            {metric.title}
                          </h3>
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
                        <p className="text-2xl font-bold text-gray-900">
                          {metric.value}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          vs last month
                        </p>
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
  );
}
