"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  MapPin,
  Star,
  Heart,
  Share2,
  Search,
  Grid,
  List,
  Map,
  Plus,
  TrendingUp,
  Brain,
  Clock,
  Filter,
  SlidersHorizontal,
  Bookmark,
  ArrowRight,
  Sparkles,
  Award,
  Zap,
  Globe,
  ChevronDown,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AnimatedCard } from "@/components/ui/animated-card"
import { SmoothReveal } from "@/components/ui/smooth-reveal"
import { StaggerContainer } from "@/components/ui/stagger-container"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { EnhancedChatbotWidget } from "@/components/ai/enhanced-chatbot-widget"
import { LeafletEventsMap } from "@/components/maps/leaflet-events-map"
import EventRecommendations from "@/components/events/event-recommendations"
import { FloatingElements } from "@/components/ui/floating-elements"
import { PageTransition } from "@/components/ui/page-transition"

interface Event {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  date: string
  time: string
  endTime: string
  location: {
    name: string
    address: string
    city: string
    lat: number
    lng: number
    isOnline?: boolean
  }
  organizer: {
    name: string
    avatar: string
    verified: boolean
    followers: number
  }
  attendees: number
  maxAttendees: number
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  image: string
  gallery?: string[]
  trending?: boolean
  featured?: boolean
  isNew?: boolean
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
  duration?: string
  language?: string
  certificates?: boolean
}

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [priceRange, setPriceRange] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid")
  const [sortBy, setSortBy] = useState("date")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [savedEvents, setSavedEvents] = useState<string[]>([])

  // Enhanced mock events data
  const mockEvents: Event[] = [
    {
      id: "1",
      title: "AI & Machine Learning Summit 2024",
      description:
        "Join industry leaders for cutting-edge discussions on artificial intelligence, machine learning, and the future of technology. Network with experts and discover breakthrough innovations.",
      category: "Technology",
      tags: ["AI", "Machine Learning", "Tech", "Innovation", "Networking", "Future Tech"],
      date: "2024-02-15",
      time: "09:00",
      endTime: "18:00",
      location: {
        name: "Moscone Convention Center",
        address: "747 Howard Street",
        city: "San Francisco",
        lat: 37.7749,
        lng: -122.4194,
      },
      organizer: {
        name: "TechEvents Global",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
        followers: 15420,
      },
      attendees: 847,
      maxAttendees: 1000,
      price: 299,
      originalPrice: 399,
      rating: 4.8,
      reviewCount: 156,
      image: "/placeholder.svg?height=300&width=500",
      gallery: ["/placeholder.svg?height=200&width=300", "/placeholder.svg?height=200&width=300"],
      trending: true,
      featured: true,
      isNew: false,
      difficulty: "Intermediate",
      duration: "9 hours",
      language: "English",
      certificates: true,
    },
    {
      id: "2",
      title: "Digital Marketing Masterclass",
      description:
        "Master the latest digital marketing strategies, SEO techniques, and social media marketing. Learn from industry experts and transform your marketing approach.",
      category: "Marketing",
      tags: ["Marketing", "Digital", "SEO", "Social Media", "Strategy", "Growth"],
      date: "2024-02-20",
      time: "14:00",
      endTime: "17:00",
      location: {
        name: "Marketing Hub NYC",
        address: "456 Marketing Avenue",
        city: "New York",
        lat: 40.7128,
        lng: -74.006,
      },
      organizer: {
        name: "Digital Marketing Pros",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: false,
        followers: 8750,
      },
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
      id: "3",
      title: "Startup Pitch Competition",
      description:
        "Watch innovative startups pitch their groundbreaking ideas to top-tier investors. Network with entrepreneurs and discover the next big thing in tech.",
      category: "Business",
      tags: ["Startups", "Pitch", "Investment", "Entrepreneurship", "Innovation", "Funding"],
      date: "2024-02-25",
      time: "18:00",
      endTime: "21:00",
      location: {
        name: "Innovation Center Austin",
        address: "789 Startup Boulevard",
        city: "Austin",
        lat: 30.2672,
        lng: -97.7431,
      },
      organizer: {
        name: "Startup Austin Community",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
        followers: 12300,
      },
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
      id: "4",
      title: "Virtual UX/UI Design Workshop",
      description:
        "Learn modern design principles, user research methodologies, and prototyping tools from industry experts. Perfect for designers at any level.",
      category: "Design",
      tags: ["UX", "UI", "Design", "Prototyping", "User Research", "Figma"],
      date: "2024-03-01",
      time: "10:00",
      endTime: "16:00",
      location: {
        name: "Online Event",
        address: "Virtual Platform",
        city: "Online",
        lat: 0,
        lng: 0,
        isOnline: true,
      },
      organizer: {
        name: "Design Academy",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
        followers: 9850,
      },
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
      id: "5",
      title: "Blockchain & Web3 Conference",
      description:
        "Explore the future of decentralized technology, cryptocurrency, NFTs, and DeFi. Connect with blockchain pioneers and learn about emerging opportunities.",
      category: "Technology",
      tags: ["Blockchain", "Web3", "Cryptocurrency", "NFT", "DeFi", "Crypto"],
      date: "2024-03-05",
      time: "09:30",
      endTime: "17:30",
      location: {
        name: "Miami Convention Center",
        address: "1901 Convention Center Drive",
        city: "Miami",
        lat: 25.7617,
        lng: -80.1918,
      },
      organizer: {
        name: "Blockchain Society",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
        followers: 18900,
      },
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
  ]

  const categories = [
    { value: "all", label: "All Categories", icon: "🎯" },
    { value: "technology", label: "Technology", icon: "💻" },
    { value: "business", label: "Business", icon: "💼" },
    { value: "marketing", label: "Marketing", icon: "📈" },
    { value: "design", label: "Design", icon: "🎨" },
    { value: "health", label: "Health", icon: "🏥" },
    { value: "education", label: "Education", icon: "📚" },
  ]

  const filteredEvents = useMemo(() => {
    let filtered = mockEvents

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          event.organizer.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category.toLowerCase() === selectedCategory.toLowerCase())
    }

    // Location filter
    if (selectedLocation !== "all") {
      if (selectedLocation === "online") {
        filtered = filtered.filter((event) => event.location.isOnline)
      } else {
        filtered = filtered.filter((event) => event.location.city.toLowerCase() === selectedLocation.toLowerCase())
      }
    }

    // Price filter
    if (priceRange !== "all") {
      switch (priceRange) {
        case "free":
          filtered = filtered.filter((event) => event.price === 0)
          break
        case "paid":
          filtered = filtered.filter((event) => event.price > 0)
          break
        case "under-100":
          filtered = filtered.filter((event) => event.price > 0 && event.price < 100)
          break
        case "100-300":
          filtered = filtered.filter((event) => event.price >= 100 && event.price <= 300)
          break
        case "over-300":
          filtered = filtered.filter((event) => event.price > 300)
          break
      }
    }

    // Date filter
    if (dateRange !== "all") {
      const now = new Date()
      switch (dateRange) {
        case "today":
          filtered = filtered.filter((event) => {
            const eventDate = new Date(event.date)
            return eventDate.toDateString() === now.toDateString()
          })
          break
        case "week":
          filtered = filtered.filter((event) => {
            const eventDate = new Date(event.date)
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            return eventDate >= now && eventDate <= weekFromNow
          })
          break
        case "month":
          filtered = filtered.filter((event) => {
            const eventDate = new Date(event.date)
            const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            return eventDate >= now && eventDate <= monthFromNow
          })
          break
      }
    }

    // Sort events
    switch (sortBy) {
      case "date":
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        break
      case "popularity":
        filtered.sort((a, b) => b.attendees - a.attendees)
        break
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
    }

    return filtered
  }, [searchQuery, selectedCategory, selectedLocation, priceRange, dateRange, sortBy])

  const toggleSaveEvent = (eventId: string) => {
    setSavedEvents((prev) => (prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]))
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (selectedCategory !== "all") count++
    if (selectedLocation !== "all") count++
    if (priceRange !== "all") count++
    if (dateRange !== "all") count++
    return count
  }

  const clearFilters = () => {
    setSelectedCategory("all")
    setSelectedLocation("all")
    setPriceRange("all")
    setDateRange("all")
    setSearchQuery("")
  }

  const EnhancedEventCard = ({ event, isListView = false }: { event: Event; isListView?: boolean }) => {
    const attendancePercentage = (event.attendees / event.maxAttendees) * 100
    const isSaved = savedEvents.includes(event.id)

    return (
      <AnimatedCard
        variant="3d"
        className={cn(
          "group cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-2xl border-0",
          isListView ? "flex flex-row h-64" : "h-full",
        )}
      >
        <div className={cn("relative overflow-hidden", isListView ? "w-80 flex-shrink-0" : "h-64")}>
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            width={500}
            height={300}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {event.featured && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 font-semibold">
                <Award className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {event.trending && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 font-semibold">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {event.isNew && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 font-semibold">
                <Sparkles className="w-3 h-3 mr-1" />
                New
              </Badge>
            )}
            {event.location.isOnline && (
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 font-semibold">
                <Globe className="w-3 h-3 mr-1" />
                Online
              </Badge>
            )}
          </div>

          {/* Top Right Actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                toggleSaveEvent(event.id)
              }}
            >
              <Heart className={cn("h-4 w-4", isSaved && "fill-red-500 text-red-500")} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 rounded-full"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end justify-between">
              <div className="text-white">
                <div className="text-2xl font-bold">
                  {event.price === 0 ? "Free" : `$${event.price}`}
                  {event.originalPrice && (
                    <span className="text-sm line-through text-gray-300 ml-2">${event.originalPrice}</span>
                  )}
                </div>
                <div className="text-sm opacity-90">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div className="text-right text-white">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{event.rating}</span>
                  <span className="text-sm opacity-75">({event.reviewCount})</span>
                </div>
                <div className="text-sm opacity-90">{event.difficulty}</div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className={cn("p-6 flex-1", isListView ? "flex flex-col justify-between" : "")}>
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="secondary" className="mb-2 font-medium">
                {event.category}
              </Badge>
              {event.certificates && (
                <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                  <Award className="w-3 h-3 mr-1" />
                  Certificate
                </Badge>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300 line-clamp-2 mb-2">
              {event.title}
            </h3>

            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">{event.description}</p>
          </div>

          {/* Event Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>
                  {event.time} - {event.endTime}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="truncate">
                  {event.location.name}, {event.location.city}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <span>{event.duration}</span>
              </div>
            </div>

            {/* Attendance Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Attendance</span>
                <span className="font-medium text-gray-900">
                  {event.attendees}/{event.maxAttendees} people
                </span>
              </div>
              <Progress value={attendancePercentage} className="h-2 bg-gray-100">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </Progress>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{Math.round(attendancePercentage)}% full</span>
                <span>{event.maxAttendees - event.attendees} spots left</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.slice(0, isListView ? 6 : 4).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors"
              >
                {tag}
              </Badge>
            ))}
            {event.tags.length > (isListView ? 6 : 4) && (
              <Badge variant="outline" className="text-xs">
                +{event.tags.length - (isListView ? 6 : 4)} more
              </Badge>
            )}
          </div>

          {/* Organizer */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 ring-2 ring-purple-100">
                <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs bg-gradient-to-r from-purple-400 to-blue-400 text-white">
                  {event.organizer.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{event.organizer.name}</span>
                  {event.organizer.verified && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">{event.organizer.followers.toLocaleString()} followers</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50">
              <Bookmark className="h-4 w-4 mr-2" />
              Save for Later
            </Button>
            <Link href={`/events/${event.id}`} className="flex-1">
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold"
              >
                View Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </AnimatedCard>
    )
  }

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
                  Join thousands of professionals, creators, and innovators at events that inspire, educate, and connect
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
                  <div className="text-purple-200 text-sm">Events Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    <AnimatedCounter end={filteredEvents.filter((e) => e.trending).length} />
                  </div>
                  <div className="text-purple-200 text-sm">Trending Now</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    <AnimatedCounter end={filteredEvents.filter((e) => e.price === 0).length} />
                  </div>
                  <div className="text-purple-200 text-sm">Free Events</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    <AnimatedCounter end={filteredEvents.filter((e) => e.location.isOnline).length} />
                  </div>
                  <div className="text-purple-200 text-sm">Online Events</div>
                </div>
              </div>
            </SmoothReveal>

            {/* Enhanced Search Bar */}
            <SmoothReveal delay={300}>
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search events, topics, or organizers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-4 text-lg bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg focus:shadow-xl transition-all duration-300"
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
              </div>
            </SmoothReveal>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  {categories.slice(0, 6).map((category) => (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.value)}
                      className={cn(
                        "text-sm font-medium transition-all duration-200",
                        selectedCategory === category.value
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                          : "hover:bg-purple-50 hover:border-purple-200",
                      )}
                    >
                      <span className="mr-1">{category.icon}</span>
                      {category.label}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-200"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  More Filters
                  {getActiveFiltersCount() > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-600">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
                </Button>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-4">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                  <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                    <TabsTrigger value="grid" className="flex items-center gap-2">
                      <Grid className="h-4 w-4" />
                      Grid
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      List
                    </TabsTrigger>
                    <TabsTrigger value="map" className="flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      Map
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">📅 Date</SelectItem>
                    <SelectItem value="popularity">🔥 Popularity</SelectItem>
                    <SelectItem value="rating">⭐ Rating</SelectItem>
                    <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                    <SelectItem value="price-high">💎 Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>

                <Link href="/events/create">
                  <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <SmoothReveal>
                <div className="mt-6 p-6 bg-gray-50 rounded-2xl border">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">🌍 All Locations</SelectItem>
                          <SelectItem value="online">💻 Online</SelectItem>
                          <SelectItem value="san francisco">🌉 San Francisco</SelectItem>
                          <SelectItem value="new york">🗽 New York</SelectItem>
                          <SelectItem value="austin">🤠 Austin</SelectItem>
                          <SelectItem value="miami">🏖️ Miami</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Prices" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">💸 All Prices</SelectItem>
                          <SelectItem value="free">🆓 Free</SelectItem>
                          <SelectItem value="under-100">💵 Under $100</SelectItem>
                          <SelectItem value="100-300">💰 $100 - $300</SelectItem>
                          <SelectItem value="over-300">💎 Over $300</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Dates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">📅 All Dates</SelectItem>
                          <SelectItem value="today">📍 Today</SelectItem>
                          <SelectItem value="week">📆 This Week</SelectItem>
                          <SelectItem value="month">🗓️ This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </SmoothReveal>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 lg:w-96 bg-white shadow-sm">
              <TabsTrigger value="all" className="font-medium">
                All Events
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2 font-medium">
                <Brain className="h-4 w-4" />
                For You
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center gap-2 font-medium">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2 font-medium">
                <Heart className="h-4 w-4" />
                Saved
              </TabsTrigger>
            </TabsList>

            {/* All Events Tab */}
            <TabsContent value="all" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Discover Events ({filteredEvents.length})</h2>
                  <p className="text-gray-600 mt-1">Find your next amazing experience</p>
                </div>
              </div>

              {viewMode === "map" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <LeafletEventsMap
                      events={filteredEvents}
                      selectedEvent={selectedEvent}
                      onEventSelect={setSelectedEvent}
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
                            : "border-gray-200 hover:border-purple-200",
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
                              <h4 className="font-semibold text-sm text-gray-900 truncate">{event.title}</h4>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{event.description}</p>
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
              ) : (
                <StaggerContainer
                  className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" : "space-y-8"}
                >
                  {filteredEvents.map((event, index) => (
                    <div key={event.id} className="stagger-item">
                      <EnhancedEventCard event={event} isListView={viewMode === "list"} />
                    </div>
                  ))}
                </StaggerContainer>
              )}

              {filteredEvents.length === 0 && (
                <SmoothReveal>
                  <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                    <CardContent>
                      <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
                      <p className="text-gray-600 mb-6">
                        Try adjusting your search criteria or filters to find more events
                      </p>
                      <Button onClick={clearFilters} className="bg-gradient-to-r from-purple-500 to-blue-500">
                        <Filter className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    </CardContent>
                  </Card>
                </SmoothReveal>
              )}
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations">
              <EventRecommendations />
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved events yet</h3>
                      <p className="text-gray-600 mb-6">Save events you're interested in to view them here later</p>
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
          </Tabs>
        </div>

        <EnhancedChatbotWidget context="events" size="normal" />
      </div>
    </PageTransition>
  )
}
