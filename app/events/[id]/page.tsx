"use client";

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
import { EventDiscussion } from "@/components/events/event-discussion";
import { UpdateRsvpDialog } from "@/components/events/update-rsvp-dialog";
import { AttendeesDialog } from "@/components/events/attendees-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Star,
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
  socialProof: {
    rating: number;
    reviewCount: number;
    attendeeCount: number;
  };
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
  socialProof: {
    rating: 4.8,
    reviewCount: 127,
    attendeeCount: 1250,
  },
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

export default function EventDetailsPage() {
  const event = DUMMY_EVENT;
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isUpdateRsvpOpen, setIsUpdateRsvpOpen] = useState(false);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);

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

  const handleUpdateRsvp = (isGoing: boolean) => {
    setIsRegistered(isGoing);
    // If user selects "Not going", we can optionally do something
    // For now, just update the state
  };

  // Filter related events based on matching tags
  const relatedEventsByTags = event.relatedEvents
    .map((relatedEvent) => {
      const matchingTags = relatedEvent.tags.filter((tag) =>
        event.tags.includes(tag)
      );
      return {
        ...relatedEvent,
        matchScore: matchingTags.length,
        matchingTags,
      };
    })
    .filter((relatedEvent) => relatedEvent.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? relatedEventsByTags.length - 1 : prev - 1
    );
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) =>
      prev === relatedEventsByTags.length - 1 ? 0 : prev + 1
    );
  };

  const availableSpots = event.capacity - event.registered;
  const registrationPercentage = (event.registered / event.capacity) * 100;

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
              <div className="flex items-center gap-2 text-white/90">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {event.socialProof.rating}
                </span>
                <span className="text-sm">
                  ({event.socialProof.reviewCount} reviews)
                </span>
              </div>
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
                        onClick={() => setIsUpdateRsvpOpen(true)}
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
                    <div className="flex flex-col gap-2 md:flex-row">
                      {/* Price Badge */}
                      <Badge
                        variant="outline"
                        className="border-gray-300 text-gray-700 px-3 py-1.5 text-sm font-medium"
                      >
                        {event.price.type === "free"
                          ? "FREE"
                          : `$${event.price.amount}`}
                      </Badge>
                      {/* Spots Left Badge */}
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-3 py-1.5 text-sm font-medium">
                        {availableSpots} spots left
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-1 items-center gap-2 sm:flex-initial">
                    <div className="flex w-full min-w-0 items-center gap-2">
                      {/* Bookmark Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full hover:bg-gray-100"
                      >
                        <Bookmark className="h-5 w-5 text-gray-700" />
                      </Button>

                      {/* Attend Button */}
                      <Button
                        className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-5 rounded-full flex-1 min-w-0 sm:w-auto sm:flex-initial sm:min-w-max shadow-md hover:shadow-lg transition-all"
                        onClick={handleAttendClick}
                      >
                        <span className="truncate">
                          {event.location.isOnline
                            ? "Attend online"
                            : "Attend onsite"}
                        </span>
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
            <Button variant="outline" onClick={() => setIsAttendeesOpen(true)}>
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
                      <AvatarImage
                        src={event.organizer.image || "/placeholder.svg"}
                      />
                      <AvatarFallback>{event.organizer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {event.organizer.name}
                        </h3>
                        {event.organizer.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4">
                        Leading organization in healthcare technology innovation
                        with over 1,250 successful events.
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

              {/* Other Events by Organizer */}
              {event.organizerEvents && event.organizerEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-violet-600" />
                      Other Events by {event.organizer.name}
                    </CardTitle>
                    <CardDescription>
                      Discover more events from this organizer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {event.organizerEvents.map((orgEvent) => (
                        <Link
                          key={orgEvent.id}
                          href={`/events/${orgEvent.id}`}
                          className="group"
                        >
                          <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-violet-300">
                            <div className="relative h-40 overflow-hidden">
                              <img
                                src={orgEvent.image || "/placeholder.svg"}
                                alt={orgEvent.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-3 right-3 flex gap-2">
                                <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm">
                                  {orgEvent.category}
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-violet-600 transition-colors">
                                {orgEvent.title}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(orgEvent.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Users className="h-4 w-4" />
                                  <span>{orgEvent.attendees} attending</span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-violet-700 border-violet-300"
                                >
                                  {orgEvent.price === 0
                                    ? "FREE"
                                    : `$${orgEvent.price}`}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Related Events Carousel */}
              {relatedEventsByTags.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-violet-600" />
                        You Might Also Like
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handlePrevSlide}
                          className="h-8 w-8"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleNextSlide}
                          className="h-8 w-8"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Based on similar tags: {event.tags.slice(0, 3).join(", ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative overflow-hidden">
                      <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{
                          transform: `translateX(-${currentSlide * 100}%)`,
                        }}
                      >
                        {relatedEventsByTags.map((relatedEvent) => (
                          <div
                            key={relatedEvent.id}
                            className="w-full flex-shrink-0"
                          >
                            <Card className="border-0 shadow-none hover:shadow-lg transition-shadow cursor-pointer">
                              <div className="relative h-48 overflow-hidden rounded-lg mb-3">
                                <img
                                  src={relatedEvent.image || "/placeholder.svg"}
                                  alt={relatedEvent.title}
                                  className="w-full h-full object-cover"
                                />
                                {/* Category & Price Badges */}
                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                  <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm">
                                    {relatedEvent.category}
                                  </Badge>
                                  <Badge className="bg-violet-600 text-white">
                                    {relatedEvent.price === 0
                                      ? "Free"
                                      : `$${relatedEvent.price}`}
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h3 className="font-semibold text-lg line-clamp-2">
                                  {relatedEvent.title}
                                </h3>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(relatedEvent.date)}</span>
                                </div>

                                {/* Matching Tags */}
                                <div className="flex flex-wrap gap-2">
                                  {relatedEvent.matchingTags
                                    .slice(0, 3)
                                    .map((tag, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs bg-violet-50 text-violet-600"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                </div>

                                <Button
                                  className="w-full bg-violet-600 hover:bg-violet-700"
                                  asChild
                                >
                                  <a href={`/events/${relatedEvent.id}`}>
                                    View Event
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </a>
                                </Button>
                              </div>
                            </Card>
                          </div>
                        ))}
                      </div>

                      {/* Carousel Indicators */}
                      <div className="flex items-center justify-center gap-2 mt-4">
                        {relatedEventsByTags.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              index === currentSlide
                                ? "w-8 bg-violet-600"
                                : "w-2 bg-gray-300 hover:bg-gray-400"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
              <EventDiscussion
                eventId={event.id}
                organizerName={event.organizer.name}
                hasAnnouncement={true}
              />
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

      {/* Update RSVP Dialog */}
      <UpdateRsvpDialog
        open={isUpdateRsvpOpen}
        onOpenChange={setIsUpdateRsvpOpen}
        currentStatus={isRegistered}
        onUpdate={handleUpdateRsvp}
      />

      {/* Attendees Dialog */}
      <AttendeesDialog
        open={isAttendeesOpen}
        onOpenChange={setIsAttendeesOpen}
        totalAttendees={event.registered}
        maxAttendees={event.capacity}
        eventTitle={event.title}
      />
    </div>
  );
}
