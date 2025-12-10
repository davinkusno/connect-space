"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingElements } from "@/components/ui/floating-elements"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/components/ui/page-transition"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { ArrowLeft, Loader2, MapPin, Save, Search, Upload } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

interface CommunityProfile {
  name: string
  profilePicture: string
  bannerUrl: string
  location: {
    city: string
    country: string
    address: string
  }
}

export default function EditCommunityPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [community, setCommunity] = useState<CommunityProfile | null>(null)

  // Form state
  const [profilePreview, setProfilePreview] = useState<string>("")
  const [bannerPreview, setBannerPreview] = useState<string>("")
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [address, setAddress] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [communityId, setCommunityId] = useState<string | null>(null)

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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    // Load current community data from database
    const load = async () => {
      setIsLoading(true)
      try {
        const supabase = getSupabaseBrowser()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error("User not found")
          setIsLoading(false)
          return
        }

        // Try to get community where user is creator
        let { data: communityData, error: communityError } = await supabase
          .from("communities")
          .select("*")
          .eq("creator_id", user.id)
          .limit(1)
          .maybeSingle()

        // If not found as creator, try to get community where user is admin
        if (!communityData || communityError) {
          const { data: memberData } = await supabase
            .from("community_members")
            .select("community_id")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .limit(1)
            .maybeSingle()

          if (memberData) {
            const { data: commData } = await supabase
              .from("communities")
              .select("*")
              .eq("id", memberData.community_id)
              .single()

            if (commData) {
              communityData = commData
            }
          }
        }

        // Use actual data from database or fallback to defaults
        const communityProfile: CommunityProfile = {
          name: communityData?.name || "Community",
          profilePicture: communityData?.logo_url || "/placeholder-user.jpg",
          bannerUrl: communityData?.banner_url || "/placeholder.jpg",
          location: { 
            city: "", 
            country: "", 
            address: "" 
          },
        }

        // Parse location from database
        if (communityData?.location) {
          try {
            const locationData = typeof communityData.location === 'string' 
              ? JSON.parse(communityData.location) 
              : communityData.location
            if (locationData.city) communityProfile.location.city = locationData.city
            if (locationData.country) communityProfile.location.country = locationData.country
            if (locationData.address) communityProfile.location.address = locationData.address
          } catch (e) {
            // If location is a plain string (city name), use it as city
            if (typeof communityData.location === 'string') {
              communityProfile.location.city = communityData.location
            }
          }
        }

        setCommunity(communityProfile)
        setProfilePreview(communityProfile.profilePicture)
        setBannerPreview(communityProfile.bannerUrl)
        setCity(communityProfile.location.city)
        setCountry(communityProfile.location.country)
        setAddress(communityProfile.location.address)
        setSearchQuery(communityProfile.location.address || "")
        setCommunityId(communityData.id)
      } catch (error) {
        console.error("Failed to load community data:", error)
        // Fallback to default values on error
        const defaultProfile: CommunityProfile = {
          name: "Community",
        profilePicture: "/placeholder-user.jpg",
        bannerUrl: "/placeholder.jpg",
          location: { city: "", country: "", address: "" },
      }
        setCommunity(defaultProfile)
        setProfilePreview(defaultProfile.profilePicture)
        setBannerPreview(defaultProfile.bannerUrl)
        
        // Try to get community ID even if data loading failed
        try {
          const supabase = getSupabaseBrowser()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            let { data: commData } = await supabase
              .from("communities")
              .select("id")
              .eq("creator_id", user.id)
              .limit(1)
              .maybeSingle()
            
            if (!commData) {
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
                  .select("id")
                  .eq("id", memberData.community_id)
                  .single()
                
                if (comm) {
                  setCommunityId(comm.id)
                }
              }
            } else {
              setCommunityId(commData.id)
            }
          }
        } catch (e) {
          console.error("Failed to get community ID:", e)
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
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
        const cityName = addr.city || addr.town || addr.village || addr.municipality || ""
        const countryName = addr.country || ""
        
        setAddress(displayName)
        setCity(cityName)
        setCountry(countryName)
        setSearchQuery(displayName)
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
    setAddress(suggestion.display_name)
    setCity(addressParts.city || addressParts.town || addressParts.village || addressParts.municipality || "")
    setCountry(addressParts.country || "")
    setLocationLat(lat)
    setLocationLng(lng)

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
        setAddress(result.display_name || searchQuery)
        setCity(addressParts.city || addressParts.town || addressParts.village || addressParts.municipality || "")
        setCountry(addressParts.country || "")
        setLocationLat(lat)
        setLocationLng(lng)

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

  const isLocationValid = useMemo(() => {
    return city.trim().length > 1 && country.trim().length > 1 && address.trim().length > 5
  }, [city, country, address])

  const handleProfileFile = (file: File | null) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setProfilePreview(url)
    setProfileFile(file)
  }

  const handleBannerFile = (file: File | null) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setBannerPreview(url)
    setBannerFile(file)
  }

  const handleSave = async () => {
    if (!communityId) {
      toast.error("Community not found")
      return
    }

    // Check if there's anything to save
    const hasProfileFile = profileFile !== null
    const hasBannerFile = bannerFile !== null
    // Check if location has meaningful data (user is trying to set/update location)
    const hasLocationData = city.trim().length > 0 && country.trim().length > 0 && address.trim().length > 5
    
    if (!hasProfileFile && !hasBannerFile && !hasLocationData) {
      toast.error("Please make at least one change before saving")
      return
    }

    setIsSaving(true)
    try {
      // Prepare FormData
      const formDataToSend = new FormData()
      if (profileFile) {
        formDataToSend.append("profileImage", profileFile)
      }
      if (bannerFile) {
        formDataToSend.append("bannerImage", bannerFile)
      }
      
      // Only include location if user has provided city data
      if (hasLocationData && city.trim()) {
        // Save just the city name
        formDataToSend.append("location", city.trim())
      }

      // Call API
      const response = await fetch(`/api/communities/${communityId}/update`, {
        method: "POST",
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update community")
      }

      toast.success("Community updated successfully!")
      
      // Redirect to community admin page after a short delay
      setTimeout(() => {
        window.location.href = "/community-admin"
      }, 1000)
    } catch (error: any) {
      console.error("Error saving community:", error)
      toast.error(error.message || "Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageTransition>
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen relative">
        <FloatingElements />
        <div className="max-w-5xl mx-auto p-6 md:p-8 relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Edit Community</h1>
            <Link href="/community-admin" className="inline-flex">
              <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Left column: Profile Picture */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg h-full">
              <CardHeader>
                <CardTitle className="text-lg">Profile Picture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-28 h-28 border-4 border-white shadow">
                    <AvatarImage src={profilePreview} alt={community?.name} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      {community?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileFile(e.target.files?.[0] || null)} />
                  <Button type="button" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300" onClick={() => document.getElementById('profile-upload')?.click()}>
                    Choose File
                  </Button>
                  <p className="text-xs text-gray-500">PNG/JPG, recommended 400x400px, max ~2MB</p>
                </div>
              </CardContent>
            </Card>

            {/* Middle: Banner */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg lg:col-span-2 h-full">
              <CardHeader>
                <CardTitle className="text-lg">Banner / Background</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 h-full">
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center text-center">
                    {bannerPreview ? (
                      <>
                        <Image src={bannerPreview} alt="Banner Preview" fill className="object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/30 text-white text-xs py-1">Click below to change background</div>
                      </>
                    ) : (
                      <button type="button" onClick={() => document.getElementById('banner-upload')?.click()} className="flex flex-col items-center justify-center gap-2 p-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center justify-center shadow">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-sm font-medium text-purple-700">Upload Background</div>
                        <div className="text-xs text-purple-600/80">or upload logo coba</div>
                        <div className="text-[10px] text-gray-500">Recommended 1200x400px</div>
                      </button>
                    )}
                  </div>
                  <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleBannerFile(e.target.files?.[0] || null)} />
                  <div className="w-full text-center">
                    <Button type="button" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300" onClick={() => document.getElementById('banner-upload')?.click()}>
                      Choose File
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">PNG/JPG, recommended 1200x400px, max ~4MB</p>
                </div>
              </CardContent>
            </Card>

            {/* Location Editor */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  Change Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                          className="pl-10"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={searchLocation}
                        disabled={!searchQuery.trim() || isSearching}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600"
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
                            className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="mt-1" />
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, ZIP" className="mt-1" />
                  </div>
                </div>

                {(locationLat && locationLng) && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-sm">
                      <p className="text-gray-600 text-xs">
                        <span className="font-medium">Coordinates:</span> {locationLat.toFixed(6)}, {locationLng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300" asChild>
                    <Link href="/community-admin">Cancel</Link>
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving} 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                    <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}


