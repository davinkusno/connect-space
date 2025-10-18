"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers, RotateCcw, Locate, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Community } from "@/types/community"

interface LeafletCommunitiesMapProps {
  communities: Community[]
  selectedCommunity?: Community | null
  onCommunitySelect?: (community: Community | null) => void
  userLocation?: { lat: number; lng: number } | null
  searchRadius?: number
  className?: string
  height?: string
  showControls?: boolean
  showUserLocation?: boolean
}

// Category colors for markers
const categoryColors: Record<string, string> = {
  Technology: "#3B82F6", // Blue
  Sports: "#EF4444", // Red
  Arts: "#8B5CF6", // Purple
  Food: "#F59E0B", // Amber
  Outdoors: "#10B981", // Emerald
  Business: "#6366F1", // Indigo
  default: "#6B7280", // Gray
}

export function LeafletCommunitiesMap({
  communities,
  selectedCommunity,
  onCommunitySelect,
  userLocation,
  searchRadius = 25,
  className,
  height = "600px",
  showControls = true,
  showUserLocation = true,
}: LeafletCommunitiesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)
  const radiusCircleRef = useRef<any>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(12)
  const [mapType, setMapType] = useState<"street" | "satellite">("street")
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: userLocation?.lat || 40.7128,
    lng: userLocation?.lng || -74.006,
  })

  // Load Leaflet CSS and JS
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Check if Leaflet is already loaded
        if (typeof window !== "undefined" && (window as any).L) {
          setLeafletLoaded(true)
          return
        }

        // Load Leaflet CSS
        const cssLink = document.createElement("link")
        cssLink.rel = "stylesheet"
        cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        cssLink.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        cssLink.crossOrigin = ""
        document.head.appendChild(cssLink)

        // Load Leaflet JS
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""

        script.onload = () => {
          setLeafletLoaded(true)
        }

        script.onerror = () => {
          console.error("Failed to load Leaflet")
          setIsLoading(false)
          toast.error("Failed to load map. Please refresh the page.")
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("Error loading Leaflet:", error)
        setIsLoading(false)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return

    try {
      const L = (window as any).L

      // Initialize map
      const map = L.map(mapRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: true,
      })

      // Add tile layer
      const getTileLayer = (type: string) => {
        if (type === "satellite") {
          return L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
              attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
              maxZoom: 18,
            },
          )
        } else {
          return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          })
        }
      }

      const tileLayer = getTileLayer(mapType)
      tileLayer.addTo(map)

      // Map event listeners
      map.on("zoomend", () => {
        setCurrentZoom(map.getZoom())
      })

      map.on("moveend", () => {
        const center = map.getCenter()
        setMapCenter({ lat: center.lat, lng: center.lng })
      })

      // Store map reference
      mapInstanceRef.current = map

      setIsLoading(false)
    } catch (error) {
      console.error("Error initializing map:", error)
      setIsLoading(false)
      toast.error("Failed to initialize map")
    }
  }, [leafletLoaded, mapType])

  // Create community marker
  const createCommunityMarker = useCallback(
    (community: Community) => {
      if (!leafletLoaded) return null

      const L = (window as any).L
      const color = categoryColors[community.category] || categoryColors.default

      const markerIcon = L.divIcon({
        html: `
        <div class="relative group">
          <div class="w-10 h-10 rounded-full border-3 border-white shadow-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110" 
               style="background-color: ${color}">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          ${
            community.trending
              ? `
            <div class="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white">
              <div class="w-full h-full bg-orange-400 rounded-full animate-ping opacity-75"></div>
            </div>
          `
              : ""
          }
        </div>
      `,
        className: "community-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      })

      const marker = L.marker([community.location.lat, community.location.lng], {
        icon: markerIcon,
        community: community, // Store community data
      })

      // Create popup content
      const popupContent = `
      <div class="p-4 min-w-[280px] max-w-[320px]">
        <div class="flex items-start gap-3 mb-3">
          <img src="${community.image}" alt="${community.name}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-lg mb-1 line-clamp-1">${community.name}</h3>
            <span class="inline-block px-2 py-1 text-xs font-medium rounded-full text-white" style="background-color: ${color}">
              ${community.category}
            </span>
          </div>
        </div>
        
        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${community.description}</p>
        
        <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            ${community.memberCount.toLocaleString()}
          </div>
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            ${community.upcomingEvents} events
          </div>
        </div>
        
        <div class="flex flex-wrap gap-1 mb-3">
          ${community.tags
            .slice(0, 3)
            .map(
              (tag) => `
            <span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">${tag}</span>
          `,
            )
            .join("")}
        </div>
        
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            ${community.memberGrowth} growth
          </span>
          <button class="px-3 py-1 text-sm font-medium text-white rounded-lg transition-colors duration-200" 
                  style="background-color: ${color}" 
                  onclick="window.selectCommunity(${community.id})">
            View Details
          </button>
        </div>
      </div>
    `

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: "community-popup",
      })

      // Handle marker click
      marker.on("click", () => {
        onCommunitySelect?.(community)
      })

      return marker
    },
    [leafletLoaded, onCommunitySelect],
  )

  // Create user location marker
  const createUserMarker = useCallback(
    (location: { lat: number; lng: number }) => {
      if (!leafletLoaded) return null

      const L = (window as any).L

      const userIcon = L.divIcon({
        html: `
        <div class="relative">
          <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
          <div class="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-75"></div>
        </div>
      `,
        className: "user-marker",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      return L.marker([location.lat, location.lng], { icon: userIcon }).bindPopup(`
        <div class="p-2 text-center">
          <div class="flex items-center gap-2 text-blue-600 font-medium">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Your Location
          </div>
        </div>
      `)
    },
    [leafletLoaded],
  )

  // Update markers when communities change
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return

    const L = (window as any).L

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker)
    })
    markersRef.current = []

    // Add community markers
    communities.forEach((community) => {
      const marker = createCommunityMarker(community)
      if (marker) {
        marker.addTo(mapInstanceRef.current)
        markersRef.current.push(marker)
      }
    })

    // Add user location marker
    if (userLocation && showUserLocation) {
      if (userMarkerRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current)
      }

      const userMarker = createUserMarker(userLocation)
      if (userMarker) {
        userMarker.addTo(mapInstanceRef.current)
        userMarkerRef.current = userMarker
      }

      // Add search radius circle
      if (radiusCircleRef.current) {
        mapInstanceRef.current.removeLayer(radiusCircleRef.current)
      }

      const radiusCircle = L.circle([userLocation.lat, userLocation.lng], {
        radius: searchRadius * 1000, // Convert km to meters
        fillColor: "#3B82F6",
        fillOpacity: 0.1,
        color: "#3B82F6",
        weight: 2,
        opacity: 0.5,
      })

      radiusCircle.addTo(mapInstanceRef.current)
      radiusCircleRef.current = radiusCircle
    }

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current)
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }, [
    communities,
    userLocation,
    searchRadius,
    showUserLocation,
    createCommunityMarker,
    createUserMarker,
    leafletLoaded,
  ])

  // Highlight selected community
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return

    markersRef.current.forEach((marker) => {
      const community = marker.options.community
      if (community && community.id === selectedCommunity?.id) {
        marker.openPopup()
        mapInstanceRef.current.setView([community.location.lat, community.location.lng], Math.max(currentZoom, 14))
      }
    })
  }, [selectedCommunity, leafletLoaded, currentZoom])

  // Global function for popup buttons
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).selectCommunity = (communityId: string) => {
        const community = communities.find((c) => c.id === communityId)
        if (community) {
          onCommunitySelect?.(community)
        }
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).selectCommunity
      }
    }
  }, [communities, onCommunitySelect])

  // Control handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut()
    }
  }

  const handleResetView = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 12)
    }
  }

  const handleMapTypeChange = () => {
    const newType = mapType === "street" ? "satellite" : "street"
    setMapType(newType)

    if (mapInstanceRef.current) {
      const L = (window as any).L

      // Remove current tile layer
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })

      // Add new tile layer
      const getTileLayer = (type: string) => {
        if (type === "satellite") {
          return L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
              attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
              maxZoom: 18,
            },
          )
        } else {
          return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          })
        }
      }

      const newTileLayer = getTileLayer(newType)
      newTileLayer.addTo(mapInstanceRef.current)
    }
  }

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 14)
            toast.success("Location updated!")
          }
        },
        (error) => {
          toast.error("Unable to get your location")
        },
      )
    } else {
      toast.error("Geolocation is not supported by this browser")
    }
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl border shadow-lg bg-gray-100", className)}>
      <div
        ref={mapRef}
        className="relative w-full transition-opacity duration-300"
        style={{
          height,
          opacity: isLoading ? 0 : 1,
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-gray-600 text-sm">Loading interactive map...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {showControls && !isLoading && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
          {/* Zoom Controls */}
          <div className="flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="rounded-none border-b border-gray-200 hover:bg-gray-50 h-10 w-10 p-0"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="rounded-none hover:bg-gray-50 h-10 w-10 p-0"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Map Type Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMapTypeChange}
            className={cn(
              "bg-white shadow-lg hover:bg-gray-50 h-10 w-10 p-0",
              mapType === "satellite" ? "text-blue-600" : "text-gray-600",
            )}
            title={`Switch to ${mapType === "street" ? "satellite" : "street"} view`}
          >
            <Layers className="h-4 w-4" />
          </Button>

          {/* Locate User */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLocateUser}
            className="bg-white shadow-lg hover:bg-gray-50 h-10 w-10 p-0"
            title="Find my location"
          >
            <Locate className="h-4 w-4" />
          </Button>

          {/* Reset View */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetView}
            className="bg-white shadow-lg hover:bg-gray-50 h-10 w-10 p-0"
            title="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Map Stats */}
      {!isLoading && (
        <div className="absolute top-4 left-4 z-[1000]">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-violet-600 font-medium">
                  <Search className="h-4 w-4" />
                  {communities.length} communities
                </div>
                {userLocation && (
                  <div className="flex items-center gap-1 text-blue-600 font-medium">
                    <Navigation className="h-4 w-4" />
                    {searchRadius}km radius
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legend */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-3">
              <h4 className="font-medium text-sm mb-2">Categories</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(categoryColors)
                  .filter(([key]) => key !== "default")
                  .map(([category, color]) => (
                    <div key={category} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-gray-600">{category}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {!isLoading && !leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
          <div className="text-center p-6">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">Map Unavailable</h3>
            <p className="text-gray-600 text-sm mb-4">Unable to load the interactive map.</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
