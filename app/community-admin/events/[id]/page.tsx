"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveLeafletMap } from "@/components/ui/interactive-leaflet-map";
import { CalendarIntegration } from "@/components/ui/calendar-integration";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Heart,
  ExternalLink,
  User2,
  ChevronRight,
  ChevronLeft,
  Ticket,
  BookOpen,
  Award,
  Globe,
  Sparkles,
  Bookmark,
  ArrowLeft,
  Video,
  Copy,
  CheckCheck,
  PenLine,
  Check,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  date: string;
  time: string;
  endTime: string;
  location: {
    venue: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
    isOnline?: boolean;
    meetingLink?: string;
  };
  organizer: {
    name: string;
    image: string;
    verified: boolean;
  };
  category: string;
  price: {
    type: "free" | "paid";
    amount?: number;
    currency?: string;
  };
  capacity: number;
  registered: number;
  image: string;
  images: string[];
  tags: string[];
  website?: string;
  relatedEvents: Array<{
    id: string;
    title: string;
    date: string;
    image: string;
    category: string;
    tags: string[];
    price: number;
  }>;
  organizerEvents?: Array<{
    id: string;
    title: string;
    date: string;
    image: string;
    category: string;
    price: number;
    attendees: number;
  }>;
}

const DUMMY_EVENT: Event = {
  id: "1",
  title: "AI in Healthcare Summit 2024",
  description:
    "Join industry leaders for an insightful exploration of AI's transformative potential in healthcare.",
  longDescription: `Join us for a comprehensive summit exploring the cutting-edge applications of artificial intelligence in healthcare. This full-day event brings together leading researchers, healthcare professionals, and tech innovators to discuss the latest breakthroughs, challenges, and opportunities in AI-powered healthcare solutions.

  The summit will feature keynote presentations from renowned experts, interactive workshops, panel discussions, and networking sessions. Topics will include machine learning applications in diagnostics, AI-powered drug discovery, ethical considerations in healthcare AI, and future trends in digital health.

  This is an unmissable opportunity for healthcare professionals, researchers, data scientists, and entrepreneurs to stay at the forefront of this rapidly evolving field.`,
  date: "2024-03-15",
  time: "09:00",
  endTime: "17:00",
  location: {
    venue: "Virtual Event",
    address: "Online Platform",
    city: "Online",
    lat: 0,
    lng: 0,
    isOnline: true,
    meetingLink: "https://zoom.us/j/123456789?pwd=abc123xyz",
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
  relatedEvents: [
    {
      id: "2",
      title: "Machine Learning Workshop",
      date: "2024-03-22",
      image: "/placeholder.svg?height=120&width=160",
      category: "Technology",
      tags: ["AI", "Machine Learning", "Tech", "Workshop"],
      price: 199,
    },
    {
      id: "3",
      title: "Digital Health Conference",
      date: "2024-04-05",
      image: "/placeholder.svg?height=120&width=160",
      category: "Healthcare",
      tags: ["Healthcare", "Technology", "Innovation", "Networking"],
      price: 349,
    },
    {
      id: "4",
      title: "AI Ethics Symposium",
      date: "2024-04-18",
      image: "/placeholder.svg?height=120&width=160",
      category: "Technology",
      tags: ["AI", "Ethics", "Innovation"],
      price: 0,
    },
    {
      id: "5",
      title: "Healthcare Innovation Forum",
      date: "2024-04-25",
      image: "/placeholder.svg?height=120&width=160",
      category: "Healthcare",
      tags: ["Healthcare", "Innovation", "Technology"],
      price: 299,
    },
    {
      id: "6",
      title: "AI Networking Meetup",
      date: "2024-05-02",
      image: "/placeholder.svg?height=120&width=160",
      category: "Technology",
      tags: ["AI", "Networking", "Technology"],
      price: 0,
    },
  ],
  organizerEvents: [
    {
      id: "7",
      title: "Digital Health Transformation Summit",
      date: "2024-04-10",
      image: "/placeholder.svg?height=200&width=350",
      category: "Healthcare",
      price: 249,
      attendees: 432,
    },
    {
      id: "8",
      title: "Medical AI Workshop Series",
      date: "2024-03-28",
      image: "/placeholder.svg?height=200&width=350",
      category: "Technology",
      price: 199,
      attendees: 287,
    },
    {
      id: "9",
      title: "HealthTech Networking Event",
      date: "2024-04-15",
      image: "/placeholder.svg?height=200&width=350",
      category: "Healthcare",
      price: 0,
      attendees: 156,
    },
  ],
};

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params Promise (Next.js 15+)
  const { id } = use(params);

  // Create a copy of DUMMY_EVENT with the correct ID from params
  // TODO: Fetch actual event data from Supabase based on id
  const baseEvent = { ...DUMMY_EVENT, id: id };

  // Customize event data based on ID for demo purposes
  const eventTitles: Record<string, string> = {
    "1": "AI & Machine Learning Summit 2024",
    "2": "Digital Marketing Masterclass",
    "3": "Startup Funding Workshop",
    "4": "Web Development Bootcamp",
    "5": "Blockchain & Cryptocurrency Forum",
    "6": "AI in Healthcare Summit 2024",
  };

  const eventLocations: Record<string, typeof baseEvent.location> = {
    "1": {
      venue: "Moscone Convention Center",
      address: "747 Howard Street",
      city: "San Francisco",
      lat: 37.7749,
      lng: -122.4194,
      isOnline: false,
    },
    "2": {
      venue: "WeWork Pacific Design Center",
      address: "8687 Melrose Ave",
      city: "West Hollywood",
      lat: 34.0839,
      lng: -118.3847,
      isOnline: false,
    },
    "3": {
      venue: "TechHub Boston",
      address: "1 Broadway",
      city: "Cambridge",
      lat: 42.3626,
      lng: -71.0843,
      isOnline: false,
    },
    "4": {
      venue: "General Assembly",
      address: "315 W 36th St",
      city: "New York",
      lat: 40.7549,
      lng: -73.9925,
      isOnline: false,
    },
    "5": {
      venue: "Convention Center",
      address: "800 W Katella Ave",
      city: "Anaheim",
      lat: 33.8031,
      lng: -117.9239,
      isOnline: false,
    },
    "6": {
      venue: "Virtual Event",
      address: "Online Platform",
      city: "Online",
      lat: 0,
      lng: 0,
      isOnline: true,
      meetingLink: "https://zoom.us/j/123456789?pwd=abc123xyz",
    },
  };

  const event = {
    ...baseEvent,
    title: eventTitles[id] || baseEvent.title,
    location: eventLocations[id] || baseEvent.location,
  };

  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setIsCheckingAuth(false);
    };

    checkAuth();

    // Subscribe to auth changes
    const supabase = getSupabaseBrowser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2024-01-01T${timeStr}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopyLink = () => {
    if (event.location.meetingLink) {
      navigator.clipboard.writeText(event.location.meetingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleAttendClick = () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      // Redirect to login/register page with return URL
      router.push("/auth/login?redirect=/events/" + event.id);
      return;
    }

    // Directly set as registered (works for both online and onsite)
    setIsRegistered(true);
    // Optionally scroll to location tab for online events
    if (event.location.isOnline) {
      const locationTab = document.querySelector('[value="location"]');
      if (locationTab) {
        (locationTab as HTMLElement).click();
      }
    }
  };

  const handleSaveEvent = () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      // Redirect to login/register page with return URL
      router.push("/auth/login?redirect=/events/" + event.id);
      return;
    }

    // Toggle save state
    // TODO: Implement actual save/bookmark functionality with Supabase
    console.log("Event saved/bookmarked");
  };

  const availableSpots = event.capacity - event.registered;
  const registrationPercentage = (event.registered / event.capacity) * 100;

  // Mock user role - replace with actual auth check
  const isAdmin = true; // Set to true for community admin

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="hover:bg-gray-100 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden">
        <img
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                {event.category}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {event.title}
            </h1>

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

            <p className="text-lg text-white/90 mb-8 max-w-3xl leading-relaxed">
              {event.description}
            </p>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
            onClick={handleSaveEvent}
            disabled={isCheckingAuth}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-50 bg-white shadow-md rounded-2xl overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center p-3 md:p-5 md:pl-8">
            {/* Left: Date & Title */}
            <div className="hidden min-w-0 flex-1 flex-col gap-1 md:flex">
              <time className="text-xs uppercase leading-5 tracking-tight text-gray-500">
                {formatDate(event.date)} · {formatTime(event.time)}
              </time>
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {event.title}
              </h2>
            </div>

            {/* Right: Badges & Actions */}
            <div className="ml-auto flex w-full items-center justify-between gap-2 md:w-auto md:justify-start">
              {isRegistered ? (
                <>
                  {/* "You're going!" Badge */}
                  <div className="flex items-center gap-2 pl-3 sm:flex">
                    <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1.5 text-sm font-medium rounded-full">
                      <Check className="h-3 w-3 mr-1" />
                      <span className="truncate px-0.5">You're going!</span>
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-1 items-center gap-2 sm:flex-initial">
                    <div className="flex w-full min-w-0 items-center gap-2">
                      {/* Edit RSVP Button */}
                      <Button
                        variant="ghost"
                        className="hover:bg-gray-100 text-gray-700 px-6 py-4 rounded-full flex-1 min-w-0 sm:w-auto sm:flex-initial sm:min-w-max"
                        onClick={() => {
                          /* RSVP edit coming soon */
                        }}
                      >
                        <PenLine className="h-5 w-5 mr-2" />
                        <span className="truncate">Edit RSVP</span>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-2 md:flex-row"></div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-1 items-center gap-2 sm:flex-initial">
                    <div className="flex w-full min-w-0 items-center gap-2">
                      {/* Bookmark Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full hover:bg-gray-100"
                        onClick={handleSaveEvent}
                        disabled={isCheckingAuth}
                      >
                        <Bookmark className="h-5 w-5 text-gray-700" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
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
            <Button
              variant="outline"
              onClick={() => {
                /* View attendees coming soon */
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              View Attendees
            </Button>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
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
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {event.longDescription}
                    </p>
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
                      <Badge
                        key={index}
                        variant="outline"
                        className="hover:bg-violet-50 cursor-pointer"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-6 mt-6">
              {event.location.isOnline ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Video className="h-5 w-5 text-purple-600" />
                          Virtual Event
                        </CardTitle>
                        <CardDescription className="mt-2">
                          This is an online event. Join from anywhere!
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isRegistered ? (
                      <>
                        {/* Event Details - Simple and Clean */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-gray-700">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <span>{formatDate(event.date)}</span>
                          </div>

                          <div className="flex items-center gap-3 text-gray-700">
                            <Video className="h-5 w-5 text-gray-500" />
                            <div>
                              <span className="text-gray-600">
                                Online event
                              </span>
                              <a
                                href={event.location.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-600 hover:text-blue-700 hover:underline mt-0.5"
                              >
                                {event.location.meetingLink}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Add to Calendar Button */}
                        <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-full py-6 shadow-md hover:shadow-lg transition-all">
                          Add to calendar
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Not Registered Yet */}
                        <div className="text-center py-12">
                          <div className="inline-flex h-20 w-20 rounded-full bg-violet-100 items-center justify-center mb-4">
                            <Video className="h-10 w-10 text-violet-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Join this online event
                          </h3>
                          <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Click the button below to attend this virtual event
                            and get the meeting link.
                          </p>
                          <Button
                            size="lg"
                            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 rounded-full shadow-md hover:shadow-lg transition-all"
                            onClick={handleAttendClick}
                          >
                            Attend online
                          </Button>
                        </div>

                        {/* Platform Info */}
                        <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Platform Information
                          </h4>
                          <div className="space-y-2 text-sm text-gray-700">
                            <p className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
                              This event will be hosted on Zoom
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
                              No special software installation required
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
                              Works on desktop, mobile, and tablet
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Event Location</CardTitle>
                    <CardDescription>
                      {event.location.venue} • {event.location.address},{" "}
                      {event.location.city}
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
              )}
            </TabsContent>

            <TabsContent value="discussion" className="mt-6">
              <div className="space-y-6">
                {/* Admin Post Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User2 className="h-5 w-5 text-violet-600" />
                      Admin Post
                    </CardTitle>
                    <CardDescription>
                      Share announcements and updates with event attendees
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Post Title
                        </label>
                        <input
                          type="text"
                          placeholder="Enter post title..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Post Content
                        </label>
                        <textarea
                          placeholder="Share updates, announcements, or start a discussion..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm text-gray-600">
                              Pin this post
                            </span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm text-gray-600">
                              Send notification
                            </span>
                          </label>
                        </div>
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                          Post Update
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pinned Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Pinned Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Sample Pinned Post */}
                      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback>HA</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">
                                  HealthTech Admin
                                </span>
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                  <Award className="h-3 w-3 mr-1" />
                                  Pinned
                                </Badge>
                              </div>
                              <span className="text-xs text-gray-500">
                                2 hours ago
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-yellow-600 hover:bg-yellow-100"
                            >
                              <Award className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Important: Event Schedule Update
                        </h3>
                        <p className="text-gray-700 text-sm mb-3">
                          Due to technical requirements, we're moving the
                          keynote presentation to 10:30 AM instead of 10:00 AM.
                          All other sessions remain unchanged.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>📌 Pinned by Admin</span>
                          <span>👀 47 views</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-gray-600" />
                      Recent Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Sample Post 1 */}
                      <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-semibold text-sm">
                                John Doe
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                1 hour ago
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500"
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Excited for the AI workshop!
                        </h3>
                        <p className="text-gray-700 text-sm mb-3">
                          Looking forward to learning about the latest
                          developments in healthcare AI. Any specific topics we
                          should prepare for?
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>❤️ 12 likes</span>
                          <span>💬 3 replies</span>
                        </div>
                      </div>

                      {/* Sample Post 2 */}
                      <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback>SM</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-semibold text-sm">
                                Sarah Miller
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                3 hours ago
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500"
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Networking opportunities
                        </h3>
                        <p className="text-gray-700 text-sm mb-3">
                          Would love to connect with other healthcare
                          professionals attending. Feel free to reach out!
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>❤️ 8 likes</span>
                          <span>💬 1 reply</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
      </div>
    </div>
  );
}
