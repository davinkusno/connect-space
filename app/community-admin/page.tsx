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
  Calendar,
  Sparkles,
  Loader2,
  Save,
  X
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"
import { FloatingElements } from "@/components/ui/floating-elements"
import { toast } from "sonner"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Textarea } from "@/components/ui/textarea"

// Component to fetch and display event count
function EventCount({ communityId }: { communityId?: string }) {
  const [eventCount, setEventCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEventCount = async () => {
      if (!communityId) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = getSupabaseBrowser()
        const { count, error } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("community_id", communityId)

        if (error) {
          console.error("Error fetching event count:", error)
          setEventCount(0)
        } else {
          setEventCount(count || 0)
        }
      } catch (error) {
        console.error("Error loading event count:", error)
        setEventCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    loadEventCount()
  }, [communityId])

  if (isLoading) {
    return <span>Loading...</span>
  }

  return <span>{eventCount} total events</span>
}

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
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState("")
  const [isSavingDescription, setIsSavingDescription] = useState(false)

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
    try {
      const supabase = getSupabaseBrowser()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not found")
        // Use dummy data if no user
        await loadDummyData()
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

      // If we have real community data, use it directly
      if (communityData) {
        // Parse location from database
        let locationData = {
          city: "",
          country: "",
          address: ""
        }
        
        if (communityData.location) {
          try {
            let parsed: any = null
            
            if (typeof communityData.location === 'string') {
              // Try to parse as JSON first
              try {
                parsed = JSON.parse(communityData.location)
          } catch (e) {
                // If not JSON, use as plain string address
                locationData.address = communityData.location
                parsed = null
              }
            } else {
              parsed = communityData.location
            }
            
            // If parsed successfully and is an object
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              locationData = {
                city: parsed.city || parsed.City || "",
                country: parsed.country || parsed.Country || "",
                address: parsed.address || parsed.Address || parsed.full_address || ""
              }
            }
          } catch (e) {
            console.error("Error parsing location:", e)
            // If location is a plain string, use it as address
            if (typeof communityData.location === 'string') {
              locationData.address = communityData.location
            }
          }
        }

        // Get member count
        const { count: memberCount } = await supabase
          .from("community_members")
          .select("*", { count: "exact", head: true })
          .eq("community_id", communityData.id)
        
        // Get admin email from community_members
        // First, get admin user_id from community_members
        let adminEmail = ""
        const { data: adminMember } = await supabase
          .from("community_members")
          .select("user_id")
          .eq("community_id", communityData.id)
          .eq("role", "admin")
          .limit(1)
          .maybeSingle()
        
        // Then, get email from users table
        if (adminMember && adminMember.user_id) {
          const { data: userData } = await supabase
            .from("users")
            .select("email")
            .eq("id", adminMember.user_id)
            .maybeSingle()
          
          if (userData && userData.email) {
            adminEmail = userData.email
          }
        }
        
        // Parse category - can be JSON array (interests) or single string
        let categoryValue = "General"
        let tagsValue: string[] = []
        
        if (communityData.category) {
          try {
            // Try to parse as JSON array (if interests were saved as JSON)
            const parsed = JSON.parse(communityData.category)
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Category is JSON array of interests
              categoryValue = parsed[0] // Use first as primary category
              tagsValue = parsed // All interests as tags
            } else {
              // Single category value
              categoryValue = communityData.category
              tagsValue = [communityData.category]
            }
          } catch (e) {
            // Not JSON, treat as single category string
            categoryValue = communityData.category
            tagsValue = [communityData.category]
          }
        }
        
        // Also check if there's a separate tags field (for backward compatibility)
        if (communityData.tags) {
          if (Array.isArray(communityData.tags)) {
            tagsValue = communityData.tags
          } else if (typeof communityData.tags === 'string') {
            try {
              tagsValue = JSON.parse(communityData.tags)
            } catch (e) {
              tagsValue = [communityData.tags]
            }
          }
        }
        
        // Build community object with actual data from database
        const actualCommunity: Community = {
          id: communityData.id,
          name: communityData.name || "Community",
          email: adminEmail, // Use admin email from community_members
          description: communityData.description || "",
          profilePicture: communityData.logo_url || (communityData as any).profile_picture || "/placeholder.svg?height=200&width=300",
          location: locationData, // Use actual location from database
          memberCount: memberCount || 0,
          category: categoryValue, // Primary category (first interest)
          tags: tagsValue, // All interests as tags (can be multiple)
          createdAt: communityData.created_at ? new Date(communityData.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          isVerified: (communityData as any).is_verified || false,
          privacy: (communityData.is_private ? "private" : "public") as "public" | "private" | "invite-only"
      }
      
        await loadDummyData(actualCommunity)
      } else {
        // No community found, use dummy data
        await loadDummyData()
      }
    } catch (error) {
      console.error("Failed to load community data:", error)
      // On error, still load dummy data
      await loadDummyData()
    } finally {
      setIsLoading(false)
    }
  }

  const loadDummyData = async (communityOverride?: Community) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    const mockCommunity: Community = communityOverride || {
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

    setCommunity(mockCommunity)
    setDiscussionTopics(mockDiscussions)
    setRecentJoinRequests(mockJoinRequests)
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

  const handleEditDescription = () => {
    setEditedDescription(community?.description || "")
    setIsEditingDescription(true)
  }

  const handleCancelEdit = () => {
    setIsEditingDescription(false)
    setEditedDescription("")
  }

  const handleSaveDescription = async () => {
    if (!community?.id) {
      toast.error("Community not found")
      return
    }

    if (!editedDescription.trim()) {
      toast.error("Description cannot be empty")
      return
    }

    if (editedDescription.length < 10) {
      toast.error("Description must be at least 10 characters")
      return
    }

    if (editedDescription.length > 1000) {
      toast.error("Description must be less than 1000 characters")
      return
    }

    setIsSavingDescription(true)
    try {
      const response = await fetch(`/api/communities/${community.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editedDescription.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || "Failed to save description"
        toast.error(errorMessage)
        return
      }

      setCommunity((prev) => prev ? { ...prev, description: editedDescription.trim() } : null)
      setIsEditingDescription(false)
      toast.success("Description updated successfully!")
    } catch (error: any) {
      console.error("Failed to save description:", error)
      toast.error("Failed to save description. Please try again.")
    } finally {
      setIsSavingDescription(false)
    }
  }

  const generateDescription = async () => {
    if (!community?.name || !community?.tags || community.tags.length < 3) {
      toast.error("Please ensure community has a name and at least 3 tags")
      return
    }

    setIsGeneratingDescription(true)
    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "community-description",
          params: {
            name: community.name,
            category: community.category,
            tags: community.tags.slice(0, 3).join(", "),
            locationType: "physical",
            location: `${community.location.city}, ${community.location.country}`,
          },
        }),
      })

      const data = await response.json()

      // Check if response has error
      if (!response.ok) {
        const errorMessage = data.error || "Failed to generate description"
        toast.error(errorMessage)
        return
      }

      // Validate response has description
      if (data && data.description && typeof data.description === 'string') {
        const generatedDescription = data.description
        if (isEditingDescription) {
          // If in edit mode, update the edited description
          setEditedDescription(generatedDescription)
        } else {
          // If not in edit mode, update community directly
          setCommunity((prev) => prev ? { ...prev, description: generatedDescription } : null)
        }
        toast.success("Description generated successfully!")
      } else {
        // If no description in response, use fallback
        const fallbackDescription = `${community.name} is a ${community.category} community focused on ${community.tags.slice(0, 3).join(", ")}. Join us to connect with like-minded individuals, share knowledge, and participate in activities related to our community interests.`
        if (isEditingDescription) {
          setEditedDescription(fallbackDescription)
        } else {
          setCommunity((prev) => prev ? { ...prev, description: fallbackDescription } : null)
        }
        toast.success("Description generated (using fallback)")
      }
    } catch (error: any) {
      console.error("Failed to generate description:", error)
      
      // Provide fallback description even on error
      const fallbackDescription = `${community?.name} is a ${community?.category} community focused on ${community?.tags.slice(0, 3).join(", ") || "various topics"}. Join us to connect with like-minded individuals, share knowledge, and participate in activities related to our community interests.`
      if (isEditingDescription) {
        setEditedDescription(fallbackDescription)
      } else {
        setCommunity((prev) => prev ? { ...prev, description: fallbackDescription } : null)
      }
      toast.warning("Using fallback description. AI generation encountered an issue.")
    } finally {
      setIsGeneratingDescription(false)
    }
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
                      {community?.id && (
                        <Link 
                          href={`/community/${community.id}`}
                          className="text-xs text-purple-600 hover:text-purple-700 hover:underline transition-colors"
                        >
                          view detail
                        </Link>
                      )}
                    </div>

                    {/* Member Count (left under name) */}
                    <div className="self-start text-left flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">{community?.memberCount.toLocaleString()} members</span>
                    </div>

                    {/* Community Email */}
                    {community?.email && (
                    <div className="self-start text-left flex items-center space-x-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                        <span className="text-sm font-medium">{community.email}</span>
                    </div>
                    )}

                    {/* Location */}
                    {(community?.location.city || community?.location.country || community?.location.address) && (
                    <div className="self-start text-left flex items-center space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <div className="text-sm text-left">
                          {(community.location.city || community.location.country) && (
                            <div className="font-medium">
                              {[community.location.city, community.location.country].filter(Boolean).join(", ") || "Location not set"}
                      </div>
                          )}
                          {community.location.address && (
                            <div className="text-xs text-gray-500">{community.location.address}</div>
                          )}
                    </div>
                      </div>
                    )}

                    

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
                    <Link href="/community-admin/requests" className="block">
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
                      {!isEditingDescription ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                            onClick={handleEditDescription}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            onClick={handleCancelEdit}
                            disabled={isSavingDescription}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:from-green-600 hover:to-emerald-600"
                            onClick={handleSaveDescription}
                            disabled={isSavingDescription}
                          >
                            {isSavingDescription ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingDescription ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        placeholder="Enter community description..."
                        className="min-h-[150px] text-base leading-relaxed resize-none"
                        disabled={isSavingDescription}
                      />
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>Character count: {editedDescription.length}</span>
                          <span className={editedDescription.length < 10 || editedDescription.length > 1000 ? "text-red-500" : ""}>
                            {editedDescription.length < 10 
                              ? "Minimum 10 characters required" 
                              : editedDescription.length > 1000 
                              ? "Maximum 1000 characters" 
                              : `${1000 - editedDescription.length} characters remaining`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Events Card */}
                    <Link href="/community-admin/events">
                      <div className="group rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5 hover:shadow-md transition-all cursor-pointer">
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
                        <EventCount communityId={community?.id} />
                        <ChevronRight className="w-4 h-4 text-purple-600" />
                      </div>
                      </div>
                    </Link>


                    {/* Members Card */}
                    <Link href="/community-admin/members">
                      <div className="group rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5 hover:shadow-md transition-all cursor-pointer">
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
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Announcements */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📢</span>
                    </div>
                    <span>Announcements</span>
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
