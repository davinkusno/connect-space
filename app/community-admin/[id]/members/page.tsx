"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Users, 
  Search, 
  UserMinus,
  Mail,
  Calendar,
  ArrowLeft,
  UserPlus,
  Shield
} from "lucide-react"
import { PageTransition } from "@/components/ui/page-transition"
import { FloatingElements } from "@/components/ui/floating-elements"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { toast as sonnerToast } from "sonner"

interface Member {
  id: string
  user_id: string
  role: "admin" | "member"
  joined_at: string
  user: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    email: string
  }
}

interface Community {
  id: string
  name: string
  profilePicture: string
}

export default function CommunityMembersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [members, setMembers] = useState<Member[]>([])
  const [community, setCommunity] = useState<Community | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("joined_at")
  const [sortOrder, setSortOrder] = useState<string>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [communityId, setCommunityId] = useState<string | null>(null)
  const { toast } = useToast()

  const pageSize = 10

  // Mock data
  const mockCommunity: Community = {
    id: "1",
    name: "Tech Innovators NYC",
    profilePicture: "/placeholder.svg?height=200&width=300"
  }

  // Only 3 dummy members
  const mockMembers: Member[] = [
    {
      id: "dummy-1",
      user_id: "user1",
      role: "admin",
      joined_at: "2023-01-15T10:00:00Z",
      user: {
        id: "user1",
        username: "admin_user",
        full_name: "John Admin",
        avatar_url: "/placeholder-user.jpg",
        email: "john.admin@email.com"
      }
    },
    {
      id: "dummy-2",
      user_id: "user2",
      role: "member",
      joined_at: "2023-02-20T14:30:00Z",
      user: {
        id: "user2",
        username: "moderator_sarah",
        full_name: "Sarah Johnson",
        avatar_url: "/placeholder-user.jpg",
        email: "sarah.johnson@email.com"
      }
    },
    {
      id: "dummy-3",
      user_id: "user3",
      role: "member",
      joined_at: "2023-03-10T09:15:00Z",
      user: {
        id: "user3",
        username: "mike_dev",
        full_name: "Michael Chen",
        avatar_url: "/placeholder-user.jpg",
        email: "michael.chen@email.com"
      }
    }
  ]

  // Load community and members data
  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setCommunityId(resolvedParams.id)
      loadCommunityAndMembers(resolvedParams.id)
    }
    loadParams()
  }, [params])

  const loadCommunityAndMembers = async (id: string) => {
    try {
      const supabase = getSupabaseBrowser()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not found")
        return
      }

      // Get community by ID
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("id, name, logo_url, creator_id")
        .eq("id", id)
        .single()

      if (communityError || !communityData) {
        console.error("Community not found:", communityError)
        return
      }

      // Verify user is admin or creator
      const isCreator = communityData.creator_id === user.id
      const { data: membership } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle()

      if (!isCreator && !membership) {
        console.error("User is not admin or creator")
        return
      }

      // Set community
      setCommunity({
        id: communityData.id,
        name: communityData.name || "Community",
        profilePicture: communityData.logo_url || "/placeholder.svg?height=200&width=300"
      })

      // Load members from database
      await loadMembers(communityData.id)
    } catch (error) {
      console.error("Error loading community:", error)
    }
  }

  const loadMembers = async (communityId: string) => {
    try {
      const supabase = getSupabaseBrowser()
      
      // Fetch all members from database (without status in select to avoid errors)
      const { data: allMembersData, error: membersError } = await supabase
        .from("community_members")
        .select(`
          id,
          user_id,
          role,
          joined_at
        `)
        .eq("community_id", communityId)
        .order("joined_at", { ascending: false })

      if (membersError) {
        console.error("Error fetching members:", membersError)
        // Use dummy data on error
        setMembers(mockMembers)
        setTotalCount(mockMembers.length)
        setTotalPages(Math.ceil(mockMembers.length / pageSize))
        return
      }

      if (!allMembersData || allMembersData.length === 0) {
        // Combine with dummy data if no real members
        const allMembers = [...mockMembers]
        setMembers(allMembers)
        setTotalCount(allMembers.length)
        setTotalPages(Math.ceil(allMembers.length / pageSize))
        return
      }

      // Fetch status for each member separately
      const memberIds = allMembersData.map((m: any) => m.id)
      const { data: statusData, error: statusError } = await supabase
        .from("community_members")
        .select("id, status")
        .in("id", memberIds)

      // If status column doesn't exist, treat all as approved
      if (statusError) {
        console.warn("Status column may not exist, treating all members as approved:", statusError)
      }

      // Combine status with member data
      const membersWithStatus = allMembersData.map((member: any) => {
        const statusInfo = statusData?.find((s: any) => s.id === member.id)
        const memberStatus = statusInfo?.status ?? null
        return {
          ...member,
          status: memberStatus
        }
      })

      // Filter for approved members (status = true or null)
      const membersData = membersWithStatus.filter((member: any) => {
        // If status is null/undefined, treat as approved
        if (member.status === null || member.status === undefined) {
          return true
        }
        // If status is true, it's approved
        if (member.status === true || member.status === "true") {
          return true
        }
        // If status is false, it's pending (not approved yet)
        return false
      })

      if (membersData.length === 0) {
        // No approved members, but still show dummy data
        const allMembers = [...mockMembers]
        setMembers(allMembers)
        setTotalCount(allMembers.length)
        setTotalPages(Math.ceil(allMembers.length / pageSize))
        return
      }

      // Fetch user data for each member
      const userIds = membersData.map((m: any) => m.user_id)
      if (userIds.length === 0) {
        const allMembers = [...mockMembers]
        setMembers(allMembers)
        setTotalCount(allMembers.length)
        setTotalPages(Math.ceil(allMembers.length / pageSize))
        return
      }

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, full_name, avatar_url, email")
        .in("id", userIds)

      if (usersError) {
        console.error("Error fetching user data:", usersError)
      }

      // Map database members to Member interface
      const mappedMembers: Member[] = membersData.map((member: any) => {
        const user = usersData?.find((u: any) => u.id === member.user_id)
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role as "admin" | "member",
          joined_at: member.joined_at,
          user: {
            id: user?.id || member.user_id,
            username: user?.username || null,
            full_name: user?.full_name || null,
            avatar_url: user?.avatar_url || null,
            email: user?.email || ""
          }
        }
      })

      // Combine with dummy data (only 3 dummy members)
      const allMembers = [...mappedMembers, ...mockMembers]
      setMembers(allMembers)
      setTotalCount(allMembers.length)
      setTotalPages(Math.ceil(allMembers.length / pageSize))
    } catch (error) {
      console.error("Error loading members:", error)
      // Use dummy data on error
      setMembers(mockMembers)
      setTotalCount(mockMembers.length)
      setTotalPages(Math.ceil(mockMembers.length / pageSize))
    }
  }

  const handleAppointAsAdmin = async (memberId: string, memberName: string) => {
    try {
      // Don't update dummy members
      if (memberId.startsWith("dummy-")) {
        sonnerToast.error("Cannot update dummy members")
        return
      }

      const response = await fetch(`/api/communities/members/${memberId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "admin" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to appoint as admin")
      }

      // Update local state
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, role: "admin" as const }
          : member
      ))

      sonnerToast.success(`${memberName} has been appointed as admin`)
    } catch (error: any) {
      console.error("Failed to appoint as admin:", error)
      sonnerToast.error(error.message || "Failed to appoint member as admin")
    }
  }

  const handleKickMember = async (memberId: string, memberName: string) => {
    try {
      // Don't delete dummy members
      if (memberId.startsWith("dummy-")) {
        sonnerToast.error("Cannot remove dummy members")
        return
      }

      if (!community) {
        sonnerToast.error("Community not found")
        return
      }

      const supabase = getSupabaseBrowser()
      
      // Delete from community_members table with community_id filter for security
      const { error: deleteError } = await supabase
        .from("community_members")
        .delete()
        .eq("id", memberId)
        .eq("community_id", community.id)

      if (deleteError) {
        console.error("Error removing member:", deleteError)
        sonnerToast.error("Failed to remove member from community")
        return
      }

      // Remove from UI
      setMembers(prev => prev.filter(member => member.id !== memberId))
      setTotalCount(prev => prev - 1)
      
      sonnerToast.success(`${memberName} has been removed from the community`)
    } catch (error) {
      console.error("Failed to kick member:", error)
      sonnerToast.error("Failed to remove member from community")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Filter and sort members
  let filteredMembers = members

  if (searchTerm) {
    filteredMembers = filteredMembers.filter(member => 
      member.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Apply sorting - First by role (admin first), then by selected sort criteria
  filteredMembers.sort((a, b) => {
    // First, sort by role: admin comes first
    if (a.role === "admin" && b.role !== "admin") {
      return -1
    }
    if (a.role !== "admin" && b.role === "admin") {
      return 1
    }
    
    // If both have the same role (both admin or both member), sort by selected criteria
    let aValue: any, bValue: any
    
    if (sortBy === "joined_at") {
      aValue = new Date(a.joined_at).getTime()
      bValue = new Date(b.joined_at).getTime()
    } else if (sortBy === "name") {
      aValue = a.user.full_name || a.user.username || ""
      bValue = b.user.full_name || b.user.username || ""
    } else {
      // Default to joined_at if sortBy is invalid
      aValue = new Date(a.joined_at).getTime()
      bValue = new Date(b.joined_at).getTime()
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Apply pagination
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex)

  return (
    <PageTransition>
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen relative">
        <FloatingElements />
        <div className="max-w-7xl mx-auto p-8 relative z-10">
          {/* Back Button */}
          <div className="mb-4">
            <Link href={communityId ? `/community-admin/${communityId}` : "/community-admin"}>
              <Button variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Community Members</h1>
            </div>
            <p className="text-gray-600">
              Manage and view all members of your community. Total: {totalCount} members
            </p>
          </div>

          {/* Filters */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search members by name, username, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joined_at">Join Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order */}
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <div className="space-y-4">
            {paginatedMembers.map((member) => (
              <Card key={member.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={member.user.avatar_url || "/placeholder-user.jpg"} 
                          alt={member.user.full_name || member.user.username || "Member"}
                        />
                        <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                          {(member.user.full_name || member.user.username || "M").charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {member.user.full_name || member.user.username || "Unknown User"}
                          </h3>
                          {member.role === "admin" && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{member.user.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {formatDate(member.joined_at)}</span>
                          </div>
                        </div>

                        {member.user.username && (
                          <div className="text-sm text-gray-500 mt-1">
                            @{member.user.username}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {member.role !== "admin" && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Appoint as Admin
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Appoint as Admin</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to appoint{" "}
                                  <span className="font-semibold">
                                    {member.user.full_name || member.user.username || "this member"}
                                  </span>{" "}
                                  as an admin? They will have administrative privileges for this community.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleAppointAsAdmin(member.id, member.user.full_name || member.user.username || "Member")}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Appoint as Admin
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                              >
                                <UserMinus className="w-4 h-4 mr-2" />
                                Kick
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{" "}
                                  <span className="font-semibold">
                                    {member.user.full_name || member.user.username || "this member"}
                                  </span>{" "}
                                  from the community? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleKickMember(member.id, member.user.full_name || member.user.username || "Member")}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove Member
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page 
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" 
                        : "border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                      }
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
              >
                Next
              </Button>
            </div>
          )}

          {/* Empty State */}
          {paginatedMembers.length === 0 && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Members Found</h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? "No members match your current search criteria. Try adjusting your search terms."
                    : "This community doesn't have any members yet."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  )
}



