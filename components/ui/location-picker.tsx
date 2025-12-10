"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Loader2, MapPin, Navigation, Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
const USE_GOOGLE_PLACES = !!GOOGLE_PLACES_API_KEY

interface LocationData {
  address: string
  lat: number | null
  lng: number | null
  city?: string
  country?: string
}

interface LocationPickerProps {
  value?: LocationData
  onChange: (location: LocationData) => void
  locationType?: "physical" | "online" | "hybrid"
  className?: string
  required?: boolean
}

export function LocationPicker({
  value,
  onChange,
  locationType = "physical",
  className,
  required = false,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(value?.address || "")
  const [isSearching, setIsSearching] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{
    display_name: string
    lat: string
    lon: string
    address?: any
  }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locationLat, setLocationLat] = useState<number | null>(value?.lat || null)
  const [locationLng, setLocationLng] = useState<number | null>(value?.lng || null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load Google Maps API (if API key is available)
  useEffect(() => {
    if (!USE_GOOGLE_PLACES || typeof window === "undefined") return

    const loadGoogleMaps = () => {
      if ((window as any).google?.maps?.places) {
        setGoogleMapsLoaded(true)
        initializeGooglePlaces()
        return
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Wait for it to load
        const checkInterval = setInterval(() => {
          if ((window as any).google?.maps?.places) {
            clearInterval(checkInterval)
            setGoogleMapsLoaded(true)
            initializeGooglePlaces()
          }
        }, 100)
        return () => clearInterval(checkInterval)
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&callback=initGoogleMaps`
      script.async = true
      script.defer = true

      // Set up callback
      ;(window as any).initGoogleMaps = () => {
        setGoogleMapsLoaded(true)
        initializeGooglePlaces()
      }

      script.onerror = () => {
        console.error("Failed to load Google Maps API")
        toast.error("Failed to load location search. Using basic search instead.")
      }

      document.head.appendChild(script)
    }

    const initializeGooglePlaces = () => {
      if (!(window as any).google?.maps?.places) return

      const google = (window as any).google
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
      placesServiceRef.current = new google.maps.places.PlacesService(
        document.createElement("div")
      )
    }

    loadGoogleMaps()
  }, [])

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
        const country = addr.country || ""
        
        const locationData: LocationData = {
          address: displayName,
          lat,
          lng,
          city,
          country,
        }
        
        setSearchQuery(displayName)
        onChange(locationData)
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
    }
  }, [onChange])

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return
    if (locationType === "online") return

    try {
      const L = (window as any).L
      const defaultCenter = locationLat && locationLng 
        ? { lat: locationLat, lng: locationLng }
        : { lat: -6.2088, lng: 106.8456 } // Jakarta default

      const map = L.map(mapRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: locationLat && locationLng ? 15 : 10,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Add marker
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
    if (mapInstanceRef.current && markerRef.current && locationLat && locationLng) {
      markerRef.current.setLatLng([locationLat, locationLng])
      mapInstanceRef.current.setView([locationLat, locationLng], 15)
    }
  }, [locationLat, locationLng])

  // Nominatim search fallback (OpenStreetMap)
  const fetchNominatimSuggestions = useCallback(async (query: string) => {
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

  // Photon search (free, no API key, better for autocomplete than Nominatim)
  const fetchPhotonSuggestions = useCallback(async (query: string) => {
    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`
      )
      const data = await response.json()

      if (data && data.features && data.features.length > 0) {
        const formattedSuggestions = data.features.map((feature: any) => {
          const props = feature.properties
          // Build display name from available properties
          let displayName = props.name || ""
          if (props.street) {
            displayName = displayName ? `${displayName}, ${props.street}` : props.street
          }
          if (props.city || props.locality) {
            displayName = displayName 
              ? `${displayName}, ${props.city || props.locality}`
              : (props.city || props.locality)
          }
          if (props.country) {
            displayName = displayName ? `${displayName}, ${props.country}` : props.country
          }
          
          // Fallback to OSM display name if available
          if (!displayName && props.osm_value) {
            displayName = `${props.osm_value}${props.osm_key ? ` (${props.osm_key})` : ''}`
          }

          return {
            display_name: displayName || "Unknown location",
            lat: feature.geometry.coordinates[1].toString(),
            lon: feature.geometry.coordinates[0].toString(),
            address: {
              city: props.city || props.locality || "",
              country: props.country || "",
              street: props.street || "",
              name: props.name || "",
            },
            osm_type: props.osm_type,
            osm_key: props.osm_key,
            osm_value: props.osm_value,
          }
        })
        
        setSearchSuggestions(formattedSuggestions)
        setShowSuggestions(true)
      } else {
        // Fallback to Nominatim if Photon returns no results
        fetchNominatimSuggestions(query)
      }
    } catch (error) {
      console.error("Photon search error:", error)
      // Fallback to Nominatim
      fetchNominatimSuggestions(query)
    } finally {
      setIsSearching(false)
    }
  }, [fetchNominatimSuggestions])

  // Autocomplete search suggestions - Google Places, Photon, or Nominatim
  const fetchSearchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)

    // Use Google Places Autocomplete if available
    if (USE_GOOGLE_PLACES && googleMapsLoaded && autocompleteServiceRef.current) {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: query,
            types: ["establishment", "geocode"], // Include buildings, businesses, and addresses
            componentRestrictions: undefined, // Remove to search globally
          },
          (predictions: any[], status: string) => {
            if (status === (window as any).google?.maps?.places?.PlacesServiceStatus?.OK && predictions) {
              const formattedSuggestions = predictions.map((prediction) => ({
                display_name: prediction.description,
                place_id: prediction.place_id,
                structured_formatting: prediction.structured_formatting,
                types: prediction.types,
              }))
              setSearchSuggestions(formattedSuggestions)
              setShowSuggestions(true)
            } else {
              // Fallback to Photon if Google fails
              fetchPhotonSuggestions(query)
            }
            setIsSearching(false)
          }
        )
      } catch (error) {
        console.error("Google Places error:", error)
        // Fallback to Photon
        fetchPhotonSuggestions(query)
      }
    } else {
      // Use Photon (free, no API key) - better than Nominatim for autocomplete
      fetchPhotonSuggestions(query)
    }
  }, [googleMapsLoaded, fetchPhotonSuggestions])

  // Geocode with Nominatim (helper function)
  const geocodeWithNominatim = useCallback(async (address: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)

        const addressParts = result.address || {}
        const locationData: LocationData = {
          address: result.display_name || address,
          lat,
          lng,
          city: addressParts.city || addressParts.town || addressParts.village || addressParts.municipality || "",
          country: addressParts.country || "",
        }
        
        setLocationLat(lat)
        setLocationLng(lng)
        onChange(locationData)
        toast.success("Location found!")
      } else {
        toast.error("Location not found. Please try a different address.")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      toast.error("Failed to find location")
    } finally {
      setIsSearching(false)
    }
  }, [onChange])

  // Geocode an address string
  const geocodeAddress = useCallback(async (address: string) => {
    setIsSearching(true)
    try {
      if (USE_GOOGLE_PLACES && googleMapsLoaded && (window as any).google?.maps) {
        // Use Google Geocoding
        const geocoder = new (window as any).google.maps.Geocoder()
        geocoder.geocode({ address }, (results: any[], status: string) => {
          if (status === "OK" && results && results.length > 0) {
            const result = results[0]
            const lat = result.geometry.location.lat()
            const lng = result.geometry.location.lng()
            
            const addressComponents = result.address_components || []
            const city = addressComponents.find((comp: any) => 
              comp.types.includes("locality") || comp.types.includes("administrative_area_level_2")
            )?.long_name || ""
            const country = addressComponents.find((comp: any) => 
              comp.types.includes("country")
            )?.long_name || ""

            const locationData: LocationData = {
              address: result.formatted_address || address,
              lat,
              lng,
              city,
              country,
            }
            
            setLocationLat(lat)
            setLocationLng(lng)
            onChange(locationData)
            toast.success("Location found!")
          } else {
            // Fallback to Nominatim
            geocodeWithNominatim(address)
          }
          setIsSearching(false)
        })
      } else {
        // Use Nominatim
        geocodeWithNominatim(address)
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      geocodeWithNominatim(address)
    }
  }, [onChange, googleMapsLoaded, geocodeWithNominatim])

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
    lat?: string
    lon?: string
    address?: any
    place_id?: string
    structured_formatting?: any
  }) => {
    setSearchQuery(suggestion.display_name)
    setSearchSuggestions([])
    setShowSuggestions(false)

    // If it's a Google Places suggestion, get full details
    if (USE_GOOGLE_PLACES && suggestion.place_id && placesServiceRef.current) {
      setIsSearching(true)
      placesServiceRef.current.getDetails(
        {
          placeId: suggestion.place_id,
          fields: ["geometry", "formatted_address", "address_components", "name"],
        },
        (place: any, status: string) => {
          if (status === (window as any).google?.maps?.places?.PlacesServiceStatus?.OK && place) {
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            
            // Extract address components
            const addressComponents = place.address_components || []
            const city = addressComponents.find((comp: any) => 
              comp.types.includes("locality") || comp.types.includes("administrative_area_level_2")
            )?.long_name || ""
            const country = addressComponents.find((comp: any) => 
              comp.types.includes("country")
            )?.long_name || ""

            const locationData: LocationData = {
              address: place.formatted_address || suggestion.display_name,
              lat,
              lng,
              city,
              country,
            }
            
            setLocationLat(lat)
            setLocationLng(lng)
            onChange(locationData)
            toast.success("Location selected!")
          } else {
            // Fallback: try to geocode the display name
            geocodeAddress(suggestion.display_name)
          }
          setIsSearching(false)
        }
      )
    } else if (suggestion.lat && suggestion.lon) {
      // Nominatim suggestion with coordinates
      const lat = parseFloat(suggestion.lat)
      const lng = parseFloat(suggestion.lon)

      // Extract address components
      const addressParts = suggestion.address || {}
      const locationData: LocationData = {
        address: suggestion.display_name,
        lat,
        lng,
        city: addressParts.city || addressParts.town || addressParts.village || addressParts.municipality || "",
        country: addressParts.country || "",
      }
      
      setLocationLat(lat)
      setLocationLng(lng)
      onChange(locationData)
      toast.success("Location selected!")
    } else {
      // No coordinates, try to geocode
      geocodeAddress(suggestion.display_name)
    }
  }, [onChange, USE_GOOGLE_PLACES, googleMapsLoaded, geocodeAddress])

  // Geocoding: Convert address to coordinates
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
        const locationData: LocationData = {
          address: result.display_name || searchQuery,
          lat,
          lng,
          city: addressParts.city || addressParts.town || addressParts.village || addressParts.municipality || "",
          country: addressParts.country || "",
        }
        
        setLocationLat(lat)
        setLocationLng(lng)
        onChange(locationData)
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
  }, [searchQuery, onChange])

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
        const lng = position.coords.longitude
        handleMapClick(lat, lng)
        setIsSearching(false)
        toast.success("Location detected!")
      },
      (error: GeolocationPositionError) => {
        // Use numeric error codes for better compatibility
        // PERMISSION_DENIED = 1, POSITION_UNAVAILABLE = 2, TIMEOUT = 3
        let errorMessage = "Failed to get your location"
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = "Location access denied. Please enable location permissions in your browser settings."
            break
          case 2: // POSITION_UNAVAILABLE
            errorMessage = "Location information is unavailable. Please try searching for a location instead."
            break
          case 3: // TIMEOUT
            errorMessage = "Location request timed out. Please try again."
            break
          default:
            errorMessage = `Unable to get your location${error.message ? `: ${error.message}` : ""}. Please try searching for a location instead.`
            break
        }
        
        // Log error details for debugging (but don't expose to user)
        console.error("Geolocation error:", {
          code: error.code,
          message: error.message,
          timestamp: error.timestamp || Date.now()
        })
        
        toast.error(errorMessage)
        setIsSearching(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds timeout
        maximumAge: 0, // Don't use cached position
      }
    )
  }, [handleMapClick])

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

  // Don't show map for online communities
  if (locationType === "online") {
    return (
      <div className={cn("space-y-3", className)}>
        <Input
          placeholder="e.g., Zoom, Google Meet, Discord"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            onChange({
              address: e.target.value,
              lat: null,
              lng: null,
            })
          }}
          className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
        />
        <p className="text-sm text-gray-500">
          Enter the platform or link where your community meets online
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
              placeholder="Search for a building, place, or address..."
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={searchLocation}
              disabled={isSearching || !searchQuery.trim()}
              className="h-7 px-2"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
              ) : (
                <Search className="h-4 w-4 text-violet-600" />
              )}
            </Button>
          </div>
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => {
                  // Handle Google Places structured formatting
                  const mainText = suggestion.structured_formatting?.main_text || suggestion.display_name.split(",")[0]
                  const secondaryText = suggestion.structured_formatting?.secondary_text || suggestion.display_name
                  
                  return (
                    <button
                      key={suggestion.place_id || index}
                      type="button"
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-violet-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {mainText}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {secondaryText}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
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
            💡 Click on the map or drag the pin to set your location
          </p>
        </div>
      )}

      {/* Selected Location Display */}
      {locationLat && locationLng && (
        <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg border border-violet-200">
          <MapPin className="h-4 w-4 text-violet-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {searchQuery || "Location selected"}
            </p>
            <p className="text-xs text-gray-600">
              {locationLat.toFixed(6)}, {locationLng.toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

