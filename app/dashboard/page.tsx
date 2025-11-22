"use client";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { NotificationModal } from "@/components/notifications/notification-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Compass,
  ChevronRight,
  BarChart3,
  Calendar,
  BookOpen,
  Award,
  Bookmark,
  Clock,
  MapPin,
  Building2,
  Crown,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { EnhancedChatbotWidget } from "@/components/ai/enhanced-chatbot-widget";
import { PaginationControls } from "@/components/ui/pagination-controls";

// Import new enhanced components
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
  const [activeTab, setActiveTab] = useState("events");
  const [username, setUsername] = useState<string>("there");
  const [userPoints, setUserPoints] = useState<number>(0);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 4;
  const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [createdCommunitiesPage, setCreatedCommunitiesPage] = useState(1);
  const [joinedCommunitiesPage, setJoinedCommunitiesPage] = useState(1);
  const communitiesPerPage = 6;

  // Initialize with default saved events (all 10 events for demo)
  const [savedEvents, setSavedEvents] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  ]);
  const [savedEventsPage, setSavedEventsPage] = useState(1);
  const [savedEventsFilter, setSavedEventsFilter] = useState("soonest"); // soonest, oldest
  const savedEventsPerPage = 5;

  // Load saved events from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("savedEvents");
    if (saved) {
      try {
        const parsedSaved = JSON.parse(saved);
        setSavedEvents(parsedSaved);
      } catch (error) {
        console.error("Error loading saved events:", error);
        // Keep default values if error
      }
    } else {
      // Save default to localStorage
      localStorage.setItem(
        "savedEvents",
        JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      );
    }
  }, []);

  // Save to localStorage whenever savedEvents changes
  useEffect(() => {
    localStorage.setItem("savedEvents", JSON.stringify(savedEvents));
  }, [savedEvents]);

  // Toggle save event
  const toggleSaveEvent = (eventId: number) => {
    setSavedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

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
          .select(
            `
            id,
            name,
            description,
            logo_url,
            banner_url,
            created_at,
            member_count
          `
          )
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
          .select(
            `
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
          `
          )
          .eq("user_id", session.user.id)
          .order("joined_at", { ascending: false });

        if (!memberError && memberData) {
          // Filter out communities where user is creator (already in createdCommunities)
          const createdIds = new Set(createdData?.map((c) => c.id) || []);
          const joined = memberData
            .filter(
              (m: any) => m.communities && !createdIds.has(m.communities.id)
            )
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
          .select(
            `
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
          `
          )
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
              time: new Date(item.events.start_time).toLocaleTimeString(
                "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              ),
              location: item.events.location,
              image: item.events.image_url,
              category: item.events.category,
              community: item.events.communities?.name || "Community",
              communityId: item.events.community_id,
              communityLogo: item.events.communities?.logo_url,
              status: item.status, // 'going' or 'maybe'
              registeredAt: item.registered_at,
            }))
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
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

  // Calculate total communities count
  const totalCommunities = createdCommunities.length + joinedCommunities.length;

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
    {
      id: 6,
      title: "Yoga & Wellness Retreat",
      community: "Wellness Warriors",
      date: "2024-01-28",
      time: "9:00 AM",
      location: "Serenity Wellness Center",
      status: "saved" as const,
      attendees: 31,
      capacity: 40,
      type: "Wellness",
      priority: "medium" as const,
      image: "/placeholder.svg?height=120&width=200",
      description:
        "Rejuvenate your mind and body with a full day of yoga, meditation, and wellness activities.",
      organizer: {
        name: "Maya Patel",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      tags: ["Yoga", "Wellness", "Meditation", "Health"],
    },
    {
      id: 7,
      title: "Photography Workshop: Street Photography",
      community: "Photo Enthusiasts",
      date: "2024-02-02",
      time: "10:00 AM",
      location: "Downtown City Center",
      status: "saved" as const,
      attendees: 19,
      capacity: 25,
      type: "Workshop",
      priority: "high" as const,
      image: "/placeholder.svg?height=120&width=200",
      description:
        "Learn the art of street photography from a professional photographer with hands-on practice.",
      organizer: {
        name: "James Wilson",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      tags: ["Photography", "Workshop", "Street", "Art"],
    },
    {
      id: 8,
      title: "Cooking Class: Italian Cuisine",
      community: "Food Enthusiasts",
      date: "2024-02-05",
      time: "6:30 PM",
      location: "The Culinary Institute",
      status: "saved" as const,
      attendees: 15,
      capacity: 20,
      type: "Culinary",
      priority: "low" as const,
      image: "/placeholder.svg?height=120&width=200",
      description:
        "Master the art of Italian cooking with hands-on preparation of authentic pasta dishes.",
      organizer: {
        name: "Chef Antonio Rossi",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      tags: ["Cooking", "Italian", "Food", "Class"],
    },
    {
      id: 9,
      title: "Tech Talk: Future of Web Development",
      community: "Tech Innovators",
      date: "2024-02-08",
      time: "7:00 PM",
      location: "Tech Hub Conference Room",
      status: "saved" as const,
      attendees: 52,
      capacity: 60,
      type: "Tech Talk",
      priority: "high" as const,
      image: "/placeholder.svg?height=120&width=200",
      description:
        "Dive into the latest trends in web development including AI integration and modern frameworks.",
      organizer: {
        name: "Alex Thompson",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      tags: ["Tech", "Web Development", "AI", "Future"],
    },
    {
      id: 10,
      title: "Book Club: Monthly Discussion",
      community: "Book Lovers",
      date: "2024-02-10",
      time: "2:00 PM",
      location: "Community Library",
      status: "saved" as const,
      attendees: 28,
      capacity: 35,
      type: "Cultural",
      priority: "low" as const,
      image: "/placeholder.svg?height=120&width=200",
      description:
        "Join fellow book enthusiasts to discuss this month's featured novel and share recommendations.",
      organizer: {
        name: "Rachel Green",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      tags: ["Books", "Reading", "Discussion", "Community"],
    },
  ];

  // Get saved events list with filtering and sorting
  const filteredSavedEvents = upcomingEvents
    .filter((event) => savedEvents.includes(event.id))
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      // Sort by date
      if (savedEventsFilter === "soonest") {
        return dateA - dateB; // Ascending (nearest first)
      } else {
        return dateB - dateA; // Descending (oldest/farthest first)
      }
    });

  // Apply pagination
  const totalSavedPages = Math.ceil(
    filteredSavedEvents.length / savedEventsPerPage
  );
  const paginatedSavedEvents = filteredSavedEvents.slice(
    (savedEventsPage - 1) * savedEventsPerPage,
    savedEventsPage * savedEventsPerPage
  );

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
          <TabsList className="grid w-full grid-cols-2 mb-4">
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
          </TabsList>

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
                            <div className="relative h-36 overflow-hidden">
                              <img
                                src={event.image || "/placeholder.svg"}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />

                              {/* Status Badge */}
                              <div className="absolute top-2 left-2">
                                <Badge
                                  className={`text-xs ${
                                    event.status === "attending"
                                      ? "bg-green-500 hover:bg-green-600 text-white border-0"
                                      : event.status === "saved"
                                      ? "bg-blue-500 hover:bg-blue-600 text-white border-0"
                                      : "bg-gray-500 hover:bg-gray-600 text-white border-0"
                                  }`}
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
                                className="absolute top-2 right-2 h-7 w-7 p-0 bg-white/90 hover:bg-white rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveEvent(event.id);
                                }}
                              >
                                <Bookmark
                                  className={`h-3.5 w-3.5 ${
                                    savedEvents.includes(event.id)
                                      ? "fill-amber-500 text-amber-500"
                                      : "text-gray-600"
                                  }`}
                                />
                              </Button>
                            </div>

                            <CardContent className="p-3">
                              {/* Category Badge */}
                              <Badge
                                variant="secondary"
                                className="mb-2 text-xs"
                              >
                                {event.type}
                              </Badge>

                              {/* Title */}
                              <Link href={`/events/${event.id}`}>
                                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2 mb-2">
                                  {event.title}
                                </h3>
                              </Link>

                              {/* Description */}
                              <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                                {event.description}
                              </p>

                              {/* Event Info */}
                              <div className="space-y-1.5 mb-3">
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  <CalendarIcon className="h-3.5 w-3.5" />
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
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span className="truncate">
                                    {event.location}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  <Users className="h-3.5 w-3.5" />
                                  <span>{event.attendees} attending</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  <Award className="h-3.5 w-3.5" />
                                  <span className="truncate">
                                    {event.organizer?.name || event.community}
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`flex-1 text-xs ${
                                    savedEvents.includes(event.id)
                                      ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                      : "border-gray-300 hover:bg-gray-50"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSaveEvent(event.id);
                                  }}
                                >
                                  <Bookmark
                                    className={`h-3 w-3 mr-1 ${
                                      savedEvents.includes(event.id)
                                        ? "fill-amber-500"
                                        : ""
                                    }`}
                                  />
                                  {savedEvents.includes(event.id)
                                    ? "Saved"
                                    : "Save"}
                                </Button>
                                <Link
                                  href={`/events/${event.id}`}
                                  className="flex-1"
                                >
                                  <Button
                                    size="sm"
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
                                  >
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

                {/* Saved Events Section */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <div className="p-1.5 bg-amber-100 rounded-lg">
                            <Bookmark className="h-4 w-4 text-amber-600" />
                          </div>
                          Saved Events ({filteredSavedEvents.length})
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-500 mt-1">
                          Events you've bookmarked for later
                        </CardDescription>
                      </div>
                      <Select
                        value={savedEventsFilter}
                        onValueChange={(value) => {
                          setSavedEventsFilter(value);
                          setSavedEventsPage(1); // Reset to first page
                        }}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Sort by date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soonest">Soonest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {paginatedSavedEvents.length > 0 ? (
                      <div className="space-y-3">
                        {paginatedSavedEvents.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between gap-4 p-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
                          >
                            {/* Event Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Link href={`/events/${event.id}`}>
                                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                                    {event.title}
                                  </h4>
                                </Link>
                                <Badge
                                  variant="secondary"
                                  className="text-xs flex-shrink-0"
                                >
                                  {event.type}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
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
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-[200px]">
                                    {event.location}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Link href={`/events/${event.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300 hover:bg-gray-50"
                                >
                                  View
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => toggleSaveEvent(event.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Pagination Controls */}
                        {totalSavedPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSavedEventsPage((prev) =>
                                  Math.max(prev - 1, 1)
                                )
                              }
                              disabled={savedEventsPage === 1}
                              className="h-9"
                            >
                              <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                              Previous
                            </Button>

                            <div className="flex items-center gap-2">
                              {Array.from(
                                { length: totalSavedPages },
                                (_, i) => i + 1
                              ).map((page) => (
                                <Button
                                  key={page}
                                  variant={
                                    savedEventsPage === page
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setSavedEventsPage(page)}
                                  className={`h-9 w-9 ${
                                    savedEventsPage === page
                                      ? "bg-amber-600 hover:bg-amber-700 text-white"
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
                                setSavedEventsPage((prev) =>
                                  Math.min(prev + 1, totalSavedPages)
                                )
                              }
                              disabled={savedEventsPage === totalSavedPages}
                              className="h-9"
                            >
                              Next
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : filteredSavedEvents.length > 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Bookmark className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No events on this page
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Try a different page or filter
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Bookmark className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No saved events yet
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Save events you're interested in to view them here
                        </p>
                        <Link href="/events">
                          <Button variant="outline" size="sm">
                            <Search className="h-4 w-4 mr-2" />
                            Browse Events
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
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
                        Create a space for like-minded people to connect and
                        grow together
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
                  {isLoadingCommunities ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">
                          Loading communities...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {createdCommunities
                          .slice(
                            (createdCommunitiesPage - 1) * communitiesPerPage,
                            createdCommunitiesPage * communitiesPerPage
                          )
                          .map((community) => (
                            <Card
                              key={community.id}
                              className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow border border-purple-200 bg-purple-50/30"
                            >
                              <CardContent className="p-5">
                                {/* Community Avatar and Info */}
                                <div className="flex items-start gap-3 mb-4">
                                  <Avatar className="h-14 w-14 ring-2 ring-purple-200">
                                    <AvatarImage
                                      src={
                                        community.logo_url || "/placeholder.svg"
                                      }
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
                                    <Badge
                                      variant="secondary"
                                      className="mt-1 text-xs"
                                    >
                                      <Crown className="h-3 w-3 mr-1" />
                                      Creator
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

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <Link
                                    href={`/community/${community.id}`}
                                    className="flex-1"
                                  >
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                    >
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
                      {createdCommunities.length > communitiesPerPage && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <PaginationControls
                            currentPage={createdCommunitiesPage}
                            totalPages={Math.ceil(
                              createdCommunities.length / communitiesPerPage
                            )}
                            onPageChange={setCreatedCommunitiesPage}
                            itemsPerPage={communitiesPerPage}
                            totalItems={createdCommunities.length}
                          />
                        </div>
                      )}
                    </>
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
                      <p className="text-sm text-gray-500">
                        Loading communities...
                      </p>
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
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {joinedCommunities
                        .slice(
                          (joinedCommunitiesPage - 1) * communitiesPerPage,
                          joinedCommunitiesPage * communitiesPerPage
                        )
                        .map((community) => (
                          <Card
                            key={community.id}
                            className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
                          >
                            <CardContent className="p-5">
                              {/* Community Avatar and Info */}
                              <div className="flex items-start gap-3 mb-4">
                                <Avatar className="h-14 w-14 ring-2 ring-blue-100">
                                  <AvatarImage
                                    src={
                                      community.logo_url || "/placeholder.svg"
                                    }
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
                                  <Badge
                                    variant="secondary"
                                    className="mt-1 text-xs"
                                  >
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
                    {joinedCommunities.length > communitiesPerPage && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <PaginationControls
                          currentPage={joinedCommunitiesPage}
                          totalPages={Math.ceil(
                            joinedCommunities.length / communitiesPerPage
                          )}
                          onPageChange={setJoinedCommunitiesPage}
                          itemsPerPage={communitiesPerPage}
                          totalItems={joinedCommunities.length}
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <EnhancedChatbotWidget context="dashboard" size="normal" />
    </div>
  );
}
