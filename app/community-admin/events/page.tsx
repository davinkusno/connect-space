"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"
import { FloatingElements } from "@/components/ui/floating-elements"
import { CommunityAdminNav } from "@/components/navigation/community-admin-nav"
import { format } from "date-fns"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  attendeeCount: number
  maxAttendees: number
  image: string
  status: "upcoming" | "past"
  category: string
  price: number
  organizer: string
  organizerAvatar: string
}

export default function CommunityAdminEventsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({from: undefined, to: undefined})
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    // Mock events data
    const mockEvents: Event[] = [
      {
        id: "1",
        title: "AI & Machine Learning Workshop",
        description: "Learn the latest trends in AI and ML with hands-on projects and expert guidance.",
        date: "2024-01-25",
        time: "14:00",
        location: "Tech Hub NYC, 123 Innovation St",
        attendeeCount: 45,
        maxAttendees: 50,
        image: "/placeholder.svg?height=200&width=300",
        status: "upcoming",
        category: "Technology",
        price: 25,
        organizer: "Tech Innovators NYC",
        organizerAvatar: "/placeholder-user.jpg"
      },
      {
        id: "2",
        title: "Startup Pitch Night",
        description: "Present your startup idea to investors and get valuable feedback.",
        date: "2024-01-28",
        time: "18:30",
        location: "Innovation Center, 456 Startup Ave",
        attendeeCount: 78,
        maxAttendees: 100,
        image: "/placeholder.svg?height=200&width=300",
        status: "upcoming",
        category: "Business",
        price: 15,
        organizer: "Tech Innovators NYC",
        organizerAvatar: "/placeholder-user.jpg"
      },
      {
        id: "3",
        title: "React Best Practices Meetup",
        description: "Discuss React patterns, performance optimization, and modern development practices.",
        date: "2024-01-15",
        time: "19:00",
        location: "Coding Space, 789 Dev Blvd",
        attendeeCount: 32,
        maxAttendees: 40,
        image: "/placeholder.svg?height=200&width=300",
        status: "past",
        category: "Technology",
        price: 0,
        organizer: "Tech Innovators NYC",
        organizerAvatar: "/placeholder-user.jpg"
      },
      {
        id: "4",
        title: "Networking Mixer",
        description: "Connect with fellow tech professionals and entrepreneurs.",
        date: "2024-01-10",
        time: "17:00",
        location: "Tech Bar, 321 Network St",
        attendeeCount: 89,
        maxAttendees: 120,
        image: "/placeholder.svg?height=200&width=300",
        status: "past",
        category: "Networking",
        price: 10,
        organizer: "Tech Innovators NYC",
        organizerAvatar: "/placeholder-user.jpg"
      }
    ]
    setEvents(mockEvents)
  }

  const filteredEvents = useMemo(() => {
    let result = events.filter(event => event.status === activeTab)

    // Apply search filter
    if (searchQuery) {
      result = result.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply date filter
    if (dateRange.from || dateRange.to) {
      result = result.filter(event => {
        const eventDate = new Date(event.date)
        const fromDate = dateRange.from || new Date(0)
        const toDate = dateRange.to || new Date()
        return eventDate >= fromDate && eventDate <= toDate
      })
    }

    // Sort by date (most recent first)
    return result.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return activeTab === "upcoming" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    })
  }, [events, activeTab, searchQuery, dateRange])

  const formatEventDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const formatEventTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getDateFilterText = () => {
    if (dateRange.from && dateRange.to) {
      // Same date = single pick
      if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
        return format(dateRange.from, "MMM dd, yyyy")
      }
      // Different dates = range pick
      return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
    }
    if (dateRange.from) {
      return `From ${format(dateRange.from, "MMM dd")}`
    }
    if (dateRange.to) {
      return `Until ${format(dateRange.to, "MMM dd")}`
    }
    return "Filter Date"
  }

  const clearDateFilter = () => {
    setDateRange({from: undefined, to: undefined})
  }

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Generate years (2020-2030)
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i)

  // Handle month/year change
  const handleMonthChange = (month: string) => {
    setCurrentMonth(parseInt(month))
  }

  const handleYearChange = (year: string) => {
    setCurrentYear(parseInt(year))
  }

  return (
    <PageTransition>
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen relative">
        <CommunityAdminNav 
          communityProfilePicture="/placeholder-user.jpg"
          communityName="Tech Innovators NYC"
        />
        <FloatingElements />
        <div className="max-w-6xl mx-auto p-8 relative z-10">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Events Management</h1>
              <p className="text-lg text-gray-600">Manage your community events</p>
            </div>
            <Link href="/community-admin/create">
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Date Filter */}
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {getDateFilterText()}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4">
                      <div className="space-y-4">
                        {/* Custom Month/Year Picker */}
                        <div className="flex justify-center items-center gap-2">
                          <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                            <SelectTrigger className="w-32">
                              <SelectValue>{monthNames[currentMonth]}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {monthNames.map((month, index) => (
                                <SelectItem key={month} value={index.toString()}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                            <SelectTrigger className="w-24">
                              <SelectValue>{currentYear}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Calendar */}
                        <div className="relative">
                          <Calendar
                            mode="range"
                            selected={{from: dateRange.from, to: dateRange.to}}
                            onSelect={(range) => {
                              setDateRange(range || {from: undefined, to: undefined})
                              setShowDatePicker(false)
                            }}
                            initialFocus
                            className="rounded-md border-0"
                            month={new Date(currentYear, currentMonth)}
                            onMonthChange={(date) => {
                              setCurrentMonth(date.getMonth())
                              setCurrentYear(date.getFullYear())
                            }}
                            classNames={{
                              caption: "hidden", // Hide default caption
                              nav: "flex items-center",
                              nav_button_previous: "absolute left-1 top-1/2 -translate-y-1/2",
                              nav_button_next: "absolute right-1 top-1/2 -translate-y-1/2",
                              head_cell: "text-gray-600 font-semibold text-center py-2",
                              row: "flex w-full mt-2",
                              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                              day_range_end: "day-range-end",
                              day_selected: "bg-purple-600 text-white hover:bg-purple-700 focus:bg-purple-700",
                              day_today: "bg-purple-100 text-purple-900 font-semibold",
                              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                              day_disabled: "text-muted-foreground opacity-50",
                              day_range_middle: "aria-selected:bg-purple-200 aria-selected:text-purple-900",
                              day_hidden: "invisible",
                            }}
                          />
                        </div>
                      </div>
                      {/* Clear Button */}
                      {(dateRange.from || dateRange.to) && (
                        <div className="pt-3 border-t mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearDateFilter}
                            className="w-full text-gray-600 hover:text-red-600"
                          >
                            Clear Filter
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <Button
              variant={activeTab === "upcoming" ? "default" : "ghost"}
              onClick={() => setActiveTab("upcoming")}
              className={cn(
                "px-6 py-2 transition-all duration-200",
                activeTab === "upcoming"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md"
                  : "text-gray-600 hover:text-purple-600 hover:bg-white"
              )}
            >
              Upcoming Events
            </Button>
            <Button
              variant={activeTab === "past" ? "default" : "ghost"}
              onClick={() => setActiveTab("past")}
              className={cn(
                "px-6 py-2 transition-all duration-200",
                activeTab === "past"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md"
                  : "text-gray-600 hover:text-purple-600 hover:bg-white"
              )}
            >
              Past Events
            </Button>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Events Found</h3>
                  <p className="text-gray-500">
                    {(searchQuery || dateRange.from || dateRange.to)
                      ? "Try adjusting your search or filters."
                      : `No ${activeTab} events at the moment.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Event Image */}
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <Badge className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none">
                          {event.category}
                        </Badge>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{event.title}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-600">
                              {event.price === 0 ? "Free" : `$${event.price}`}
                            </div>
                            <div className="text-sm text-gray-500">per person</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-purple-600" />
                            <span>{formatEventDate(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <span>{formatEventTime(event.time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-purple-600" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span>{event.attendeeCount}/{event.maxAttendees} attendees</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={event.organizerAvatar} alt={event.organizer} />
                              <AvatarFallback className="text-xs">
                                {event.organizer.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600">{event.organizer}</span>
                          </div>
                          <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                            View Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
