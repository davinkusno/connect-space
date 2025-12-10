"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FadeTransition, SlideTransition } from "@/components/ui/content-transitions"
import { Spinner } from "@/components/ui/loading-indicators"
import { HoverScale } from "@/components/ui/micro-interactions"
import { cn } from "@/lib/utils"
import { Calendar, ChevronRight, Filter, Layers, MapPin, Navigation, Users, X, ZoomIn, ZoomOut } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface Community {
  id: number
  name: string
  description: string
  members: number
  category: string
  location: {
    lat: number
    lng: number
    address: string
    city: string
  }
  image: string
  tags: string[]
  upcomingEvents: number
  gradient: string
}

interface MapMarker {
  id: number
  position: { lat: number; lng: number }
  community: Community
  isActive: boolean
}

interface InteractiveMapProps {
  communities?: Community[]
  selectedCommunity?: Community | null
  onCommunitySelect?: (community: Community | null) => void
  className?: string
  height?: string
  showControls?: boolean
  showFilters?: boolean
}

export function InteractiveMap({
  communities = [],
  selectedCommunity,
  onCommunitySelect,
  className,
  height = "500px",
  showControls = true,
  showFilters = true,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [zoom, setZoom] = useState(12)
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 }) // NYC default
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null)
  const [showSatellite, setShowSatellite] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Initialize map markers
  useEffect(() => {
    const mapMarkers: MapMarker[] = communities.map((community) => ({
      id: community.id,
      position: community.location,
      community,
      isActive: selectedCommunity?.id === community.id,
    }))
    setMarkers(mapMarkers)
  }, [communities, selectedCommunity])

  // Simulate map loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Get user location
  const getUserLocation = useCallback(() => {
    setIsLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(userPos)
          setCenter(userPos)
          setIsLocating(false)
        },
        () => {
          setIsLocating(false)
        },
      )
    } else {
      setIsLocating(false)
    }
  }, [])

  // Handle marker click
  const handleMarkerClick = useCallback(
    (community: Community) => {
      setCenter(community.location)
      onCommunitySelect?.(community)
    },
    [onCommunitySelect],
  )

  // Handle zoom controls
  const handleZoomIn = () => setZoom(Math.min(zoom + 1, 18))
  const handleZoomOut = () => setZoom(Math.max(zoom - 1, 3))

  // Filter communities by category
  const filteredMarkers = markers.filter((marker) =>
    selectedCategory === "all" ? true : marker.community?.category?.toLowerCase() === selectedCategory,
  )

  const categories = [
    { value: "all", label: "All Categories", count: communities.length },
    { value: "technology", label: "Technology", count: communities.filter((c) => c.category === "Technology").length },
    { value: "sports", label: "Sports", count: communities.filter((c) => c.category === "Sports").length },
    { value: "arts", label: "Arts", count: communities.filter((c) => c.category === "Arts").length },
    { value: "outdoors", label: "Outdoors", count: communities.filter((c) => c.category === "Outdoors").length },
  ]

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className="relative bg-gradient-to-br from-blue-50 to-green-50 transition-all duration-500"
        style={{ height }}
      >
        {/* Loading State */}
        <FadeTransition show={!isLoaded}>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
            <div className="text-center">
              <Spinner size="lg" className="mb-4 text-violet-600" />
              <p className="text-gray-600">Loading interactive map...</p>
            </div>
          </div>
        </FadeTransition>

        {/* Map Content */}
        <FadeTransition show={isLoaded}>
          <div className="absolute inset-0">
            {/* Simulated Map Background */}
            <div
              className={cn(
                "absolute inset-0 transition-all duration-700",
                showSatellite
                  ? "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900"
                  : "bg-gradient-to-br from-blue-100 via-green-50 to-blue-50",
              )}
            >
              {/* Grid Pattern for Map Feel */}
              <div className="absolute inset-0 opacity-20">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: "50px 50px",
                    transform: `scale(${zoom / 10})`,
                    transition: "transform 0.3s ease",
                  }}
                />
              </div>

              {/* User Location Marker */}
              {userLocation && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                  style={{
                    left: `${50 + (userLocation.lng - center.lng) * 100}%`,
                    top: `${50 + (center.lat - userLocation.lat) * 100}%`,
                  }}
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-glow" />
                    <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-30" />
                  </div>
                </div>
              )}

              {/* Community Markers */}
              {filteredMarkers.map((marker, index) => {
                const isHovered = hoveredMarker === marker.id
                const isSelected = selectedCommunity?.id === marker.id
                const offsetX = (marker.position.lng - center.lng) * 200
                const offsetY = (center.lat - marker.position.lat) * 200

                return (
                  <div
                    key={marker.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 cursor-pointer"
                    style={{
                      left: `${50 + offsetX}%`,
                      top: `${50 + offsetY}%`,
                      zIndex: isSelected ? 30 : isHovered ? 20 : 10,
                      animationDelay: `${index * 100}ms`,
                    }}
                    onMouseEnter={() => setHoveredMarker(marker.id)}
                    onMouseLeave={() => setHoveredMarker(null)}
                    onClick={() => handleMarkerClick(marker.community)}
                  >
                    {/* Marker Pin */}
                    <div
                      className={cn(
                        "relative transition-all duration-300",
                        isSelected || isHovered ? "scale-125" : "scale-100",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full border-3 border-white shadow-lg transition-all duration-300",
                          marker.community.gradient,
                          isSelected ? "ring-4 ring-violet-400 ring-opacity-50" : "",
                        )}
                      />
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />

                      {/* Ripple Effect */}
                      {(isSelected || isHovered) && (
                        <div className="absolute inset-0 w-8 h-8 rounded-full bg-violet-400 opacity-30 animate-ping" />
                      )}
                    </div>

                    {/* Marker Popup */}
                    <SlideTransition show={isHovered || isSelected} direction="up">
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
                        <Card className="shadow-xl border-0 overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage src={marker.community.image || "/placeholder.svg"} />
                                <AvatarFallback>{marker.community.name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-gray-900 truncate">
                                  {marker.community.name}
                                </h4>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                  {marker.community.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {marker.community.members}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {marker.community.upcomingEvents}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {marker.community.tags.slice(0, 2).map((tag, tagIndex) => (
                                    <Badge key={tagIndex} variant="secondary" className="text-xs px-1 py-0">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </SlideTransition>
                  </div>
                )
              })}
            </div>
          </div>
        </FadeTransition>

        {/* Map Controls */}
        {showControls && (
          <FadeTransition show={isLoaded}>
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {/* Zoom Controls */}
              <div className="flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
                <HoverScale>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    className="rounded-none border-b border-gray-200 hover:bg-violet-50"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </HoverScale>
                <HoverScale>
                  <Button variant="ghost" size="sm" onClick={handleZoomOut} className="rounded-none hover:bg-violet-50">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </HoverScale>
              </div>

              {/* Layer Toggle */}
              <HoverScale>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSatellite(!showSatellite)}
                  className={cn(
                    "bg-white shadow-lg hover:bg-violet-50",
                    showSatellite ? "text-violet-600" : "text-gray-600",
                  )}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </HoverScale>

              {/* Location Button */}
              <HoverScale>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={getUserLocation}
                  disabled={isLocating}
                  className="bg-white shadow-lg hover:bg-violet-50"
                >
                  {isLocating ? <Spinner size="sm" className="text-violet-600" /> : <Navigation className="h-4 w-4" />}
                </Button>
              </HoverScale>
            </div>
          </FadeTransition>
        )}

        {/* Category Filters */}
        {showFilters && (
          <FadeTransition show={isLoaded}>
            <div className="absolute bottom-4 left-4 right-4">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Filter by Category</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <HoverScale key={category.value}>
                        <Button
                          variant={selectedCategory === category.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(category.value)}
                          className={cn(
                            "text-xs transition-all duration-200",
                            selectedCategory === category.value
                              ? "bg-violet-600 text-white hover:bg-violet-700"
                              : "border-gray-200 hover:border-violet-300 hover:bg-violet-50",
                          )}
                        >
                          {category.label}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {category.count}
                          </Badge>
                        </Button>
                      </HoverScale>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeTransition>
        )}

        {/* Selected Community Details */}
        {selectedCommunity && (
          <SlideTransition show={!!selectedCommunity} direction="left">
            <div className="absolute top-4 left-4 w-80">
              <Card className="shadow-xl border-0 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={selectedCommunity.image || "/placeholder.svg"}
                      alt={selectedCommunity.name}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 ${selectedCommunity.gradient} opacity-20`} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCommunitySelect?.(null)}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{selectedCommunity.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{selectedCommunity.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {selectedCommunity.members} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {selectedCommunity.upcomingEvents} events
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedCommunity.location.address}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {selectedCommunity.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <HoverScale>
                      <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                        View Community
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </HoverScale>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SlideTransition>
        )}

        {/* Zoom Level Indicator */}
        <FadeTransition show={isLoaded}>
          <div className="absolute bottom-4 right-4">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-gray-600">
              Zoom: {zoom}
            </Badge>
          </div>
        </FadeTransition>
      </div>
      {!communities || communities.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No locations to display</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
