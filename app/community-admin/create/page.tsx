"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Wand2, Sparkles, RefreshCw, Copy, Lightbulb, ArrowLeft, MapPin, Search, Loader2, Image as ImageIcon, Globe } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { EnhanceContentButton } from "@/components/ai/enhance-content-button"
import { CommunityAdminNav } from "@/components/navigation/community-admin-nav"
import { toast } from "sonner"

export default function CreateEventPage() {
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

  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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


  const handleInputChange = (field: string, value: any) => {
    setEventData((prev) => ({ ...prev, [field]: value }))
  }

  const generateDescription = async () => {
    if (!eventData.title) {
      alert("Please enter an event title first")
      return
    }

    setIsGeneratingDescription(true)
    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "event-description",
          params: {
            title: eventData.title,
            category: eventData.category || undefined, // Optional category
            location: eventData.location,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEventData((prev) => ({ ...prev, description: data.description }))
        setAiSuggestions(data)
      }
    } catch (error) {
      console.error("Failed to generate description:", error)
    } finally {
      setIsGeneratingDescription(false)
    }
  }


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEventImage(file)
      const url = URL.createObjectURL(file)
      setEventImagePreview(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("=== FORM SUBMITTED ===", { 
      isSubmitting, 
      eventData: {
        title: eventData.title,
        description: eventData.description?.substring(0, 50) + "...",
        date: eventData.date,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        isOnline: eventData.isOnline,
        isPublic: eventData.isPublic
      }
    })
    
    if (isSubmitting) {
      console.log("Already submitting, returning early")
      return
    }
    
    setIsSubmitting(true)
    console.log("=== STARTING EVENT CREATION PROCESS ===")
    
    // Validation
    if (!eventData.title || !eventData.description) {
      toast.error("Please fill in all required fields (title, description)")
      setIsSubmitting(false)
      return
    }
    
    if (!eventData.date || !eventData.startTime || !eventData.endTime) {
      toast.error("Please select date, start time, and end time")
      setIsSubmitting(false)
      return
    }
    
    // Note: Location validation will be done later when formatting locationJson
    // This allows for more flexible location handling (with or without coordinates)

    try {
      // Get current user and community
      const { getSupabaseBrowser } = await import("@/lib/supabase/client")
      const supabase = getSupabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Please login to create an event")
        setIsSubmitting(false)
        return
      }

      // Get user's community (as creator or admin)
      // Priority: creator first, then admin
      let { data: community } = await supabase
        .from("communities")
        .select("id, name")
        .eq("creator_id", user.id)
        .limit(1)
        .maybeSingle()

      if (!community) {
        const { data: memberData } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .limit(1)
          .maybeSingle()
        
        if (memberData) {
          const { data: comm } = await supabase
            .from("communities")
            .select("id, name")
            .eq("id", memberData.community_id)
            .single()
          
          if (comm) {
            community = comm
          }
        }
      }

      if (!community) {
        toast.error("You must be a community admin to create events")
        setIsSubmitting(false)
        return
      }

      // Log for debugging
      console.log("Creating event for community:", {
        community_id: community.id,
        community_name: community.name,
        user_id: user.id,
        user_email: user.email
      })

      // Calculate start_time and end_time
      // Get date in local timezone
      const year = eventData.date.getFullYear()
      const month = String(eventData.date.getMonth() + 1).padStart(2, '0')
      const day = String(eventData.date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      // Parse start time
      const [startHours, startMinutes] = eventData.startTime.split(':')
      const startDateTimeStr = `${dateStr}T${startHours}:${startMinutes}:00`
      const startDateTime = new Date(startDateTimeStr)
      
      // Parse end time
      const [endHours, endMinutes] = eventData.endTime.split(':')
      const endDateTimeStr = `${dateStr}T${endHours}:${endMinutes}:00`
      let endDateTime = new Date(endDateTimeStr)
      
      // Validate dates
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast.error("Invalid date or time. Please check your input.")
        setIsSubmitting(false)
        return
      }
      
      // If end time is earlier than or equal to start time, assume it's the next day
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1)
        console.log("End time is before start time, assuming next day:", endDateTime.toISOString())
      }
      
      // Final validation that end time is after start time
      if (endDateTime <= startDateTime) {
        toast.error("End time must be after start time")
        setIsSubmitting(false)
        return
      }
      
      console.log("Date calculations:", {
        dateStr,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
      })

      console.log("=== FORMATTING LOCATION ===")
      console.log("isOnline:", eventData.isOnline)
      console.log("location:", eventData.location)
      console.log("meetingLink:", eventData.meetingLink)
      console.log("locationLat:", locationLat)
      console.log("locationLng:", locationLng)

      // Format location as JSON
      let locationJson: string | null = null
      try {
        if (eventData.isOnline) {
          if (!eventData.meetingLink) {
            console.error("ERROR: Online event but no meeting link")
            toast.error("Please provide a meeting link for online events")
            setIsSubmitting(false)
            return
          }
          locationJson = JSON.stringify({
            isOnline: true,
            meetingLink: eventData.meetingLink,
          })
          console.log("Location JSON (online):", locationJson)
        } else {
          // For offline events, location is required
          if (!eventData.location) {
            console.error("ERROR: Offline event but no location")
            toast.error("Please provide a location for offline events")
            setIsSubmitting(false)
            return
          }
          
          // If location has lat/lng, use them; otherwise use text location
          if (locationLat && locationLng) {
            locationJson = JSON.stringify({
              venue: eventData.location,
              address: eventData.location,
              city: locationCity || "",
              lat: locationLat,
              lng: locationLng,
              isOnline: false,
            })
            console.log("Location JSON (offline with coords):", locationJson)
          } else {
            // Fallback: use text location without coordinates
            locationJson = JSON.stringify({
              venue: eventData.location,
              address: eventData.location,
              city: locationCity || "",
              isOnline: false,
            })
            console.log("Location JSON (offline text only):", locationJson)
          }
        }
      } catch (locationError) {
        console.error("ERROR formatting location:", locationError)
        toast.error("Error formatting location. Please try again.")
        setIsSubmitting(false)
        return
      }
      
      // Ensure location is set
      if (!locationJson) {
        console.error("ERROR: locationJson is null after formatting")
        toast.error("Please provide location information")
        setIsSubmitting(false)
        return
      }
      
      console.log("=== LOCATION FORMATTED SUCCESSFULLY ===")

      // Upload image if provided
      console.log("=== CHECKING IMAGE UPLOAD ===")
      console.log("eventImage:", eventImage ? "exists" : "null")
      let imageUrl: string | null = null
      if (eventImage) {
        console.log("Uploading image...")
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
            console.log("Image uploaded successfully:", imageUrl)
          } else {
            const errorData = await uploadResponse.json()
            console.error("Failed to upload image:", errorData)
            toast.error("Failed to upload image, but event will be created without image")
          }
        } catch (imageError) {
          console.error("ERROR uploading image:", imageError)
          toast.error("Failed to upload image, but event will be created without image")
        }
      } else {
        console.log("No image to upload")
      }
      console.log("=== IMAGE UPLOAD CHECK COMPLETE ===")

      // Prepare event data
      console.log("=== PREPARING EVENT PAYLOAD ===")
      const eventPayload: any = {
        title: eventData.title,
        description: eventData.description,
        location: locationJson,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        image_url: imageUrl,
        community_id: community.id,
        is_online: eventData.isOnline,
        is_public: eventData.isPublic,
        max_attendees: eventData.capacity ? parseInt(eventData.capacity) : null,
      }

      // Only include category if provided (optional field)
      if (eventData.category) {
        eventPayload.category = eventData.category
      }
      
      console.log("Event payload prepared:", {
        title: eventPayload.title,
        hasDescription: !!eventPayload.description,
        hasLocation: !!eventPayload.location,
        start_time: eventPayload.start_time,
        end_time: eventPayload.end_time,
        community_id: eventPayload.community_id,
        is_online: eventPayload.is_online,
        is_public: eventPayload.is_public,
      })

      // Create event via API
      console.log("=== SENDING EVENT TO API ===")
      console.log("Event payload:", JSON.stringify(eventPayload, null, 2))
      
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      })
      
      console.log("=== API RESPONSE RECEIVED ===")
      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      // Check response status first
      if (!response.ok) {
        let errorMessage = `Failed to create event (${response.status})`
        try {
          const errorData = await response.json()
          errorMessage = errorData?.error || errorData?.details || errorMessage
          console.error("API Error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
        } catch (parseError) {
          const text = await response.text()
          console.error("Failed to parse error response:", text)
        }
        throw new Error(errorMessage)
      }

      // Parse successful response
      let result
      try {
        result = await response.json()
        console.log("API Response:", result)
      } catch (parseError) {
        console.error("Failed to parse response:", parseError)
        const text = await response.text()
        console.error("Response text:", text)
        throw new Error("Invalid response from server")
      }

      // Check if event was actually created (result.success or result.data indicates success)
      if (!result || (!result.success && !result.data)) {
        console.error("Event creation failed - no success response:", result)
        throw new Error(result?.error || result?.message || "Event creation failed")
      }

      console.log("=== EVENT CREATED SUCCESSFULLY ===")
      console.log("Event data:", result.data || result)
      
      // Show success toast
      toast.success("Event created successfully!", {
        duration: 1500,
      })
      
      // Redirect to events page
      console.log("=== REDIRECTING TO /community-admin/events ===")
      // Use router.push for better Next.js navigation
      try {
        const { useRouter } = await import("next/navigation")
        // Actually, we can't use hooks here, so use window.location
        window.location.href = "/community-admin/events"
      } catch (redirectError) {
        console.error("Redirect error:", redirectError)
        // Fallback to window.location
        window.location.href = "/community-admin/events"
      }
    } catch (error: any) {
      console.error("Error creating event:", error)
      const errorMessage = error?.message || error?.toString() || "Failed to create event. Please try again."
      console.error("Full error details:", {
        name: error?.name,
        message: errorMessage,
        stack: error?.stack
      })
      toast.error(errorMessage)
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

  return (
    <div className="min-h-screen bg-white">
      <CommunityAdminNav />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-light text-gray-900 mb-3">Create Your Event</h1>
              <p className="text-gray-600">Organize memorable experiences with AI-powered assistance</p>
            </div>
            <Link href="/community-admin/events">
              <Button variant="outline" size="icon" className="border-gray-200 hover:border-purple-300 hover:bg-purple-50">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information with AI Integration */}
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-2">
                Event Details
                <Badge variant="secondary" className="ml-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
              </CardTitle>
              <p className="text-gray-600">Let AI help you create compelling event details</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Event Title *</Label>
                  <EnhanceContentButton
                    content={eventData.title}
                    contentType="title"
                    onEnhanced={(enhanced) => handleInputChange("title", enhanced)}
                    context={{ category: eventData.category, type: "event" }}
                    disabled={!eventData.title}
                  />
                </div>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description *</Label>
                  <div className="flex gap-2">
                    <EnhanceContentButton
                      content={eventData.description}
                      contentType="description"
                      onEnhanced={(enhanced) => handleInputChange("description", enhanced)}
                      context={{
                        name: eventData.title,
                        category: eventData.category,
                        type: "event",
                      }}
                      disabled={!eventData.description}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescription}
                      disabled={!eventData.title || isGeneratingDescription}
                      className="border-violet-200 text-violet-600 hover:bg-violet-50"
                    >
                      {isGeneratingDescription ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Category input for AI generation (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm text-gray-600">Category (optional - helps AI generate better description)</Label>
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
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">{eventData.description.length}/1000 characters</p>
                  {aiSuggestions && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(eventData.description)}
                      className="text-violet-600 hover:text-violet-700"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  )}
                </div>
              </div>

              {/* AI Suggestions Panel */}
              {aiSuggestions && (
                <Card className="border-violet-200 bg-violet-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-violet-700 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      AI Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aiSuggestions.alternativeDescriptions && (
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Alternative Descriptions:</Label>
                        <div className="space-y-2 mt-1">
                          {aiSuggestions.alternativeDescriptions.slice(0, 2).map((alt: string, index: number) => (
                            <div key={index} className="p-2 bg-white rounded border text-sm">
                              <p className="text-gray-700">{alt}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleInputChange("description", alt)}
                                className="mt-1 h-6 px-2 text-xs text-violet-600"
                              >
                                Use this
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
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
              <p className="text-gray-600">Upload an image for your event</p>
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
                  Creating Event...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
