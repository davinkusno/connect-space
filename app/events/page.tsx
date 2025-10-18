"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  MapPin,
  Star,
  Heart,
  Share2,
  Search,
  Map,
  Plus,
  TrendingUp,
  Brain,
  Clock,
  Filter,
  Bookmark,
  ArrowRight,
  Sparkles,
  Award,
  Zap,
  Globe,
  X,
  Users,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnimatedCard } from "@/components/ui/animated-card";
import { SmoothReveal } from "@/components/ui/smooth-reveal";
import { StaggerContainer } from "@/components/ui/stagger-container";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { EnhancedChatbotWidget } from "@/components/ai/enhanced-chatbot-widget";
import { LeafletEventsMap } from "@/components/maps/leaflet-events-map";
import { FloatingElements } from "@/components/ui/floating-elements";
import { PageTransition } from "@/components/ui/page-transition";

interface Event {
  id: number;
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
  maxAttendees: number;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  gallery?: string[];
  trending?: boolean;
  featured: boolean;
  isNew?: boolean;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  duration?: string;
  language?: string;
  certificates?: boolean;
}

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city: string;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [searchFilter, setSearchFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [savedEvents, setSavedEvents] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Enhanced mock events data
  const mockEvents: Event[] = [
    {
      id: 1,
      title: "AI & Machine Learning Summit 2024",
      description:
        "Join industry leaders for cutting-edge discussions on artificial intelligence, machine learning, and the future of technology. Network with experts and discover breakthrough innovations.",
      category: "Technology",
      tags: [
        "AI",
        "Machine Learning",
        "Tech",
        "Innovation",
        "Networking",
        "Future Tech",
      ],
      date: "2024-02-15",
      time: "09:00",
      endTime: "18:00",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: "747 Howard Street",
        venue: "Moscone Convention Center",
        city: "San Francisco",
      },
      organizer: "TechEvents Global",
      attendees: 847,
      maxAttendees: 1000,
      price: 299,
      originalPrice: 399,
      rating: 4.8,
      reviewCount: 156,
      image: "/placeholder.svg?height=300&width=500",
      gallery: [
        "/placeholder.svg?height=200&width=300",
        "/placeholder.svg?height=200&width=300",
      ],
      trending: true,
      featured: true,
      isNew: false,
      difficulty: "Intermediate",
      duration: "9 hours",
      language: "English",
      certificates: true,
    },
    {
      id: 2,
      title: "Digital Marketing Masterclass",
      description:
        "Master the latest digital marketing strategies, SEO techniques, and social media marketing. Learn from industry experts and transform your marketing approach.",
      category: "Marketing",
      tags: [
        "Marketing",
        "Digital",
        "SEO",
        "Social Media",
        "Strategy",
        "Growth",
      ],
      date: "2024-02-20",
      time: "14:00",
      endTime: "17:00",
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        address: "456 Marketing Avenue",
        venue: "Marketing Hub NYC",
        city: "New York",
      },
      organizer: "Digital Marketing Pros",
      attendees: 234,
      maxAttendees: 300,
      price: 149,
      rating: 4.6,
      reviewCount: 89,
      image: "/placeholder.svg?height=300&width=500",
      trending: false,
      featured: false,
      isNew: true,
      difficulty: "Beginner",
      duration: "3 hours",
      language: "English",
      certificates: false,
    },
    {
      id: 3,
      title: "Startup Pitch Competition",
      description:
        "Watch innovative startups pitch their groundbreaking ideas to top-tier investors. Network with entrepreneurs and discover the next big thing in tech.",
      category: "Business",
      tags: [
        "Startups",
        "Pitch",
        "Investment",
        "Entrepreneurship",
        "Innovation",
        "Funding",
      ],
      date: "2024-02-25",
      time: "18:00",
      endTime: "21:00",
      location: {
        latitude: 30.2672,
        longitude: -97.7431,
        address: "789 Startup Boulevard",
        venue: "Innovation Center Austin",
        city: "Austin",
      },
      organizer: "Startup Austin Community",
      attendees: 156,
      maxAttendees: 200,
      price: 0,
      rating: 4.7,
      reviewCount: 67,
      image: "/placeholder.svg?height=300&width=500",
      trending: true,
      featured: false,
      isNew: false,
      difficulty: "Intermediate",
      duration: "3 hours",
      language: "English",
      certificates: false,
    },
    {
      id: 4,
      title: "Virtual UX/UI Design Workshop",
      description:
        "Learn modern design principles, user research methodologies, and prototyping tools from industry experts. Perfect for designers at any level.",
      category: "Design",
      tags: ["UX", "UI", "Design", "Prototyping", "User Research", "Figma"],
      date: "2024-03-01",
      time: "10:00",
      endTime: "16:00",
      location: {
        latitude: 0,
        longitude: 0,
        address: "Virtual Platform",
        venue: "Online Event",
        city: "Online",
        isOnline: true,
      },
      organizer: "Design Academy",
      attendees: 445,
      maxAttendees: 500,
      price: 99,
      originalPrice: 149,
      rating: 4.9,
      reviewCount: 203,
      image: "/placeholder.svg?height=300&width=500",
      trending: false,
      featured: true,
      isNew: true,
      difficulty: "Beginner",
      duration: "6 hours",
      language: "English",
      certificates: true,
    },
    {
      id: 5,
      title: "Blockchain & Web3 Conference",
      description:
        "Explore the future of decentralized technology, cryptocurrency, NFTs, and DeFi. Connect with blockchain pioneers and learn about emerging opportunities.",
      category: "Technology",
      tags: ["Blockchain", "Web3", "Cryptocurrency", "NFT", "DeFi", "Crypto"],
      date: "2024-03-05",
      time: "09:30",
      endTime: "17:30",
      location: {
        latitude: 25.7617,
        longitude: -80.1918,
        address: "1901 Convention Center Drive",
        venue: "Miami Convention Center",
        city: "Miami",
      },
      organizer: "Blockchain Society",
      attendees: 567,
      maxAttendees: 800,
      price: 399,
      rating: 4.7,
      reviewCount: 134,
      image: "/placeholder.svg?height=300&width=500",
      trending: true,
      featured: true,
      isNew: false,
      difficulty: "Advanced",
      duration: "8 hours",
      language: "English",
      certificates: true,
    },
    {
      id: 6,
      title: "AI in Healthcare Summit 2024",
      description:
        "Join industry leaders for an insightful exploration of AI's transformative potential in healthcare.",
      category: "Technology",
      tags: ["AI", "Healthcare", "Technology", "Innovation", "Networking"],
      date: "2024-03-15",
      time: "09:00",
      endTime: "17:00",
      location: {
        latitude: 0,
        longitude: 0,
        address: "Online Platform",
        venue: "Virtual Event",
        city: "Online",
        isOnline: true,
      },
      organizer: "HealthTech Innovations",
      attendees: 347,
      maxAttendees: 500,
      price: 299,
      rating: 4.8,
      reviewCount: 127,
      image: "/placeholder.svg?height=300&width=500",
      trending: false,
      featured: true,
      isNew: true,
      difficulty: "Intermediate",
      duration: "8 hours",
      language: "English",
      certificates: true,
    },
  ];

  const categories = [
    { value: "all", label: "All Categories", icon: "🎯" },
    { value: "technology", label: "Technology", icon: "💻" },
    { value: "business", label: "Business", icon: "💼" },
    { value: "marketing", label: "Marketing", icon: "📈" },
    { value: "design", label: "Design", icon: "🎨" },
    { value: "health", label: "Health", icon: "🏥" },
    { value: "education", label: "Education", icon: "📚" },
  ];

  const filteredEvents = useMemo(() => {
    let filtered = mockEvents;

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

    // General search filter (for events search)
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          event.organizer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (event) =>
          event.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Location filter
    if (selectedLocation !== "all") {
      if (selectedLocation === "online") {
        filtered = filtered.filter((event) => event.location.isOnline);
      } else {
        filtered = filtered.filter(
          (event) =>
            event.location.city.toLowerCase() === selectedLocation.toLowerCase()
        );
      }
    }

    // Price filter
    if (priceRange !== "all") {
      switch (priceRange) {
        case "free":
          filtered = filtered.filter((event) => event.price === 0);
          break;
        case "paid":
          filtered = filtered.filter((event) => event.price > 0);
          break;
        case "under-100":
          filtered = filtered.filter(
            (event) => event.price > 0 && event.price < 100
          );
          break;
        case "100-300":
          filtered = filtered.filter(
            (event) => event.price >= 100 && event.price <= 300
          );
          break;
        case "over-300":
          filtered = filtered.filter((event) => event.price > 300);
          break;
      }
    }

    // Date filter
    if (dateRange !== "all") {
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
    searchQuery,
    locationQuery,
    selectedCategory,
    selectedLocation,
    priceRange,
    dateRange,
  ]);

  const toggleSaveEvent = (eventId: number) => {
    setSavedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocoding to get city name (simplified)
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();

            setUserLocation({
              lat: latitude,
              lng: longitude,
              city: data.city || data.locality || "Current Location",
            });
          } catch (error) {
            setUserLocation({
              lat: latitude,
              lng: longitude,
              city: "Current Location",
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (selectedLocation !== "all") count++;
    if (priceRange !== "all") count++;
    if (dateRange !== "all") count++;
    return count;
  };

  // Get user location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Debug log for showLocationDropdown state changes
  useEffect(() => {
    console.log("showLocationDropdown changed to:", showLocationDropdown);
  }, [showLocationDropdown]);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedLocation("all");
    setPriceRange("all");
    setDateRange("all");
    setSearchQuery("");
  };

  const EnhancedEventCard = ({
    event,
    isListView = false,
  }: {
    event: Event;
    isListView?: boolean;
  }) => {
    const isSaved = savedEvents.includes(event.id);

    return (
      <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            width={500}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Price Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-white text-gray-900 font-semibold shadow-sm">
              {event.price === 0 ? "Free" : `$${event.price}`}
            </Badge>
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
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isSaved ? "fill-red-500 text-red-500" : "text-gray-600"
              )}
            />
          </Button>
        </div>

        <CardContent className="p-4">
          {/* Category Badge */}
          <Badge variant="secondary" className="mb-3">
            {event.category}
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
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(event.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
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
              <span>{event.attendees} attending</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Award className="h-4 w-4" />
              <span className="truncate">{event.organizer}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                toggleSaveEvent(event.id);
              }}
            >
              <Heart
                className={cn(
                  "h-4 w-4 mr-2",
                  isSaved && "fill-red-500 text-red-500"
                )}
              />
              {isSaved ? "Saved" : "Save"}
            </Button>
            <Link href={`/events/${event.id}`} className="flex-1">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
                      end={filteredEvents.filter((e) => e.trending).length}
                    />
                  </div>
                  <div className="text-purple-200 text-sm">Trending Now</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    <AnimatedCounter
                      end={filteredEvents.filter((e) => e.price === 0).length}
                    />
                  </div>
                  <div className="text-purple-200 text-sm">Free Events</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    <AnimatedCounter
                      end={
                        filteredEvents.filter((e) => e.location.isOnline).length
                      }
                    />
                  </div>
                  <div className="text-purple-200 text-sm">Online Events</div>
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
                      onClick={() => {
                        console.log("Location input clicked, showing dropdown");
                        setShowLocationDropdown(true);
                        console.log("showLocationDropdown set to true");
                      }}
                      onFocus={() => {
                        console.log("Location input focused, showing dropdown");
                        setShowLocationDropdown(true);
                        console.log(
                          "showLocationDropdown state:",
                          showLocationDropdown
                        );
                      }}
                      onBlur={() => {
                        console.log(
                          "Location input blurred, hiding dropdown in 500ms"
                        );
                        // Delay closing to allow clicking on dropdown items
                        setTimeout(() => {
                          console.log("Hiding dropdown now");
                          setShowLocationDropdown(false);
                        }, 0);
                      }}
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

                    {/* Location Dropdown - Simple Version */}
                    {showLocationDropdown && (
                      <div
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-[99999] overflow-hidden"
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: "8px",
                          zIndex: 99999,
                        }}
                      >
                        <button
                          onClick={() => {
                            console.log("Use current location clicked");
                            getUserLocation();
                            if (userLocation) {
                              setLocationQuery(userLocation.city);
                            }
                            setShowLocationDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <svg
                            className="w-5 h-5 text-gray-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 18.93A7.005 7.005 0 015.07 13H3v-2h2.07A7.005 7.005 0 0111 5.07V3h2v2.07A7.005 7.005 0 0118.93 11H21v2h-2.07A7.005 7.005 0 0113 18.93V21h-2v-2.07zM12 17a5 5 0 100-10 5 5 0 000 10zm0-3a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              Use my current location
                            </div>
                          </div>
                        </button>
                      </div>
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
                      <SelectItem value="recommendations">For You</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="map">Map View</SelectItem>
                      <SelectItem value="saved">Saved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Center: Categories (Horizontal Scroll - Centered) */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-center gap-4 overflow-x-auto scrollbar-hide">
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => setSelectedCategory(category.value)}
                        className={cn(
                          "text-sm font-medium whitespace-nowrap transition-colors",
                          selectedCategory === category.value
                            ? "text-gray-900 underline underline-offset-8 decoration-2"
                            : "text-gray-600 hover:text-gray-900"
                        )}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Filters Button & Create */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "h-10 px-4 rounded-lg border-gray-300 font-medium",
                      getActiveFiltersCount() > 0 &&
                        "border-purple-600 text-purple-600"
                    )}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {getActiveFiltersCount() > 0 && (
                      <span className="ml-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {getActiveFiltersCount()}
                      </span>
                    )}
                  </Button>

              </div>

              {/* Collapsible Filters Panel */}
              {showFilters && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">
                        Location
                      </label>
                      <Select
                        value={selectedLocation}
                        onValueChange={setSelectedLocation}
                      >
                        <SelectTrigger className="w-[160px] h-9 text-sm bg-white border-gray-300 rounded-lg">
                          <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="san francisco">
                            San Francisco
                          </SelectItem>
                          <SelectItem value="new york">New York</SelectItem>
                          <SelectItem value="austin">Austin</SelectItem>
                          <SelectItem value="miami">Miami</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">
                        Price
                      </label>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger className="w-[140px] h-9 text-sm bg-white border-gray-300 rounded-lg">
                          <SelectValue placeholder="All Prices" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Prices</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="under-100">Under $100</SelectItem>
                          <SelectItem value="100-300">$100 - $300</SelectItem>
                          <SelectItem value="over-300">Over $300</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">
                        Date
                      </label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[140px] h-9 text-sm bg-white border-gray-300 rounded-lg">
                          <SelectValue placeholder="All Dates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Dates</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {filteredEvents.length}
                        </span>{" "}
                        events
                      </span>
                      {getActiveFiltersCount() > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-9 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                {filteredEvents.map((event, index) => (
                  <div key={event.id} className="stagger-item">
                    <EnhancedEventCard event={event} />
                  </div>
                ))}
              </StaggerContainer>

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

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    Personalized Recommendations
                  </h2>
                  <p className="text-gray-600">
                    AI-powered suggestions based on your interests and
                    preferences
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-600"
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    AI Powered
                  </Badge>
                </div>
              </div>

              {/* Recommended Events Grid */}
              {filteredEvents.length > 0 ? (
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredEvents.map((event, index) => {
                    const isSaved = savedEvents.includes(event.id);

                    return (
                      <div key={event.id} className="stagger-item">
                        <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow border border-purple-200">
                          <div className="relative h-48 overflow-hidden">
                            <Image
                              src={event.image || "/placeholder.svg"}
                              alt={event.title}
                              width={500}
                              height={300}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* AI Recommended Badge */}
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 flex items-center gap-1 shadow-md">
                                <Brain className="h-3 w-3" />
                                AI Recommended
                              </Badge>
                            </div>

                            {/* Price Badge */}
                            <div className="absolute bottom-3 left-3">
                              <Badge className="bg-white text-gray-900 font-semibold shadow-sm">
                                {event.price === 0 ? "Free" : `$${event.price}`}
                              </Badge>
                            </div>

                            {/* Save Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute bottom-3 right-3 h-8 w-8 p-0 bg-white/90 hover:bg-white rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveEvent(event.id);
                              }}
                            >
                              <Heart
                                className={cn(
                                  "h-4 w-4",
                                  isSaved
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-600"
                                )}
                              />
                            </Button>
                          </div>

                          <CardContent className="p-4">
                            {/* Category Badge */}
                            <Badge variant="secondary" className="mb-3">
                              {event.category}
                            </Badge>

                            {/* Title */}
                            <Link href={`/events/${event.id}`}>
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2 mb-2">
                                {event.title}
                              </h3>
                            </Link>

                            {/* Description */}
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {event.description}
                            </p>

                            {/* AI Explanation */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-2 mb-4">
                              <div className="flex items-start gap-2">
                                <Brain className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-purple-700">
                                  Based on your interest in{" "}
                                  {event.category.toLowerCase()} events
                                </p>
                              </div>
                            </div>

                            {/* Event Info */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
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
                                <span>
                                  {event.time} - {event.endTime}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">
                                  {event.location.city}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="h-4 w-4" />
                                <span>{event.attendees} attending</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Award className="h-4 w-4" />
                                <span className="truncate">
                                  {event.organizer}
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
                                  toggleSaveEvent(event.id);
                                }}
                              >
                                <Heart
                                  className={cn(
                                    "h-4 w-4 mr-2",
                                    isSaved && "fill-red-500 text-red-500"
                                  )}
                                />
                                {isSaved ? "Saved" : "Save"}
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
                      </div>
                    );
                  })}
                </StaggerContainer>
              ) : (
                <SmoothReveal>
                  <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                    <CardContent>
                      <Brain className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No AI recommendations yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Attend some events and save your favorites to get
                        personalized recommendations
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
              )}
            </TabsContent>

            {/* Trending Tab */}
            <TabsContent value="trending" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  Trending Events
                </h2>
              </div>

              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredEvents
                  .filter((event) => event.trending)
                  .map((event, index) => (
                    <div key={event.id} className="stagger-item">
                      <EnhancedEventCard event={event} />
                    </div>
                  ))}
              </StaggerContainer>
            </TabsContent>

            {/* Saved Tab */}
            <TabsContent value="saved" className="space-y-6">
              {savedEvents.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg">
                        <Heart className="h-6 w-6 text-white" />
                      </div>
                      Saved Events ({savedEvents.length})
                    </h2>
                  </div>

                  <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredEvents
                      .filter((event) => savedEvents.includes(event.id))
                      .map((event, index) => (
                        <div key={event.id} className="stagger-item">
                          <EnhancedEventCard event={event} />
                        </div>
                      ))}
                  </StaggerContainer>
                </>
              ) : (
                <SmoothReveal>
                  <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                    <CardContent>
                      <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No saved events yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Save events you're interested in to view them here later
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
              )}
            </TabsContent>

            {/* Events on Map Tab */}
            <TabsContent value="map" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                    <Map className="h-6 w-6 text-white" />
                  </div>
                  Events on Map ({filteredEvents.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <LeafletEventsMap
                    events={filteredEvents}
                    selectedEvent={selectedEvent}
                    onEventSelect={(event) => setSelectedEvent(event)}
                    userLocation={userLocation}
                    height="700px"
                    className="rounded-2xl shadow-lg border"
                  />
                </div>
                <div className="space-y-4 max-h-[700px] overflow-y-auto">
                  <h3 className="text-xl font-bold text-gray-900 sticky top-0 bg-white py-2">
                    Events on Map ({filteredEvents.length})
                  </h3>
                  {filteredEvents.map((event) => (
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
                                {new Date(event.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location.city}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {event.category}
                              </Badge>
                              <span className="text-sm font-bold text-purple-600">
                                {event.price === 0 ? "Free" : `$${event.price}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <EnhancedChatbotWidget context="events" size="normal" />
      </div>
    </PageTransition>
  );
}
