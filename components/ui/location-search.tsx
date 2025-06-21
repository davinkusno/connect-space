"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FadeTransition, SlideTransition } from "@/components/ui/content-transitions"
import { HoverScale } from "@/components/ui/micro-interactions"
import { Spinner } from "@/components/ui/loading-indicators"
import { Search, MapPin, Navigation, X, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface LocationResult {
  id: string
  name: string
  address: string
  city: string
  state: string
  country: string
  coordinates: { lat: number; lng: number }
  type: "city" | "address" | "landmark"
}

interface LocationSearchProps {
  onLocationSelect?: (location: LocationResult) => void
  placeholder?: string
  className?: string
  showRecentSearches?: boolean
}

export function LocationSearch({
  onLocationSelect,
  placeholder = "Search for a location...",
  className,
  showRecentSearches = true,
}: LocationSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<LocationResult[]>([])
  const [recentSearches, setRecentSearches] = useState<LocationResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Mock location data
  const mockLocations: LocationResult[] = [
    {
      id: "1",
      name: "New York City",
      address: "New York, NY",
      city: "New York",
      state: "NY",
      country: "USA",
      coordinates: { lat: 40.7128, lng: -74.006 },
      type: "city",
    },
    {
      id: "2",
      name: "San Francisco",
      address: "San Francisco, CA",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      coordinates: { lat: 37.7749, lng: -122.4194 },
      type: "city",
    },
    {
      id: "3",
      name: "Los Angeles",
      address: "Los Angeles, CA",
      city: "Los Angeles",
      state: "CA",
      country: "USA",
      coordinates: { lat: 34.0522, lng: -118.2437 },
      type: "city",
    },
    {
      id: "4",
      name: "Chicago",
      address: "Chicago, IL",
      city: "Chicago",
      state: "IL",
      country: "USA",
      coordinates: { lat: 41.8781, lng: -87.6298 },
      type: "city",
    },
    {
      id: "5",
      name: "Central Park",
      address: "Central Park, New York, NY",
      city: "New York",
      state: "NY",
      country: "USA",
      coordinates: { lat: 40.7829, lng: -73.9654 },
      type: "landmark",
    },
  ]

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentLocationSearches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Handle search
  useEffect(() => {
    if (query.length > 2) {
      setIsSearching(true)
      // Simulate API delay
      const timer = setTimeout(() => {
        const filtered = mockLocations.filter(
          (location) =>
            location.name.toLowerCase().includes(query.toLowerCase()) ||
            location.address.toLowerCase().includes(query.toLowerCase()) ||
            location.city.toLowerCase().includes(query.toLowerCase()),
        )
        setResults(filtered)
        setIsSearching(false)
        setShowResults(true)
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setResults([])
      setShowResults(false)
      setIsSearching(false)
    }
  }, [query])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLocationSelect = (location: LocationResult) => {
    setQuery(location.name)
    setShowResults(false)
    onLocationSelect?.(location)

    // Add to recent searches
    const updated = [location, ...recentSearches.filter((r) => r.id !== location.id)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("recentLocationSearches", JSON.stringify(updated))
  }

  const getCurrentLocation = () => {
    setIsGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation: LocationResult = {
            id: "current",
            name: "Current Location",
            address: "Your current location",
            city: "Current",
            state: "",
            country: "",
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            type: "address",
          }
          handleLocationSelect(currentLocation)
          setIsGettingLocation(false)
        },
        () => {
          setIsGettingLocation(false)
        },
      )
    } else {
      setIsGettingLocation(false)
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentLocationSearches")
  }

  const getLocationIcon = (type: string) => {
    switch (type) {
      case "city":
        return "🏙️"
      case "landmark":
        return "🏛️"
      default:
        return "📍"
    }
  }

  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(query.length > 2 || recentSearches.length > 0)}
          className="pl-10 pr-20 h-12 border-2 border-gray-200 focus:border-violet-400 rounded-xl bg-white/50 backdrop-blur-sm form-field"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("")
                setShowResults(false)
              }}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="h-8 w-8 p-0 hover:bg-violet-50 text-violet-600"
          >
            {isGettingLocation ? <Spinner size="sm" /> : <Navigation className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Search Results */}
      <FadeTransition show={showResults}>
        <div ref={resultsRef} className="absolute top-full left-0 right-0 mt-2 z-50">
          <Card className="shadow-xl border-0 overflow-hidden max-h-80 overflow-y-auto">
            <CardContent className="p-0">
              {/* Loading State */}
              {isSearching && (
                <div className="p-4 text-center">
                  <Spinner size="sm" className="mb-2 text-violet-600" />
                  <p className="text-sm text-gray-600">Searching locations...</p>
                </div>
              )}

              {/* Search Results */}
              {!isSearching && results.length > 0 && (
                <div>
                  <div className="p-3 border-b border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700">Search Results</h4>
                  </div>
                  {results.map((location, index) => (
                    <SlideTransition key={location.id} show={true} delay={index * 50}>
                      <HoverScale>
                        <button
                          onClick={() => handleLocationSelect(location)}
                          className="w-full p-3 text-left hover:bg-violet-50 transition-colors duration-200 border-b border-gray-50 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-lg">{getLocationIcon(location.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{location.name}</p>
                              <p className="text-sm text-gray-600 truncate">{location.address}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {location.type}
                            </Badge>
                          </div>
                        </button>
                      </HoverScale>
                    </SlideTransition>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isSearching && query.length > 2 && results.length === 0 && (
                <div className="p-4 text-center">
                  <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No locations found for "{query}"</p>
                </div>
              )}

              {/* Recent Searches */}
              {!isSearching &&
                query.length <= 2 &&
                showRecentSearches &&
                recentSearches.length > 0 &&
                results.length === 0 && (
                  <div>
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Recent Searches
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </Button>
                    </div>
                    {recentSearches.map((location, index) => (
                      <SlideTransition key={location.id} show={true} delay={index * 50}>
                        <HoverScale>
                          <button
                            onClick={() => handleLocationSelect(location)}
                            className="w-full p-3 text-left hover:bg-violet-50 transition-colors duration-200 border-b border-gray-50 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-lg">{getLocationIcon(location.type)}</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{location.name}</p>
                                <p className="text-sm text-gray-600 truncate">{location.address}</p>
                              </div>
                            </div>
                          </button>
                        </HoverScale>
                      </SlideTransition>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </FadeTransition>
    </div>
  )
}
