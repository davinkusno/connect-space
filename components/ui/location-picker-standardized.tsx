"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { LocationSearchResult, StandardizedLocation, toStandardizedLocation } from "@/types/location"
import { Loader2, MapPin, Navigation, Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface LocationPickerStandardizedProps {
  value?: StandardizedLocation
  onChange: (location: StandardizedLocation) => void
  locationType?: "physical" | "online" | "hybrid"
  className?: string
  required?: boolean
}

/**
 * Location Picker Component (Standardized)
 * 
 * Uses our backend API for:
 * - Location search (OpenStreetMap Nominatim in English)
 * - Reverse geocoding (map clicks, current location)
 * 
 * Features:
 * - Consistent English city names (e.g., "Jakarta", not "Daerah Khusus Ibukota Jakarta")
 * - Same data structure as user profile
 * - Works with recommendation algorithms (city matching)
 * - Interactive Leaflet map
 */
export function LocationPickerStandardized({
  value,
  onChange,
  locationType = "physical",
  className,
  required = false,
}: LocationPickerStandardizedProps) {
  const [searchQuery, setSearchQuery] = useState(value?.displayName || "")
  const [isSearching, setIsSearching] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<LocationSearchResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<StandardizedLocation | null>(value || null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Reverse geocoding: Convert coordinates to address using our API
  const handleMapClick = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `/api/locations/reverse?lat=${lat}&lon=${lon}`
      )

      if (!response.ok) {
        throw new Error("Failed to reverse geocode")
      }

      const data = await response.json()
      
      if (data.location) {
        const standardizedLocation = toStandardizedLocation(data.location)
        setCurrentLocation(standardizedLocation)
        setSearchQuery(standardizedLocation.displayName)
        onChange(standardizedLocation)
        toast.success("Location selected!")
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      toast.error("Failed to get location details")
    }
  }, [onChange])

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return
    if (locationType === "online") return

    try {
      const L = (window as any).L
      const defaultCenter = currentLocation 
        ? { lat: currentLocation.lat, lon: currentLocation.lon }
        : { lat: 0, lon: 0 } // World center default

      const map = L.map(mapRef.current, {
        center: [defaultCenter.lat, defaultCenter.lon],
        zoom: currentLocation ? 15 : 2,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Add marker
      const marker = L.marker([defaultCenter.lat, defaultCenter.lon], {
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
  }, [leafletLoaded, handleMapClick, locationType])

  // Update map when location changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && currentLocation) {
      markerRef.current.setLatLng([currentLocation.lat, currentLocation.lon])
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lon], 15)
    }
  }, [currentLocation])

  // Search for locations using our API
  const fetchSearchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch(
        `/api/locations/search?q=${encodeURIComponent(query.trim())}`
      )

      if (!response.ok) {
        throw new Error("Failed to search locations")
      }

      const data = await response.json()

      if (data.cities && data.cities.length > 0) {
        setSearchSuggestions(data.cities)
        setShowSuggestions(true)
      } else {
        setSearchSuggestions([])
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error("Search suggestions error:", error)
      setSearchSuggestions([])
      toast.error("Failed to search locations")
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
    if (value.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchSearchSuggestions(value)
      }, 500) // 500ms delay
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }, [fetchSearchSuggestions])

  // Select a suggestion and update map
  const selectSuggestion = useCallback((suggestion: LocationSearchResult) => {
    const standardizedLocation = toStandardizedLocation(suggestion)
    setCurrentLocation(standardizedLocation)
    setSearchQuery(standardizedLocation.displayName)
    setSearchSuggestions([])
    setShowSuggestions(false)
    onChange(standardizedLocation)
    toast.success("Location selected!")
  }, [onChange])

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setIsSearching(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        handleMapClick(lat, lon)
        setIsSearching(false)
      },
      (error: GeolocationPositionError) => {
        let errorMessage = "Failed to get your location"
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = "Location access denied. Please enable location permissions."
            break
          case 2: // POSITION_UNAVAILABLE
            errorMessage = "Location information unavailable."
            break
          case 3: // TIMEOUT
            errorMessage = "Location request timed out."
            break
        }
        
        console.error("Geolocation error:", error)
        toast.error(errorMessage)
        setIsSearching(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [handleMapClick])

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (searchSuggestions.length > 0) {
        selectSuggestion(searchSuggestions[0])
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

  // Online communities - text input only
  if (locationType === "online") {
    return (
      <div className={cn("space-y-3", className)}>
        <Input
          placeholder="e.g., Zoom, Google Meet, Discord"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            // For online, create a simple location object
            const onlineLocation: StandardizedLocation = {
              city: "Online",
              placeId: "online",
              lat: 0,
              lon: 0,
              displayName: e.target.value,
              fullAddress: e.target.value,
            }
            onChange(onlineLocation)
          }}
          className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
        />
        <p className="text-sm text-gray-500">
          Enter the platform or link where the event will be held online
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input with Autocomplete */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            placeholder="Search for a city or address..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => {
              if (searchSuggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            className="pl-10 pr-24 border-gray-200 focus:border-violet-300 focus:ring-violet-200"
            required={required}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isSearching}
              className="h-7 px-2"
              title="Use my current location"
            >
              <Navigation className="h-4 w-4 text-violet-600" />
            </Button>
          </div>
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id || index}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-violet-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {suggestion.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
          </div>
        )}
      </div>

      {/* Map */}
      {locationType !== "online" && (
        <div className="space-y-2">
          <div
            ref={mapRef}
            className="w-full h-[400px] rounded-lg border border-gray-200 overflow-hidden bg-gray-100"
            style={{ zIndex: 0 }}
          />
          {!leafletLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500">
            💡 Click on the map or drag the pin to set the location
          </p>
        </div>
      )}

      {/* Selected Location Display */}
      {currentLocation && currentLocation.lat !== 0 && currentLocation.lon !== 0 && (
        <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg border border-violet-200">
          <MapPin className="h-4 w-4 text-violet-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentLocation.city}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {currentLocation.displayName}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

