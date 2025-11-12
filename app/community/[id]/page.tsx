"use client";

import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  FadeTransition,
  SlideTransition,
  InViewTransition,
} from "@/components/ui/content-transitions";
import {
  ButtonPulse,
  HoverScale,
  AnimatedIcon,
} from "@/components/ui/micro-interactions";
import { Spinner } from "@/components/ui/loading-indicators";
import { InteractiveMap } from "@/components/ui/interactive-map";
import {
  MapPin,
  Users,
  Calendar,
  MessageCircle,
  Share2,
  Bell,
  UserPlus,
  ThumbsUp,
  Reply,
  Send,
  ImageIcon,
  Navigation,
  Hash,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CommunityGallery } from "@/components/community/community-gallery";
import { FloatingChat } from "@/components/chat/floating-chat";

export default function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params Promise (Next.js 15+)
  const { id } = use(params);

  const [isJoined, setIsJoined] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [activeTab, setActiveTab] = useState("discussions");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  const community = {
    id: id,
    name: "Tech Innovators",
    description:
      "A vibrant community for tech enthusiasts, entrepreneurs, and innovators. We host weekly meetups, workshops, hackathons, and networking events to foster collaboration and learning.",
    members: 1247,
    location: {
      lat: 40.7589,
      lng: -73.9851,
      address: "123 Tech Street, Manhattan, NY 10001",
      city: "New York",
    },
    category: "Technology",
    coverImage: "/placeholder.svg?height=300&width=800",
    profileImage: "/placeholder.svg?height=120&width=120",
    tags: ["Tech", "Innovation", "Startups", "AI", "Development"],
    upcomingEvents: 3,
    memberGrowth: "+12%",
    founded: "January 2022",
    gradient: "gradient-primary",
    rules: [
      "Be respectful and professional",
      "No spam or self-promotion",
      "Stay on topic",
      "Help others and share knowledge",
    ],
    moderators: [
      {
        name: "Sarah Chen",
        role: "Founder",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        name: "Mike Johnson",
        role: "Moderator",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        name: "Lisa Wang",
        role: "Event Coordinator",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  };

  const upcomingEvents = [
    {
      id: 1,
      title: "AI & Machine Learning Workshop",
      date: "2024-01-15",
      time: "6:00 PM",
      location: {
        lat: 40.7505,
        lng: -73.9934,
        address: "WeWork SoHo, 115 Broadway, New York, NY",
        city: "New York",
      },
      attendees: 45,
      maxAttendees: 50,
      image: "/placeholder.svg?height=100&width=150",
    },
    {
      id: 2,
      title: "Startup Pitch Night",
      date: "2024-01-22",
      time: "7:00 PM",
      location: {
        lat: 40.7282,
        lng: -74.0776,
        address: "TechHub NYC, 142 W 36th St, New York, NY",
        city: "New York",
      },
      attendees: 32,
      maxAttendees: 40,
      image: "/placeholder.svg?height=100&width=150",
    },
    {
      id: 3,
      title: "Networking Happy Hour",
      date: "2024-01-29",
      time: "5:30 PM",
      location: {
        lat: 40.7614,
        lng: -73.9776,
        address: "Rooftop Bar Manhattan, 230 5th Ave, New York, NY",
        city: "New York",
      },
      attendees: 28,
      maxAttendees: 60,
      image: "/placeholder.svg?height=100&width=150",
    },
  ];

  // Convert events to community format for map
  const eventCommunities = upcomingEvents.map((event) => ({
    id: event.id + 1000, // Offset to avoid conflicts
    name: event.title,
    description: `Event at ${event.location.address}`,
    members: event.attendees,
    location: event.location,
    category: "Event",
    image: event.image,
    tags: ["Event", "Meetup"],
    upcomingEvents: 1,
    gradient: "gradient-secondary",
  }));

  const discussions = [
    {
      id: 1,
      author: "Alex Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      title: "Best practices for React performance optimization?",
      content:
        "I'm working on a large React application and looking for tips on optimizing performance. What are your go-to strategies?",
      timestamp: "2 hours ago",
      likes: 12,
      replies: 8,
      tags: ["React", "Performance"],
    },
    {
      id: 2,
      author: "Emma Thompson",
      avatar: "/placeholder.svg?height=40&width=40",
      title: "Just launched my startup!",
      content:
        "After months of hard work, I'm thrilled to announce the launch of my AI-powered productivity app. Thanks to this community for all the support!",
      timestamp: "4 hours ago",
      likes: 24,
      replies: 15,
      tags: ["Startup", "AI"],
    },
    {
      id: 3,
      author: "David Kim",
      avatar: "/placeholder.svg?height=40&width=40",
      title: "Looking for a co-founder with backend expertise",
      content:
        "I have a great idea for a fintech startup and I'm looking for a technical co-founder with strong backend development skills.",
      timestamp: "6 hours ago",
      likes: 8,
      replies: 12,
      tags: ["Co-founder", "Backend"],
    },
  ];

  const members = [
    {
      name: "Sarah Chen",
      role: "Founder",
      avatar: "/placeholder.svg?height=40&width=40",
      joinDate: "Jan 2022",
    },
    {
      name: "Mike Johnson",
      role: "Developer",
      avatar: "/placeholder.svg?height=40&width=40",
      joinDate: "Feb 2022",
    },
    {
      name: "Lisa Wang",
      role: "Product Manager",
      avatar: "/placeholder.svg?height=40&width=40",
      joinDate: "Mar 2022",
    },
    {
      name: "Alex Rodriguez",
      role: "Full Stack",
      avatar: "/placeholder.svg?height=40&width=40",
      joinDate: "Apr 2022",
    },
    {
      name: "Emma Thompson",
      role: "UX Designer",
      avatar: "/placeholder.svg?height=40&width=40",
      joinDate: "May 2022",
    },
    {
      name: "David Kim",
      role: "Data Scientist",
      avatar: "/placeholder.svg?height=40&width=40",
      joinDate: "Jun 2022",
    },
  ];

  const handleJoinCommunity = () => {
    setIsJoined(!isJoined);
  };

  const handleSubmitPost = () => {
    if (newPost.trim()) {
      setIsSubmitting(true);
      setTimeout(() => {
        console.log("Submitting post:", newPost);
        setNewPost("");
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleStartDirectMessage = (userId: string, userName: string) => {
    // Navigate to messages page with direct message
    window.location.href = `/messages?dm=${userId}&name=${userName}`;
  };

  const handleToggleChat = () => {
    if (isChatMinimized) {
      setIsChatMinimized(false);
    } else {
      setIsChatOpen(!isChatOpen);
    }
  };

  const handleMinimizeChat = () => {
    setIsChatMinimized(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setIsChatMinimized(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-medium text-violet-700">
              ConnectSpace
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/discover">
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-violet-700 nav-item"
                >
                  Discover
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-violet-700 nav-item"
                >
                  Dashboard
                </Button>
              </Link>
              <Link href="/messages">
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-violet-700 nav-item"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Messages
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Cover Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image
          src={community.coverImage || "/placeholder.svg"}
          alt={community.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <InViewTransition
          effect="fade"
          className="absolute bottom-8 left-8 text-white"
        >
          <div className="flex items-center gap-6">
            <div className="relative">
              <Image
                src={community.profileImage || "/placeholder.svg"}
                alt={community.name}
                width={80}
                height={80}
                className="rounded-2xl border-4 border-white/20 backdrop-blur-sm"
              />
            </div>
            <div>
              <h1 className="text-4xl font-light mb-2">{community.name}</h1>
              <div className="flex items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {community.members.toLocaleString()}
                </div>
                <HoverScale>
                  <button
                    onClick={() => setShowLocationMap(!showLocationMap)}
                    className="flex items-center gap-2 hover:text-white transition-colors duration-200"
                  >
                    <MapPin className="h-4 w-4" />
                    {community.location.city}
                  </button>
                </HoverScale>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0"
                >
                  {community.category}
                </Badge>
              </div>
            </div>
          </div>
        </InViewTransition>
      </div>

      {/* Location Map Modal */}
      <FadeTransition show={showLocationMap}>
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Community Location
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLocationMap(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  <strong>{community.name}</strong> is located at:
                </p>
                <p className="text-gray-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-violet-600" />
                  {community.location.address}
                </p>
              </div>
              <InteractiveMap
                communities={[community]}
                height="400px"
                showControls={true}
                showFilters={false}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </FadeTransition>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Action Buttons */}
            <InViewTransition
              effect="slide-up"
              className="flex items-center gap-4 mb-8"
            >
              <ButtonPulse
                onClick={handleJoinCommunity}
                className={
                  isJoined
                    ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    : "bg-violet-700 hover:bg-violet-800 text-white"
                }
                pulseColor={
                  isJoined
                    ? "rgba(229, 231, 235, 0.5)"
                    : "rgba(124, 58, 237, 0.3)"
                }
              >
                <Button
                  size="lg"
                  className={
                    isJoined
                      ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      : "bg-violet-700 hover:bg-violet-800 text-white"
                  }
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isJoined ? "Joined" : "Join Community"}
                </Button>
              </ButtonPulse>
              <HoverScale>
                <Button
                  variant="outline"
                  className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Follow
                </Button>
              </HoverScale>
              <HoverScale>
                <Button
                  variant="outline"
                  className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                  onClick={() => setShowShareOptions(!showShareOptions)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </HoverScale>
              <HoverScale>
                <Button
                  variant="outline"
                  className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                  onClick={() => setIsChatOpen(true)}
                >
                  <Hash className="h-4 w-4 mr-2" />
                  Join Chat
                </Button>
              </HoverScale>
            </InViewTransition>

            {/* Share Options Dropdown */}
            <FadeTransition show={showShareOptions} className="mb-4">
              <Card className="p-4 border-gray-100">
                <div className="flex gap-2">
                  {[
                    "Twitter",
                    "Facebook",
                    "LinkedIn",
                    "Email",
                    "Copy Link",
                  ].map((option) => (
                    <Button
                      key={option}
                      variant="outline"
                      size="sm"
                      className="text-sm"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </Card>
            </FadeTransition>

            {/* Community Tabs */}
            <Tabs
              defaultValue="discussions"
              className="w-full"
              onValueChange={handleTabChange}
            >
              <TabsList className="grid w-full grid-cols-5 bg-gray-50 border-gray-200">
                <TabsTrigger
                  value="discussions"
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
                >
                  Discussions
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
                >
                  Events
                </TabsTrigger>
                <TabsTrigger
                  value="gallery"
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
                >
                  Gallery
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
                >
                  Members
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
                >
                  About
                </TabsTrigger>
              </TabsList>

              {/* Discussions Tab */}
              <TabsContent value="discussions" className="space-y-8 mt-8">
                {/* New Post */}
                {isJoined && (
                  <SlideTransition
                    show={activeTab === "discussions"}
                    direction="up"
                  >
                    <Card className="border-gray-100">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Avatar>
                            <AvatarImage src="/placeholder.svg?height=40&width=40" />
                            <AvatarFallback>You</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-4">
                            <Textarea
                              placeholder="Share something with the community..."
                              value={newPost}
                              onChange={(e) => setNewPost(e.target.value)}
                              className="min-h-[100px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 resize-none form-field"
                            />
                            <div className="flex justify-between items-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                              >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Add Image
                              </Button>
                              <ButtonPulse
                                disabled={!newPost.trim() || isSubmitting}
                                onClick={handleSubmitPost}
                                pulseColor="rgba(124, 58, 237, 0.3)"
                              >
                                <Button
                                  disabled={!newPost.trim() || isSubmitting}
                                  className="bg-violet-700 hover:bg-violet-800 text-white"
                                >
                                  {isSubmitting ? (
                                    <>
                                      <Spinner
                                        size="sm"
                                        className="mr-2 border-white"
                                      />{" "}
                                      Posting...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-2" /> Post
                                    </>
                                  )}
                                </Button>
                              </ButtonPulse>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </SlideTransition>
                )}

                {/* Discussion Posts */}
                <div className="space-y-6">
                  {discussions.map((post, index) => (
                    <InViewTransition
                      key={post.id}
                      effect="fade"
                      delay={index * 100}
                    >
                      <Card className="hover:shadow-md transition-shadow duration-300 border-gray-100 hover:border-violet-200">
                        <CardContent className="p-8">
                          <div className="flex gap-4">
                            <Avatar>
                              <AvatarImage
                                src={post.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>{post.author[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="font-medium text-gray-900">
                                  {post.author}
                                </span>
                                <span className="text-gray-500 text-sm">
                                  {post.timestamp}
                                </span>
                              </div>
                              <h3 className="font-medium text-lg mb-3 text-gray-900">
                                {post.title}
                              </h3>
                              <p className="text-gray-700 mb-6 leading-relaxed">
                                {post.content}
                              </p>

                              <div className="flex flex-wrap gap-2 mb-6">
                                {post.tags.map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs border-gray-200 text-gray-600"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex items-center gap-8 text-sm text-gray-500">
                                <ButtonPulse className="flex items-center gap-2 hover:text-violet-700 transition-colors duration-200">
                                  <button className="flex items-center gap-2">
                                    <ThumbsUp className="h-4 w-4" />
                                    {post.likes}
                                  </button>
                                </ButtonPulse>
                                <button className="flex items-center gap-2 hover:text-violet-700 transition-colors duration-200">
                                  <Reply className="h-4 w-4" />
                                  {post.replies} replies
                                </button>
                                <button className="flex items-center gap-2 hover:text-violet-700 transition-colors duration-200">
                                  <Share2 className="h-4 w-4" />
                                  Share
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </InViewTransition>
                  ))}
                </div>
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="space-y-8 mt-8">
                <SlideTransition show={activeTab === "events"} direction="up">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-light text-gray-900">
                      Upcoming Events
                    </h3>
                    {isJoined && (
                      <ButtonPulse pulseColor="rgba(124, 58, 237, 0.3)">
                        <Button className="bg-violet-700 hover:bg-violet-800 text-white">
                          <Calendar className="h-4 w-4 mr-2" />
                          Create Event
                        </Button>
                      </ButtonPulse>
                    )}
                  </div>
                </SlideTransition>

                {/* Events Map */}
                <SlideTransition
                  show={activeTab === "events"}
                  direction="up"
                  delay={100}
                >
                  <Card className="border-gray-100 overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-violet-600" />
                        Event Locations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <InteractiveMap
                        communities={eventCommunities}
                        height="300px"
                        showControls={true}
                        showFilters={false}
                      />
                    </CardContent>
                  </Card>
                </SlideTransition>

                <div className="grid gap-8">
                  {upcomingEvents.map((event, index) => (
                    <InViewTransition
                      key={event.id}
                      effect="slide-up"
                      delay={index * 100}
                    >
                      <Card className="hover:shadow-md transition-shadow duration-300 border-gray-100 hover:border-violet-200">
                        <CardContent className="p-8">
                          <div className="flex gap-8">
                            <HoverScale scale={1.05}>
                              <Image
                                src={event.image || "/placeholder.svg"}
                                alt={event.title}
                                width={150}
                                height={100}
                                className="rounded-xl object-cover"
                              />
                            </HoverScale>
                            <div className="flex-1">
                              <h4 className="text-xl font-medium mb-3 text-gray-900">
                                {event.title}
                              </h4>
                              <div className="space-y-2 text-gray-600 mb-6">
                                <div className="flex items-center gap-3">
                                  <AnimatedIcon
                                    icon={<Calendar className="h-4 w-4" />}
                                    animationType="pulse"
                                  />
                                  {event.date} at {event.time}
                                </div>
                                <HoverScale>
                                  <button
                                    onClick={() => setShowLocationMap(true)}
                                    className="flex items-center gap-3 hover:text-violet-600 transition-colors duration-200"
                                  >
                                    <MapPin className="h-4 w-4" />
                                    {event.location.address}
                                  </button>
                                </HoverScale>
                                <div className="flex items-center gap-3">
                                  <Users className="h-4 w-4" />
                                  {event.attendees}/{event.maxAttendees}{" "}
                                  attending
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <ButtonPulse pulseColor="rgba(124, 58, 237, 0.3)">
                                  <Button className="bg-violet-700 hover:bg-violet-800 text-white">
                                    {isJoined ? "RSVP" : "Join to RSVP"}
                                  </Button>
                                </ButtonPulse>
                                <Button
                                  variant="outline"
                                  className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                                >
                                  <Navigation className="h-4 w-4 mr-2" />
                                  Directions
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </InViewTransition>
                  ))}
                </div>
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery" className="space-y-8 mt-8">
                <SlideTransition show={activeTab === "gallery"} direction="up">
                  <CommunityGallery
                    communityId={community.id}
                    isAdmin={true}
                    isMember={isJoined}
                  />
                </SlideTransition>
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-8 mt-8">
                <SlideTransition show={activeTab === "members"} direction="up">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-light text-gray-900">
                      Members ({community.members.toLocaleString()})
                    </h3>
                    <div className="form-field w-64">
                      <Input
                        placeholder="Search members..."
                        className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                      />
                    </div>
                  </div>
                </SlideTransition>

                <div className="grid gap-6">
                  {members.map((member, index) => (
                    <InViewTransition
                      key={index}
                      effect="slide-up"
                      delay={index * 100}
                    >
                      <Card className="border-gray-100 hover:border-violet-200 transition-colors duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage
                                  src={member.avatar || "/placeholder.svg"}
                                />
                                <AvatarFallback>
                                  {member.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {member.name}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                  {member.role}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  Joined {member.joinDate}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <HoverScale>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                                  onClick={() =>
                                    handleStartDirectMessage(
                                      member.name,
                                      member.name
                                    )
                                  }
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Message
                                </Button>
                              </HoverScale>
                              <HoverScale>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                                >
                                  View Profile
                                </Button>
                              </HoverScale>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </InViewTransition>
                  ))}
                </div>
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-8 mt-8">
                <SlideTransition show={activeTab === "about"} direction="up">
                  <Card className="border-gray-100">
                    <CardHeader>
                      <CardTitle className="text-xl font-medium text-gray-900">
                        About This Community
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <p className="text-gray-700 leading-relaxed">
                        {community.description}
                      </p>

                      <div className="grid grid-cols-2 gap-8 py-6">
                        <div>
                          <span className="text-sm text-gray-500">Founded</span>
                          <p className="font-medium text-gray-900">
                            {community.founded}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Growth</span>
                          <p className="font-medium text-violet-700">
                            {community.memberGrowth} this month
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-gray-200" />

                      <div>
                        <h4 className="font-medium mb-4 text-gray-900 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-violet-600" />
                          Location
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-gray-800 mb-2">
                            {community.location.address}
                          </p>
                          <HoverScale>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowLocationMap(true)}
                              className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                              View on Map
                            </Button>
                          </HoverScale>
                        </div>
                      </div>

                      <Separator className="bg-gray-200" />

                      <div>
                        <h4 className="font-medium mb-4 text-gray-900">
                          Community Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {community.tags.map((tag, index) => (
                            <HoverScale key={index}>
                              <Badge
                                variant="outline"
                                className="border-gray-200 text-gray-600"
                              >
                                {tag}
                              </Badge>
                            </HoverScale>
                          ))}
                        </div>
                      </div>

                      <Separator className="bg-gray-200" />

                      <div>
                        <h4 className="font-medium mb-4 text-gray-900">
                          Community Rules
                        </h4>
                        <ul className="space-y-3">
                          {community.rules.map((rule, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="text-violet-700 font-medium">
                                {index + 1}.
                              </span>
                              <span className="text-gray-700">{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </SlideTransition>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Community Stats */}
            <InViewTransition effect="slide-left">
              <Card className="border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">
                    Community Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Members</span>
                    <span className="font-medium text-gray-900">
                      {community.members.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Growth Rate</span>
                    <span className="font-medium text-violet-700">
                      {community.memberGrowth}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upcoming Events</span>
                    <span className="font-medium text-gray-900">
                      {community.upcomingEvents}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Founded</span>
                    <span className="font-medium text-gray-900">
                      {community.founded}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </InViewTransition>

            {/* Quick Actions */}
            <InViewTransition effect="slide-left" delay={50}>
              <Card className="border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <HoverScale>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Discussion
                    </Button>
                  </HoverScale>
                  <HoverScale>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                      onClick={handleToggleChat}
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      {isChatOpen ? "Hide Chat" : "Open Chat"}
                    </Button>
                  </HoverScale>
                  <HoverScale>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </HoverScale>
                  <HoverScale>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Invite Friends
                    </Button>
                  </HoverScale>
                </CardContent>
              </Card>
            </InViewTransition>

            {/* Moderators */}
            <InViewTransition effect="slide-left" delay={100}>
              <Card className="border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">
                    Moderators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {community.moderators.map((mod, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={mod.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{mod.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {mod.name}
                        </p>
                        <p className="text-violet-700 text-xs">{mod.role}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </InViewTransition>
          </div>
        </div>
      </div>

      {/* Floating Chat */}
      <FloatingChat
        communityId={community.id}
        communityName={community.name}
        isOpen={isChatOpen}
        isMinimized={isChatMinimized}
        onToggle={handleToggleChat}
        onMinimize={handleMinimizeChat}
        onClose={handleCloseChat}
        onStartDirectMessage={handleStartDirectMessage}
      />
    </div>
  );
}
