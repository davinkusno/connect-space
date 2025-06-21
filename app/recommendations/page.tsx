"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
  Sparkles,
  Users,
  Calendar,
  FileText,
  User,
  TrendingUp,
  MapPin,
  Clock,
  Star,
  RefreshCw,
  ChevronRight,
  Bookmark,
  Share2,
  SlidersHorizontal,
  Target,
  Zap,
  Brain,
  ThumbsUp,
  ThumbsDown,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AnimatedCard } from "@/components/ui/animated-card"
import { SmoothReveal } from "@/components/ui/smooth-reveal"
import { StaggerContainer } from "@/components/ui/stagger-container"

interface Recommendation {
  id: string
  type: "community" | "event" | "person" | "content"
  title: string
  description: string
  relevanceScore: number
  reasoning: string
  category: string
  tags: string[]
  metadata?: any
  image?: string
  isBookmarked?: boolean
  userFeedback?: "like" | "dislike" | null
}

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: "all",
    relevanceThreshold: [70],
    showExplanations: true,
    sortBy: "relevance",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Mock data - in real app, this would come from API
  const mockRecommendations: Recommendation[] = [
    {
      id: "1",
      type: "community",
      title: "AI & Machine Learning Enthusiasts",
      description:
        "A vibrant community of AI researchers, engineers, and enthusiasts sharing knowledge and collaborating on cutting-edge projects.",
      relevanceScore: 95,
      reasoning:
        "Based on your interest in technology and recent searches for AI-related content, this community aligns perfectly with your learning goals.",
      category: "Technology",
      tags: ["AI", "Machine Learning", "Deep Learning", "Python"],
      metadata: {
        memberCount: 2847,
        activityLevel: "high",
        location: "Global",
        recentGrowth: "+23%",
      },
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "2",
      type: "event",
      title: "Introduction to Neural Networks Workshop",
      description:
        "Hands-on workshop covering the fundamentals of neural networks, from basic concepts to building your first model.",
      relevanceScore: 92,
      reasoning:
        "This workshop matches your beginner-level AI interests and provides practical experience you've been seeking.",
      category: "Education",
      tags: ["Neural Networks", "Workshop", "Beginner", "Hands-on"],
      metadata: {
        date: "2024-02-15",
        time: "2:00 PM",
        location: "Tech Hub Downtown",
        price: "Free",
        attendees: 45,
      },
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "3",
      type: "person",
      title: "Dr. Sarah Chen",
      description:
        "AI Research Scientist at TechCorp with 10+ years experience in machine learning and computer vision.",
      relevanceScore: 88,
      reasoning:
        "Dr. Chen's expertise in AI and her mentoring background make her an ideal connection for your learning journey.",
      category: "Technology",
      tags: ["AI Expert", "Mentor", "Research", "Computer Vision"],
      metadata: {
        role: "AI Research Scientist",
        experience: "10+ years",
        location: "San Francisco",
        connections: 1250,
      },
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "4",
      type: "content",
      title: "The Future of AI in Healthcare",
      description:
        "Comprehensive article exploring how artificial intelligence is revolutionizing medical diagnosis and treatment.",
      relevanceScore: 85,
      reasoning:
        "This content combines your AI interests with healthcare applications, expanding your knowledge into new domains.",
      category: "Healthcare",
      tags: ["AI", "Healthcare", "Innovation", "Medical Technology"],
      metadata: {
        readTime: "8 min",
        author: "Dr. Michael Rodriguez",
        publishDate: "2024-01-20",
        engagement: "high",
      },
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "5",
      type: "community",
      title: "Startup Founders Network",
      description:
        "Connect with fellow entrepreneurs, share experiences, and get advice on building successful startups.",
      relevanceScore: 82,
      reasoning:
        "Your entrepreneurial interests and business background suggest you'd benefit from this founder community.",
      category: "Business",
      tags: ["Startups", "Entrepreneurship", "Networking", "Business"],
      metadata: {
        memberCount: 1456,
        activityLevel: "moderate",
        location: "New York",
        recentGrowth: "+15%",
      },
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "6",
      type: "event",
      title: "Tech Networking Mixer",
      description:
        "Monthly networking event for tech professionals to connect, share ideas, and explore collaboration opportunities.",
      relevanceScore: 78,
      reasoning:
        "Perfect for expanding your professional network in the tech industry and meeting like-minded individuals.",
      category: "Networking",
      tags: ["Networking", "Tech", "Professionals", "Monthly"],
      metadata: {
        date: "2024-02-28",
        time: "6:00 PM",
        location: "Innovation Center",
        price: "$15",
        attendees: 120,
      },
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  useEffect(() => {
    // Simulate API call
    setIsLoading(true)
    setTimeout(() => {
      setRecommendations(mockRecommendations)
      setFilteredRecommendations(mockRecommendations)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = recommendations

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((rec) => rec.type === activeTab)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (rec) =>
          rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Filter by category
    if (filters.category !== "all") {
      filtered = filtered.filter((rec) => rec.category.toLowerCase() === filters.category)
    }

    // Filter by relevance threshold
    filtered = filtered.filter((rec) => rec.relevanceScore >= filters.relevanceThreshold[0])

    // Sort
    switch (filters.sortBy) {
      case "relevance":
        filtered.sort((a, b) => b.relevanceScore - a.relevanceScore)
        break
      case "newest":
        // Sort by newest (mock implementation)
        break
      case "popular":
        // Sort by popularity (mock implementation)
        break
    }

    setFilteredRecommendations(filtered)
  }, [recommendations, activeTab, searchQuery, filters])

  const handleBookmark = (id: string) => {
    setRecommendations((prev) => prev.map((rec) => (rec.id === id ? { ...rec, isBookmarked: !rec.isBookmarked } : rec)))
  }

  const handleFeedback = (id: string, feedback: "like" | "dislike") => {
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id ? { ...rec, userFeedback: rec.userFeedback === feedback ? null : feedback } : rec,
      ),
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "community":
        return Users
      case "event":
        return Calendar
      case "person":
        return User
      case "content":
        return FileText
      default:
        return Sparkles
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "community":
        return "bg-blue-500"
      case "event":
        return "bg-green-500"
      case "person":
        return "bg-purple-500"
      case "content":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const RecommendationCard = ({ recommendation }: { recommendation: Recommendation }) => {
    const IconComponent = getTypeIcon(recommendation.type)
    const typeColor = getTypeColor(recommendation.type)

    return (
      <AnimatedCard className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-purple-300">
        <CardContent className="p-0">
          {/* Image Header */}
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            <img
              src={recommendation.image || "/placeholder.svg"}
              alt={recommendation.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Type Badge */}
            <div className={cn("absolute top-3 left-3 p-2 rounded-lg", typeColor)}>
              <IconComponent className="h-4 w-4 text-white" />
            </div>

            {/* Relevance Score */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-xs font-medium">{recommendation.relevanceScore}%</span>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
                onClick={() => handleBookmark(recommendation.id)}
              >
                <Bookmark className={cn("h-4 w-4", recommendation.isBookmarked && "fill-current text-blue-600")} />
              </Button>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                {recommendation.title}
              </h3>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">{recommendation.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {recommendation.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {recommendation.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{recommendation.tags.length - 3} more
                </Badge>
              )}
            </div>

            {/* Metadata */}
            {recommendation.type === "community" && recommendation.metadata && (
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {recommendation.metadata.memberCount.toLocaleString()} members
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {recommendation.metadata.recentGrowth}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {recommendation.metadata.location}
                </div>
              </div>
            )}

            {recommendation.type === "event" && recommendation.metadata && (
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {recommendation.metadata.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recommendation.metadata.time}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {recommendation.metadata.location}
                </div>
              </div>
            )}

            {recommendation.type === "person" && recommendation.metadata && (
              <div className="flex items-center gap-2 mb-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={recommendation.image || "/placeholder.svg"} />
                  <AvatarFallback>{recommendation.title.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-xs text-gray-500">
                  {recommendation.metadata.role} • {recommendation.metadata.experience}
                </div>
              </div>
            )}

            {/* AI Reasoning */}
            {filters.showExplanations && (
              <div className="bg-purple-50 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-purple-700 mb-1">Why this is recommended:</p>
                    <p className="text-xs text-purple-600 leading-relaxed">{recommendation.reasoning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-8 px-2 text-xs",
                    recommendation.userFeedback === "like" && "bg-green-100 text-green-700",
                  )}
                  onClick={() => handleFeedback(recommendation.id, "like")}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Helpful
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-8 px-2 text-xs",
                    recommendation.userFeedback === "dislike" && "bg-red-100 text-red-700",
                  )}
                  onClick={() => handleFeedback(recommendation.id, "dislike")}
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  Not relevant
                </Button>
              </div>

              <Link href={`/${recommendation.type}/${recommendation.id}`}>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                  {recommendation.type === "community"
                    ? "Join"
                    : recommendation.type === "event"
                      ? "Register"
                      : recommendation.type === "person"
                        ? "Connect"
                        : "Read"}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="glass-effect sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gradient flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              ConnectSpace
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/discover">
                <Button variant="ghost" size="sm">
                  Discover
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <SmoothReveal>
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              <span className="text-gradient">AI-Powered</span> Recommendations
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover communities, events, people, and content tailored specifically for you using advanced AI
              algorithms
            </p>
          </div>
        </SmoothReveal>

        {/* Controls */}
        <SmoothReveal delay={200}>
          <Card className="mb-8 border-gray-200">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Search */}
                <div className="flex-1">
                  <Input
                    placeholder="Search recommendations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 text-lg border-gray-300 focus:border-purple-400"
                  />
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-4">
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Most Relevant</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Category</Label>
                      <Select
                        value={filters.category}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="networking">Networking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Relevance Threshold: {filters.relevanceThreshold[0]}%
                      </Label>
                      <Slider
                        value={filters.relevanceThreshold}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, relevanceThreshold: value }))}
                        max={100}
                        min={0}
                        step={5}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="explanations"
                        checked={filters.showExplanations}
                        onChange={(e) => setFilters((prev) => ({ ...prev, showExplanations: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="explanations" className="text-sm">
                        Show AI explanations
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </SmoothReveal>

        {/* Tabs */}
        <SmoothReveal delay={300}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8 bg-gray-100">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                All ({recommendations.length})
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Communities ({recommendations.filter((r) => r.type === "community").length})
              </TabsTrigger>
              <TabsTrigger value="event" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Events ({recommendations.filter((r) => r.type === "event").length})
              </TabsTrigger>
              <TabsTrigger value="person" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                People ({recommendations.filter((r) => r.type === "person").length})
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Content ({recommendations.filter((r) => r.type === "content").length})
              </TabsTrigger>
            </TabsList>

            {/* Results */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                {filteredRecommendations.length} recommendations found
              </h2>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear search
                </Button>
              )}
            </div>

            <TabsContent value={activeTab} className="space-y-8">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-lg" />
                      <CardContent className="p-6 space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredRecommendations.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-gray-400 mb-6">
                    <Target className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No recommendations found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                  <Button
                    onClick={() => {
                      setSearchQuery("")
                      setFilters({
                        category: "all",
                        relevanceThreshold: [70],
                        showExplanations: true,
                        sortBy: "relevance",
                      })
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecommendations.map((recommendation, index) => (
                    <div key={recommendation.id} className="stagger-item">
                      <RecommendationCard recommendation={recommendation} />
                    </div>
                  ))}
                </StaggerContainer>
              )}
            </TabsContent>
          </Tabs>
        </SmoothReveal>

        {/* AI Insights Panel */}
        {!isLoading && filteredRecommendations.length > 0 && (
          <SmoothReveal delay={400}>
            <Card className="mt-12 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Zap className="h-5 w-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {Math.round(
                        filteredRecommendations.reduce((sum, rec) => sum + rec.relevanceScore, 0) /
                          filteredRecommendations.length,
                      )}
                      %
                    </div>
                    <p className="text-sm text-gray-600">Average Relevance</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {new Set(filteredRecommendations.map((rec) => rec.category)).size}
                    </div>
                    <p className="text-sm text-gray-600">Categories Covered</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {filteredRecommendations.filter((rec) => rec.relevanceScore >= 90).length}
                    </div>
                    <p className="text-sm text-gray-600">High-Confidence Matches</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SmoothReveal>
        )}
      </div>
    </div>
  )
}
