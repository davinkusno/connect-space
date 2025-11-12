"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers, Copy, Share2, ExternalLink, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Location {
  lat: number
  lng: number
  address: string
  venue: string
  city: string
}

interface InteractiveLeafletMapProps {
  location: Location
  className?: string
  height?: string
  showControls?: boolean
  showDirections?: boolean
  zoom?: number
}

// Leaflet map implementation using CDN
export function InteractiveLeafletMap({
  location,
  className,
  height = "400px",
  showControls = true,
  showDirections = true,
  zoom = 15,
}: InteractiveLeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [mapType, setMapType] = useState<"street" | "satellite">("street")
  const [leafletLoaded, setLeafletLoaded] = useState(false)

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
        center: [location.lat, location.lng],
        zoom: currentZoom,
        zoomControl: false, // We'll add custom controls
        attributionControl: true,
      })

      // Add tile layer based on map type
      const getTileLayer = (type: string) => {
        if (type === "satellite") {
          return L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
              attribution:
                '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
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

      // Create custom marker icon
      const customIcon = L.divIcon({
        html: `
          <div class="relative">
            <div class="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-bounce">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div class="absolute inset-0 w-8 h-8 bg-red-400 rounded-full animate-ping opacity-30"></div>
          </div>
        `,
        className: "custom-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })

      // Add marker
      const marker = L.marker([location.lat, location.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-3 min-w-[200px]">
            <h3 class="font-semibold text-lg mb-2">${location.venue}</h3>
            <p class="text-gray-600 text-sm mb-2">${location.address}</p>
            <p class="text-gray-500 text-xs">${location.city}</p>
          </div>
        `)

      // Map event listeners
      map.on("zoomend", () => {
        setCurrentZoom(map.getZoom())
      })

      // Store references
      mapInstanceRef.current = map
      markerRef.current = marker

      setIsLoading(false)
    } catch (error) {
      console.error("Error initializing map:", error)
      setIsLoading(false)
      toast.error("Failed to initialize map")
    }
  }, [leafletLoaded, location, mapType])

  // Handle zoom controls
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
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([location.lat, location.lng], zoom)
    }
  }

  // Handle map type change
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

  const handleGetDirections = () => {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${location.lat},${location.lng}`,
    )}`
    window.open(directionsUrl, "_blank", "noopener,noreferrer")
    toast.success("Opening directions in Google Maps...")
  }

  const handleCopyLocation = async () => {
    try {
      const locationText = `${location.venue}, ${location.address}, ${location.city}`
      await navigator.clipboard.writeText(locationText)
      toast.success("Location copied to clipboard!")
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = `${location.venue}, ${location.address}, ${location.city}`
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        toast.success("Location copied to clipboard!")
      } catch (fallbackErr) {
        toast.error("Failed to copy location")
      }
      document.body.removeChild(textArea)
    }
  }

  const handleShareLocation = async () => {
    const locationText = `${location.venue}, ${location.address}, ${location.city}`
    const shareData = {
      title: `Event at ${location.venue}`,
      text: `Check out this event location: ${locationText}`,
      url: window.location.href,
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        toast.success("Location shared successfully!")
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopyLocation() // Fallback to copy
        }
      }
    } else {
      handleCopyLocation() // Fallback to copy
    }
  }

  const handleOpenInMaps = () => {
    const mapsUrl = `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}&zoom=${currentZoom}`
    window.open(mapsUrl, "_blank", "noopener,noreferrer")
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

      {/* Directions Button */}
      {showDirections && !isLoading && (
        <div className="absolute top-4 left-4 z-[1000]">
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

      {/* Location Info Card */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 truncate">{location.venue}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{location.address}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {location.city}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Zoom: {currentZoom}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLocation}
                    className="flex-shrink-0"
                    title="Copy location"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareLocation}
                    className="flex-shrink-0"
                    title="Share location"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInMaps}
                    className="flex-shrink-0"
                    title="Open in OpenStreetMap"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
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
