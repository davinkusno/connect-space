import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InteractiveLeafletMap } from "@/components/ui/interactive-leaflet-map"
import { CalendarIntegration } from "@/components/ui/calendar-integration"
import { EventReviews } from "@/components/ui/event-reviews"
import { CommunityAdminNav } from "@/components/navigation/community-admin-nav"
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Heart,
  Share2,
  ExternalLink,
  User2,
  ChevronRight,
  Star,
  Ticket,
  Wifi,
  Coffee,
  Car,
  Camera,
  Utensils,
  Gift,
  BookOpen,
  Award,
  Globe,
} from "lucide-react"

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
  amenities: string[]
  website?: string
  socialProof: {
    rating: number
    reviewCount: number
    attendeeCount: number
  }
  sponsors: Array<{
    name: string
    logo: string
    tier: "gold" | "silver" | "bronze"
  }>
  relatedEvents: Array<{
    id: string
    title: string
    date: string
    image: string
  }>
}

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
  amenities: ["Wi-Fi", "Lunch Included", "Parking", "Recording", "Coffee"],
  website: "https://healthtechinnovations.com",
  socialProof: {
    rating: 4.8,
    reviewCount: 127,
    attendeeCount: 1250,
  },
  sponsors: [
    { name: "TechCorp", logo: "/placeholder.svg?height=60&width=120", tier: "gold" },
    { name: "HealthAI", logo: "/placeholder.svg?height=60&width=120", tier: "silver" },
    { name: "InnovateMed", logo: "/placeholder.svg?height=60&width=120", tier: "bronze" },
  ],
  relatedEvents: [
    { id: "2", title: "Machine Learning Workshop", date: "2024-03-22", image: "/placeholder.svg?height=120&width=160" },
    { id: "3", title: "Digital Health Conference", date: "2024-04-05", image: "/placeholder.svg?height=120&width=160" },
    { id: "4", title: "AI Ethics Symposium", date: "2024-04-18", image: "/placeholder.svg?height=120&width=160" },
  ],
}

const EventDetailsPage = () => {
  const event = DUMMY_EVENT

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeStr: string) => {
    return new Date(`2024-01-01T${timeStr}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getAmenityIcon = (amenity: string) => {
    const icons: { [key: string]: any } = {
      "Wi-Fi": Wifi,
      "Lunch Included": Utensils,
      Parking: Car,
      Recording: Camera,
      Coffee: Coffee,
    }
    return icons[amenity] || Gift
  }

  const availableSpots = event.capacity - event.registered
  const registrationPercentage = (event.registered / event.capacity) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      <CommunityAdminNav 
        communityProfilePicture="/placeholder-user.jpg"
        communityName="Tech Innovators NYC"
      />
      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden">
        <img src={event.image || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {event.category}
              </Badge>
              <div className="flex items-center gap-2 text-white/90">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{event.socialProof.rating}</span>
                <span className="text-sm">({event.socialProof.reviewCount} reviews)</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">{event.title}</h1>

            <div className="flex flex-wrap items-center gap-6 text-white/90 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>
                  {formatTime(event.time)} - {formatTime(event.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{event.location.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{event.registered} attending</span>
              </div>
            </div>

            <p className="text-lg text-white/90 mb-8 max-w-3xl leading-relaxed">{event.description}</p>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <CalendarIntegration
                event={{
                  title: event.title,
                  description: event.description,
                  startDate: `${event.date}T${event.time}`,
                  endDate: `${event.date}T${event.endTime}`,
                  location: event.location,
                  organizer: event.organizer.name,
                }}
                variant="default"
              />
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                View Attendees
              </Button>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Event Website
              </Button>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6 mt-6">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      About This Event
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.longDescription}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle>Topics & Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="hover:bg-violet-50 cursor-pointer">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Organizer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User2 className="h-5 w-5" />
                      Event Organizer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={event.organizer.image || "/placeholder.svg"} />
                        <AvatarFallback>{event.organizer.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{event.organizer.name}</h3>
                          {event.organizer.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Award className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4">
                          Leading organization in healthcare technology innovation with over 1,250 successful events.
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                          <Button variant="outline" size="sm">
                            Contact Organizer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Location</CardTitle>
                    <CardDescription>
                      {event.location.venue} • {event.location.address}, {event.location.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractiveLeafletMap
                      location={event.location}
                      height="500px"
                      showControls={true}
                      showDirections={true}
                      zoom={15}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <EventReviews eventId={event.id} userCanReview={true} />
              </TabsContent>

              <TabsContent value="gallery" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {event.images.map((image, index) => (
                        <div
                          key={index}
                          className="aspect-video rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                        >
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Event image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-6">
              <CardContent className="p-6">

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Available spots</span>
                    <span className="font-medium">
                      {availableSpots} of {event.capacity}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-violet-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${registrationPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Registered</span>
                    <span className="font-medium">{event.registered} people</span>
                  </div>
                </div>

                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white mb-4" size="lg">
                  <Ticket className="h-4 w-4 mr-2" />
                  Register Now
                </Button>

                <div className="text-center">
                  <p className="text-xs text-gray-500">Free cancellation up to 24 hours before the event</p>
                </div>
              </CardContent>
            </Card>

            {/* What's Included */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  What's Included
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.amenities.map((amenity, index) => {
                    const IconComponent = getAmenityIcon(amenity)
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4 text-violet-600" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sponsors */}
            <Card>
              <CardHeader>
                <CardTitle>Event Sponsors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {["gold", "silver", "bronze"].map((tier) => {
                    const tierSponsors = event.sponsors.filter((s) => s.tier === tier)
                    if (tierSponsors.length === 0) return null

                    return (
                      <div key={tier}>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 capitalize">{tier} Sponsors</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {tierSponsors.map((sponsor, index) => (
                            <div
                              key={index}
                              className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <img
                                src={sponsor.logo || "/placeholder.svg"}
                                alt={sponsor.name}
                                className="h-8 w-auto mb-2"
                              />
                              <span className="text-xs text-gray-600 text-center">{sponsor.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Related Events */}
            <Card>
              <CardHeader>
                <CardTitle>You Might Also Like</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {event.relatedEvents.map((relatedEvent) => (
                    <div
                      key={relatedEvent.id}
                      className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <img
                        src={relatedEvent.image || "/placeholder.svg"}
                        alt={relatedEvent.title}
                        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1 line-clamp-2">{relatedEvent.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{formatDate(relatedEvent.date)}</p>
                        <div className="flex items-center text-violet-600 text-xs">
                          <span>View Event</span>
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Globe className="h-4 w-4 mr-2" />
                    Visit Event Website
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <User2 className="h-4 w-4 mr-2" />
                    Contact Organizer
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetailsPage
