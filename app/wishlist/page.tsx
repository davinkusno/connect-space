"use client"

import { useState, useMemo } from "react"
import { Heart, Search, Calendar, X, Filter, SortAsc, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageTransition } from "@/components/ui/page-transition"
import { StaggerContainer } from "@/components/ui/stagger-container"
import { FloatingElements } from "@/components/ui/floating-elements"
import { AnimatedButton } from "@/components/ui/animated-button"
import { useWishlist } from "@/components/wishlist/wishlist-provider"
import { WishlistEventCard } from "@/components/wishlist/wishlist-event-card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedCard } from "@/components/ui/animated-card"
import Link from "next/link"

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("date-asc")
  const [priceFilter, setPriceFilter] = useState("all")

  // Extract unique categories from wishlist
  const categories = useMemo(() => {
    const uniqueCategories = new Set(wishlist.map((event) => event.category))
    return ["All", ...Array.from(uniqueCategories)]
  }, [wishlist])

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    const filtered = wishlist.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === "All" || event.category === selectedCategory

      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "free" && event.price === 0) ||
        (priceFilter === "paid" && event.price > 0)

      return matchesSearch && matchesCategory && matchesPrice
    })

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "price-asc":
          return a.price - b.price
        case "price-desc":
          return b.price - a.price
        case "title-asc":
          return a.title.localeCompare(b.title)
        case "title-desc":
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

    return filtered
  }, [wishlist, searchQuery, selectedCategory, sortBy, priceFilter])

  // Group events by month
  const eventsByMonth = useMemo(() => {
    const grouped: Record<string, typeof wishlist> = {}

    filteredAndSortedEvents.forEach((event) => {
      const date = new Date(event.date)
      const monthYear = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })

      if (!grouped[monthYear]) {
        grouped[monthYear] = []
      }

      grouped[monthYear].push(event)
    })

    return grouped
  }, [filteredAndSortedEvents])

  // Handle removing an event
  const handleRemoveEvent = (eventId: number) => {
    removeFromWishlist(eventId)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("All")
    setPriceFilter("all")
    setSortBy("date-asc")
  }

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return filteredAndSortedEvents.filter((event) => {
      const eventDate = new Date(event.date)
      return eventDate >= now && eventDate <= nextWeek
    })
  }, [filteredAndSortedEvents])

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
        <FloatingElements />

        {/* Enhanced Header */}
        <div className="relative z-10">
          <div className="glass-effect border-b">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6 shadow-lg">
                  <Heart className="w-10 h-10 text-white fill-current" />
                </div>
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                  My <span className="text-gradient">Wishlist</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Keep track of events you're interested in and never miss an opportunity to connect and learn.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <AnimatedCard variant="3d" className="p-6 text-center group">
                  <div className="absolute inset-0 gradient-primary opacity-10 rounded-lg"></div>
                  <div className="relative z-10">
                    <Heart className="h-8 w-8 text-pink-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <p className="text-2xl font-bold text-gradient">{wishlist.length}</p>
                    <p className="text-sm text-gray-600">Saved Events</p>
                  </div>
                </AnimatedCard>

                <AnimatedCard variant="3d" className="p-6 text-center group">
                  <div className="absolute inset-0 gradient-secondary opacity-10 rounded-lg"></div>
                  <div className="relative z-10">
                    <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <p className="text-2xl font-bold text-gradient">{upcomingEvents.length}</p>
                    <p className="text-sm text-gray-600">This Week</p>
                  </div>
                </AnimatedCard>

                <AnimatedCard variant="3d" className="p-6 text-center group">
                  <div className="absolute inset-0 gradient-tertiary opacity-10 rounded-lg"></div>
                  <div className="relative z-10">
                    <Star className="h-8 w-8 text-yellow-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <p className="text-2xl font-bold text-gradient">{wishlist.filter((e) => e.featured).length}</p>
                    <p className="text-sm text-gray-600">Featured</p>
                  </div>
                </AnimatedCard>
              </div>

              {/* Enhanced Search and Filters */}
              <AnimatedCard variant="glass" className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search your wishlist..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 text-lg border-0 bg-white/50 backdrop-blur-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-40 border-0 bg-white/50 backdrop-blur-sm">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Select value={priceFilter} onValueChange={setPriceFilter}>
                      <SelectTrigger className="w-32 border-0 bg-white/50 backdrop-blur-sm">
                        <SelectValue placeholder="Price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <SortAsc className="w-4 h-4 text-gray-500" />
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-40 border-0 bg-white/50 backdrop-blur-sm">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-asc">Date (Soonest)</SelectItem>
                          <SelectItem value="date-desc">Date (Latest)</SelectItem>
                          <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                          <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                          <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                          <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(searchQuery || selectedCategory !== "All" || priceFilter !== "all" || sortBy !== "date-asc") && (
                      <AnimatedButton variant="glass" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </AnimatedButton>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            </div>
          </div>

          {/* Results Summary */}
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">{filteredAndSortedEvents.length}</span>{" "}
                  {filteredAndSortedEvents.length === 1 ? "event" : "events"} in your wishlist
                  {searchQuery && (
                    <>
                      {" "}
                      matching <span className="font-medium text-purple-600">"{searchQuery}"</span>
                    </>
                  )}
                  {selectedCategory !== "All" && (
                    <>
                      {" "}
                      in <span className="font-medium text-purple-600">{selectedCategory}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  onClick={clearWishlist}
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  disabled={wishlist.length === 0}
                >
                  Clear All
                </AnimatedButton>
                <Link href="/events">
                  <AnimatedButton variant="gradient" size="sm">
                    Discover More
                  </AnimatedButton>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Wishlist Content */}
        <div className="max-w-7xl mx-auto px-6 pb-12 relative z-10">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="glass-effect border-0 p-2 rounded-2xl mb-8">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
              >
                All Events ({filteredAndSortedEvents.length})
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
              >
                This Week ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger
                value="byMonth"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
              >
                By Month
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <StaggerContainer>
                {filteredAndSortedEvents.length > 0 ? (
                  <div className="space-y-6">
                    {filteredAndSortedEvents.map((event, index) => (
                      <div key={event.id} style={{ animationDelay: `${index * 100}ms` }}>
                        <WishlistEventCard event={event} onRemove={() => handleRemoveEvent(event.id)} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyWishlistState searchQuery={searchQuery} />
                )}
              </StaggerContainer>
            </TabsContent>

            <TabsContent value="upcoming">
              <StaggerContainer>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-6">
                    {upcomingEvents.map((event, index) => (
                      <div key={event.id} style={{ animationDelay: `${index * 100}ms` }}>
                        <WishlistEventCard event={event} onRemove={() => handleRemoveEvent(event.id)} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyUpcomingState />
                )}
              </StaggerContainer>
            </TabsContent>

            <TabsContent value="byMonth">
              <StaggerContainer>
                {Object.keys(eventsByMonth).length > 0 ? (
                  <div className="space-y-12">
                    {Object.entries(eventsByMonth).map(([month, events], monthIndex) => (
                      <div key={month} className="space-y-6" style={{ animationDelay: `${monthIndex * 200}ms` }}>
                        <div className="flex items-center gap-4">
                          <h2 className="text-3xl font-bold text-gray-900">{month}</h2>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 px-3 py-1">
                            {events.length} {events.length === 1 ? "event" : "events"}
                          </Badge>
                        </div>
                        <div className="space-y-6">
                          {events.map((event, eventIndex) => (
                            <div key={event.id} style={{ animationDelay: `${monthIndex * 200 + eventIndex * 100}ms` }}>
                              <WishlistEventCard event={event} onRemove={() => handleRemoveEvent(event.id)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyWishlistState searchQuery={searchQuery} />
                )}
              </StaggerContainer>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  )
}

// Enhanced Empty state components
const EmptyWishlistState = ({ searchQuery }: { searchQuery: string }) => (
  <AnimatedCard variant="3d" className="py-16 text-center">
    <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
      <Heart className="w-16 h-16 text-pink-400" />
    </div>

    {searchQuery ? (
      <>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No matching events found</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Try adjusting your search criteria or explore our events to find something interesting.
        </p>
      </>
    ) : (
      <>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Your wishlist is empty</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Start building your wishlist by saving events you're interested in. Never miss out on amazing opportunities!
        </p>
      </>
    )}

    <div className="flex justify-center gap-4">
      <Link href="/events">
        <AnimatedButton variant="gradient">
          <Search className="w-4 h-4 mr-2" />
          Discover Events
        </AnimatedButton>
      </Link>
      <Link href="/dashboard">
        <AnimatedButton variant="glass">Back to Dashboard</AnimatedButton>
      </Link>
    </div>
  </AnimatedCard>
)

const EmptyUpcomingState = () => (
  <AnimatedCard variant="3d" className="py-16 text-center">
    <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
      <Calendar className="w-16 h-16 text-blue-400" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3">No upcoming events this week</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      Check out all your saved events or discover new ones to add to your wishlist.
    </p>
    <div className="flex justify-center gap-4">
      <Link href="/events">
        <AnimatedButton variant="gradient">
          <Search className="w-4 h-4 mr-2" />
          Find Events
        </AnimatedButton>
      </Link>
    </div>
  </AnimatedCard>
)
