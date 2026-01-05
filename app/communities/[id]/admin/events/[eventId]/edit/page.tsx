"use client"

import { EnhanceContentButton } from "@/components/ai/enhance-content-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingElements } from "@/components/ui/floating-elements"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/components/ui/page-transition"
import { SmoothReveal } from "@/components/ui/smooth-reveal"
import { Textarea } from "@/components/ui/textarea"
import {
    ArrowLeft,
    Calendar, Clock, Globe, Image as ImageIcon, Loader2, MapPin, Search
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { use, useCallback, useEffect, useRef, useState } from "react"
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
  params: Promise<{ eventId: string }>;
}) {
  const pathname = usePathname();
  // Extract community ID from pathname: /communities/[communityId]/admin/events/[eventId]/edit
  const pathParts = pathname?.split("/") || [];
  const communityIdIndex = pathParts.indexOf("communities") + 1;
  const communityId = communityIdIndex > 0 && pathParts[communityIdIndex] ? pathParts[communityIdIndex] : null;
  
  // This eventId is the event ID (from nested route)
  const { eventId } = use(params);
  const router = useRouter()
  
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    category: "",
    start_time: "",
    end_time: "",
    location: "",
    capacity: "",
    isOnline: false,
    link: "",
  })
  
  const [eventImage, setEventImage] = useState<File | null>(null)
  const [eventImagePreview, setEventImagePreview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [communityName, setCommunityName] = useState<string>("Community")
  
  // AI Enhancement state

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
        if (eventId.startsWith("dummy-")) {
          setIsLoadingEvent(false)
          return
        }

        // Fetch event data from API
        const eventResponse = await fetch(`/api/events/${eventId}`)
        if (!eventResponse.ok) {
          console.error("Event not found")
          toast.error("Event not found")
          setIsLoadingEvent(false)
          return
        }

        const eventApiData = await eventResponse.json()
        const eventRecord = eventApiData.event

        if (!eventRecord) {
          console.error("Event not found")
          toast.error("Event not found")
          setIsLoadingEvent(false)
          return
        }

        // Get community name from event data
        if (eventRecord.communities?.name) {
          setCommunityName(eventRecord.communities.name)
        } else {
          // Fallback: fetch from API
          const communityResponse = await fetch(`/api/communities/${eventRecord.community_id}`)
          if (communityResponse.ok) {
            const communityData = await communityResponse.json()
            setCommunityName(communityData.name || "Community")
          }
        }

        // Parse location
        let locationStr = ""
        let isOnline = eventRecord.is_online || false
        
        if (eventRecord.location) {
          try {
            const parsed = typeof eventRecord.location === 'string' 
              ? JSON.parse(eventRecord.location) 
              : eventRecord.location
            
            if (parsed.address || parsed.venue) {
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

        // Format dates to datetime-local format (YYYY-MM-DDTHH:mm)
        const startTime = new Date(eventRecord.start_time)
        const endTime = new Date(eventRecord.end_time)
        
        // Convert to datetime-local format
        const formatDateTimeLocal = (date: Date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          return `${year}-${month}-${day}T${hours}:${minutes}`
        }

        // Set event data
        setEventData({
          title: eventRecord.title || "",
          description: eventRecord.description || "",
          category: eventRecord.category || "",
          start_time: formatDateTimeLocal(startTime),
          end_time: formatDateTimeLocal(endTime),
          location: locationStr,
          capacity: eventRecord.max_attendees?.toString() || "",
          isOnline: isOnline,
          link: eventRecord.link || "",
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
  }, [eventId])

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

      // Convert datetime-local to ISO string
      let startTime = null
      let endTime = null
      
      if (eventData.start_time) {
        startTime = new Date(eventData.start_time).toISOString()
      }
      
      if (eventData.end_time) {
        endTime = new Date(eventData.end_time).toISOString()
      }

      // Format location as JSON with city for searchability
      let locationValue: string | null = null
      if (!eventData.isOnline) {
        if (eventData.location || locationLat || locationLng || locationCity) {
          locationValue = JSON.stringify({
            address: eventData.location || "",
            city: locationCity || "",
            lat: locationLat || 0,
            lng: locationLng || 0,
          })
        }
      }

      // Prepare update payload (only include fields that are provided)
      const updatePayload: any = {}

      if (eventData.title) updatePayload.title = eventData.title
      if (eventData.description) updatePayload.description = eventData.description
      if (eventData.category) updatePayload.category = eventData.category
      if (locationValue) updatePayload.location = locationValue
      if (startTime) updatePayload.start_time = startTime
      if (endTime) updatePayload.end_time = endTime
      if (imageUrl) updatePayload.image_url = imageUrl
      if (eventData.isOnline !== undefined) updatePayload.is_online = eventData.isOnline
      if (eventData.capacity) updatePayload.max_attendees = parseInt(eventData.capacity)
      if (eventData.link !== undefined) updatePayload.link = eventData.link || null

      // Update event via API
      const response = await fetch(`/api/events/${eventId}/update`, {
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
        window.location.href = `/events/${eventId}`
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

  // Initialize map - only when all conditions are met
  useEffect(() => {
    // Don't initialize if: online event, leaflet not loaded, already initialized, or still loading event
    if (eventData.isOnline || !leafletLoaded || mapInstanceRef.current || isLoadingEvent) return

    // Function to initialize the map
    const initMap = () => {
      // Double-check conditions
      if (!mapRef.current || mapInstanceRef.current || eventData.isOnline) return

      const container = mapRef.current
      // Check if container has dimensions (is visible)
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        // Container not ready yet, retry
        return false
      }

      try {
        const L = (window as any).L
        if (!L) {
          console.error("Leaflet not available")
          return false
        }

        const defaultCenter = locationLat && locationLng 
          ? { lat: locationLat, lng: locationLng }
          : { lat: -6.2088, lng: 106.8456 } // Jakarta default

        const map = L.map(container, {
          center: [defaultCenter.lat, defaultCenter.lng],
          zoom: locationLat && locationLng ? 15 : 13,
          zoomControl: true,
        })

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        // Add marker with custom icon
        const marker = L.marker([defaultCenter.lat, defaultCenter.lng], {
          draggable: true,
          icon: L.divIcon({
            className: "custom-marker",
            html: `<div style="background-color: #7c3aed; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          }),
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

        // Invalidate size after initialization to ensure proper rendering
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, 300)
        
        return true
      } catch (error) {
        console.error("Error initializing map:", error)
        toast.error("Failed to initialize map")
        return false
      }
    }

    // Try to initialize immediately
    if (!initMap()) {
      // If container not ready, retry with increasing delays
      let retryCount = 0
      const maxRetries = 10
      const retryInterval = setInterval(() => {
        retryCount++
        if (initMap() || retryCount >= maxRetries) {
          clearInterval(retryInterval)
        }
      }, 200)
      
      return () => {
        clearInterval(retryInterval)
      }
    }

    // Cleanup function
    return () => {
      // Don't cleanup map here, let the cleanup effect handle it
    }
  }, [leafletLoaded, eventData.isOnline, isLoadingEvent, locationLat, locationLng, handleMapClick])

  // Cleanup map when switching to online event
  useEffect(() => {
    if (eventData.isOnline && mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [eventData.isOnline])

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Update map when location changes (after map is initialized)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) {
      // Map not initialized yet, but we have location data - try to initialize
      if (locationLat && locationLng && leafletLoaded && !eventData.isOnline && !isLoadingEvent && mapRef.current) {
        // Trigger map initialization by forcing a re-render check
        // The initialization effect will handle this
        return
      }
      return
    }
    
    if (locationLat && locationLng) {
      markerRef.current.setLatLng([locationLat, locationLng])
      mapInstanceRef.current.setView([locationLat, locationLng], 15)
      // Invalidate size to ensure proper rendering
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
        }
      }, 100)
    }
  }, [locationLat, locationLng, leafletLoaded, eventData.isOnline, isLoadingEvent])

  // Cleanup map when switching to online event
  useEffect(() => {
    if (eventData.isOnline && mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [eventData.isOnline])

  // Invalidate map size when container becomes visible or when not loading
  useEffect(() => {
    if (!eventData.isOnline && mapInstanceRef.current && mapRef.current && !isLoadingEvent) {
      const timeout = setTimeout(() => {
        if (mapInstanceRef.current && mapRef.current) {
          const container = mapRef.current
          if (container.offsetWidth > 0 && container.offsetHeight > 0) {
            mapInstanceRef.current.invalidateSize()
          }
        }
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [eventData.isOnline, isLoadingEvent])

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading event data...</p>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
        <FloatingElements />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
          <SmoothReveal delay={100} direction="up">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
            <Link href={communityId ? `/communities/${communityId}/admin/events` : "/communities/admin"}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hover:bg-violet-50 transition-colors group"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back
              </Button>
            </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                  <span className="text-sm font-medium text-violet-700">{communityName}</span>
          </div>
        </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Edit Event</h1>
                  <p className="text-gray-600 mt-1">Update your event details for {communityName}</p>
                </div>
              </div>
            </div>
          </SmoothReveal>

        <form onSubmit={handleSave} className="space-y-8">
            {/* Basic Information */}
            <SmoothReveal delay={200} direction="up">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
              <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Event Details</CardTitle>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description *</Label>
                  <EnhanceContentButton
                    content={eventData.description}
                    contentType="description"
                    onEnhanced={(enhanced) => handleInputChange("description", enhanced)}
                    context={{
                      name: eventData.title,
                      category: communityName || "",
                      type: "event",
                    }}
                    disabled={!eventData.description.trim()}
                    className="text-xs"
                  />
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
            </SmoothReveal>

          {/* Date, Time & Location */}
            <SmoothReveal delay={300} direction="up">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
              <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">When & Where</CardTitle>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="start_time" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    Start Date & Time *
                  </Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={eventData.start_time}
                    onChange={(e) => handleInputChange("start_time", e.target.value)}
                    className="h-12 border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="end_time" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    End Date & Time *
                  </Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={eventData.end_time}
                    onChange={(e) => handleInputChange("end_time", e.target.value)}
                    className="h-12 border-gray-200 focus:border-violet-300 focus:ring-violet-200"
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
                <div className="space-y-3">
                  <Label htmlFor="link">Registration Link</Label>
                  <Input
                    type="url"
                    id="link"
                    placeholder="https://example.com/register"
                    value={eventData.link}
                    onChange={(e) => handleInputChange("link", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                  />
                  <p className="text-xs text-gray-500">Optional: Add a link to external registration page</p>
                </div>
              </div>

              {/* Online Event Checkbox */}
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={eventData.isOnline}
                  onChange={(e) => {
                    handleInputChange("isOnline", e.target.checked);
                    if (e.target.checked) {
                      handleInputChange("location", "");
                      setLocationLat(null);
                      setLocationLng(null);
                      setLocationCity("");
                    }
                  }}
                  className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                />
                <Label htmlFor="isOnline" className="cursor-pointer font-medium text-gray-700 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-violet-600" />
                  This is an online event
                </Label>
              </div>

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
                  {!leafletLoaded ? (
                    <div className="w-full h-[400px] rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
                      <p className="text-gray-500">Loading map...</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-[400px] rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                      <div 
                        ref={mapRef} 
                        className="relative w-full h-full z-0"
                        style={{ minHeight: '400px' }}
                      />
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
            </SmoothReveal>

          {/* Event Image */}
            <SmoothReveal delay={400} direction="up">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
              <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
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
            </SmoothReveal>

          {/* Submit Button */}
            <SmoothReveal delay={500} direction="up">
              <div className="flex justify-end gap-4">
                <Link href={communityId ? `/communities/${communityId}/admin/events` : "/communities/admin"}>
                  <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
                    Cancel
                  </Button>
                </Link>
                          <Button
              type="submit" 
              disabled={isSubmitting}
                  className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white px-8 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            </SmoothReveal>
        </form>
        </div>
      </div>

    </PageTransition>
  )
}



