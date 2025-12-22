"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FloatingElements } from "@/components/ui/floating-elements"
import { PageTransition } from "@/components/ui/page-transition"
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import {
    AlertTriangle, Calendar, ChevronRight, Clock, Edit, FileText,
    LayoutGrid, Loader2, Mail, Save, ShieldAlert, Star, UserPlus, Users, X
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getReportReasonLabel } from "@/lib/utils/report-utils"

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

interface UserReport {
  id: string
  reason: string
  details: string | null
  status: "pending" | "reviewing" | "resolved" | "dismissed"
  created_at: string
  reporter_id: string
}

interface JoinRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  userAvatar: string
  requestedAt: string
  status: "pending" | "approved" | "rejected"  // String status values
  message?: string
  points_count?: number  // Count of positive points
  report_count?: number    // Count of reports (separate from points)
  reports?: UserReport[]   // Actual report details
}

export default function CommunityAdminPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [community, setCommunity] = useState<Community | null>(null)
  const [recentJoinRequests, setRecentJoinRequests] = useState<JoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState("")
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [communityId, setCommunityId] = useState<string | null>(null)
  
  // Reports dialog state
  const [selectedUserReports, setSelectedUserReports] = useState<{
    userName: string
    reports: UserReport[]
  } | null>(null)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setCommunityId(resolvedParams.id)
      loadCommunityData(resolvedParams.id)
    }
    loadParams()
  }, [params])

  const loadCommunityData = async (id: string) => {
    try {
      const supabase = getSupabaseBrowser()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not found")
        toast.error("Please login to access this page")
        setIsLoading(false)
        return
      }

      // Get community by ID from params
      let { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("*")
        .eq("id", id)
        .single()

      // Verify user has permission (creator or admin)
      if (communityData) {
        const isCreator = communityData.creator_id === user.id
        
        // Check if user is admin in community_members
        const { data: memberData } = await supabase
          .from("community_members")
          .select("role")
          .eq("community_id", id)
          .eq("user_id", user.id)
          .eq("status", "approved")
          .single()
        
        const isAdmin = memberData?.role === "admin"

        if (!isCreator && !isAdmin) {
          toast.error("Only community creators and admins can access this page")
          setIsLoading(false)
          return
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
                // If not JSON, use as plain string city name
                locationData.city = communityData.location
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

        // Get member count - only approved members
        const { data: allMembers, error: membersError } = await supabase
          .from("community_members")
          .select("status")
          .eq("community_id", communityData.id)
          .eq("status", "approved")
        
        const memberCount = allMembers?.length || 0
        
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
          privacy: "public" as "public" | "private" | "invite-only"
      }
      
        setCommunity(actualCommunity)
        
        // Load real join requests from database
        await loadJoinRequests(actualCommunity.id)
      } else {
        // No community found
        toast.error("Community not found")
      }
    } catch (error) {
      console.error("Failed to load community data:", error)
      toast.error("Failed to load community data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadJoinRequests = async (communityId: string) => {
    try {
      const supabase = getSupabaseBrowser()
      
      if (!supabase) {
        console.error("Supabase client not initialized")
        setRecentJoinRequests([])
        return
      }
      
      // Fetch all members from community_members table for this community
      // First, fetch without status to avoid cache issues
      const { data: joinRequestsData, error: joinRequestsError } = await supabase
        .from("community_members")
        .select(`
          id,
          user_id,
          joined_at
        `)
        .eq("community_id", communityId)
        .order("joined_at", { ascending: false })

      if (joinRequestsError) {
        console.error("Error fetching join requests:", joinRequestsError)
        setRecentJoinRequests([])
        return
      }

      if (!joinRequestsData || joinRequestsData.length === 0) {
        setRecentJoinRequests([])
        return
      }

      // Fetch status separately for each member to avoid cache issues
      const memberIds = joinRequestsData.map((r: any) => r.id)
      const { data: statusData, error: statusError } = await supabase
        .from("community_members")
        .select("id, status")
        .in("id", memberIds)

      // Combine status with member data
      const membersWithStatus = joinRequestsData.map((member: any) => {
        const statusInfo = statusData?.find((s: any) => s.id === member.id)
        const memberStatus = statusInfo?.status ?? null
        return {
          ...member,
          status: memberStatus
        }
      })

      // Filter for pending requests only (status = 'pending')
      const pendingRequests = membersWithStatus.filter((req: any) => {
        return req.status === "pending"
      })
      
      if (pendingRequests.length === 0) {
        setRecentJoinRequests([])
        return
      }

      // Fetch user data for each join request
      const userIds = pendingRequests.map((r: any) => r.user_id)
      if (userIds.length === 0) {
        setRecentJoinRequests([])
        return
      }

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, full_name, avatar_url, email")
        .in("id", userIds)

      if (usersError) {
        console.error("Error fetching user data for join requests:", usersError)
        setRecentJoinRequests([])
        return
      }

      // Fetch user points for each user (only for positive activity points)
      const { data: userPointsData } = await supabase
        .from("user_points")
        .select("user_id, point_type")
        .in("user_id", userIds)
        .neq("point_type", "report_received") // Only count positive activities

      // Count points per user
      const userStatsMap: Record<string, { points_count: number }> = {}
      if (userPointsData) {
        userPointsData.forEach((record: any) => {
          if (!userStatsMap[record.user_id]) {
            userStatsMap[record.user_id] = { points_count: 0 }
          }
          userStatsMap[record.user_id].points_count += 1
        })
      }

      // Fetch actual reports for each user
      // Include: direct member reports + thread reports + reply reports
      
      // 1. Direct member reports
      const { data: memberReportsData } = await supabase
        .from("reports")
        .select("id, reason, details, status, created_at, reporter_id, target_id, report_type")
        .eq("report_type", "member")
        .in("target_id", userIds)
        .order("created_at", { ascending: false })

      // 2. Get all threads created by these users
      const { data: userThreadsData } = await supabase
        .from("messages")
        .select("id, sender_id")
        .in("sender_id", userIds)
        .is("parent_id", null) // Only threads
      
      let threadReportsData: any[] = []
      if (userThreadsData && userThreadsData.length > 0) {
        const threadIds = userThreadsData.map(t => t.id)
        const { data } = await supabase
          .from("reports")
          .select("id, reason, details, status, created_at, reporter_id, target_id, report_type")
          .eq("report_type", "thread")
          .in("target_id", threadIds)
          .order("created_at", { ascending: false })
        threadReportsData = data || []
      }
      
      // 3. Get all replies created by these users
      const { data: userRepliesData } = await supabase
        .from("messages")
        .select("id, sender_id")
        .in("sender_id", userIds)
        .not("parent_id", "is", null) // Only replies
      
      let replyReportsData: any[] = []
      if (userRepliesData && userRepliesData.length > 0) {
        const replyIds = userRepliesData.map(r => r.id)
        const { data } = await supabase
          .from("reports")
          .select("id, reason, details, status, created_at, reporter_id, target_id, report_type")
          .eq("report_type", "reply")
          .in("target_id", replyIds)
          .order("created_at", { ascending: false })
        replyReportsData = data || []
      }
      
      // Create mapping of thread/reply IDs to sender IDs
      const threadSenderMap = new Map(userThreadsData?.map(t => [t.id, t.sender_id]) || [])
      const replySenderMap = new Map(userRepliesData?.map(r => [r.id, r.sender_id]) || [])

      // Group all reports by user_id
      const reportsByUser: Record<string, UserReport[]> = {}
      
      // Add member reports
      memberReportsData?.forEach((report: any) => {
        const userId = report.target_id
        if (!reportsByUser[userId]) {
          reportsByUser[userId] = []
        }
        reportsByUser[userId].push({
          id: report.id,
          reason: report.reason,
          details: report.details,
          status: report.status,
          created_at: report.created_at,
          reporter_id: report.reporter_id
        })
      })
      
      // Add thread reports (map to sender)
      threadReportsData.forEach((report: any) => {
        const userId = threadSenderMap.get(report.target_id)
        if (userId) {
          if (!reportsByUser[userId]) {
            reportsByUser[userId] = []
          }
          reportsByUser[userId].push({
            id: report.id,
            reason: report.reason,
            details: report.details,
            status: report.status,
            created_at: report.created_at,
            reporter_id: report.reporter_id
          })
        }
      })
      
      // Add reply reports (map to sender)
      replyReportsData.forEach((report: any) => {
        const userId = replySenderMap.get(report.target_id)
        if (userId) {
          if (!reportsByUser[userId]) {
            reportsByUser[userId] = []
          }
          reportsByUser[userId].push({
            id: report.id,
            reason: report.reason,
            details: report.details,
            status: report.status,
            created_at: report.created_at,
            reporter_id: report.reporter_id
          })
        }
      })

      // Map to JoinRequest format
      const joinRequestsWithUsers: (JoinRequest | null)[] = pendingRequests.map((request: any) => {
        const userData = usersData?.find((u: any) => u.id === request.user_id)
        
        if (!userData) {
          return null
        }

        const stats = userStatsMap[request.user_id] || { points_count: 0 }
        const userReports = reportsByUser[request.user_id] || []
        
        return {
          id: request.id,
          userId: request.user_id,
          userName: userData.full_name || userData.username || "Unknown",
          userEmail: userData.email || "",
          userAvatar: userData.avatar_url || "/placeholder-user.jpg",
          requestedAt: request.joined_at,
          status: "pending",  // String: 'pending'
          message: undefined,
          points_count: stats.points_count,
          report_count: userReports.length, // Use actual reports count from reports table
          reports: userReports
        } as JoinRequest
      })

      // Filter out null values
      const validRequests = joinRequestsWithUsers.filter((req): req is JoinRequest => req !== null)
      setRecentJoinRequests(validRequests)
    } catch (error) {
      console.error("Error loading join requests:", error)
      setRecentJoinRequests([])
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

  const handleApprove = async (requestId: string) => {
    try {
      if (!community) {
        toast.error("Community not found")
        return
      }

      const request = recentJoinRequests.find(r => r.id === requestId)
      
      if (!request) {
        toast.error("Request not found")
        return
      }

      // Use API route to handle approve (server-side handles case-sensitive column better)
      let result
      try {
        console.log("Sending approve request:", { requestId, communityId: community.id })
        const response = await fetch(`/api/communities/members/${requestId}/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            community_id: community.id
          })
        })

        console.log("Response received:", { 
          ok: response.ok, 
          status: response.status, 
          statusText: response.statusText 
        })

        // Get response text first to see what we're dealing with
        const responseText = await response.text()
        console.log("Response text:", responseText)

        // Try to parse as JSON
        try {
          result = JSON.parse(responseText)
          console.log("Parsed result:", result)
        } catch (parseError) {
          console.error("Failed to parse JSON:", parseError)
          toast.error(`Failed to approve request: ${response.statusText || `HTTP ${response.status}`}`)
          return
        }

        // Check if response is ok
        if (!response.ok) {
          console.error("Approve API error - Full response:", {
            status: response.status,
            statusText: response.statusText,
            result: result,
            responseText: responseText
          })
          const errorMessage = result?.error || result?.details || result?.message || `Failed to approve request (${response.status})`
          toast.error(errorMessage)
          return
        }

        console.log("Approve successful:", result)
      } catch (fetchError: any) {
        console.error("Approve API error - Fetch failed:", {
          message: fetchError.message,
          name: fetchError.name,
          stack: fetchError.stack,
          error: fetchError
        })
        toast.error(`Failed to approve request: ${fetchError.message || "Network error"}`)
        return
      }

      // Immediately remove from join requests list (optimistic update)
      setRecentJoinRequests((prev) => {
        const filtered = prev.filter((req) => req.id !== requestId)
        return filtered
      })
      
      // Reload join requests to ensure UI is in sync with database
      await loadJoinRequests(community.id)

      // Reload community data to get updated member count from database
      // This ensures memberCount only counts approved members (status = 'approved')
      const supabase = getSupabaseBrowser()
      const { data: allMembers } = await supabase
        .from("community_members")
        .select("status")
        .eq("community_id", community.id)
        .eq("status", "approved")
      
      // Update member count in state (only counts approved members)
      setCommunity((prev) => prev ? { ...prev, memberCount: allMembers?.length || 0 } : null)
      
      toast.success("Request approved successfully")
    } catch (error: any) {
      console.error("Error approving request:", error)
      toast.error(`Failed to approve request: ${error.message || "Unknown error"}`)
      // Reload join requests on error to ensure UI is correct
      if (community) {
        await loadJoinRequests(community.id)
      }
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      if (!community) {
        toast.error("Community not found")
        return
      }

      const supabase = getSupabaseBrowser()
      
      // Delete the member record (reject = remove from community_members)
      // Only delete from the current community's members for security
      const { error: deleteError } = await supabase
        .from("community_members")
        .delete()
        .eq("id", requestId)
        .eq("community_id", community.id)

      if (deleteError) {
        console.error("Error rejecting request:", deleteError)
        toast.error("Failed to reject request")
        return
      }

      // Note: We do NOT update memberCount here because:
      // 1. Rejected requests (status = 'pending') are NOT counted in memberCount
      // 2. Only approved members (status = 'approved') are counted
      // 3. Deleting a pending request does not affect the member count

      // Remove from UI
      setRecentJoinRequests((prev) => prev.filter((req) => req.id !== requestId))
      
      // Reload join requests to ensure UI is in sync
      if (community) {
        await loadJoinRequests(community.id)
      }
      
      toast.success("Request rejected")
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast.error("Failed to reject request")
    }
  }

  const handleApproveAll = async () => {
    try {
      if (!community) {
        toast.error("Community not found")
        return
      }

      const supabase = getSupabaseBrowser()
      const pendingRequests = recentJoinRequests.filter(r => r.status === "pending")  // String: 'pending'
      
      if (pendingRequests.length === 0) return

      // Use API endpoint for bulk approve to ensure proper handling
      const requestIds = pendingRequests.map(r => r.id)
      
      try {
        const response = await fetch("/api/communities/members/bulk-approve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            community_id: community.id,
            member_ids: requestIds,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to approve all requests")
        }

        toast.success(result.message || "All requests approved")
      } catch (error: any) {
        console.error("Error approving all requests:", error)
        toast.error(error.message || "Failed to approve all requests")
        return
      }

      // Reload community data to get updated member count from database
      if (community) {
        const { data: allMembers } = await supabase
          .from("community_members")
          .select("status")
          .eq("community_id", community.id)
          .eq("status", "approved")  // String: 'approved'
        
        // Update member count in state (only counts approved members)
        setCommunity((prev) => prev ? { ...prev, memberCount: allMembers?.length || 0 } : null)
      }

      // Remove all approved requests from UI
      setRecentJoinRequests((prev) => prev.filter((req) => !pendingRequests.some(pr => pr.id === req.id)))
      
      // Reload join requests to ensure UI is in sync
      if (community) {
        await loadJoinRequests(community.id)
      }
      
      toast.success(`Approved ${pendingRequests.length} requests`)
    } catch (error) {
      console.error("Error approving all requests:", error)
      toast.error("Failed to approve all requests")
    }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
        <FloatingElements />
        <div className="max-w-7xl mx-auto p-8 relative z-10">
          {/* Back Button */}
          <div className="mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300">
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                Back to Home
              </Button>
            </Link>
          </div>
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
                          href={`/communities/${community.id}`}
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


                    

                    {/* Edit Profile & Location Button */}
                    {communityId && (
                      <Link href={`/communities/${communityId}/admin/edit`} className="w-full">
                        <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile & Location
                        </Button>
                      </Link>
                    )}
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
                    <span>{recentJoinRequests.filter(r => r.status === "pending").length} pending</span>
                    <span></span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col">
                  <div className="space-y-4 flex-1">
                    {recentJoinRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No join requests available</p>
                      </div>
                    ) : (
                      <>
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
                                {/* All requests in this list are pending, no need for status badge */}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{request.userEmail}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-green-500 fill-green-500" />
                                  <span className="text-xs font-medium text-green-600">{request.points_count || 0} {(request.points_count || 0) === 1 ? 'point' : 'points'}</span>
                                </div>
                                  <div className="flex items-center gap-1">
                                  <AlertTriangle className={`w-3 h-3 ${(request.report_count ?? 0) > 0 ? 'text-red-500' : 'text-gray-300'}`} />
                                  <span className={`text-xs font-medium ${(request.report_count ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{request.report_count || 0} {(request.report_count || 0) === 1 ? 'report' : 'reports'}</span>
                                  </div>
                              </div>
                              {request.message && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{request.message}</p>
                              )}
                              {/* Show reports badge if user has been reported */}
                              {request.reports && request.reports.length > 0 && (
                                <div className="mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUserReports({
                                        userName: request.userName,
                                        reports: request.reports || []
                                      })
                                    }}
                                    className="text-xs border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    <AlertTriangle className="w-3 h-3 mr-1.5" />
                                    <span>View {request.reports.length} {request.reports.length === 1 ? 'Report' : 'Reports'}</span>
                                  </Button>
                                </div>
                              )}
                              <div className="mt-3 flex items-center gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                                  onClick={() => handleApprove(request.id)}
                                  disabled={request.status !== "pending"}  // String: 'pending'
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                                  onClick={() => handleReject(request.id)}
                                  disabled={request.status !== "pending"}  // String: 'pending'
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  
                  {/* See More Link */}
                  {communityId && (
                    <div className="mt-3">
                      <Link href={`/communities/${communityId}/admin/requests`} className="block">
                        <Button variant="ghost" className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                          See All Requests
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Community Tags */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {community?.tags.slice(0, 5).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {(!community?.tags || community.tags.length === 0) && (
                      <p className="text-sm text-gray-500">No tags added yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Community Description */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <span>Description</span>
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

              {/* Quick Actions */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <LayoutGrid className="w-5 h-5 text-purple-600" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Events Card */}
                    {communityId && (
                      <Link href={`/communities/${communityId}/admin/events`}>
                        <div className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900">Events</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">Manage and track your community events</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500"><EventCount communityId={community?.id} /></span>
                            <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                        </div>
                      </Link>
                    )}

                    {/* Members Card */}
                    {communityId && (
                      <Link href={`/communities/${communityId}/admin/members`}>
                        <div className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                              </div>
                              <h4 className="font-semibold text-gray-900">Members</h4>
                            </div>
                          <p className="text-sm text-gray-600 mb-3">View and manage community members</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{community?.memberCount.toLocaleString()} members</span>
                            <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    )}

                    {communityId && (
                      <Link href={`/communities/${communityId}/admin/reports`}>
                        <div className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-red-300 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                              <ShieldAlert className="w-5 h-5 text-red-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900">Reports</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">Review and manage all reports</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">View all reports</span>
                            <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reports Dialog */}
      <Dialog open={!!selectedUserReports} onOpenChange={() => setSelectedUserReports(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Reports for {selectedUserReports?.userName}
            </DialogTitle>
            <DialogDescription>
              {selectedUserReports?.reports.length} {selectedUserReports?.reports.length === 1 ? 'report' : 'reports'} submitted by community members
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {selectedUserReports?.reports.map((report, index) => (
              <Card key={report.id} className="border-red-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 mb-2">
                        Report #{index + 1}
                      </Badge>
                      <h4 className="font-semibold text-red-900">
                        {getReportReasonLabel(report.reason)}
                      </h4>
                    </div>
                    <Badge 
                      variant={
                        report.status === 'resolved' ? 'default' :
                        report.status === 'reviewing' ? 'secondary' :
                        report.status === 'dismissed' ? 'outline' :
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {report.status}
                    </Badge>
                  </div>
                  
                  {report.details && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                        {report.details}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>Reported on {new Date(report.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
