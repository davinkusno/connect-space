"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  MapPin,
  Users,
  Star,
  Heart,
  Share2,
  TrendingUp,
  Brain,
  UserCheck,
  Sparkles,
  Filter,
  RefreshCw,
  Info,
  ChevronRight,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AnimatedCard } from "@/components/ui/animated-card"
import { SmoothReveal } from "@/components/ui/smooth-reveal"
import { StaggerContainer } from "@/components/ui/stagger-container"
import { AnimatedCounter } from "@/components/ui/animated-counter"

interface Event {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  date: string
  time: string
  location: {
    name: string
    address: string
    city: string
    lat: number
    lng: number
  }
  organizer: {
    name: string
    avatar: string
    verified: boolean
  }
  attendees: number
  maxAttendees: number
  price: number
  rating: number
  image: string
  isRecommended?: boolean
  recommendationScore?: number
  recommendationReason?: string
  recommendationMethod?: string
  trending?: boolean
  featured?: boolean
}

interface RecommendationFilters {
  algorithm: string
  confidenceThreshold: number
  showExplanations: boolean
  categories: string[]
  maxDistance: number
  priceRange: [number, number]
  dateRange: string
}

const defaultFilters: RecommendationFilters = {
  algorithm: "all",
  confidenceThreshold: 0.7,
  showExplanations: true,
  categories: [],
  maxDistance: 25,
  priceRange: [0, 200],
  dateRange: "all",
}

export default function EventRecommendations() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<RecommendationFilters>(defaultFilters)
  const [userPreferences, setUserPreferences] = useState({
    interests: ["Technology", "Business", "Networking"],
    location: "New York",
    attendedEvents: ["1", "3", "5"],
    savedEvents: ["2", "4"],
  })

  // Mock recommended events data
  const mockRecommendedEvents: Event[] = [
    {
      id: "rec-1",
      title: "AI & Machine Learning Summit 2024",
      description: "Join industry leaders for cutting-edge discussions on AI, ML, and the future of technology.",
      category: "Technology",
      tags: ["AI", "Machine Learning", "Tech", "Innovation", "Networking"],
      date: "2024-02-15",
      time: "09:00",
      location: {
        name: "Tech Convention Center",
        address: "123 Innovation Drive",
        city: "San Francisco",
        lat: 37.7749,
        lng: -122.4194,
      },
      organizer: {
        name: "TechEvents Inc",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
      },
      attendees: 847,
      maxAttendees: 1000,
      price: 299,
      rating: 4.8,
      image: "/placeholder.svg?height=200&width=300",
      isRecommended: true,
      recommendationScore: 0.95,
      recommendationReason: "Matches your interest in AI and technology events",
      recommendationMethod: "content_based",
      trending: true,
      featured: true,
    },
    {
      id: "rec-2",
      title: "Startup Founders Networking Mixer",
      description: "Connect with fellow entrepreneurs, investors, and startup enthusiasts in an intimate setting.",
      category: "Business",
      tags: ["Startups", "Networking", "Entrepreneurship", "Investors", "Business"],
      date: "2024-02-20",
      time: "18:00",
      location: {
        name: "Innovation Hub",
        address: "456 Startup Street",
        city: "New York",
        lat: 40.7128,
        lng: -74.006,
      },
      organizer: {
        name: "Startup Community NYC",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
      },
      attendees: 156,
      maxAttendees: 200,
      price: 0,
      rating: 4.6,
      image: "/placeholder.svg?height=200&width=300",
      isRecommended: true,
      recommendationScore: 0.87,
      recommendationReason: "Users with similar interests also attended this event",
      recommendationMethod: "collaborative_filtering",
      trending: false,
      featured: false,
    },
    {
      id: "rec-3",
      title: "Digital Marketing Masterclass",
      description: "Learn advanced digital marketing strategies from industry experts and grow your business.",
      category: "Marketing",
      tags: ["Digital Marketing", "SEO", "Social Media", "Business Growth", "Strategy"],
      date: "2024-02-25",
      time: "14:00",
      location: {
        name: "Business Center",
        address: "789 Marketing Ave",
        city: "Los Angeles",
        lat: 34.0522,
        lng: -118.2437,
      },
      organizer: {
        name: "Marketing Pros",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: false,
      },
      attendees: 234,
      maxAttendees: 300,
      price: 149,
      rating: 4.4,
      image: "/placeholder.svg?height=200&width=300",
      isRecommended: true,
      recommendationScore: 0.78,
      recommendationReason: "Popular among professionals in your network",
      recommendationMethod: "popularity_based",
      trending: true,
      featured: false,
    },
    {
      id: "rec-4",
      title: "Web3 & Blockchain Conference",
      description: "Explore the future of decentralized technology, NFTs, and cryptocurrency innovations.",
      category: "Technology",
      tags: ["Blockchain", "Web3", "Cryptocurrency", "NFT", "DeFi"],
      date: "2024-03-05",
      time: "10:00",
      location: {
        name: "Crypto Arena",
        address: "321 Blockchain Blvd",
        city: "Miami",
        lat: 25.7617,
        lng: -80.1918,
      },
      organizer: {
        name: "Blockchain Society",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
      },
      attendees: 567,
      maxAttendees: 800,
      price: 399,
      rating: 4.7,
      image: "/placeholder.svg?height=200&width=300",
      isRecommended: true,
      recommendationScore: 0.82,
      recommendationReason: "Based on your technology event attendance history",
      recommendationMethod: "content_based",
      trending: true,
      featured: true,
    },
    {
      id: "rec-5",
      title: "UX/UI Design Workshop",
      description: "Hands-on workshop covering modern design principles, user research, and prototyping tools.",
      category: "Design",
      tags: ["UX", "UI", "Design", "Prototyping", "User Research"],
      date: "2024-03-10",
      time: "13:00",
      location: {
        name: "Design Studio",
        address: "654 Creative Lane",
        city: "Seattle",
        lat: 47.6062,
        lng: -122.3321,
      },
      organizer: {
        name: "Design Collective",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
      },
      attendees: 89,
      maxAttendees: 120,
      price: 199,
      rating: 4.9,
      image: "/placeholder.svg?height=200&width=300",
      isRecommended: true,
      recommendationScore: 0.73,
      recommendationReason: "Trending in your area with high ratings",
      recommendationMethod: "popularity_based",
      trending: false,
      featured: false,
    },
  ]

  useEffect(() => {
    loadRecommendations()
  }, [filters])

  const loadRecommendations = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))
      setEvents(mockRecommendedEvents)
    } catch (error) {
      console.error("Failed to load recommendations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEvents = useMemo(() => {
    let filtered = events

    // Filter by algorithm type
    if (filters.algorithm !== "all") {
      filtered = filtered.filter((event) => event.recommendationMethod === filters.algorithm)
    }

    // Filter by confidence threshold
    filtered = filtered.filter((event) => (event.recommendationScore || 0) >= filters.confidenceThreshold)

    // Filter by categories
    if (filters.categories.length > 0) {
      filtered = filtered.filter((event) => filters.categories.includes(event.category))
    }

    // Filter by price range
    filtered = filtered.filter((event) => event.price >= filters.priceRange[0] && event.price <= filters.priceRange[1])

    // Filter by date range
    if (filters.dateRange !== "all") {
      const now = new Date()
      const eventDate = new Date(filtered[0]?.date || now)

      switch (filters.dateRange) {
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

    return filtered
  }, [events, filters])

  const getAlgorithmIcon = (method: string) => {
    switch (method) {
      case "collaborative_filtering":
        return <UserCheck className="h-4 w-4" />
      case "content_based":
        return <Brain className="h-4 w-4" />
      case "popularity_based":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  const getAlgorithmLabel = (method: string) => {
    switch (method) {
      case "collaborative_filtering":
        return "Similar Users"
      case "content_based":
        return "Your Interests"
      case "popularity_based":
        return "Trending"
      default:
        return "Hybrid"
    }
  }

  const getAlgorithmColor = (method: string) => {
    switch (method) {
      case "collaborative_filtering":
        return "bg-blue-500"
      case "content_based":
        return "bg-purple-500"
      case "popularity_based":
        return "bg-orange-500"
      default:
        return "bg-green-500"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <SmoothReveal>
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Recommended Events
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover events tailored to your interests using our intelligent recommendation system
          </p>
        </div>
      </SmoothReveal>

      {/* Filters */}
      <SmoothReveal delay={200}>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Algorithm Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Recommendation Type</Label>
              <Select value={filters.algorithm} onValueChange={(value) => setFilters({ ...filters, algorithm: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Recommendations</SelectItem>
                  <SelectItem value="collaborative_filtering">Similar Users</SelectItem>
                  <SelectItem value="content_based">Your Interests</SelectItem>
                  <SelectItem value="popularity_based">Trending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Confidence Threshold */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Confidence: {Math.round(filters.confidenceThreshold * 100)}%
              </Label>
              <Slider
                value={[filters.confidenceThreshold]}
                onValueChange={(value) => setFilters({ ...filters, confidenceThreshold: value[0] })}
                max={1}
                min={0.5}
                step={0.05}
                className="w-full"
              />
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Time Frame</Label>
              <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time frame" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Upcoming</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Explanations Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="explanations" className="text-sm font-medium">
                Show Explanations
              </Label>
              <Switch
                id="explanations"
                checked={filters.showExplanations}
                onCheckedChange={(checked) => setFilters({ ...filters, showExplanations: checked })}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <AnimatedCounter end={filteredEvents.length} /> recommended events found
            </div>
            <Button variant="outline" onClick={loadRecommendations} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </Card>
      </SmoothReveal>

      {/* Recommendations Grid */}
      <SmoothReveal delay={400}>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="stagger-item">
                <AnimatedCard variant="3d" className="group cursor-pointer h-full">
                  <div className="relative overflow-hidden h-48">
                    <Image
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      width={400}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Algorithm Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge
                        className={cn(
                          "text-white border-0 flex items-center gap-1",
                          getAlgorithmColor(event.recommendationMethod || ""),
                        )}
                      >
                        {getAlgorithmIcon(event.recommendationMethod || "")}
                        {getAlgorithmLabel(event.recommendationMethod || "")}
                      </Badge>
                    </div>

                    {/* Match Score */}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-green-500 text-white border-0 font-bold">
                        {Math.round((event.recommendationScore || 0) * 100)}% match
                      </Badge>
                    </div>

                    {/* Featured/Trending Badges */}
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      {event.featured && <Badge className="bg-purple-500 text-white border-0">Featured</Badge>}
                      {event.trending && (
                        <Badge className="bg-orange-500 text-white border-0 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Trending
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold group-hover:text-purple-600 transition-colors duration-300 line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{event.rating}</span>
                      </div>
                    </div>

                    {/* Recommendation Explanation */}
                    {filters.showExplanations && event.recommendationReason && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-700">{event.recommendationReason}</p>
                        </div>
                      </div>
                    )}

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {event.location.name}, {event.location.city}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        {event.attendees}/{event.maxAttendees} interested
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.tags.slice(0, 3).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{event.organizer.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600">{event.organizer.name}</span>
                        {event.organizer.verified && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">
                          {event.price === 0 ? "Free" : `$${event.price}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Heart className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Link href={`/events/${event.id}`} className="flex-1">
                        <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-blue-500">
                          View Event
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </AnimatedCard>
              </div>
            ))}
          </StaggerContainer>
        )}
      </SmoothReveal>

      {/* No Results */}
      {!isLoading && filteredEvents.length === 0 && (
        <SmoothReveal>
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No recommendations found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or attend more events to improve recommendations
              </p>
              <Button onClick={() => setFilters(defaultFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        </SmoothReveal>
      )}
    </div>
  )
}
