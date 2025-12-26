"use client";

import { Chatbot } from "@/components/ai/chatbot";
import { LeafletEventsMap } from "@/components/maps/leaflet-events-map";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingElements } from "@/components/ui/floating-elements";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmoothReveal } from "@/components/ui/smooth-reveal";
import { StaggerContainer } from "@/components/ui/stagger-container";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Globe,
  Heart,
  Lock,
  Map,
  MapPin,
  Search,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface Event {
  id: string | number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  date: string;
  time: string;
  endTime: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    venue: string;
    city: string;
    isOnline?: boolean;
  };
  organizer: string;
  attendees: number;
  maxAttendees: number | null;
  rating: number;
  reviewCount: number;
  image: string;
  gallery?: string[];
  featured: boolean;
  isNew?: boolean;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  duration?: string;
  language?: string;
  certificates?: boolean;
  isPrivate?: boolean;
  community?: {
    id: string;
    name: string;
    logo?: string | null;
  } | null;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [dateRange, setDateRange] = useState("upcoming");
  const [searchFilter, setSearchFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [savedEvents, setSavedEvents] = useState<(string | number)[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [unsaveEventId, setUnsaveEventId] = useState<string | number | null>(
    null
  );
  const [isUnsaveDialogOpen, setIsUnsaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [registrationStatus, setRegistrationStatus] = useState<
    Record<string | number, boolean>
  >({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [mapSidebarPage, setMapSidebarPage] = useState(1);
  const [mapSidebarItemsPerPage] = useState(10);

  // Fetch events from API - fetch all events, filtering is done client-side
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all events without filters - filtering is done client-side
        // This ensures registrationStatus contains ALL interested events
        const params = new URLSearchParams({
          page: "1",
          pageSize: "1000", // Fetch all events
          dateRange: "all", // Get all events, client-side will filter by date
          sortBy: "start_time",
          sortOrder: "asc",
        });

        const response = await fetch(`/api/events?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch events");
        }

        const data = await response.json();
        const eventsData = data.events || [];
        setEvents(eventsData);
        setTotalPages(data.pagination?.totalPages || 1);

        // Extract user-specific status directly from the events response
        // (API now includes isInterested and isSaved for each event)
        const registrationMap: Record<string | number, boolean> = {};
        const savedEventIds: (string | number)[] = [];

        eventsData.forEach(
          (event: Event & { isInterested?: boolean; isSaved?: boolean }) => {
            if (event.isInterested) {
              registrationMap[event.id] = true;
            }
            if (event.isSaved) {
              savedEventIds.push(event.id);
            }
          }
        );

        setRegistrationStatus(registrationMap);
        setSavedEvents(savedEventIds);

        // Still need current user for other operations
        const { getSupabaseBrowser } = await import("@/lib/supabase/client");
        const supabase = getSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUser(user);
      } catch (err: any) {
        console.error("Error fetching events:", err);
        setError(err.message || "Failed to load events");
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []); // Only fetch once on mount - all filtering is done client-side

  // Check scroll position on mount and when layout changes
  useEffect(() => {
    const checkScroll = () => {
      if (categoryScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } =
          categoryScrollRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    checkScroll();
    // Check again after a short delay to ensure layout is complete
    const timer = setTimeout(checkScroll, 100);

    // Also check on window resize
    window.addEventListener("resize", checkScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, []); // Empty dependency array - only run on mount

  // Fetch saved events from API
  const fetchSavedEvents = async () => {
    try {
      // Get saved events via API
      const response = await fetch("/api/events/saved");
      if (response.ok) {
        const data = await response.json();
        // API returns { events: [...] } format
        const savedEventIds = (data.events || []).map(
          (item: { id: string }) => item.id
        );
        setSavedEvents(savedEventIds);
      } else {
        setSavedEvents([]);
      }
    } catch (err) {
      console.error("Error fetching saved events:", err);
      setSavedEvents([]);
    }
  };

  useEffect(() => {
    fetchSavedEvents();
  }, [events]); // Re-fetch when events change

  // Listen for custom events from event detail page
  useEffect(() => {
    const handleEventSaved = () => {
      fetchSavedEvents();
    };

    const handleEventUnsaved = () => {
      fetchSavedEvents();
    };

    window.addEventListener("eventSaved", handleEventSaved);
    window.addEventListener("eventUnsaved", handleEventUnsaved);

    return () => {
      window.removeEventListener("eventSaved", handleEventSaved);
      window.removeEventListener("eventUnsaved", handleEventUnsaved);
    };
  }, []);

  const categories = [
    { value: "all", label: "All Categories", icon: "🎯" },
    { value: "tech & innovation", label: "Tech & Innovation", icon: "💻" },
    { value: "career & business", label: "Career & Business", icon: "💼" },
    { value: "hobbies & crafts", label: "Hobbies & Crafts", icon: "🎨" },
    { value: "sports & fitness", label: "Sports & Fitness", icon: "⚽" },
    { value: "arts & culture", label: "Arts & Culture", icon: "🎭" },
    {
      value: "education & learning",
      label: "Education & Learning",
      icon: "📚",
    },
    { value: "social & community", label: "Social & Community", icon: "👥" },
    { value: "travel & adventure", label: "Travel & Adventure", icon: "✈️" },
    { value: "food & drink", label: "Food & Drink", icon: "🍔" },
    { value: "entertainment", label: "Entertainment", icon: "🎬" },
  ];

  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Location filter
    if (locationQuery) {
      if (locationQuery.toLowerCase() === "online") {
        filtered = filtered.filter(
          (event) =>
            event.location?.isOnline === true ||
            event.title.toLowerCase().includes("online") ||
            event.description.toLowerCase().includes("online")
        );
      } else {
        filtered = filtered.filter(
          (event) =>
            event.location?.city
              ?.toLowerCase()
              .includes(locationQuery.toLowerCase()) ||
            event.location?.venue
              ?.toLowerCase()
              .includes(locationQuery.toLowerCase()) ||
            event.location?.address
              ?.toLowerCase()
              .includes(locationQuery.toLowerCase())
        );
      }
    }

    // General search filter (for events search) - includes city/location
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          (event.community?.name || event.organizer || "")
            .toLowerCase()
            .includes(query) ||
          (event.location?.city?.toLowerCase().includes(query) ?? false) ||
          (event.location?.address?.toLowerCase().includes(query) ?? false)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (event) =>
          event.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Location filter (selectedLocation from filter panel)
    if (selectedLocation !== "all") {
      if (selectedLocation === "online") {
        filtered = filtered.filter(
          (event) => event.location?.isOnline === true
        );
      } else {
        filtered = filtered.filter(
          (event) =>
            event.location?.city?.toLowerCase() ===
            selectedLocation.toLowerCase()
        );
      }
    }

    // Date filter (client-side filtering for consistency)
    if (dateRange === "upcoming") {
      const now = new Date();
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= now;
      });
    } else if (dateRange !== "all") {
      const now = new Date();
      switch (dateRange) {
        case "today":
          filtered = filtered.filter((event) => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === now.toDateString();
          });
          break;
        case "week":
          filtered = filtered.filter((event) => {
            const eventDate = new Date(event.date);
            const weekFromNow = new Date(
              now.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            return eventDate >= now && eventDate <= weekFromNow;
          });
          break;
        case "month":
          filtered = filtered.filter((event) => {
            const eventDate = new Date(event.date);
            const monthFromNow = new Date(
              now.getTime() + 30 * 24 * 60 * 60 * 1000
            );
            return eventDate >= now && eventDate <= monthFromNow;
          });
          break;
      }
    }

    return filtered;
  }, [
    events,
    searchQuery,
    locationQuery,
    selectedCategory,
    selectedLocation,
    dateRange,
  ]);

  // Reset page to 1 when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    selectedCategory,
    selectedLocation,
    dateRange,
    searchQuery,
    locationQuery,
  ]);

  // Pagination logic
  // Since we're doing client-side filtering, we need to paginate the filtered results
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Calculate total pages based on filtered results length
  const calculatedTotalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  const handleSaveEvent = async (eventId: string | number) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save event");
      }

      // Update local state - API call was successful
      setSavedEvents((prev) => [...prev, String(eventId)]);
    } catch (error: unknown) {
      console.error("Error saving event:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save event";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsaveEvent = async () => {
    if (!unsaveEventId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${unsaveEventId}/save`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unsave event");
      }

      // Update local state - API call was successful
      setSavedEvents((prev) =>
        prev.filter((id) => String(id) !== String(unsaveEventId))
      );

      setIsUnsaveDialogOpen(false);
      setUnsaveEventId(null);
    } catch (error: unknown) {
      console.error("Error unsaving event:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to unsave event";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle save/unsave event
  const toggleSaveEvent = async (eventId: string | number) => {
    const isSaved = savedEvents.includes(eventId);

    if (isSaved) {
      // Unsave event
      setUnsaveEventId(eventId);
      setIsUnsaveDialogOpen(true);
    } else {
      // Save event
      await handleSaveEvent(eventId);
    }
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setDateRange("all");
    setSearchQuery("");
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of page smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setMapSidebarPage(1); // Also reset map sidebar pagination
  }, [
    searchQuery,
    locationQuery,
    selectedCategory,
    selectedLocation,
    dateRange,
  ]);

  // Pagination Component - accepts custom totalPages for different filter tabs
  const EventPaginationControls = ({
    totalPages = calculatedTotalPages,
  }: {
    totalPages?: number;
  }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push("...");
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push("...");
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push("...");
          pages.push(currentPage - 1);
          pages.push(currentPage);
          pages.push(currentPage + 1);
          pages.push("...");
          pages.push(totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 px-3 border-gray-300 hover:bg-purple-50 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                className={cn(
                  "h-9 w-9 p-0 border-gray-300",
                  currentPage === page
                    ? "bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
                    : "hover:bg-purple-50 hover:border-purple-400"
                )}
              >
                {page}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 px-3 border-gray-300 hover:bg-purple-50 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const EnhancedEventCard = ({
    event,
    isListView = false,
  }: {
    event: Event;
    isListView?: boolean;
  }) => {
    const isSaved = savedEvents.includes(event.id);
    
    // Check if event is in the past
    const isEventPast = new Date(event.date) < new Date(new Date().setHours(0, 0, 0, 0));

    // Determine border color based on registration status
    const getBorderColor = () => {
      if (event.isPrivate) return "border-amber-400 hover:border-amber-500";
      if (currentUser && registrationStatus[event.id]) {
        return "border-green-500 border-2";
      }
      return "border-gray-200";
    };

    return (
      <Card
        className={cn(
          "group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow border-2 flex flex-col h-full",
          getBorderColor()
        )}
      >
        <div className="relative h-48 overflow-hidden">
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            width={500}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {/* Private/Public Badge */}
            {event.isPrivate ? (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-2 border-amber-300 flex items-center gap-1 shadow-lg text-xs font-bold px-2.5 py-1">
                <Lock className="h-3.5 w-3.5" />
                Private
              </Badge>
            ) : (
              <Badge className="bg-green-500 hover:bg-green-600 text-white border-2 border-green-300 flex items-center gap-1 shadow-lg text-xs font-bold px-2.5 py-1">
                <Globe className="h-3.5 w-3.5" />
                Public
              </Badge>
            )}
            {/* Registration Status Badge on Image */}
            {currentUser && registrationStatus[event.id] && (
              <Badge className="bg-green-500/90 backdrop-blur-sm text-white border border-green-300 text-xs font-semibold px-2 py-0.5 flex items-center gap-1 shadow-md">
                <CheckCircle2 className="h-3 w-3" />
                Interested
              </Badge>
            )}
          </div>

          {/* Save Button */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-3 right-3 h-8 w-8 p-0 bg-white/90 hover:bg-white rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveEvent(event.id);
            }}
            disabled={isEventPast}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isSaved ? "fill-red-500 text-red-500" : "text-gray-600",
                isEventPast && "opacity-50"
              )}
            />
          </Button>
        </div>

        <CardContent className="p-4 flex flex-col flex-grow">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Category Badge */}
            <Badge variant="secondary">{event.category}</Badge>
            {/* Registration Status Badge */}
            {currentUser && registrationStatus[event.id] && (
              <Badge className="bg-green-50 text-green-700 border border-green-500 text-xs font-semibold px-2 py-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Interested
              </Badge>
            )}
          </div>

          {/* Title */}
          <Link href={`/events/${event.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2 mb-2 min-h-[3.5rem]">
              {event.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[2.5rem]">
            {event.description}
          </p>

          {/* Private Event Info - with consistent height */}
          <div className="mb-3 min-h-[42px]">
            {event.isPrivate && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Join this community to attend event
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Event Info */}
          <div className="space-y-2 mb-4 flex-grow">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(event.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {event.time} - {event.endTime}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{event.location.city}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{event.attendees} interested</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <Link href={`/events/${event.id}`} className="block">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                View Event
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
          <FloatingElements />

          {/* Hero Header */}
          <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=1200')] bg-cover bg-center opacity-10" />

            <div className="relative max-w-7xl mx-auto px-6 py-16">
              <SmoothReveal>
                <div className="text-center mb-8">
                  <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    Discover Amazing Events
                  </h1>
                  <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
                    Join thousands of professionals, creators, and innovators at
                    events that inspire, educate, and connect
                  </p>
                </div>
              </SmoothReveal>

              {/* Quick Stats */}
              <SmoothReveal delay={200}>
                <div className="grid grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      <AnimatedCounter end={filteredEvents.length} />
                    </div>
                    <div className="text-purple-200 text-sm">
                      Events Available
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      <AnimatedCounter
                        end={
                          filteredEvents.filter((e) => !e.location.isOnline)
                            .length
                        }
                      />
                    </div>
                    <div className="text-purple-200 text-sm">
                      Events Offline
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      <AnimatedCounter
                        end={
                          filteredEvents.filter((e) => e.location.isOnline)
                            .length
                        }
                      />
                    </div>
                    <div className="text-purple-200 text-sm">Events Online</div>
                  </div>
                </div>
              </SmoothReveal>

              {/* Enhanced Search Bar - Eventbrite Style */}
              <SmoothReveal delay={300}>
                <div className="max-w-4xl mx-auto relative z-[100]">
                  <div className="relative flex bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg focus-within:shadow-xl transition-all duration-300">
                    {/* Search Events Input */}
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder="Search events"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-4 py-4 text-lg border-0 rounded-none focus:ring-0 focus:outline-none text-gray-900 placeholder:text-gray-500 h-full"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-gray-300 my-2"></div>

                    {/* Location Input with Dropdown */}
                    <div className="relative w-64">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder="Choose a location"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        className="pl-12 pr-4 py-4 text-lg border-0 rounded-none focus:ring-0 focus:outline-none text-gray-900 placeholder:text-gray-500 h-full"
                      />
                      {locationQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                          onClick={() => setLocationQuery("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Search Button */}
                    <Button
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-none px-6 py-5 shadow-lg h-full"
                      onClick={() => {
                        // Trigger search logic here
                        console.log("Search triggered:", {
                          searchQuery,
                          locationQuery,
                        });
                      }}
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </SmoothReveal>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              {/* Dribbble-Style Filter Bar */}
              <div className="bg-white border-b border-gray-200 sticky top-0 z-40 -mx-6 px-6">
                <div className="flex items-center justify-between gap-4 py-4">
                  {/* Left: View Selector (Tabs as Dropdown) */}
                  <div className="flex-shrink-0">
                    <Select value={activeTab} onValueChange={setActiveTab}>
                      <SelectTrigger className="w-[150px] h-10 border-gray-300 rounded-lg font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="map">Map View</SelectItem>
                        <SelectItem value="online">Online Events</SelectItem>
                        <SelectItem value="interested">
                          Interested Event
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Center: Categories (Horizontal Scroll - Centered) */}
                  <div className="flex-1 overflow-hidden min-w-0 relative">
                    {/* Left Arrow */}
                    {showLeftArrow && (
                      <button
                        onClick={() => {
                          if (categoryScrollRef.current) {
                            categoryScrollRef.current.scrollBy({
                              left: -200,
                              behavior: "smooth",
                            });
                          }
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-1.5 shadow-md transition-all"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="h-4 w-4 text-gray-600" />
                      </button>
                    )}

                    {/* Right Arrow */}
                    {showRightArrow && (
                      <button
                        onClick={() => {
                          if (categoryScrollRef.current) {
                            categoryScrollRef.current.scrollBy({
                              left: 200,
                              behavior: "smooth",
                            });
                          }
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-1.5 shadow-md transition-all"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      </button>
                    )}

                    <div
                      ref={categoryScrollRef}
                      className="flex items-center gap-4 overflow-x-auto scrollbar-hide px-6 py-1"
                      onScroll={() => {
                        if (categoryScrollRef.current) {
                          const { scrollLeft, scrollWidth, clientWidth } =
                            categoryScrollRef.current;
                          setShowLeftArrow(scrollLeft > 0);
                          setShowRightArrow(
                            scrollLeft < scrollWidth - clientWidth - 10
                          );
                        }
                      }}
                    >
                      {categories.map((category) => (
                        <button
                          key={category.value}
                          onClick={() => {
                            // Allow deselecting by clicking the active category again
                            if (selectedCategory === category.value) {
                              setSelectedCategory("all");
                            } else {
                              setSelectedCategory(category.value);
                            }
                          }}
                          className={cn(
                            "text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 px-3 py-1.5 rounded-md",
                            selectedCategory === category.value
                              ? "text-gray-900 underline underline-offset-8 decoration-2 bg-gray-50"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: Date Range Filter */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-[160px] h-10 border-gray-300 rounded-lg">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Dates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">
                          Upcoming Events
                        </SelectItem>
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {/* All Events Tab */}
              <TabsContent value="all" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Discover Events ({filteredEvents.length})
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Find your next amazing experience
                    </p>
                  </div>
                </div>

                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {paginatedEvents.map((event, index) => (
                    <div key={event.id} className="stagger-item">
                      <EnhancedEventCard event={event} />
                    </div>
                  ))}
                </StaggerContainer>

                {/* Pagination Controls */}
                {calculatedTotalPages > 1 && <EventPaginationControls />}

                {filteredEvents.length === 0 && (
                  <SmoothReveal>
                    <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                      <CardContent>
                        <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          No events found
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Try adjusting your search criteria or filters to find
                          more events
                        </p>
                        <Button
                          onClick={clearFilters}
                          className="bg-gradient-to-r from-purple-500 to-blue-500"
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          Clear All Filters
                        </Button>
                      </CardContent>
                    </Card>
                  </SmoothReveal>
                )}
              </TabsContent>

              {/* Interested Event Tab */}
              <TabsContent value="interested" className="space-y-6">
                {(() => {
                  const interestedEvents = filteredEvents.filter(
                    (event) => registrationStatus[event.id]
                  );
                  const interestedStartIndex = (currentPage - 1) * itemsPerPage;
                  const interestedEndIndex =
                    interestedStartIndex + itemsPerPage;
                  const paginatedInterestedEvents = interestedEvents.slice(
                    interestedStartIndex,
                    interestedEndIndex
                  );
                  const interestedTotalPages = Math.ceil(
                    interestedEvents.length / itemsPerPage
                  );

                  return interestedEvents.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                            <CheckCircle2 className="h-6 w-6 text-white" />
                          </div>
                          Interested Events ({interestedEvents.length})
                        </h2>
                      </div>

                      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {paginatedInterestedEvents.map((event, index) => (
                          <div key={event.id} className="stagger-item">
                            <EnhancedEventCard event={event} />
                          </div>
                        ))}
                      </StaggerContainer>

                      {/* Pagination Controls */}
                      {interestedTotalPages > 1 && (
                        <EventPaginationControls
                          totalPages={interestedTotalPages}
                        />
                      )}
                    </>
                  ) : (
                    <SmoothReveal>
                      <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                        <CardContent>
                          <CheckCircle2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No interested events yet
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Click "Interested" on events you want to join to see
                            them here
                          </p>
                          <Button
                            onClick={() => setActiveTab("all")}
                            className="bg-gradient-to-r from-purple-500 to-blue-500"
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Explore Events
                          </Button>
                        </CardContent>
                      </Card>
                    </SmoothReveal>
                  );
                })()}
              </TabsContent>

              {/* Online Events Tab */}
              <TabsContent value="online" className="space-y-6">
                {(() => {
                  const onlineEvents = filteredEvents.filter(
                    (e) => e.location.isOnline
                  );
                  const onlineStartIndex = (currentPage - 1) * itemsPerPage;
                  const onlineEndIndex = onlineStartIndex + itemsPerPage;
                  const paginatedOnlineEvents = onlineEvents.slice(
                    onlineStartIndex,
                    onlineEndIndex
                  );
                  const onlineTotalPages = Math.ceil(
                    onlineEvents.length / itemsPerPage
                  );

                  return onlineEvents.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                            <Globe className="h-6 w-6 text-white" />
                          </div>
                          Online Events ({onlineEvents.length})
                        </h2>
                      </div>

                      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {paginatedOnlineEvents.map((event, index) => (
                          <div key={event.id} className="stagger-item">
                            <EnhancedEventCard event={event} />
                          </div>
                        ))}
                      </StaggerContainer>

                      {/* Pagination Controls */}
                      {onlineTotalPages > 1 && (
                        <EventPaginationControls
                          totalPages={onlineTotalPages}
                        />
                      )}
                    </>
                  ) : (
                    <SmoothReveal>
                      <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                        <CardContent>
                          <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No online events available
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Check back later for virtual events you can join
                            from anywhere
                          </p>
                          <Button
                            onClick={() => setActiveTab("all")}
                            className="bg-gradient-to-r from-purple-500 to-blue-500"
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Explore All Events
                          </Button>
                        </CardContent>
                      </Card>
                    </SmoothReveal>
                  );
                })()}
              </TabsContent>

              {/* Events on Map Tab */}
              <TabsContent value="map" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                      <Map className="h-6 w-6 text-white" />
                    </div>
                    Events on Map (
                    {filteredEvents.filter((e) => !e.location.isOnline).length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <LeafletEventsMap
                      events={filteredEvents}
                      selectedEvent={selectedEvent}
                      onEventSelect={(event) => {
                        setSelectedEvent(event);
                        // Don't navigate here - only highlight on map
                        // Navigation happens when clicking "View Details" button in popup
                      }}
                      height="700px"
                      className="rounded-2xl shadow-lg border"
                    />
                  </div>
                  <div className="flex flex-col h-[700px]">
                    <div className="flex items-center justify-between sticky top-0 bg-white py-2 border-b mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        Events on Map (
                        {
                          filteredEvents.filter((e) => !e.location.isOnline)
                            .length
                        }
                        )
                      </h3>
                    </div>
                    <div className="flex-1 space-y-4 overflow-y-auto">
                      {(() => {
                        const physicalEvents = filteredEvents.filter(
                          (event) => !event.location.isOnline
                        );
                        const startIdx =
                          (mapSidebarPage - 1) * mapSidebarItemsPerPage;
                        const endIdx = startIdx + mapSidebarItemsPerPage;
                        const paginatedMapEvents = physicalEvents.slice(
                          startIdx,
                          endIdx
                        );

                        return paginatedMapEvents.map((event) => (
                          <Card
                            key={event.id}
                            className={cn(
                              "cursor-pointer transition-all duration-200 border-2 hover:shadow-md",
                              selectedEvent?.id === event.id
                                ? "border-purple-400 bg-purple-50 shadow-md"
                                : "border-gray-200 hover:border-purple-200"
                            )}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Image
                                  src={event.image || "/placeholder.svg"}
                                  alt={event.title}
                                  width={60}
                                  height={60}
                                  className="rounded-lg object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm text-gray-900 truncate">
                                    {event.title}
                                  </h4>
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                    {event.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(event.date).toLocaleDateString(
                                        "en-US",
                                        {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        }
                                      )}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {event.location.city}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {event.category}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ));
                      })()}
                    </div>
                    {/* Pagination controls */}
                    {(() => {
                      const physicalEvents = filteredEvents.filter(
                        (e) => !e.location.isOnline
                      );
                      const totalMapPages = Math.ceil(
                        physicalEvents.length / mapSidebarItemsPerPage
                      );

                      if (totalMapPages <= 1) return null;

                      return (
                        <div className="flex items-center justify-between gap-2 pt-4 border-t mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setMapSidebarPage((p) => Math.max(1, p - 1))
                            }
                            disabled={mapSidebarPage === 1}
                            className="h-8"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-gray-600">
                            Page {mapSidebarPage} of {totalMapPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setMapSidebarPage((p) =>
                                Math.min(totalMapPages, p + 1)
                              )
                            }
                            disabled={mapSidebarPage === totalMapPages}
                            className="h-8"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Unsave Confirmation Dialog */}
          <AlertDialog
            open={isUnsaveDialogOpen}
            onOpenChange={setIsUnsaveDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure to unsave?</AlertDialogTitle>
                <AlertDialogDescription>
                  This event will be removed from your saved events list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleUnsaveEvent}
                  disabled={isSaving}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSaving ? "Unsaving..." : "Yes, unsave"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageTransition>
      <Chatbot />
    </>
  );
}
