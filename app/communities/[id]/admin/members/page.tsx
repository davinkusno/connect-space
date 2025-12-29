"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FloatingElements } from "@/components/ui/floating-elements"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/components/ui/page-transition"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import {
    ArrowLeft, AlertTriangle, Calendar, Search, Shield, Star, UserMinus, Users
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast as sonnerToast } from "sonner"

interface Member {
  id: string
  user_id: string
  role: "admin" | "member"
  joined_at: string
  points_count?: number  // Count of positive points
  report_count?: number    // Count of reports (separate from points)
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
  creator_id?: string
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
  const [isCreator, setIsCreator] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { toast } = useToast()

  const pageSize = 10

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

      // Check if user is creator or admin
      const userIsCreator = communityData.creator_id === user.id

      // Check if user is admin (co-admin)
      const { data: membership } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .eq("status", "approved")
        .single()

      const userIsAdmin = membership?.role === "admin"
      
      if (!userIsCreator && !userIsAdmin) {
        console.error("User is not authorized")
        sonnerToast.error("Only community creators and admins can access this page")
        return
      }

      setIsCreator(userIsCreator)
      setIsAdmin(userIsAdmin)
      setCurrentUserId(user.id)

      // Set community
      setCommunity({
        id: communityData.id,
        name: communityData.name || "Community",
        profilePicture: communityData.logo_url || "/placeholder.svg?height=200&width=300",
        creator_id: communityData.creator_id
      })

      // Load members from database
      await loadMembers(communityData.id)
    } catch (error) {
      console.error("Error loading community:", error)
    }
  }

  const loadMembers = async (communityId: string) => {
    try {
      // Use API endpoint that includes comprehensive user stats
      const response = await fetch(`/api/communities/${communityId}/members-stats`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error fetching members:", errorData)
        setMembers([])
        setTotalCount(0)
        setTotalPages(0)
        return
      }

      const data = await response.json()
      
      if (!data.success || !data.members) {
        console.error("Invalid response format:", data)
        setMembers([])
        setTotalCount(0)
        setTotalPages(0)
        return
      }

      const membersData = data.members

      if (membersData.length === 0) {
        setMembers([])
        setTotalCount(0)
        setTotalPages(0)
        return
      }

      // Map API response to Member interface
      const mappedMembers: Member[] = membersData.map((member: any) => {
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role as "admin" | "member",
          joined_at: member.joined_at,
          points_count: member.points_count || 0,
          report_count: member.report_count || 0,
          user: {
            id: member.user?.id || member.user_id,
            username: member.user?.username || null,
            full_name: member.user?.full_name || null,
            avatar_url: member.user?.avatar_url || null,
            email: member.user?.email || ""
          }
        }
      })

      // Set real members data
      setMembers(mappedMembers)
      setTotalCount(mappedMembers.length)
      setTotalPages(Math.ceil(mappedMembers.length / pageSize))
    } catch (error) {
      console.error("Error loading members:", error)
      setMembers([])
      setTotalCount(0)
      setTotalPages(0)
    }
  }

  const handleAppointAsAdmin = async (memberId: string, memberName: string, newRole: "admin" | "member" = "admin") => {
    try {
      const response = await fetch(`/api/communities/members/${memberId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to appoint as admin")
      }

      // Update local state
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, role: newRole as "admin" | "member" }
          : member
      ))

      sonnerToast.success(
        newRole === "admin" 
          ? `${memberName} has been appointed as admin`
          : `${memberName} has been reverted to member`
      )
    } catch (error: any) {
      console.error("Failed to appoint as admin:", error)
      sonnerToast.error(error.message || "Failed to appoint member as admin")
    }
  }

  const handleKickMember = async (memberId: string, memberName: string) => {
    try {
      if (!community) {
        sonnerToast.error("Community not found")
        return
      }

      // Use API endpoint for secure member removal
      const response = await fetch(`/api/communities/members/${memberId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove member")
      }

      // Remove from UI
      setMembers(prev => prev.filter(member => member.id !== memberId))
      setTotalCount(prev => prev - 1)
      
      sonnerToast.success(`${memberName} has been removed from the community`)
    } catch (error: any) {
      console.error("Failed to kick member:", error)
      sonnerToast.error(error.message || "Failed to remove member from community")
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
      (member.user.username || "").toLowerCase().includes(searchTerm.toLowerCase())
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
            <Link href={communityId ? `/communities/${communityId}/admin` : "/communities/admin"}>
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
                      placeholder="Search members by name or username..."
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
          <div className="space-y-2">
            {paginatedMembers.map((member) => (
              <Card key={member.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <Avatar className="w-10 h-10">
                        <AvatarImage 
                          src={member.user.avatar_url || "/placeholder-user.jpg"} 
                          alt={member.user.full_name || member.user.username || "Member"}
                        />
                        <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                          {(member.user.full_name || member.user.username || "M").charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {member.user.full_name || member.user.username || "Unknown User"}
                          </h3>
                          {member.role === "admin" && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none text-xs px-1.5 py-0">
                              <Shield className="w-3 h-3 mr-0.5" />
                              {community?.creator_id === member.user_id ? "Creator" : "Admin"}
                            </Badge>
                          )}
                          {community?.creator_id === member.user_id && member.role !== "admin" && (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none text-xs px-1.5 py-0">
                              <Star className="w-3 h-3 mr-0.5" />
                              Creator
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-green-500" />
                            <span className="font-medium text-green-600">{member.points_count || 0} {(member.points_count || 0) === 1 ? 'point' : 'points'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertTriangle className={`w-3 h-3 ${(member.report_count ?? 0) > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                            <span className={`font-medium ${(member.report_count ?? 0) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                              {member.report_count || 0} {(member.report_count || 0) === 1 ? 'report' : 'reports'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(member.joined_at)}</span>
                          </div>
                          {member.user.username && (
                            <span className="text-gray-400">@{member.user.username}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {/* Appoint as Admin - Creator only */}
                      {isCreator && community?.creator_id !== member.user_id && member.role !== "admin" && (
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
                      )}
                      {/* Kick - Creator OR Admin can kick regular members */}
                      {(isCreator || isAdmin) && community?.creator_id !== member.user_id && member.role !== "admin" && (
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
                      )}
                      {/* Show revert to member option for co-admins (not creator) */}
                      {isCreator && community?.creator_id !== member.user_id && member.role === "admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
                            >
                              <UserMinus className="w-4 h-4 mr-2" />
                              Revert to Member
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revert to Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove admin privileges from{" "}
                                <span className="font-semibold">
                                  {member.user.full_name || member.user.username || "this member"}
                                </span>? They will become a regular member.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleAppointAsAdmin(member.id, member.user.full_name || member.user.username || "Member", "member")}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                Revert to Member
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {/* Show kick option for co-admins (not creator) */}
                      {isCreator && community?.creator_id !== member.user_id && member.role === "admin" && (
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
                              <AlertDialogTitle>Remove Admin</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove{" "}
                                <span className="font-semibold">
                                  {member.user.full_name || member.user.username || "this admin"}
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
                                Remove Admin
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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



