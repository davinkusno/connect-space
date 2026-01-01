"use client";
import { Chatbot } from "@/components/ai/chatbot";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { FloatingElements } from "@/components/ui/floating-elements";
import { PageTransition } from "@/components/ui/page-transition";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isSameDay } from "date-fns";
import {
  Award,
  BarChart3,
  Bookmark,
  BookOpen,
  Building2,
  Calendar,
  CalendarIcon,
  ChevronRight,
  Clock,
  Compass,
  Crown,
  ExternalLink,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Shield,
  Star,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// Import new enhanced components

interface Community {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  created_at?: string;
  role?: "admin" | "moderator" | "member";
  status?: "pending" | "approved" | "rejected" | "banned" | null;
  member_count?: number;
  members?: number;
  upcomingEvents?: number;
  isCreator?: boolean;
  isAdmin?: boolean; // For co-admins who were appointed
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "events"
  );
  const [username, setUsername] = useState<string>("there");
  const [userPoints, setUserPoints] = useState<number>(0);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 4;
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);
  const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedSavedEvent, setSelectedSavedEvent] = useState<any | null>(
    null
  );
  const [createdCommunitiesPage, setCreatedCommunitiesPage] = useState(1);
  const [joinedCommunitiesPage, setJoinedCommunitiesPage] = useState(1);
  const [dayEventsPage, setDayEventsPage] = useState(1);
  const communitiesPerPage = 3;
  const dayEventsPerPage = 4;

  // Community creation permission state
  const [canCreateCommunity, setCanCreateCommunity] = useState(true);
  const [createPermissionData, setCreatePermissionData] = useState<any>(null);
  const [showPointsDialog, setShowPointsDialog] = useState(false);

  // Saved events from database
  const [savedEventsData, setSavedEventsData] = useState<any[]>([]);
  const [isLoadingSavedEvents, setIsLoadingSavedEvents] = useState(true);
  const [savedEventsPage, setSavedEventsPage] = useState(1);
  const [savedEventsFilter, setSavedEventsFilter] = useState("saved-date-desc"); // saved-date-asc, saved-date-desc, event-date-asc, event-date-desc
  const [savedEventsTimeFilter, setSavedEventsTimeFilter] = useState("all"); // all, today, this-week, this-month, upcoming
  const savedEventsPerPage = 5;

  // Fetch saved events from database
  useEffect(() => {
    console.log("[Dashboard] useEffect triggered, activeTab:", activeTab);

    if (activeTab !== "events") {
      console.log("[Dashboard] Not events tab, skipping saved events fetch");
      return;
    }

    const fetchSavedEvents = async () => {
      console.log("[Dashboard] fetchSavedEvents called");
      setIsLoadingSavedEvents(true);
      try {
        // Use API route to avoid RLS issues
        console.log("[Dashboard] Fetching saved events from API...");
        console.log("[Dashboard] API URL: /api/events/saved");

        const response = await fetch("/api/events/saved", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for authentication
        });

        console.log("[Dashboard] API Response status:", response.status);
        console.log("[Dashboard] API Response ok:", response.ok);

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          console.error(
            "[Dashboard] Error fetching saved events - Status:",
            response.status
          );
          console.error("[Dashboard] Error data:", errorData);
          setSavedEventsData([]);
          setIsLoadingSavedEvents(false);
          return;
        }

        const data = await response.json();
        console.log(
          "[Dashboard] Received saved events from API:",
          data.events?.length || 0
        );
        console.log("[Dashboard] Full API response:", data);

        if (data.events && data.events.length > 0) {
          console.log("[Dashboard] First saved event:", data.events[0]);
          console.log("[Dashboard] All saved events:", data.events);
        } else {
          console.log("[Dashboard] No events in response or empty array");
        }

        // Process saved events to parse location and extract community name
        const processedEvents = (data.events || []).map((event: any) => {
          // Parse location if it's JSON
          let locationDisplay = event.location || "Location TBD";
          if (event.location && typeof event.location === "string") {
            try {
              const locData = JSON.parse(event.location);
              if (event.is_online && locData.meetingLink) {
                locationDisplay = locData.meetingLink;
              } else if (locData.address) {
                locationDisplay = `${locData.address}${
                  locData.city ? `, ${locData.city}` : ""
                }`;
              } else if (locData.city) {
                locationDisplay = locData.city;
              }
            } catch {
              // If not JSON, use as-is
              locationDisplay = event.location;
            }
          } else if (event.location && typeof event.location === "object") {
            const locData = event.location;
            if (event.is_online && locData.meetingLink) {
              locationDisplay = locData.meetingLink;
            } else if (locData.address) {
              locationDisplay = `${locData.address}${
                locData.city ? `, ${locData.city}` : ""
              }`;
            } else if (locData.city) {
              locationDisplay = locData.city;
            }
          }

          // Extract community name if community is an object
          const communityName = event.community
            ? typeof event.community === "string"
              ? event.community
              : event.community.name
            : null;

          return {
            ...event,
            location: locationDisplay,
            community: communityName,
            date: event.start_time || event.date,
            time: event.start_time
              ? new Date(event.start_time).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : event.time,
            image: event.image_url || event.image || null,
          };
        });

        setSavedEventsData(processedEvents);
        console.log(
          "[Dashboard] Set savedEventsData with",
          processedEvents.length,
          "events"
        );
      } catch (error: any) {
        console.error("[Dashboard] Exception in fetchSavedEvents:", error);
        console.error("[Dashboard] Error message:", error.message);
        console.error("[Dashboard] Error stack:", error.stack);
        setSavedEventsData([]);
      } finally {
        setIsLoadingSavedEvents(false);
        console.log("[Dashboard] fetchSavedEvents completed");
      }
    };

    fetchSavedEvents();
  }, [activeTab]);

  // Listen for custom events to refresh saved events
  useEffect(() => {
    const handleEventSaved = () => {
      console.log("[Dashboard] Event saved, refreshing saved events list");
      const fetchSavedEvents = async () => {
        try {
          const response = await fetch("/api/events/saved", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            console.error("[Dashboard] Error refreshing saved events");
            return;
          }

          const data = await response.json();

          // Process saved events to parse location and extract community name
          const processedEvents = (data.events || []).map((event: any) => {
            // Parse location if it's JSON
            let locationDisplay = event.location || "Location TBD";
            if (event.location && typeof event.location === "string") {
              try {
                const locData = JSON.parse(event.location);
                if (event.is_online && locData.meetingLink) {
                  locationDisplay = locData.meetingLink;
                } else if (locData.address) {
                  locationDisplay = `${locData.address}${
                    locData.city ? `, ${locData.city}` : ""
                  }`;
                } else if (locData.city) {
                  locationDisplay = locData.city;
                }
              } catch {
                // If not JSON, use as-is
                locationDisplay = event.location;
              }
            } else if (event.location && typeof event.location === "object") {
              const locData = event.location;
              if (event.is_online && locData.meetingLink) {
                locationDisplay = locData.meetingLink;
              } else if (locData.address) {
                locationDisplay = `${locData.address}${
                  locData.city ? `, ${locData.city}` : ""
                }`;
              } else if (locData.city) {
                locationDisplay = locData.city;
              }
            }

            // Extract community name if community is an object
            const communityName = event.community
              ? typeof event.community === "string"
                ? event.community
                : event.community.name
              : null;

            return {
              ...event,
              location: locationDisplay,
              community: communityName,
              date: event.start_time || event.date,
              time: event.start_time
                ? new Date(event.start_time).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : event.time,
              image: event.image_url || event.image || null,
            };
          });

          setSavedEventsData(processedEvents);
        } catch (error) {
          console.error("[Dashboard] Error refreshing saved events:", error);
        }
      };

      fetchSavedEvents();
    };

    const handleEventUnsaved = () => {
      console.log("[Dashboard] Event unsaved, refreshing saved events list");
      handleEventSaved(); // Same logic
    };

    window.addEventListener("eventSaved", handleEventSaved);
    window.addEventListener("eventUnsaved", handleEventUnsaved);

    return () => {
      window.removeEventListener("eventSaved", handleEventSaved);
      window.removeEventListener("eventUnsaved", handleEventUnsaved);
    };
  }, []);

  // Toggle save event (delete from saved)
  const toggleSaveEvent = useCallback(async (eventId: string | number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/save`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unsave event");
      }

      // Remove from local state
      setSavedEventsData((prev) =>
        prev.filter((event) => event.id !== eventId)
      );
    } catch (error: any) {
      console.error("Error unsaving event:", error);
      alert(error.message || "Failed to unsave event");
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("[Home] Fetching user home page data from API...");
        const response = await fetch("/api/user/home");
        
        if (!response.ok) {
          console.error("[Home] API error:", response.status);
          setIsLoadingUser(false);
          return;
        }

        const result = await response.json();
        console.log("[Home] Dashboard API response:", result);

        if (result.success && result.data) {
          const { user, communities } = result.data;
          
          // Set user data
          const displayName = user.full_name || user.username || "there";
          console.log("[Home] Setting username to:", displayName);
          setUsername(displayName);
          setUserPoints(user.points || 0);

          // Set communities data
          console.log("[Home] Setting communities from API:", communities);
          setCreatedCommunities(communities.created || []);
          setJoinedCommunities(communities.joined || []);
          setIsLoadingCommunities(false);
        } else {
          console.error("[Home] Invalid response format:", result);
        }
      } catch (error) {
        console.error("[Home] Error fetching dashboard data:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  // Read tab from query parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      ["home", "events", "communities", "achievements", "insights"].includes(
        tab
      )
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Check community creation permission
  useEffect(() => {
    const checkCreatePermission = async () => {
      try {
        const response = await fetch(
          "/api/communities/check-create-permission"
        );
        if (response.ok) {
          const data = await response.json();
          setCanCreateCommunity(data.canCreate);
          setCreatePermissionData(data);
        }
      } catch (error) {
        console.error("Error checking create permission:", error);
        // Default to allowing if check fails
        setCanCreateCommunity(true);
      }
    };

    checkCreatePermission();
  }, []);

  // Communities are now fetched together with user data in the fetchUserData effect above
  // This eliminates redundant queries and improves performance

  // Fetch joined/interested events function using API (bypasses RLS)
  const fetchJoinedEvents = useCallback(async () => {
    console.log("[Dashboard] fetchJoinedEvents called, activeTab:", activeTab);
    setIsLoadingEvents(true);
    try {
      // Use API endpoint to fetch interested events (bypasses RLS)
      const response = await fetch("/api/events/interested");
      const data = await response.json();

      console.log("[Dashboard] API response:", data);

      if (!response.ok) {
        console.error("[Dashboard] API error:", data.error);
        setJoinedEvents([]);
        setIsLoadingEvents(false);
        return;
      }

      const eventsData = data.events || [];

      if (eventsData.length === 0) {
        console.log("[Dashboard] No interested events found");
        setJoinedEvents([]);
        setIsLoadingEvents(false);
        return;
      }

      // Filter to only upcoming events and map to calendar format
      const now = new Date();
      const upcomingEvents = eventsData
        .filter((event: any) => {
          if (!event.start_time) {
            console.log("[Dashboard] Skipping event - no start_time:", event);
            return false;
          }
          const eventStart = new Date(event.start_time);
          const isUpcoming = eventStart >= now;
          console.log(
            `[Dashboard] Event "${
              event.title
            }": ${eventStart.toISOString()} >= ${now.toISOString()}? ${isUpcoming}`
          );
          return isUpcoming;
        })
        .map((event: any) => {
          const startTime = event.start_time;

          // Parse location to get readable string
          let locationDisplay = "";
          if (event.location) {
            try {
              const locData =
                typeof event.location === "string"
                  ? JSON.parse(event.location)
                  : event.location;

              // Handle online events
              if (locData.meetingLink) {
                locationDisplay = locData.meetingLink;
              } else if (locData.isOnline && locData.meetingLink) {
                locationDisplay = locData.meetingLink;
              } else {
                // Handle physical events - prefer city, then venue, then address
                locationDisplay =
                  locData.city || locData.venue || locData.address || "";
              }
            } catch {
              // If not JSON, use as-is
              locationDisplay = event.location;
            }
          }

          return {
            id: event.id,
            title: event.title,
            description: event.description,
            date: startTime,
            time: new Date(startTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            end_time: event.end_time,
            is_online: event.is_online,
            location: locationDisplay,
            image: event.image_url,
            category: null,
            community: event.community?.name || "Community",
            communityId: event.community_id,
            communityLogo: event.community?.logo_url,
            status: "going",
          };
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      console.log(
        `[Dashboard] Loaded ${upcomingEvents.length} interested events:`,
        upcomingEvents
      );
      setJoinedEvents(upcomingEvents);
    } catch (error) {
      console.error("Error fetching interested events:", error);
      setJoinedEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "home" || activeTab === "events") {
      console.log("[Dashboard] Fetching joined events...");
      fetchJoinedEvents();
    }
  }, [activeTab, fetchJoinedEvents]);

  // Listen for event interested custom event to refresh
  useEffect(() => {
    const handleEventInterested = () => {
      console.log("[Dashboard] Event interested, refreshing joined events");
      if (activeTab === "home" || activeTab === "events") {
        fetchJoinedEvents();
      }
    };

    window.addEventListener("eventInterested", handleEventInterested);

    return () => {
      window.removeEventListener("eventInterested", handleEventInterested);
    };
  }, [activeTab, fetchJoinedEvents]);

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

  // Calculate total communities count
  const totalCommunities = createdCommunities.length + joinedCommunities.length;

  // Filter events by selected date
  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return joinedEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const eventsForSelectedDate = getEventsForDate(selectedDate);

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

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
  const filteredSavedEvents = useMemo(() => {
    return savedEventsData
      .filter((event) => {
        // Skip invalid events
        if (!event || !event.date) {
          console.warn("[Filter Debug] Skipping event with no date:", event);
          return false;
        }

        const eventDate = new Date(event.date || event.start_time);

        // Skip events with invalid dates
        if (isNaN(eventDate.getTime())) {
          console.warn(
            "[Filter Debug] Skipping event with invalid date:",
            event
          );
          return false;
        }

        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        // Debug: Log first event to see the structure
        if (
          savedEventsData.indexOf(event) === 0 &&
          savedEventsTimeFilter !== "all"
        ) {
          console.log("[Filter Debug] First event:", {
            title: event.title,
            date: event.date,
            start_time: event.start_time,
            eventDate: eventDate.toISOString(),
            filter: savedEventsTimeFilter,
          });
        }

        // Time period filtering
        if (savedEventsTimeFilter === "today") {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const passes = eventDate >= today && eventDate < tomorrow;
          if (savedEventsData.indexOf(event) === 0) {
            console.log("[Filter Debug] Today filter:", {
              today: today.toISOString(),
              tomorrow: tomorrow.toISOString(),
              passes,
            });
          }
          return passes;
        } else if (savedEventsTimeFilter === "this-week") {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          const passes = eventDate >= startOfWeek && eventDate < endOfWeek;
          if (savedEventsData.indexOf(event) === 0) {
            console.log("[Filter Debug] This week filter:", {
              startOfWeek: startOfWeek.toISOString(),
              endOfWeek: endOfWeek.toISOString(),
              eventDate: eventDate.toISOString(),
              passes,
            });
          }
          return passes;
        } else if (savedEventsTimeFilter === "this-month") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          return eventDate >= startOfMonth && eventDate < endOfMonth;
        } else if (savedEventsTimeFilter === "upcoming") {
          const passes = eventDate >= now;
          if (savedEventsData.indexOf(event) === 0) {
            console.log("[Filter Debug] Upcoming filter:", {
              now: now.toISOString(),
              eventDate: eventDate.toISOString(),
              passes,
            });
          }
          return passes;
        }

        // "all" - show all events
        return true;
      })
      .sort((a, b) => {
        if (savedEventsFilter === "saved-date-asc") {
          // Sort by saved date ascending (oldest saved first)
          return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
        } else if (savedEventsFilter === "saved-date-desc") {
          // Sort by saved date descending (newest saved first)
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        } else if (savedEventsFilter === "event-date-asc") {
          // Sort by event date ascending (soonest first)
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } else {
          // Sort by event date descending (farthest first)
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
  }, [savedEventsData, savedEventsTimeFilter, savedEventsFilter]);

  // Debug log after filtering
  useEffect(() => {
    if (savedEventsTimeFilter !== "all" && activeTab === "events") {
      console.log(
        `[Filter Debug] Filtered ${savedEventsData.length} events to ${filteredSavedEvents.length} events with filter: ${savedEventsTimeFilter}`
      );
    }
  }, [
    filteredSavedEvents.length,
    savedEventsData.length,
    savedEventsTimeFilter,
    activeTab,
  ]);

  // Apply pagination
  const totalSavedPages = Math.ceil(
    filteredSavedEvents.length / savedEventsPerPage
  );
  const paginatedSavedEvents = filteredSavedEvents.slice(
    (savedEventsPage - 1) * savedEventsPerPage,
    savedEventsPage * savedEventsPerPage
  );

  // Debug pagination calculation
  useEffect(() => {
    if (activeTab === "events") {
      console.log("[Pagination Debug]", {
        savedEventsData: savedEventsData.length,
        filteredSavedEvents: filteredSavedEvents.length,
        paginatedSavedEvents: paginatedSavedEvents.length,
        savedEventsPerPage,
        totalSavedPages,
        currentPage: savedEventsPage,
        filter: savedEventsTimeFilter,
      });
    }
  }, [
    activeTab,
    savedEventsData.length,
    filteredSavedEvents.length,
    paginatedSavedEvents.length,
    totalSavedPages,
    savedEventsPage,
    savedEventsTimeFilter,
  ]);

  // Debug logging for saved events
  useEffect(() => {
    if (activeTab === "events") {
      console.log(
        "[Dashboard] savedEventsData length:",
        savedEventsData.length
      );
      console.log(
        "[Dashboard] filteredSavedEvents length:",
        filteredSavedEvents.length
      );
      console.log(
        "[Dashboard] paginatedSavedEvents length:",
        paginatedSavedEvents.length
      );
      console.log("[Dashboard] savedEventsPage:", savedEventsPage);
      if (savedEventsData.length > 0) {
        console.log("[Dashboard] First saved event:", savedEventsData[0]);
      }
    }
  }, [
    savedEventsData,
    filteredSavedEvents,
    paginatedSavedEvents,
    savedEventsPage,
    activeTab,
  ]);

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
      title: "Managing",
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
      href: "/communities/create",
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
    <>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
          <FloatingElements />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
            {/* Compact Header with Inline Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {isLoadingUser ? (
                    <span className="inline-block animate-pulse bg-gray-200 rounded h-8 w-64"></span>
                  ) : (
                    <>Welcome back, {username}!</>
                  )}
                </h1>
                <p className="text-sm text-gray-600">
                  Here's your activity overview
                </p>
              </div>
              {/* Removed Create Event button - only for community admins */}
            </div>

            {/* Refined Tabbed Interface with Enhanced Widgets */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start relative">
                  {/* Enhanced Calendar - Left Column (1/3) */}
                  <Card className="border-0 shadow-sm h-[520px] flex flex-col">
                    <CardHeader className="pb-3 h-[72px] flex-shrink-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <CalendarIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        Calendar
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex-1">
                      <EnhancedCalendar
                        selectedDate={selectedDate || undefined}
                        onDateSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedEvent(null); // Reset selected event when date changes
                          setDayEventsPage(1); // Reset pagination when date changes
                        }}
                        showEventsList={false}
                        events={(() => {
                          console.log(
                            `[Dashboard] Rendering calendar with ${joinedEvents.length} events`
                          );
                          if (joinedEvents.length === 0) {
                            console.log(
                              "[Dashboard] No events to send to calendar"
                            );
                            return [];
                          }

                          const mappedEvents = joinedEvents.map((event) => {
                            // Ensure date is in correct format
                            const eventDate =
                              typeof event.date === "string"
                                ? event.date
                                : event.date instanceof Date
                                ? event.date.toISOString()
                                : new Date(event.date).toISOString();

                            console.log(
                              `[Dashboard] Sending event to calendar: ${event.title}, date: ${eventDate}`
                            );

                            return {
                              id: event.id,
                              date: eventDate,
                              title: event.title,
                            };
                          });

                          console.log(
                            `[Dashboard] Mapped ${mappedEvents.length} events for calendar`
                          );
                          return mappedEvents;
                        })()}
                      />
                    </CardContent>
                  </Card>

                  {/* Upcoming Events List - Middle Column (1/3) */}
                  <Card className="border-0 shadow-sm h-[520px] flex flex-col">
                    <CardHeader className="pb-3 h-[72px] flex-shrink-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                          <BookOpen className="h-4 w-4 text-green-600" />
                        </div>
                        Upcoming Events
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {selectedDate
                          ? `Events on ${selectedDate.toLocaleDateString(
                              "en-US",
                              { month: "long", day: "numeric", year: "numeric" }
                            )}`
                          : "Select a date to view events"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                      {selectedDate ? (
                        (() => {
                          // Filter events by selected date
                          const eventsForDate = joinedEvents.filter((event) => {
                            const eventDate = new Date(event.date);
                            return (
                              eventDate.getDate() === selectedDate.getDate() &&
                              eventDate.getMonth() ===
                                selectedDate.getMonth() &&
                              eventDate.getFullYear() ===
                                selectedDate.getFullYear()
                            );
                          });

                          if (eventsForDate.length === 0) {
                            return (
                              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                                <CalendarIcon className="h-10 w-10 mb-2 text-gray-300" />
                                <p className="text-sm text-gray-500">
                                  No events on this date
                                </p>
                              </div>
                            );
                          }

                          // Pagination
                          const totalPages = Math.ceil(
                            eventsForDate.length / dayEventsPerPage
                          );
                          const startIndex =
                            (dayEventsPage - 1) * dayEventsPerPage;
                          const paginatedEvents = eventsForDate.slice(
                            startIndex,
                            startIndex + dayEventsPerPage
                          );

                          return (
                            <div className="flex-1 flex flex-col">
                              <div className="space-y-2 flex-1">
                                {paginatedEvents.map((event) => (
                                  <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                      selectedEvent?.id === event.id
                                        ? "border-violet-500 bg-violet-50"
                                        : "border-gray-200 hover:border-violet-300 hover:bg-violet-50/50"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="w-2 h-2 rounded-full bg-violet-600 mt-1.5 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">
                                          {event.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                              {(() => {
                                                const startTime = event.time;
                                                const endTime = event.end_time
                                                  ? new Date(
                                                      event.end_time
                                                    ).toLocaleTimeString(
                                                      "en-US",
                                                      {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                      }
                                                    )
                                                  : null;
                                                return endTime
                                                  ? `${startTime} - ${endTime}`
                                                  : startTime;
                                              })()}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate max-w-[80px]">
                                              {event.is_online
                                                ? "Online"
                                                : event.location}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-3 mt-auto border-t">
                                  <span className="text-xs text-gray-500">
                                    {eventsForDate.length} event
                                    {eventsForDate.length !== 1 ? "s" : ""}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setDayEventsPage((p) =>
                                          Math.max(1, p - 1)
                                        )
                                      }
                                      disabled={dayEventsPage === 1}
                                      className="h-7 px-2"
                                    >
                                      ←
                                    </Button>
                                    <span className="text-xs text-gray-600 px-2">
                                      {dayEventsPage}/{totalPages}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setDayEventsPage((p) =>
                                          Math.min(totalPages, p + 1)
                                        )
                                      }
                                      disabled={dayEventsPage === totalPages}
                                      className="h-7 px-2"
                                    >
                                      →
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                          <CalendarIcon className="h-10 w-10 mb-2 text-gray-300" />
                          <p className="text-sm text-gray-500">
                            Select a date to view events
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Event Detail - Right Column (1/3) - Top Card (from upcoming events) */}
                  <Card className="border-0 shadow-sm h-[520px] flex flex-col">
                    <CardHeader className="pb-3 h-[72px] flex-shrink-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <CalendarIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        Event Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                      {selectedEvent ? (
                        <div className="space-y-3 flex-1 flex flex-col">
                          {/* Event Image - Compact */}
                          <div className="relative h-32 w-full overflow-hidden rounded-lg bg-gray-100 flex-shrink-0">
                            {selectedEvent.image ? (
                              <Image
                                src={selectedEvent.image}
                                alt={selectedEvent.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100">
                                <CalendarIcon className="h-8 w-8 text-violet-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-h-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                              {selectedEvent.title}
                            </h3>
                            {selectedEvent.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {selectedEvent.description}
                              </p>
                            )}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate">
                                  {new Date(
                                    selectedEvent.date
                                  ).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span>
                                  {(() => {
                                    const startTime = selectedEvent.time;
                                    const endTime = selectedEvent.end_time
                                      ? new Date(
                                          selectedEvent.end_time
                                        ).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : null;
                                    return endTime
                                      ? `${startTime} - ${endTime}`
                                      : startTime;
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate">
                                  {selectedEvent.is_online
                                    ? "Online"
                                    : selectedEvent.location}
                                </span>
                              </div>
                              {selectedEvent.community && (
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">
                                    {selectedEvent.community}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="pt-3 border-t mt-auto">
                            <Link
                              href={`/events/${selectedEvent.id}`}
                              className="w-full"
                            >
                              <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
                                View Full Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                          <CalendarIcon className="h-10 w-10 mb-2 text-gray-300" />
                          <p className="text-sm text-gray-500">
                            Select an event to view details
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Saved Events Section - Left 2 columns */}
                  <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2">
                    {/* Saved Events List - Full width */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-3">
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
                          <div className="flex items-center gap-2">
                            {/* Time Period Filter */}
                            <Select
                              value={savedEventsTimeFilter}
                              onValueChange={(value) => {
                                setSavedEventsTimeFilter(value);
                                setSavedEventsPage(1); // Reset to first page
                              }}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Time period" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="this-week">
                                  This Week
                                </SelectItem>
                                <SelectItem value="this-month">
                                  This Month
                                </SelectItem>
                                <SelectItem value="upcoming">
                                  Upcoming
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Sort Filter */}
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
                                <SelectItem value="saved-date-desc">
                                  Recently Saved
                                </SelectItem>
                                <SelectItem value="saved-date-asc">
                                  Oldest Saved
                                </SelectItem>
                                <SelectItem value="event-date-asc">
                                  Upcoming Event
                                </SelectItem>
                                <SelectItem value="event-date-desc">
                                  Past Event
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        {isLoadingSavedEvents ? (
                          <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Bookmark className="h-10 w-10 text-gray-400 animate-pulse" />
                            </div>
                            <p className="text-sm text-gray-600">
                              Loading saved events...
                            </p>
                          </div>
                        ) : filteredSavedEvents.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Bookmark className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              No events found
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              {savedEventsTimeFilter === "all"
                                ? "You haven't saved any events yet"
                                : `No saved events match the selected time filter (${savedEventsTimeFilter.replace(
                                    "-",
                                    " "
                                  )})`}
                            </p>
                            {savedEventsTimeFilter !== "all" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSavedEventsTimeFilter("all")}
                              >
                                Show All Events
                              </Button>
                            )}
                            {savedEventsTimeFilter === "all" && (
                              <Link href="/events">
                                <Button variant="outline" size="sm">
                                  <Search className="h-4 w-4 mr-2" />
                                  Browse Events
                                </Button>
                              </Link>
                            )}
                          </div>
                        ) : paginatedSavedEvents.length > 0 ? (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {paginatedSavedEvents.map((event) => (
                              <div
                                key={event.id}
                                onClick={() => {
                                  setSelectedSavedEvent(event);
                                  // Keep selectedEvent from upcoming events - allow both cards to show
                                }}
                                className={`flex items-start gap-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all w-full ${
                                  selectedSavedEvent?.id === event.id
                                    ? "border-amber-500 bg-amber-50"
                                    : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
                                } group`}
                              >
                                {/* Indicator dot */}
                                <div className="w-2 h-2 rounded-full bg-amber-600 mt-1.5 flex-shrink-0" />
                                
                                {/* Event Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-1.5 mb-1">
                                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1 flex-1 min-w-0">
                                      {event.title}
                                    </h4>
                                  </div>

                                  <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                                    <div className="flex items-center gap-1 truncate">
                                      <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">
                                        {(() => {
                                          const date = new Date(
                                            event.start_time || event.date
                                          );
                                          return date.toLocaleDateString(
                                            "en-US",
                                            {
                                              month: "short",
                                              day: "numeric",
                                              timeZone: "UTC",
                                            }
                                          );
                                        })()}
                                      </span>
                                      <span className="text-gray-400 flex-shrink-0">•</span>
                                      <Clock className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">
                                        {(() => {
                                          const startTime =
                                            event.time ||
                                            new Date(
                                              event.start_time || event.date
                                            ).toLocaleTimeString("en-US", {
                                              hour: "numeric",
                                              minute: "2-digit",
                                            });
                                          return startTime;
                                        })()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 truncate">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">
                                        {event.location || "Location TBD"}
                                      </span>
                                    </div>
                                    {event.registration_link && (
                                      <a
                                        href={event.registration_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1 text-violet-600 hover:text-violet-700 hover:underline truncate"
                                        title={event.registration_link}
                                      >
                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate text-xs font-medium">
                                          Registration Link
                                        </span>
                                      </a>
                                    )}
                                    <Badge
                                      variant="secondary"
                                      className="text-xs w-fit mt-0.5"
                                    >
                                      {event.category}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-1 flex-shrink-0">
                                  <Link
                                    href={`/events/${event.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    title="View event details"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:bg-gray-100"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 text-gray-600" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSaveEvent(event.id);
                                    }}
                                    title="Remove from saved"
                                  >
                                    <X className="h-3.5 w-3.5" />
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
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Bookmark className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              No events on this page
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Try a different page or adjust your filters
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Event Detail - Right Column (1/3) - Bottom Card (from saved events) - Positioned at same row as saved events section */}
                  <div className="lg:col-start-3 lg:col-span-1 lg:row-start-2">
                    {selectedSavedEvent ? (
                      <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 rounded-lg">
                              <Bookmark className="h-4 w-4 text-amber-600" />
                            </div>
                            Event Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-4">
                            {/* Event Image - Always show, with placeholder if no image */}
                            <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-200">
                              {selectedSavedEvent.image ? (
                                <Image
                                  src={selectedSavedEvent.image}
                                  alt={selectedSavedEvent.title}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                                      <CalendarIcon className="h-8 w-8 text-gray-500" />
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">
                                      No Image
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {selectedSavedEvent.title}
                              </h3>
                              {selectedSavedEvent.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                  {selectedSavedEvent.description}
                                </p>
                              )}
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                <span>
                                  {new Date(
                                    selectedSavedEvent.date
                                  ).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>
                                  {(() => {
                                    const startTime =
                                      selectedSavedEvent.time ||
                                      new Date(
                                        selectedSavedEvent.start_time ||
                                          selectedSavedEvent.date
                                      ).toLocaleTimeString("en-US", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      });
                                    const endTime = selectedSavedEvent.end_time
                                      ? new Date(
                                          selectedSavedEvent.end_time
                                        ).toLocaleTimeString("en-US", {
                                          hour: "numeric",
                                          minute: "2-digit",
                                        })
                                      : null;
                                    return endTime
                                      ? `${startTime} - ${endTime}`
                                      : startTime;
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span>{selectedSavedEvent.location}</span>
                              </div>
                              {selectedSavedEvent.community && (
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Users className="h-4 w-4 text-gray-400" />
                                  <span>{selectedSavedEvent.community}</span>
                                </div>
                              )}
                              {selectedSavedEvent.registration_link && (
                                <div className="flex items-center justify-between text-sm text-gray-700">
                                  <span className="flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">Registration Link</span>
                                  </span>
                                  <a
                                    href={selectedSavedEvent.registration_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="gap-1.5"
                                    >
                                      Register
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </a>
                            </div>
                              )}
                            </div>
                            <div className="pt-4 border-t flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">View more details</span>
                              <Link
                                href={`/events/${selectedSavedEvent.id}`}
                                title="View full event details"
                              >
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="gap-2"
                                >
                                  View
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                </div>
              </TabsContent>

              {/* Communities Tab - Enhanced community cards with Created and Joined sections */}
              <TabsContent value="communities" className="space-y-6">
                {/* Communities Created Section - Always show */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <Crown className="h-4 w-4 text-purple-600" />
                          </div>
                          My Communities ({createdCommunities.length})
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-500 mt-1">
                          Communities you created or manage as admin
                        </CardDescription>
                      </div>
                      {canCreateCommunity ? (
                        <Link href="/communities/create">
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Community
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => setShowPointsDialog(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Community
                        </Button>
                      )}
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
                    ) : createdCommunities.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Crown className="h-10 w-10 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No communities created yet
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                          Start your own community and bring people together
                          around shared interests
                        </p>
                        {canCreateCommunity ? (
                          <Link href="/communities/create">
                            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Your First Community
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => setShowPointsDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Community
                          </Button>
                        )}
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
                                className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow border border-purple-200 bg-purple-50/30 flex flex-col"
                              >
                                <CardContent className="p-5 flex flex-col flex-1">
                                  {/* Community Avatar and Info */}
                                  <div className="flex items-start gap-3 mb-4">
                                    <Avatar className="h-14 w-14 ring-2 ring-purple-200">
                                      <AvatarImage
                                        src={
                                          community.logo_url ||
                                          "/placeholder.svg"
                                        }
                                      />
                                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold">
                                        {community.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                      <Link
                                        href={`/communities/${community.id}`}
                                      >
                                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                                          {community.name}
                                        </h3>
                                      </Link>
                                      <Badge
                                        variant="secondary"
                                        className="mt-1 text-xs"
                                      >
                                        {community.isCreator ? (
                                          <>
                                            <Crown className="h-3 w-3 mr-1" />
                                            Creator
                                          </>
                                        ) : (
                                          <>
                                            <Shield className="h-3 w-3 mr-1" />
                                            Admin
                                          </>
                                        )}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Description - Fixed height to maintain consistency */}
                                  <div className="mb-4 min-h-[40px]">
                                    {community.description && (
                                      <p className="text-sm text-gray-600 line-clamp-2">
                                        {community.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Stats */}
                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Users className="h-4 w-4" />
                                      <span>
                                        {community.member_count ||
                                          community.members ||
                                          0}{" "}
                                        members
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <CalendarIcon className="h-4 w-4" />
                                      <span>
                                        {community.upcomingEvents || 0} upcoming
                                        events
                                      </span>
                                    </div>
                                  </div>

                                  {/* Action Buttons - Push to bottom with mt-auto */}
                                  <div className="flex gap-2 mt-auto">
                                    <Link
                                      href={`/communities/${community.id}`}
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
                                      href={`/communities/${community.id}/admin`}
                                      className="flex-1"
                                    >
                                      <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
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

                {/* Member Communities Section */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          Member Of ({joinedCommunities.length})
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-500 mt-1">
                          Communities you're part of
                        </CardDescription>
                      </div>
                      {joinedCommunities.length > 0 && (
                        <Link href="/communities">
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3 mr-1" />
                            Join More
                          </Button>
                        </Link>
                      )}
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
                          <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
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
                                          community.logo_url ||
                                          "/placeholder.svg"
                                        }
                                      />
                                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                                        {community.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                      <Link
                                        href={`/communities/${community.id}`}
                                      >
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
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[2.5rem]">
                                    {community.description ||
                                      "No description available"}
                                  </p>

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
                                      href={`/communities/${community.id}`}
                                      className="flex-1"
                                    >
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                      >
                                        View
                                      </Button>
                                    </Link>
                                    {/* Show Manage button if user is admin with approved status */}
                                    {community.role === "admin" &&
                                      community.status === "approved" && (
                                        <Link
                                          href={`/communities/${community.id}/admin`}
                                          className="flex-1"
                                        >
                                          <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
                                            Manage
                                          </Button>
                                        </Link>
                                      )}
                                  </div>
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
                          <p className="text-sm text-gray-500">
                            Loading badges...
                          </p>
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
                          <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
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
                                <Badge
                                  variant="secondary"
                                  className="text-xs mb-2"
                                >
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

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
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
                            <div className="text-2xl font-bold text-gray-900">
                              {metric.value}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Points Required / Banned Dialog */}
        <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {createPermissionData?.isBanned ? (
                  <>
                    <Shield className="w-5 h-5 text-red-600" />
                    Community Creation Banned
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5 text-amber-600" />
                    More Points Needed
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {createPermissionData?.isBanned 
                  ? "You are not allowed to create new communities"
                  : createPermissionData?.communitiesOwned === 0 
                    ? "You need more points to create your second community"
                    : createPermissionData?.communitiesOwned === 1
                    ? "You need more points to create your second community"
                    : `You need more points to create your ${(createPermissionData?.communitiesOwned || 0) + 1}${getOrdinalSuffix((createPermissionData?.communitiesOwned || 0) + 1)} community`}
              </DialogDescription>
            </DialogHeader>

            {createPermissionData?.isBanned ? (
              // Banned Message
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium mb-2">
                    You have been banned from creating communities due to previous violations.
                  </p>
                  <p className="text-sm text-red-700">
                    This restriction is permanent. If you believe this is an error, please contact our support team.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-sm text-gray-900">
                    What you can still do:
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-green-500" />
                      Join other communities
                    </li>
                    <li className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      Participate in discussions
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      Attend events
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              // Points Needed Message
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Your Usable Points</span>
                    <span className="text-2xl font-bold text-amber-600">
                      {createPermissionData?.currentPoints || 0}
                    </span>
                  </div>
                  {createPermissionData?.lockedPoints > 0 && (
                    <div className="text-xs text-gray-500 mb-2">
                      {createPermissionData.lockedPoints} points locked (unlock in 3 days after joining)
                    </div>
                  )}
                  <Progress
                    value={
                      createPermissionData?.requiredPoints > 0
                        ? (createPermissionData?.currentPoints /
                            createPermissionData?.requiredPoints) *
                          100
                        : 0
                    }
                    className="h-2 mb-2"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {Math.max(0, (createPermissionData?.requiredPoints || 0) -
                        (createPermissionData?.currentPoints || 0))}{" "}
                      more needed
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      Goal: {createPermissionData?.requiredPoints || 0}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm">
                    How to Earn Points?
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-green-500" />
                      Join communities: +3 points per community
                    </li>
                    <li className="text-xs text-gray-500 ml-6 mt-1">
                      • Max 3 points per day
                      • Points are locked for 3 days after joining
                      • Points become usable after 3 days
                    </li>
                  </ul>
                </div>

                <p className="text-sm text-gray-600">
                  {createPermissionData?.message}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => setShowPointsDialog(false)}
                className="w-full"
              >
                Got it!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTransition>
      <Chatbot />
    </>
  );
}
