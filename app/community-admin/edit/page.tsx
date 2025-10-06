"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PageTransition } from "@/components/ui/page-transition"
import { FloatingElements } from "@/components/ui/floating-elements"
import { CommunityAdminNav } from "@/components/navigation/community-admin-nav"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Save, Upload, ArrowLeft } from "lucide-react"

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
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [address, setAddress] = useState("")

  useEffect(() => {
    // Mock load current community data (replace with real fetch later)
    const load = async () => {
      setIsLoading(true)
      await new Promise((r) => setTimeout(r, 500))
      const mock: CommunityProfile = {
        name: "Tech Innovators NYC",
        profilePicture: "/placeholder-user.jpg",
        bannerUrl: "/placeholder.jpg",
        location: { city: "New York", country: "USA", address: "123 Tech Street, Manhattan, NY" },
      }
      setCommunity(mock)
      setProfilePreview(mock.profilePicture)
      setBannerPreview(mock.bannerUrl)
      setCity(mock.location.city)
      setCountry(mock.location.country)
      setAddress(mock.location.address)
      setIsLoading(false)
    }
    load()
  }, [])

  const isLocationValid = useMemo(() => {
    return city.trim().length > 1 && country.trim().length > 1 && address.trim().length > 5
  }, [city, country, address])

  const handleProfileFile = (file: File | null) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setProfilePreview(url)
  }

  const handleBannerFile = (file: File | null) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setBannerPreview(url)
  }

  return (
    <PageTransition>
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen relative">
        <CommunityAdminNav 
          communityProfilePicture={community?.profilePicture}
          communityName={community?.name}
        />
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
              <CardContent>
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
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300" asChild>
                    <Link href="/community-admin">Cancel</Link>
                  </Button>
                  <Button disabled={!isLocationValid} className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600">
                    <Save className="w-4 h-4 mr-2" />
                    Save (no API yet)
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


