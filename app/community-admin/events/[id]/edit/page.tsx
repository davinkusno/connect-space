"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CommunityAdminNav } from "@/components/navigation/community-admin-nav"
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Image as ImageIcon,
  Plus,
  X,
  Tag,
  Gift,
  Globe,
  Search,
  Loader2,
  Sparkles
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Event {
  id: string
  title: string
  description: string
  longDescription: string
  date: string
  time: string
  endTime: string
  location: {
    venue: string
    address: string
    city: string
    lat: number
    lng: number
  }
  organizer: {
    name: string
    image: string
    verified: boolean
  }
  category: string
  price: {
    type: "free" | "paid"
    amount?: number
    currency?: string
  }
  capacity: number
  registered: number
  image: string
  images: string[]
  tags: string[]
  website?: string
  socialProof: {
    rating: number
    reviewCount: number
    attendeeCount: number
  }
  relatedEvents: Array<{
    id: string
    title: string
    date: string
    image: string
  }>
}

// Mock event data (same as in detail page)
const DUMMY_EVENT: Event = {
  id: "1",
  title: "AI in Healthcare Summit 2024",
  description: "Join industry leaders for an insightful exploration of AI's transformative potential in healthcare.",
  longDescription: `Join us for a comprehensive summit exploring the cutting-edge applications of artificial intelligence in healthcare. This full-day event brings together leading researchers, healthcare professionals, and tech innovators to discuss the latest breakthroughs, challenges, and opportunities in AI-powered healthcare solutions.

The summit will feature keynote presentations from renowned experts, interactive workshops, panel discussions, and networking sessions. Topics will include machine learning applications in diagnostics, AI-powered drug discovery, ethical considerations in healthcare AI, and future trends in digital health.

This is an unmissable opportunity for healthcare professionals, researchers, data scientists, and entrepreneurs to stay at the forefront of this rapidly evolving field.`,
  date: "2024-03-15",
  time: "09:00",
  endTime: "17:00",
  location: {
    venue: "Innovation Center",
    address: "123 Main Street",
    city: "Techville",
    lat: 40.7128,
    lng: -74.006,
  },
  organizer: {
    name: "HealthTech Innovations",
    image: "/placeholder.svg?height=60&width=60",
    verified: true,
  },
  category: "Technology",
  price: {
    type: "paid",
    amount: 299,
    currency: "USD",
  },
  capacity: 500,
  registered: 347,
  image: "/placeholder.svg?height=600&width=1200",
  images: [
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
  ],
  tags: ["AI", "Healthcare", "Technology", "Innovation", "Networking"],
  website: "https://healthtechinnovations.com",
  socialProof: {
    rating: 4.8,
    reviewCount: 127,
    attendeeCount: 1250,
  },
  relatedEvents: [
    { id: "2", title: "Machine Learning Workshop", date: "2024-03-22", image: "/placeholder.svg?height=120&width=160" },
    { id: "3", title: "Digital Health Conference", date: "2024-04-05", image: "/placeholder.svg?height=120&width=160" },
    { id: "4", title: "AI Ethics Symposium", date: "2024-04-18", image: "/placeholder.svg?height=120&width=160" },
  ],
}

const categories = [
  "Workshop",
  "Seminar",
  "Meetup",
  "Conference",
  "Networking",
  "Hackathon",
  "Social",
  "Educational",
  "Sports",
  "Arts & Culture",
]

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter()
  
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    category: "",
    date: undefined as Date | undefined,
    startTime: "",
    endTime: "",
    location: "",
    capacity: "",
    isOnline: false,
    meetingLink: "",
    isPublic: true,
  })
  
  const [eventImage, setEventImage] = useState<File | null>(null)
  const [eventImagePreview, setEventImagePreview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [communityName, setCommunityName] = useState<string>("Community")

  // Location picker state
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{
    display_name: string
    lat: string
    lon: string
    address?: any
  }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [locationCity, setLocationCity] = useState("")
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const handleInputChange = (field: string, value: any) => {
    setEventData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEventImage(file)
      const url = URL.createObjectURL(file)
      setEventImagePreview(url)
    }
  }

  // Load event data from database
  useEffect(() => {
    const loadEventData = async () => {
      try {
        const { getSupabaseBrowser } = await import("@/lib/supabase/client")
        const supabase = getSupabaseBrowser()
        
        // Check if event ID is a dummy event
        if (id.startsWith("dummy-")) {
          setIsLoadingEvent(false)
          return
        }

        // Fetch real event data
        const { data: eventRecord, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single()

        if (eventError || !eventRecord) {
          console.error("Event not found:", eventError)
          toast.error("Event not found")
          setIsLoadingEvent(false)
          return
        }

        // Get community name
        const { data: communityData } = await supabase
          .from("communities")
          .select("name")
          .eq("id", eventRecord.community_id)
          .single()

        if (communityData) {
          setCommunityName(communityData.name || "Community")
        }

        // Parse location
        let locationStr = ""
        let isOnline = eventRecord.is_online || false
        let meetingLink = ""
        
        if (eventRecord.location) {
          try {
            const parsed = typeof eventRecord.location === 'string' 
              ? JSON.parse(eventRecord.location) 
              : eventRecord.location
            
            if (isOnline && parsed.meetingLink) {
              locationStr = parsed.meetingLink
              meetingLink = parsed.meetingLink
            } else if (parsed.address || parsed.venue) {
              locationStr = parsed.address || parsed.venue || ""
              if (parsed.lat && parsed.lng) {
                setLocationLat(parsed.lat)
                setLocationLng(parsed.lng)
              }
              if (parsed.city) {
                setLocationCity(parsed.city)
              }
            }
          } catch (e) {
            console.error("Error parsing location:", e)
            if (typeof eventRecord.location === 'string') {
              locationStr = eventRecord.location
            }
          }
        }

        // Format dates
        const startTime = new Date(eventRecord.start_time)
        const endTime = new Date(eventRecord.end_time)

        // Set event data
        setEventData({
          title: eventRecord.title || "",
          description: eventRecord.description || "",
          category: eventRecord.category || "",
          date: startTime,
          startTime: startTime.toTimeString().slice(0, 5),
          endTime: endTime.toTimeString().slice(0, 5),
          location: locationStr,
          capacity: eventRecord.max_attendees?.toString() || "",
          isOnline: isOnline,
          meetingLink: meetingLink,
          isPublic: eventRecord.is_public !== false,
        })

        // Set image preview if exists
        if (eventRecord.image_url) {
          setEventImagePreview(eventRecord.image_url)
        }

        // Set search query for location
        if (locationStr) {
          setSearchQuery(locationStr)
        }

        setIsLoadingEvent(false)
      } catch (error) {
        console.error("Error loading event data:", error)
        toast.error("Failed to load event data")
        setIsLoadingEvent(false)
      }
    }

    loadEventData()
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Upload image if provided
      let imageUrl: string | null = null
      if (eventImage) {
        try {
          const imageFormData = new FormData()
          imageFormData.append("image", eventImage)
          imageFormData.append("type", "event")
          
          const uploadResponse = await fetch("/api/events/upload-image", {
            method: "POST",
            body: imageFormData,
          })
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            imageUrl = uploadData.url
          } else {
            toast.error("Failed to upload image, but event will be updated without image")
          }
        } catch (imageError) {
          console.error("ERROR uploading image:", imageError)
          toast.error("Failed to upload image, but event will be updated without image")
        }
      }

      // Calculate start_time and end_time if date/time changed
      let startTime = null
      let endTime = null
      
      if (eventData.date && eventData.startTime && eventData.endTime) {
        const year = eventData.date.getFullYear()
        const month = String(eventData.date.getMonth() + 1).padStart(2, '0')
        const day = String(eventData.date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        const [startHours, startMinutes] = eventData.startTime.split(':')
        const startDateTimeStr = `${dateStr}T${startHours}:${startMinutes}:00`
        startTime = new Date(startDateTimeStr).toISOString()
        
        const [endHours, endMinutes] = eventData.endTime.split(':')
        const endDateTimeStr = `${dateStr}T${endHours}:${endMinutes}:00`
        let endDateTime = new Date(endDateTimeStr)
        
        // If end time is earlier than or equal to start time, assume it's the next day
        if (endDateTime <= new Date(startDateTimeStr)) {
          endDateTime.setDate(endDateTime.getDate() + 1)
        }
        
        endTime = endDateTime.toISOString()
      }

      // Format location as JSON
      let locationJson: string | null = null
      if (eventData.isOnline) {
        if (eventData.meetingLink) {
          locationJson = JSON.stringify({
            isOnline: true,
            meetingLink: eventData.meetingLink,
          })
        }
      } else {
        if (eventData.location || locationLat || locationLng) {
          locationJson = JSON.stringify({
            venue: eventData.location,
            address: eventData.location,
            city: locationCity || "",
            lat: locationLat || 0,
            lng: locationLng || 0,
            isOnline: false,
          })
        }
      }

      // Prepare update payload (only include fields that are provided)
      const updatePayload: any = {}

      if (eventData.title) updatePayload.title = eventData.title
      if (eventData.description) updatePayload.description = eventData.description
      if (eventData.category) updatePayload.category = eventData.category
      if (locationJson) updatePayload.location = locationJson
      if (startTime) updatePayload.start_time = startTime
      if (endTime) updatePayload.end_time = endTime
      if (imageUrl) updatePayload.image_url = imageUrl
      if (eventData.isOnline !== undefined) updatePayload.is_online = eventData.isOnline
      if (eventData.isPublic !== undefined) updatePayload.is_public = eventData.isPublic
      if (eventData.capacity) updatePayload.max_attendees = parseInt(eventData.capacity)

      // Update event via API
      const response = await fetch(`/api/events/${id}/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update event")
      }

      toast.success("Event updated successfully!", {
        duration: 1500,
      })
      
      // Redirect to event detail page
      setTimeout(() => {
        window.location.href = `/community-admin/events/${id}`
      }, 500)
    } catch (error: any) {
      console.error("Error updating event:", error)
      toast.error(error.message || "Failed to update event. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load Leaflet library
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return
      
      if ((window as any).L) {
        setLeafletLoaded(true)
        return
      }

      try {
        // Load CSS
        const cssLink = document.createElement("link")
        cssLink.rel = "stylesheet"
        cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        cssLink.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        cssLink.crossOrigin = ""
        document.head.appendChild(cssLink)

        // Load JS
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""

        script.onload = () => {
          setLeafletLoaded(true)
        }

        script.onerror = () => {
          console.error("Failed to load Leaflet")
          toast.error("Failed to load map library")
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("Error loading Leaflet:", error)
      }
    }

    loadLeaflet()
  }, [])

  // Reverse geocoding: Convert coordinates to address
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setLocationLat(lat)
    setLocationLng(lng)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      const data = await response.json()

      if (data && data.address) {
        const addr = data.address
        const displayName = data.display_name || ""
        const city = addr.city || addr.town || addr.village || addr.municipality || ""
        
        setEventData((prev) => ({
          ...prev,
          location: displayName
        }))
        setSearchQuery(displayName)
        setLocationCity(city)
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return

    try {
      const L = (window as any).L
      const defaultCenter = locationLat && locationLng 
        ? { lat: locationLat, lng: locationLng }
        : { lat: -6.2088, lng: 106.8456 } // Jakarta default

      const map = L.map(mapRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Add marker
      const marker = L.marker([defaultCenter.lat, defaultCenter.lng], {
        draggable: true,
      }).addTo(map)

      marker.on("dragend", (e: any) => {
        const { lat, lng } = e.target.getLatLng()
        handleMapClick(lat, lng)
      })

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng
        handleMapClick(lat, lng)
      })

      mapInstanceRef.current = map
      markerRef.current = marker

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          markerRef.current = null
        }
      }
    } catch (error) {
      console.error("Error initializing map:", error)
      toast.error("Failed to initialize map")
    }
  }, [leafletLoaded, handleMapClick])

  // Update map when location changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && locationLat && locationLng) {
      markerRef.current.setLatLng([locationLat, locationLng])
      mapInstanceRef.current.setView([locationLat, locationLng], 15)
    }
  }, [locationLat, locationLng])

  // Autocomplete search suggestions
  const fetchSearchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&extratags=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        setSearchSuggestions(data)
        setShowSuggestions(true)
      } else {
        setSearchSuggestions([])
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error("Search suggestions error:", error)
      setSearchSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Handle search input change with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search suggestions
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchSearchSuggestions(value)
      }, 300) // 300ms delay
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }, [fetchSearchSuggestions])

  // Select a suggestion and update map
  const selectSuggestion = useCallback((suggestion: {
    display_name: string
    lat: string
    lon: string
    address?: any
  }) => {
    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)

    setSearchQuery(suggestion.display_name)
    setSearchSuggestions([])
    setShowSuggestions(false)

    // Extract address components
    const addressParts = suggestion.address || {}
    setEventData((prev) => ({
      ...prev,
      location: suggestion.display_name
    }))
    setLocationLat(lat)
    setLocationLng(lng)
    setLocationCity(addressParts.city || addressParts.town || addressParts.village || addressParts.municipality || "")

    toast.success("Location selected!")
  }, [])

  // Geocoding: Convert address to coordinates (for manual search button)
  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setShowSuggestions(false)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)

        const addressParts = result.address || {}
        setEventData((prev) => ({
          ...prev,
          location: result.display_name || searchQuery
        }))
        setLocationLat(lat)
        setLocationLng(lng)
        setLocationCity(addressParts.city || addressParts.town || addressParts.village || addressParts.municipality || "")

        toast.success("Location found!")
      } else {
        toast.error("Location not found. Try a different address.")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      toast.error("Failed to search location")
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery])

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (searchSuggestions.length > 0) {
        selectSuggestion(searchSuggestions[0])
      } else {
        searchLocation()
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])


  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-white">
        <CommunityAdminNav />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-4">Loading event data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <CommunityAdminNav />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-light text-gray-900 mb-3">Edit Event</h1>
              <p className="text-gray-600">Update your event details</p>
            </div>
            <Link href="/community-admin/events">
              <Button variant="outline" size="icon" className="border-gray-200 hover:border-purple-300 hover:bg-purple-50">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Basic Information */}
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-gray-900">Event Details</CardTitle>
              <p className="text-gray-600">Update your event information</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., AI Workshop for Beginners"
                  value={eventData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description">Description *</Label>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm text-gray-600">Category (optional)</Label>
                  <Select value={eventData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="border-gray-200 focus:border-violet-300 focus:ring-violet-200">
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Textarea
                  id="description"
                  placeholder="Describe what your event is about, what attendees will learn or experience..."
                  value={eventData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="min-h-[120px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 resize-none"
                  required
                />
                <p className="text-sm text-gray-500">{eventData.description.length}/1000 characters</p>
              </div>
            </CardContent>
          </Card>

          {/* Date, Time & Location */}
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-gray-900">When & Where</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-gray-200",
                          !eventData.date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventData.date ? format(eventData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={eventData.date}
                        onSelect={(date) => handleInputChange("date", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={eventData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={eventData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="capacity">Capacity (Max Attendees)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="e.g., 50"
                    value={eventData.capacity}
                    onChange={(e) => handleInputChange("capacity", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="isOnline" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Online Event
                  </Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isOnline"
                      checked={eventData.isOnline}
                      onChange={(e) => handleInputChange("isOnline", e.target.checked)}
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <Label htmlFor="isOnline" className="text-sm text-gray-600 cursor-pointer">
                      This is an online event
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="isPublic" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Public Event
                  </Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={eventData.isPublic}
                      onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <Label htmlFor="isPublic" className="text-sm text-gray-600 cursor-pointer">
                      Make this event visible to everyone
                    </Label>
                  </div>
                </div>
              </div>
              
              {eventData.isOnline && (
                <div className="space-y-3">
                  <Label htmlFor="meetingLink">Meeting Link *</Label>
                  <Input
                    id="meetingLink"
                    type="url"
                    placeholder="e.g., https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
                    value={eventData.meetingLink}
                    onChange={(e) => handleInputChange("meetingLink", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                    required={eventData.isOnline}
                  />
                  <p className="text-xs text-gray-500">Provide the meeting link for online attendees</p>
                </div>
              )}

              {/* Location Section - Only show for offline events */}
              {!eventData.isOnline && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <Label className="text-base font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-600" />
                  Location *
                </Label>
                
                {/* Search Address with Autocomplete */}
                <div>
                  <Label htmlFor="search-address" className="text-sm text-gray-600">Search Address</Label>
                  <div className="mt-1 relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                        <Input
                          id="search-address"
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          onKeyDown={handleSearchKeyDown}
                          onFocus={() => {
                            if (searchSuggestions.length > 0) {
                              setShowSuggestions(true)
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowSuggestions(false), 200)
                          }}
                          placeholder="Type an address (e.g., Grand Indonesia Mall, Jakarta)"
                          className="pl-10 border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={searchLocation}
                        disabled={!searchQuery.trim() || isSearching}
                        className="bg-violet-700 hover:bg-violet-800 text-white"
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => selectSuggestion(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-violet-50 transition-colors border-b border-gray-100 last:border-b-0"
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {suggestion.display_name}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Map */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Select location on map</Label>
                  <div 
                    ref={mapRef} 
                    className="w-full h-[400px] rounded-lg border border-gray-200 overflow-hidden"
                    style={{ zIndex: 0 }}
                  />
                  {!leafletLoaded && (
                    <div className="w-full h-[400px] rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
                      <p className="text-gray-500">Loading map...</p>
                    </div>
                  )}
                </div>

                {/* Location Details */}
                {(locationLat && locationLng) && (
                  <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
                    <div className="text-sm space-y-1">
                      <p className="text-gray-700">
                        <span className="font-medium">Address:</span> {eventData.location || "Not set"}
                      </p>
                      {locationCity && (
                        <p className="text-gray-700">
                          <span className="font-medium">City:</span> {locationCity}
                        </p>
                      )}
                      <p className="text-gray-600 text-xs">
                        <span className="font-medium">Coordinates:</span> {locationLat.toFixed(6)}, {locationLng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              )}
            </CardContent>
          </Card>
          
          {/* Event Image */}
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Event Image
              </CardTitle>
              <p className="text-gray-600">Upload an image for your event (this will be the background in the hero section)</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="eventImage">Event Image</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="eventImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                    />
                  </div>
                </div>
                {eventImagePreview && (
                  <div className="mt-4">
                    <img
                      src={eventImagePreview}
                      alt="Event preview"
                      className="w-full h-64 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                {!eventImagePreview && (
                  <div className="mt-4 p-8 border-2 border-dashed border-gray-200 rounded-lg text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No image selected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-violet-700 hover:bg-violet-800 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
