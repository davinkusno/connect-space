"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  ArrowLeft
} from "lucide-react"
import { PageTransition } from "@/components/ui/page-transition"
import { FloatingElements } from "@/components/ui/floating-elements"
import { CommunityAdminNav } from "@/components/navigation/community-admin-nav"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

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

export default function CommunityMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [community, setCommunity] = useState<Community | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("joined_at")
  const [sortOrder, setSortOrder] = useState<string>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const { toast } = useToast()

  const pageSize = 10

  // Mock data
  const mockCommunity: Community = {
    id: "1",
    name: "Tech Innovators NYC",
    profilePicture: "/placeholder.svg?height=200&width=300"
  }

  const mockMembers: Member[] = [
    {
      id: "1",
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
      id: "2",
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
      id: "3",
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
    },
    {
      id: "4",
      user_id: "user4",
      role: "member",
      joined_at: "2023-04-05T16:45:00Z",
      user: {
        id: "user4",
        username: "emily_tech",
        full_name: "Emily Rodriguez",
        avatar_url: "/placeholder-user.jpg",
        email: "emily.rodriguez@email.com"
      }
    },
    {
      id: "5",
      user_id: "user5",
      role: "member",
      joined_at: "2023-05-12T11:20:00Z",
      user: {
        id: "user5",
        username: "david_pm",
        full_name: "David Kim",
        avatar_url: "/placeholder-user.jpg",
        email: "david.kim@email.com"
      }
    },
    {
      id: "6",
      user_id: "user6",
      role: "member",
      joined_at: "2023-06-18T13:10:00Z",
      user: {
        id: "user6",
        username: "lisa_design",
        full_name: "Lisa Wang",
        avatar_url: "/placeholder-user.jpg",
        email: "lisa.wang@email.com"
      }
    },
    {
      id: "7",
      user_id: "user7",
      role: "member",
      joined_at: "2023-07-22T08:30:00Z",
      user: {
        id: "user7",
        username: "alex_engineer",
        full_name: "Alex Thompson",
        avatar_url: "/placeholder-user.jpg",
        email: "alex.thompson@email.com"
      }
    },
    {
      id: "8",
      user_id: "user8",
      role: "member",
      joined_at: "2023-08-15T15:45:00Z",
      user: {
        id: "user8",
        username: "maria_dev",
        full_name: "Maria Garcia",
        avatar_url: "/placeholder-user.jpg",
        email: "maria.garcia@email.com"
      }
    }
  ]

  // Initialize data
  useEffect(() => {
    setCommunity(mockCommunity)
    setMembers(mockMembers)
    setTotalCount(mockMembers.length)
    setTotalPages(Math.ceil(mockMembers.length / pageSize))
  }, [])

  const handleKickMember = async (memberId: string, memberName: string) => {
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setMembers(prev => prev.filter(member => member.id !== memberId))
      setTotalCount(prev => prev - 1)
      
      toast({
        title: "Member Removed",
        description: `${memberName} has been removed from the community`,
      })
    } catch (error) {
      console.error("Failed to kick member:", error)
      toast({
        title: "Error",
        description: "Failed to remove member from community",
        variant: "destructive"
      })
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
  let filteredMembers = mockMembers

  if (searchTerm) {
    filteredMembers = filteredMembers.filter(member => 
      member.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Apply sorting
  filteredMembers.sort((a, b) => {
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
        <CommunityAdminNav 
          communityProfilePicture={community?.profilePicture}
          communityName={community?.name}
        />
        <FloatingElements />
        <div className="max-w-7xl mx-auto p-8 relative z-10">
          {/* Back Button */}
          <div className="mb-4">
            <Link href="/community-admin">
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
                        <div className="mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {member.user.full_name || member.user.username || "Unknown User"}
                          </h3>
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
