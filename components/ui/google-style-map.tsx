"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Copy, Layers, MapPin, Navigation, Share2, ZoomIn, ZoomOut } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface Location {
  lat: number
  lng: number
  address: string
  venue: string
  city: string
}

interface GoogleStyleMapProps {
  location: Location
  className?: string
  height?: string
  showControls?: boolean
  showDirections?: boolean
}

export function GoogleStyleMap({
  location,
  className,
  height = "400px",
  showControls = true,
  showDirections = true,
}: GoogleStyleMapProps) {
  const [zoom, setZoom] = useState(15)
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap")
  const [isLoading, setIsLoading] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleZoomIn = () => setZoom(Math.min(zoom + 1, 20))
  const handleZoomOut = () => setZoom(Math.max(zoom - 1, 1))

  const handleGetDirections = () => {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      location.address + ", " + location.city,
    )}`
    window.open(directionsUrl, "_blank")
  }

  const handleCopyLocation = async () => {
    try {
      await navigator.clipboard.writeText(`${location.venue}, ${location.address}, ${location.city}`)
      toast.success("Location copied to clipboard!")
    } catch (err) {
      toast.error("Failed to copy location")
    }
  }

  const handleShareLocation = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Event at ${location.venue}`,
          text: `Check out this event location: ${location.venue}`,
          url: window.location.href,
        })
      } catch (err) {
        // Fallback to copy
        handleCopyLocation()
      }
    } else {
      handleCopyLocation()
    }
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl border shadow-lg", className)}>
      <div ref={mapRef} className="relative bg-gradient-to-br from-blue-50 to-green-50" style={{ height }}>
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
              <p className="text-gray-600 text-sm">Loading map...</p>
            </div>
          </div>
        )}

        {/* Map Content */}
        {!isLoading && (
          <>
            {/* Simulated Map Background */}
            <div
              className={cn(
                "absolute inset-0 transition-all duration-700",
                mapType === "satellite"
                  ? "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900"
                  : "bg-gradient-to-br from-blue-100 via-green-50 to-blue-50",
              )}
            >
              {/* Grid Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: `${50 * (zoom / 15)}px ${50 * (zoom / 15)}px`,
                    transition: "background-size 0.3s ease",
                  }}
                />
              </div>

              {/* Location Marker */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="relative">
                  {/* Main Pin */}
                  <div className="w-12 h-12 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-bounce-slow">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>

                  {/* Ripple Effect */}
                  <div className="absolute inset-0 w-12 h-12 bg-red-400 rounded-full animate-ping opacity-30" />

                  {/* Shadow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-8 h-4 bg-black opacity-20 rounded-full blur-sm" />
                </div>
              </div>

              {/* Roads/Paths Simulation */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-1/3 left-0 right-0 h-2 bg-gray-400 transform -rotate-12" />
                <div className="absolute top-2/3 left-1/4 right-0 h-1 bg-gray-300 transform rotate-6" />
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-300 transform rotate-12" />
              </div>

              {/* Buildings Simulation */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-1/4 w-8 h-12 bg-gray-600 rounded-sm" />
                <div className="absolute top-1/3 right-1/4 w-6 h-8 bg-gray-700 rounded-sm" />
                <div className="absolute bottom-1/4 left-1/3 w-10 h-16 bg-gray-500 rounded-sm" />
                <div className="absolute bottom-1/3 right-1/3 w-4 h-6 bg-gray-600 rounded-sm" />
              </div>
            </div>

            {/* Location Info Card */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate">{location.venue}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{location.address}</p>
                      <Badge variant="outline" className="text-xs">
                        {location.city}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyLocation} className="flex-shrink-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShareLocation} className="flex-shrink-0">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Map Controls */}
        {showControls && !isLoading && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            {/* Zoom Controls */}
            <div className="flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="rounded-none border-b border-gray-200 hover:bg-gray-50"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleZoomOut} className="rounded-none hover:bg-gray-50">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Map Type Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMapType(mapType === "roadmap" ? "satellite" : "roadmap")}
              className={cn(
                "bg-white shadow-lg hover:bg-gray-50",
                mapType === "satellite" ? "text-blue-600" : "text-gray-600",
              )}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Directions Button */}
        {showDirections && !isLoading && (
          <div className="absolute top-4 left-4 z-20">
            <Button
              onClick={handleGetDirections}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              size="sm"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Directions
            </Button>
          </div>
        )}

        {/* Zoom Level Indicator */}
        {!isLoading && (
          <div className="absolute bottom-4 right-4 z-20">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-gray-600">
              Zoom: {zoom}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
