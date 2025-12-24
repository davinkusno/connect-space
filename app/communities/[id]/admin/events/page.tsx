"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FloatingElements } from "@/components/ui/floating-elements"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/components/ui/page-transition"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
    ArrowLeft, Calendar as CalendarIcon, ChevronDown,
    ChevronRight, Clock, Edit, MapPin, Plus, Search, Trash2, Upload, Users
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"

// Helper function to parse location and get readable string
function getLocationDisplay(location: any): string {
  if (!location) return "";
  try {
    const locData = typeof location === "string" ? JSON.parse(location) : location;
    
    // Handle online events
    if (locData.meetingLink) {
      return locData.meetingLink;
    }
    if (locData.isOnline) {
      return "Online";
    }
    
    // Handle physical events
    if (locData.address) {
      return `${locData.address}${locData.city ? `, ${locData.city}` : ''}`;
    }
    return locData.city || locData.venue || "";
  } catch {
    return typeof location === "string" ? location : "";
  }
}

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  attendeeCount: number
  maxAttendees: number | null
  image: string
  status: "upcoming" | "past"
  category: string
  price: number
  organizer: string
  organizerAvatar: string
  startTime?: Date // Add startTime to check if event has passed
}

export default function CommunityAdminEventsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({from: undefined, to: undefined})
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [events, setEvents] = useState<Event[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [communityId, setCommunityId] = useState<string | null>(null)
  const [communityName, setCommunityName] = useState<string>("Community")
  const [currentPage, setCurrentPage] = useState(1)
  const eventsPerPage = 10

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setCommunityId(resolvedParams.id)
      loadEvents(resolvedParams.id)
    }
    loadParams()
  }, [params])

  const loadEvents = async (id: string) => {
    try {
      const supabase = getSupabaseBrowser()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not found")
        setEvents([])
        return
      }

      // Get community by ID from params
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("id, name, creator_id")
        .eq("id", id)
        .single()

      if (communityError || !communityData) {
        console.error("Community not found:", communityError)
        setEvents([])
        return
      }

      // Verify user is creator only
      const isCreator = communityData.creator_id === user.id

      if (!isCreator) {
        console.error("User is not the creator")
        setEvents([])
        return
      }

      setCommunityId(id)
      setCommunityName(communityData.name || "Community")

      // Fetch real events from database
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("community_id", communityData.id)
        .order("start_time", { ascending: true })

      if (eventsError) {
        console.error("Error fetching events:", eventsError)
        setEvents([])
        return
      }

      // Fetch attendee counts for all events
      const eventIds = (eventsData || []).map((e: any) => e.id)
      let attendeeCounts: Record<string, number> = {}
      
      if (eventIds.length > 0) {
        const { data: attendeesData } = await supabase
          .from("event_attendees")
          .select("event_id")
          .in("event_id", eventIds)
        
        if (attendeesData) {
          attendeesData.forEach((a: any) => {
            attendeeCounts[a.event_id] = (attendeeCounts[a.event_id] || 0) + 1
          })
        }
      }

      // Convert database events to Event interface format
      const now = new Date()
      const realEvents: Event[] = (eventsData || []).map((event: any) => {
        const startTime = new Date(event.start_time)
        const endTime = new Date(event.end_time)
        const isUpcoming = startTime > now
        
        // Parse location
        let locationStr = ""
        
        // Handle online events first
        if (event.is_online) {
          if (event.location) {
            try {
              const locationData = typeof event.location === 'string' 
                ? JSON.parse(event.location) 
                : event.location
              
              // For online events, check for meeting link in location data
              locationStr = locationData.meetingLink || "Online"
            } catch (e) {
              // If parsing fails, just show "Online"
              locationStr = "Online"
            }
          } else {
            // No location data, but event is online
            locationStr = "Online"
          }
        } else if (event.location) {
          // Handle physical events
          try {
            const locationData = typeof event.location === 'string' 
              ? JSON.parse(event.location) 
              : event.location
            
            if (locationData.address) {
              locationStr = `${locationData.address}${locationData.city ? `, ${locationData.city}` : ''}`
            } else if (locationData.city) {
              locationStr = locationData.city
            } else if (typeof event.location === 'string') {
              locationStr = event.location
            }
          } catch (e) {
            if (typeof event.location === 'string') {
              locationStr = event.location
            }
          }
        }

        // Get attendee count from fetched data
        const attendeeCount = attendeeCounts[event.id] || 0

        return {
          id: event.id,
          title: event.title,
          description: event.description || "",
          date: format(startTime, "yyyy-MM-dd"),
          time: format(startTime, "HH:mm"),
          location: locationStr,
          attendeeCount: attendeeCount,
          maxAttendees: event.max_attendees || null,
          image: event.image_url || "/placeholder.svg?height=200&width=300",
          status: isUpcoming ? "upcoming" : "past",
          category: event.category || "General",
          price: 0, // Price not in events table
          organizer: communityData.name || "Community",
          organizerAvatar: "/placeholder-user.jpg",
          startTime: startTime // Store startTime to check if event has passed
        }
      })

      // Set only real events (no dummy events)
      setEvents(realEvents)
    } catch (error) {
      console.error("Error loading events:", error)
      setEvents([])
    }
  }

  const filteredEvents = useMemo(() => {
    // Filter by status
    let filtered = events.filter(event => event.status === activeTab)

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply date filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date)
        eventDate.setHours(0, 0, 0, 0) // Reset time to compare dates only
        
        if (dateRange.from && dateRange.to) {
          // Both dates selected - range filter
          const fromDate = new Date(dateRange.from)
          fromDate.setHours(0, 0, 0, 0)
          const toDate = new Date(dateRange.to)
          toDate.setHours(23, 59, 59, 999)
        return eventDate >= fromDate && eventDate <= toDate
        } else if (dateRange.from) {
          // Only from date - filter events on or after this date
          const fromDate = new Date(dateRange.from)
          fromDate.setHours(0, 0, 0, 0)
          return eventDate >= fromDate
        } else if (dateRange.to) {
          // Only to date - filter events on or before this date
          const toDate = new Date(dateRange.to)
          toDate.setHours(23, 59, 59, 999)
          return eventDate <= toDate
        }
        return true
      })
    }

    // Sort events by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return activeTab === "upcoming" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    })

    return filtered
  }, [events, activeTab, searchQuery, dateRange])

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage)
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * eventsPerPage
    const endIndex = startIndex + eventsPerPage
    return filteredEvents.slice(startIndex, endIndex)
  }, [filteredEvents, currentPage, eventsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, dateRange])

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

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;


    try {
      const response = await fetch(`/api/events/${eventToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete event")
      }

      // Remove event from the list
      setEvents(prevEvents => prevEvents.filter(e => e.id !== eventToDelete.id))
      setDeleteDialogOpen(false)
      setEventToDelete(null)
      
      toast.success("Event deleted successfully!")
    } catch (error: any) {
      console.error("Error deleting event:", error)
      toast.error(error.message || "Failed to delete event. Please try again.")
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setEventToDelete(null)
  }

  const handleUploadClick = (event: Event) => {
    setSelectedEvent(event)
    setUploadedImages([])
    setUploadDialogOpen(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages: string[] = []
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file)
        newImages.push(preview)
      }
    })
    
    setUploadedImages(prev => [...prev, ...newImages])
  }

  const handleUploadConfirm = async () => {
    if (selectedEvent && uploadedImages.length > 0) {
      setIsUploading(true)
      
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update event with new images
      setEvents(prev => prev.map(event => 
        event.id === selectedEvent.id 
          ? { ...event, image: uploadedImages[0] } // Update main image
          : event
      ))
      
      setIsUploading(false)
      setUploadDialogOpen(false)
      setSelectedEvent(null)
      setUploadedImages([])
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <PageTransition>
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen relative">
        <FloatingElements />
        <div className="max-w-6xl mx-auto p-8 relative z-10">
          {/* Back Button */}
          <div className="mb-4">
            <Link href={communityId ? `/communities/${communityId}/admin` : "/communities/admin"}>
              <Button variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Community Dashboard
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Events Management</h1>
              <p className="text-lg text-gray-600">Manage your community events</p>
            </div>
            <Link href={communityId ? `/events/create?community_id=${communityId}` : "/events/create"}>
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
                            onSelect={(range: DateRange | undefined) => {
                              const newRange = {
                                from: range?.from,
                                to: range?.to
                              }
                              setDateRange(newRange)
                              // Close popover when both dates are selected
                              if (newRange.from && newRange.to) {
                              setShowDatePicker(false)
                              }
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
              paginatedEvents.map((event) => (
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
                            <span className="truncate">{getLocationDisplay(event.location)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span>
                              {event.maxAttendees 
                                ? `${event.attendeeCount}/${event.maxAttendees} interested`
                                : `${event.attendeeCount} interested`}
                            </span>
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
                          <div className="flex items-center gap-2">
                            <Link href={communityId ? `/events/${event.id}?from=admin&community_id=${communityId}` : `/events/${event.id}?from=admin`}>
                              <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                                View Details
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                            {activeTab === "upcoming" && event.startTime && event.startTime > new Date() ? (
                              <>
                                <Link href={communityId ? `/communities/${communityId}/admin/events/${event.id}/edit` : `/communities/admin/${event.id}/edit`}>
                                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleDeleteClick(event)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredEvents.length > 0 && totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={eventsPerPage}
                totalItems={filteredEvents.length}
              />
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Event</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={handleDeleteCancel}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirm}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
              >
                Delete Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Images Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-600" />
                Upload Images for {selectedEvent?.title}
              </DialogTitle>
              <DialogDescription>
                Upload multiple images to showcase your event. You can select multiple files at once.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* File Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Click to upload images</p>
                      <p className="text-sm text-gray-500">or drag and drop multiple images here</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Preview Images */}
              {uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Selected Images ({uploadedImages.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setUploadDialogOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUploadConfirm}
                disabled={uploadedImages.length === 0 || isUploading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {uploadedImages.length} Image{uploadedImages.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}
