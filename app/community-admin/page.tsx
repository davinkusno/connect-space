"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MapPin, 
  Mail, 
  Edit, 
  Users, 
  Clock, 
  ChevronRight,
  MoreHorizontal,
  UserPlus,
  Calendar
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"
import { FloatingElements } from "@/components/ui/floating-elements"
import { CommunityAdminNav } from "@/components/navigation/community-admin-nav"

interface Community {
  id: string
  name: string
  email: string
  description: string
  profilePicture: string
  location: {
    city: string
    country: string
    address: string
  }
  memberCount: number
  category: string
  tags: string[]
  createdAt: string
  isVerified: boolean
  privacy: "public" | "private" | "invite-only"
}

interface JoinRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  userAvatar: string
  requestedAt: string
  status: "pending" | "approved" | "rejected"
  message?: string
}

export default function CommunityAdminPage() {
  const [community, setCommunity] = useState<Community | null>(null)
  const [recentJoinRequests, setRecentJoinRequests] = useState<JoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [discussionPage, setDiscussionPage] = useState(1)

  interface DiscussionTopic {
    id: string
    title: string
    author: string
    authorAvatar: string
    createdAt: string
    replies: number
    likes: number
    excerpt: string
    tags: string[]
  }

  const [discussionTopics, setDiscussionTopics] = useState<DiscussionTopic[]>([])

  useEffect(() => {
    loadCommunityData()
  }, [])

  const loadCommunityData = async () => {
    setIsLoading(true)
    try {
      // Mock data for now - replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      const mockCommunity: Community = {
        id: "1",
        name: "Tech Innovators NYC",
        email: "techinnovators.nyc@gmail.com",
        description: "Building the future through technology and innovation in New York City. Join us for cutting-edge discussions, networking events, and collaborative projects.",
        profilePicture: "/placeholder.svg?height=200&width=300",
        location: {
          city: "New York",
          country: "USA",
          address: "123 Tech Street, Manhattan, NY"
        },
        memberCount: 1247,
        category: "Technology",
        tags: ["Tech", "Innovation", "Startups", "AI", "Web3"],
        createdAt: "2023-01-15",
        isVerified: true,
        privacy: "public"
      }

      const mockJoinRequests: JoinRequest[] = [
        {
          id: "1",
          userId: "user1",
          userName: "Sarah Johnson",
          userEmail: "sarah.johnson@email.com",
          userAvatar: "/placeholder-user.jpg",
          requestedAt: "2024-01-16T10:30:00Z",
          status: "pending",
          message: "I'm a software engineer with 5 years of experience in AI and machine learning. Excited to join this community!"
        },
        {
          id: "2",
          userId: "user2",
          userName: "Michael Chen",
          userEmail: "michael.chen@email.com",
          userAvatar: "/placeholder-user.jpg",
          requestedAt: "2024-01-16T09:15:00Z",
          status: "pending",
          message: "Looking forward to connecting with fellow tech enthusiasts and contributing to innovative projects."
        },
        {
          id: "3",
          userId: "user3",
          userName: "Emily Rodriguez",
          userEmail: "emily.rodriguez@email.com",
          userAvatar: "/placeholder-user.jpg",
          requestedAt: "2024-01-15T16:45:00Z",
          status: "pending"
        },
        {
          id: "4",
          userId: "user4",
          userName: "David Kim",
          userEmail: "david.kim@email.com",
          userAvatar: "/placeholder-user.jpg",
          requestedAt: "2024-01-15T14:20:00Z",
          status: "pending",
          message: "Product manager passionate about emerging technologies. Would love to be part of this community."
        },
        {
          id: "5",
          userId: "user5",
          userName: "Lisa Wang",
          userEmail: "lisa.wang@email.com",
          userAvatar: "/placeholder-user.jpg",
          requestedAt: "2024-01-15T11:10:00Z",
          status: "pending"
        }
      ]

      setCommunity(mockCommunity)

      const mockDiscussions: DiscussionTopic[] = [
        {
          id: "d1",
          title: "How to get started with AI projects in 2024?",
          author: "Sarah Johnson",
          authorAvatar: "/placeholder-user.jpg",
          createdAt: "2024-01-12T08:00:00Z",
          replies: 24,
          likes: 76,
          excerpt: "Let's collect resources and roadmap for beginners who want to jump into AI...",
          tags: ["AI", "Beginner", "Roadmap"],
        },
        {
          id: "d2",
          title: "Weekly project showcase - Share your progress!",
          author: "Michael Chen",
          authorAvatar: "/placeholder-user.jpg",
          createdAt: "2024-01-14T10:15:00Z",
          replies: 18,
          likes: 54,
          excerpt: "Post your demos, screenshots, and lessons learned this week so we can give feedback...",
          tags: ["Showcase", "Projects", "Feedback"],
        },
        {
          id: "d3",
          title: "Recommended meetups in NYC for ML enthusiasts",
          author: "Emily Rodriguez",
          authorAvatar: "/placeholder-user.jpg",
          createdAt: "2024-01-10T14:25:00Z",
          replies: 12,
          likes: 33,
          excerpt: "Looking for recurring meetups with solid talks and hands-on sessions...",
          tags: ["Meetup", "NYC", "ML"],
        },
        {
          id: "d4",
          title: "Hiring: Part-time mentor for startup MVP build",
          author: "David Kim",
          authorAvatar: "/placeholder-user.jpg",
          createdAt: "2024-01-09T09:05:00Z",
          replies: 7,
          likes: 21,
          excerpt: "We're bootstrapping and need a mentor for architecture and best practices...",
          tags: ["Hiring", "Mentorship", "MVP"],
        },
      ]

      setDiscussionTopics(mockDiscussions)
      setRecentJoinRequests(mockJoinRequests)
    } catch (error) {
      console.error("Failed to load community data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleApprove = (requestId: string) => {
    setRecentJoinRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: "approved" } : req)),
    )
  }

  const handleReject = (requestId: string) => {
    setRecentJoinRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: "rejected" } : req)),
    )
  }

  const handleApproveAll = () => {
    setRecentJoinRequests((prev) => prev.map((req) => ({ ...req, status: "approved" })))
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Sidebar Loading */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                      <div className="w-48 h-4 bg-gray-200 rounded"></div>
                      <div className="w-32 h-3 bg-gray-200 rounded"></div>
                      <div className="w-40 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="w-32 h-4 bg-gray-200 rounded"></div>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="w-24 h-3 bg-gray-200 rounded"></div>
                            <div className="w-32 h-2 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen relative">
        <CommunityAdminNav 
          communityProfilePicture={community?.profilePicture}
          communityName={community?.name}
        />
        <FloatingElements />
        <div className="max-w-7xl mx-auto p-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6 flex flex-col">
              {/* Community Profile Section */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Profile Picture */}
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                        <AvatarImage 
                          src={community?.profilePicture} 
                          alt={community?.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                          {community?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {community?.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Community Name */}
                    <div className="space-y-2">
                      <h1 className="text-2xl font-bold text-gray-900">{community?.name}</h1>
                    </div>

                    {/* Member Count (left under name) */}
                    <div className="self-start text-left flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">{community?.memberCount.toLocaleString()} members</span>
                    </div>

                    {/* Community Email */}
                    <div className="self-start text-left flex items-center space-x-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">{community?.email}</span>
                    </div>

                    {/* Location */}
                    <div className="self-start text-left flex items-center space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <div className="text-sm text-left">
                        <div className="font-medium">{community?.location.city}, {community?.location.country}</div>
                        <div className="text-xs text-gray-500">{community?.location.address}</div>
                      </div>
                    </div>

                    

                    {/* Edit Community Button */}
                    <Link href="/community-admin/edit" className="w-full">
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Community
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Join Requests */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg flex-1 flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <UserPlus className="w-5 h-5 text-purple-600" />
                      <span>Recent Join Requests</span>
                    </CardTitle>
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600"
                      onClick={handleApproveAll}
                    >
                      Approve All
                    </Button>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm text-gray-500">
                    <span>{recentJoinRequests.filter(r => r.status === 'pending').length} pending</span>
                    <span></span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {[...recentJoinRequests]
                      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
                      .slice(0, 3)
                      .map((request) => (
                      <div key={request.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={request.userAvatar} alt={request.userName} />
                          <AvatarFallback className="text-sm">
                            {request.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {request.userName}
                            </h4>
                            <div className="flex items-center gap-2">
                              {request.status !== 'pending' && (
                                <Badge className={request.status === 'approved' ? 'bg-green-100 text-green-700 border-none' : 'bg-red-100 text-red-700 border-none'}>
                                  {request.status === 'approved' ? 'Approved' : 'Rejected'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{request.userEmail}</p>
                          {request.message && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{request.message}</p>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                              onClick={() => handleApprove(request.id)}
                              disabled={request.status !== 'pending'}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                              onClick={() => handleReject(request.id)}
                              disabled={request.status !== 'pending'}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* See More Link */}
                    <Link href="/community-admin/join-requests" className="block">
                      <Button variant="ghost" className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                        See All Requests
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              {/* Community Categories */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">🏷️</span>
                    </div>
                    <span>Community Categories</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {community?.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Community Description */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-xl">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">📝</span>
                      </div>
                      <span>Community Description</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600"
                      >
                        <span className="mr-2">✨</span>
                        Generate by AI
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <p className="text-gray-700 leading-relaxed text-base">
                      {community?.description}
                    </p>
                  </div>
                  
                  {/* Description Stats */}
                  <div className="mt-4 flex items-center justify-start text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Character count: {community?.description.length}</span>
                      <span>•</span>
                      <span>Last updated: {formatDate(community?.createdAt || '')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activities */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📊</span>
                    </div>
                    <span>Activities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Events Card */}
                    <div className="group rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                            <span className="text-white text-sm">📅</span>
                          </div>
                          <h4 className="font-semibold text-gray-900">Events</h4>
                        </div>
                        {/* removed status badge per request */}
                      </div>
                      <p className="text-sm text-gray-600">Manage and track your community events</p>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                        <span>{Math.floor(community?.memberCount ? community.memberCount / 100 : 10)} total events</span>
                        <ChevronRight className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>

                    {/* Members Card */}
                    <div className="group rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                            <span className="text-white text-sm">👥</span>
                          </div>
                          <h4 className="font-semibold text-gray-900">Members</h4>
                        </div>
                        {/* removed status badge per request */}
                      </div>
                      <p className="text-sm text-gray-600">View and manage community members</p>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                        <span>{community?.memberCount.toLocaleString()} members</span>
                        <ChevronRight className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>

                    {/* Join Requests Card */}
                    <div className="group rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                            <span className="text-white text-sm">📝</span>
                          </div>
                          <h4 className="font-semibold text-gray-900">Join Requests</h4>
                        </div>
                        {/* removed status badge per request */}
                      </div>
                      <p className="text-sm text-gray-600">Review approvals and rejections history</p>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                        <span>
                          {recentJoinRequests.filter(r => r.status === 'approved').length} approved • {recentJoinRequests.filter(r => r.status === 'rejected').length} rejected
                        </span>
                        <ChevronRight className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Discussion Topics */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">💬</span>
                    </div>
                    <span>Recent Discussion Topics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {discussionTopics
                      .slice((discussionPage - 1) * 2, (discussionPage - 1) * 2 + 2)
                      .map((topic) => (
                        <div key={topic.id} className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5 hover:shadow-md transition-all">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={topic.authorAvatar} alt={topic.author} />
                              <AvatarFallback className="text-sm">
                                {topic.author.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">{topic.title}</h4>
                              <div className="text-xs text-gray-500 mb-2">
                                by <span className="font-medium text-gray-700">{topic.author}</span> • {new Date(topic.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-2">{topic.excerpt}</p>
                              <div className="mt-3 flex items-center justify-end text-xs text-gray-600">
                                {topic.replies} replies • {topic.likes} likes
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-6 flex items-center justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                      onClick={() => setDiscussionPage((p) => Math.max(1, p - 1))}
                      disabled={discussionPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm text-gray-600">
                      Page {discussionPage} of {Math.max(1, Math.ceil(discussionTopics.length / 2))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                      onClick={() => setDiscussionPage((p) => Math.min(Math.ceil(discussionTopics.length / 2) || 1, p + 1))}
                      disabled={discussionPage >= Math.ceil(discussionTopics.length / 2)}
                    >
                      Next
                    </Button>
                  </div>

                  {/* See More Link */}
                  <div className="mt-3">
                    <Link href="/community-admin/discussions">
                      <Button variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                        See More
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
