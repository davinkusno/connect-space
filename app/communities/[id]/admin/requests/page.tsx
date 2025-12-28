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
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { format } from "date-fns"
import {
    AlertTriangle, ArrowLeft, CheckCircle, Clock, Loader2,
    Star, UserPlus, XCircle
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getReportReasonLabel } from "@/lib/utils/report-utils"

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
  
  // Reports dialog state
  const [selectedUserReports, setSelectedUserReports] = useState<{
    userName: string
    reports: UserReport[]
  } | null>(null)

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
      
      // Use API endpoint that includes comprehensive user stats
      const response = await fetch(`/api/communities/${communityId}/join-requests`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error fetching join requests:", errorData)
        toast.error(errorData.error?.message || "Failed to load join requests")
        setRequests([])
        return
      }

      const data = await response.json()
      
      if (!data.success || !data.requests) {
        console.error("Invalid response format:", data)
        toast.error("Failed to load join requests")
        setRequests([])
        return
      }

      const requestsData = data.requests
      
      if (requestsData.length === 0) {
        setRequests([])
        return
      }

      // Map API response to JoinRequest format
      const joinRequests: JoinRequest[] = requestsData.map((request: any) => {
        return {
          id: request.id,
          userId: request.user_id,
          userName: request.user?.full_name || request.user?.username || "Unknown User",
          userEmail: request.user?.email || "",
          userAvatar: request.user?.avatar_url || "/placeholder-user.jpg",
          requestedAt: request.joined_at,
          status: request.status as "pending" | "approved" | "rejected",
          points_count: request.points_count || 0,
          report_count: request.report_count || 0,
          reports: request.reports || []
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
      // Get all pending request IDs
      const requestIds = requests.map(r => r.id)
      
      if (requestIds.length === 0) {
        toast.info("No pending requests to approve")
        return
      }

      // Use bulk approve API endpoint
      const response = await fetch("/api/communities/members/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          requestIds,
          communityId 
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error approving all requests:", errorData)
        toast.error(errorData.error?.message || "Failed to approve all requests")
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
      const response = await fetch("/api/communities/members/bulk-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          community_id: communityId,
          member_ids: [] // Empty array means reject all pending
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to reject all requests")
      }

      toast.success("All requests rejected successfully")
      await loadJoinRequests(communityId)
    } catch (error: any) {
      console.error("Reject all API error:", error)
      toast.error(error.message || "Failed to reject all requests")
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
      const response = await fetch(`/api/communities/members/${requestId}/approve?community_id=${communityId}`, {
        method: "DELETE"
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to reject request")
      }

      toast.success("Request rejected successfully")
      await loadJoinRequests(communityId)
    } catch (error: any) {
      console.error("Reject API error:", error)
      toast.error(error.message || "Failed to reject request")
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
                          {/* Show reports badge if user has been reported */}
                          {request.reports && request.reports.length > 0 && (
                            <div className="mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUserReports({
                                    userName: request.userName,
                                    reports: request.reports || []
                                  })
                                }}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                <span>View {request.reports.length} {request.reports.length === 1 ? 'Report' : 'Reports'}</span>
                              </Button>
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
                    <span>Reported on {format(new Date(report.created_at), "MMM dd, yyyy 'at' h:mm a")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
