"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { format } from "date-fns"
import {
    AlertTriangle, ArrowLeft, CheckCircle, ChevronRight, Clock, Loader2,
    Star, UserPlus, XCircle
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

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
  status: "pending" | "approved" | "rejected"
  message?: string
  userBio?: string
  joinReason?: string
  points_count?: number  // Count of positive points
  report_count?: number    // Count of reports (separate from points)
  reports?: UserReport[]   // Actual report details
}

export default function CommunityAdminRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [communityId, setCommunityId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setCommunityId(resolvedParams.id)
      loadJoinRequests(resolvedParams.id)
    }
    loadParams()
  }, [params])

  const loadJoinRequests = async (communityId: string) => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseBrowser()
      
      // Fetch only pending join requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("community_members")
        .select(`
          id,
          user_id,
          joined_at,
          status
        `)
        .eq("community_id", communityId)
        .eq("status", "pending")
        .order("joined_at", { ascending: false })

      if (requestsError) {
        console.error("Error fetching join requests:", requestsError)
        toast.error("Failed to load join requests")
        setRequests([])
        return
      }

      if (!requestsData || requestsData.length === 0) {
        setRequests([])
        return
      }

      // Fetch user data for each request
      const userIds = requestsData.map((r: any) => r.user_id)
      
      if (userIds.length === 0) {
        setRequests([])
        return
      }
      
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, full_name, avatar_url, email")
        .in("id", userIds)

      if (usersError) {
        console.error("Error fetching users:", {
          error: usersError,
          message: usersError.message,
          details: usersError.details,
          hint: usersError.hint,
          code: usersError.code
        })
        toast.error(`Failed to load user data: ${usersError.message || 'Unknown error'}`)
        // Continue with requests even if user data fails - use fallback
      }

      // Fetch user points for each user
      const { data: userPointsData } = await supabase
        .from("user_points")
        .select("user_id, point_type")
        .in("user_id", userIds)

      // Count points and reports per user (keep separate - don't combine)
      const userStatsMap: Record<string, { points_count: number; report_count: number }> = {}
      if (userPointsData) {
        userPointsData.forEach((record: any) => {
          if (!userStatsMap[record.user_id]) {
            userStatsMap[record.user_id] = { points_count: 0, report_count: 0 }
          }
          if (record.point_type === 'report_received') {
            // Count reports separately
            userStatsMap[record.user_id].report_count += 1
          } else {
            // Count positive points
            userStatsMap[record.user_id].points_count += 1
          }
        })
      }

      // Fetch actual reports for each user (where they were reported as a member)
      const { data: reportsData } = await supabase
        .from("reports")
        .select("id, reason, details, status, created_at, reporter_id, target_id")
        .eq("report_type", "member")
        .in("target_id", userIds)
        .order("created_at", { ascending: false })

      // Group reports by user_id (target_id)
      const reportsByUser: Record<string, UserReport[]> = {}
      if (reportsData) {
        reportsData.forEach((report: any) => {
          if (!reportsByUser[report.target_id]) {
            reportsByUser[report.target_id] = []
          }
          reportsByUser[report.target_id].push({
            id: report.id,
            reason: report.reason,
            details: report.details,
            status: report.status,
            created_at: report.created_at,
            reporter_id: report.reporter_id
          })
        })
      }

      // Map requests to JoinRequest format
      const joinRequests: JoinRequest[] = requestsData.map((request: any) => {
        const user = usersData?.find((u: any) => u.id === request.user_id)
        const stats = userStatsMap[request.user_id] || { points_count: 0, report_count: 0 }
        
        return {
          id: request.id,
          userId: request.user_id,
          userName: user?.full_name || user?.username || "Unknown User",
          userEmail: user?.email || "",
          userAvatar: user?.avatar_url || "/placeholder-user.jpg",
          requestedAt: request.joined_at,
          status: request.status as "pending" | "approved" | "rejected",
          points_count: stats.points_count,
          report_count: stats.report_count,
          reports: reportsByUser[request.user_id] || []
        }
      })

      setRequests(joinRequests)
    } catch (error) {
      console.error("Error loading join requests:", error)
      toast.error("Failed to load join requests")
      setRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  // Pagination
  const totalPages = Math.ceil(requests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRequests = requests.slice(startIndex, endIndex)

  const handleApproveAll = async () => {
    if (!communityId) return

    try {
      const supabase = getSupabaseBrowser()
      
      // Update all pending requests to approved
      const { error } = await supabase
        .from("community_members")
        .update({ status: "approved" })
        .eq("community_id", communityId)
        .eq("status", "pending")

      if (error) {
        console.error("Error approving all requests:", error)
        toast.error("Failed to approve all requests")
        return
      }

      toast.success("All requests approved")
      await loadJoinRequests(communityId)
    } catch (error) {
      console.error("Error approving all requests:", error)
      toast.error("Failed to approve all requests")
    }
  }

  const handleRejectAll = async () => {
    if (!communityId) return

    try {
      const supabase = getSupabaseBrowser()
      
      // Delete all pending requests
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("status", "pending")

      if (error) {
        console.error("Error rejecting all requests:", error)
        toast.error("Failed to reject all requests")
        return
      }

      toast.success("All requests rejected")
      await loadJoinRequests(communityId)
    } catch (error) {
      console.error("Error rejecting all requests:", error)
      toast.error("Failed to reject all requests")
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!communityId) return

    try {
      const response = await fetch(`/api/communities/members/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ community_id: communityId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to approve request")
      }

      toast.success("Request approved successfully")
      await loadJoinRequests(communityId)
    } catch (error: any) {
      console.error("Approve API error:", error)
      toast.error(error.message || "Failed to approve request")
    }
  }

  const handleReject = async (requestId: string) => {
    if (!communityId) return

    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("id", requestId)
        .eq("community_id", communityId)

      if (error) {
        console.error("Error rejecting request:", error)
        toast.error("Failed to reject request")
        return
      }

      toast.success("Request rejected")
      await loadJoinRequests(communityId)
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast.error("Failed to reject request")
    }
  }

  const pendingCount = requests.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-4">
          <Link href={communityId ? `/communities/${communityId}/admin` : "/communities/admin"}>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <UserPlus className="w-8 h-8 text-purple-600" />
                Join Requests
              </h1>
              <p className="text-gray-600 mt-2">
                Manage community join requests and member approvals
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-end">
          {/* Bulk Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleApproveAll}
              disabled={pendingCount === 0}
              className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200 hover:text-green-800 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve All
            </Button>
            <Button
              onClick={handleRejectAll}
              disabled={pendingCount === 0}
              className="bg-red-100 text-red-700 border-red-300 hover:bg-red-200 hover:text-red-800 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject All
            </Button>
          </div>
        </div>

        {/* Requests List */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Requests ({requests.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading join requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-500">
                  {requests.length === 0 
                    ? "You don't have any pending join requests" 
                    : "Try adjusting your date filter criteria"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-lg border bg-white border-purple-200 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      {/* Left Side - User Info */}
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={request.userAvatar} alt={request.userName} />
                          <AvatarFallback className="text-sm">
                            {request.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {request.userName}
                          </h4>
                          <p className="text-sm text-gray-600">{request.userEmail}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {format(new Date(request.requestedAt), "MMM dd, yyyy 'at' h:mm a")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-green-500 fill-green-500" />
                              <span className="text-xs font-medium text-green-600">{request.points_count || 0} {(request.points_count || 0) === 1 ? 'point' : 'points'}</span>
                            </div>
                              <div className="flex items-center gap-1">
                              <AlertTriangle className={`w-3 h-3 ${(request.report_count ?? 0) > 0 ? 'text-red-500' : 'text-gray-300'}`} />
                              <span className={`text-xs font-medium ${(request.report_count ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{request.report_count || 0} {(request.report_count || 0) === 1 ? 'report' : 'reports'}</span>
                              </div>
                          </div>
                          {/* Show reports if user has been reported */}
                          {request.reports && request.reports.length > 0 && (
                            <div className="mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentExpanded = (document.getElementById(`reports-${request.id}`) as HTMLElement)?.style.display
                                  const element = document.getElementById(`reports-${request.id}`)
                                  if (element) {
                                    element.style.display = currentExpanded === 'none' ? 'block' : 'none'
                                  }
                                }}
                                className="w-full justify-between border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>View {request.reports.length} Previous {request.reports.length === 1 ? 'Report' : 'Reports'}</span>
                                </div>
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                              <div id={`reports-${request.id}`} style={{ display: 'none' }} className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {request.reports.map((report) => (
                                    <div key={report.id} className="text-sm bg-white p-3 rounded border border-red-100">
                                      <div className="font-medium text-red-800 mb-1">{report.reason}</div>
                                      {report.details && (
                                        <div className="text-gray-600 mb-2 text-xs">{report.details}</div>
                                      )}
                                      <div className="text-xs text-gray-500">
                                        {format(new Date(report.created_at), "MMM dd, yyyy")}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side - Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200 hover:text-green-800"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReject(request.id)}
                          className="bg-red-100 text-red-700 border-red-300 hover:bg-red-200 hover:text-red-800"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {!isLoading && requests.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              Previous
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Page {currentPage} of {totalPages}</span>
              <span>•</span>
              <span>{requests.length} {requests.length === 1 ? 'request' : 'requests'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
