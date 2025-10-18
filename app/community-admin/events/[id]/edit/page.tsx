"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CommunityAdminNav } from "@/components/navigation/community-admin-nav"
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Image as ImageIcon,
  Plus,
  X,
  Tag,
  Gift,
  Globe
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

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

const categories = ["Technology", "Business", "Networking", "Education", "Health", "Entertainment", "Sports", "Arts"]

export default function EditEventPage() {
  const router = useRouter()
  const [event, setEvent] = useState<Event>(DUMMY_EVENT)
  const [isLoading, setIsLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [newTag, setNewTag] = useState("")

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const preview = URL.createObjectURL(file)
      setEvent(prev => ({
        ...prev,
        images: [...prev.images, preview]
      }))
    })
    // Reset input
    e.target.value = ''
  }

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    router.push(`/community-admin/events/${event.id}`)
  }

  const handleCancel = () => {
    router.push(`/community-admin/events/${event.id}`)
  }

  const addTag = () => {
    if (newTag.trim() && !event.tags.includes(newTag.trim())) {
      setEvent(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setEvent(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <CommunityAdminNav 
        communityProfilePicture="/placeholder-user.jpg"
        communityName="Tech Innovators NYC"
      />
      
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/community-admin/events">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
              <p className="text-gray-600">Update event details and information</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={event.title}
                    onChange={(e) => setEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter event title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea
                    id="description"
                    value={event.description}
                    onChange={(e) => setEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the event"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="longDescription">Detailed Description</Label>
                  <Textarea
                    id="longDescription"
                    value={event.longDescription}
                    onChange={(e) => setEvent(prev => ({ ...prev, longDescription: e.target.value }))}
                    placeholder="Detailed description of the event"
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={event.category} onValueChange={(value) => setEvent(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={event.website || ""}
                    onChange={(e) => setEvent(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Event Date</Label>
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {event.date ? format(new Date(event.date), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(event.date)}
                        onSelect={(date) => {
                          if (date) {
                            setEvent(prev => ({ ...prev, date: date.toISOString().split('T')[0] }))
                            setShowDatePicker(false)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={event.time}
                      onChange={(e) => setEvent(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={event.endTime}
                      onChange={(e) => setEvent(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="venue">Venue Name</Label>
                  <Input
                    id="venue"
                    value={event.location.venue}
                    onChange={(e) => setEvent(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, venue: e.target.value }
                    }))}
                    placeholder="Enter venue name"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={event.location.address}
                    onChange={(e) => setEvent(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, address: e.target.value }
                    }))}
                    placeholder="Enter address"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={event.location.city}
                    onChange={(e) => setEvent(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, city: e.target.value }
                    }))}
                    placeholder="Enter city"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Capacity */}
            <Card>
              <CardHeader>
                <CardTitle>Capacity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="capacity">Maximum Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={event.capacity}
                    onChange={(e) => setEvent(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    placeholder="500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {event.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add new tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Images */}
            <Card>
              <CardHeader>
                <CardTitle>Event Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Event Image */}
                <div>
                  <Label>Main Event Image</Label>
                  <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mt-2">
                    {event.image ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={event.image}
                          alt="Main Event"
                          fill
                          className="object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 w-8 h-8 p-0"
                          onClick={() => setEvent(prev => ({ ...prev, image: "" }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No main image selected</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Button for Main Image */}
                  <div className="flex justify-center mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const preview = URL.createObjectURL(file)
                          setEvent(prev => ({ ...prev, image: preview }))
                        }
                      }}
                      className="hidden"
                      id="main-image-upload"
                    />
                    <label htmlFor="main-image-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Plus className="w-4 h-4 mr-2" />
                          Upload Main Image
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Additional Images */}
                <div>
                  <Label>Additional Images</Label>
                  {event.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {event.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <div className="relative w-full h-24 border rounded-lg overflow-hidden">
                            <Image
                              src={img}
                              alt={`Event image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setEvent(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index)
                            }))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg mt-2">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-4">No additional images</p>
                    </div>
                  )}
                  
                  {/* Upload Button for Additional Images */}
                  <div className="flex justify-center mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="additional-images-upload"
                    />
                    <label htmlFor="additional-images-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Plus className="w-4 h-4 mr-2" />
                          Upload Additional Images
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
