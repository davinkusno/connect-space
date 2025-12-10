"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
    AlertTriangle, ArrowLeft, Calendar as CalendarIcon, CheckCircle, ChevronDown, Clock, Loader2,
    Star, UserPlus, XCircle
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

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
  activityCount?: number
  reportCount?: number
}

export default function CommunityAdminRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [communityId, setCommunityId] = useState<string | null>(null)

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
      
      // Fetch all join requests (pending, approved, rejected)
      const { data: requestsData, error: requestsError } = await supabase
        .from("community_members")
        .select(`
          id,
          user_id,
          joined_at,
          status
        `)
        .eq("community_id", communityId)
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
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, full_name, avatar_url, email, bio")
        .in("id", userIds)

      if (usersError) {
        console.error("Error fetching users:", usersError)
        toast.error("Failed to load user data")
        setRequests([])
        return
      }

      // Fetch user points for each user
      const { data: userPointsData } = await supabase
        .from("user_points")
        .select("user_id, point_type")
        .in("user_id", userIds)

      // Count activities and reports per user
      const userStatsMap: Record<string, { activities: number; reports: number }> = {}
      if (userPointsData) {
        userPointsData.forEach((record: any) => {
          if (!userStatsMap[record.user_id]) {
            userStatsMap[record.user_id] = { activities: 0, reports: 0 }
          }
          if (record.point_type === 'report_received') {
            userStatsMap[record.user_id].reports += 1
          } else {
            userStatsMap[record.user_id].activities += 1
          }
        })
      }

      // Map requests to JoinRequest format
      const joinRequests: JoinRequest[] = requestsData.map((request: any) => {
        const user = usersData?.find((u: any) => u.id === request.user_id)
        const status = request.status === false ? "pending" : request.status === true ? "approved" : "rejected"
        const stats = userStatsMap[request.user_id] || { activities: 0, reports: 0 }
        
        return {
          id: request.id,
          userId: request.user_id,
          userName: user?.full_name || user?.username || "Unknown User",
          userEmail: user?.email || "",
          userAvatar: user?.avatar_url || "/placeholder-user.jpg",
          requestedAt: request.joined_at,
          status: status as "pending" | "approved" | "rejected",
          userBio: user?.bio || undefined,
          activityCount: stats.activities,
          reportCount: stats.reports
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

  // Filter requests based on date and status
  const filteredRequests = useMemo(() => {
    let filtered = requests

    // Status filter (always filter, no "all" option)
    filtered = filtered.filter(request => request.status === statusFilter)

    // Date filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(request => {
        const requestDate = new Date(request.requestedAt)
        
        if (dateRange.from && dateRange.to) {
          return requestDate >= dateRange.from && requestDate <= dateRange.to
        } else if (dateRange.from) {
          return requestDate >= dateRange.from
        } else if (dateRange.to) {
          return requestDate <= dateRange.to
        }
        return true
      })
    }

    return filtered.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
  }, [requests, dateRange, statusFilter])

  const handleApproveAll = async () => {
    if (!communityId) return

    try {
      const supabase = getSupabaseBrowser()
      
      // Update all pending requests to approved
      const { error } = await supabase
        .from("community_members")
        .update({ status: true })
        .eq("community_id", communityId)
        .eq("status", false)

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
        .eq("status", false)

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

  const getDateFilterText = () => {
    if (dateRange.from && dateRange.to) {
      // Same date = single pick
      if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
        return format(dateRange.from, "MMM dd, yyyy")
      }
      // Different dates = range pick
      return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
    }
    if (dateRange.from) {
      return `From ${format(dateRange.from, "MMM dd")}`
    }
    if (dateRange.to) {
      return `Until ${format(dateRange.to, "MMM dd")}`
    }
    return "Filter Date"
  }

  const clearDateFilter = () => {
    setDateRange({from: undefined, to: undefined})
  }

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Generate years (2020-2030)
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i)

  // Handle month/year change
  const handleMonthChange = (month: string) => {
    setCurrentMonth(parseInt(month))
  }

  const handleYearChange = (year: string) => {
    setCurrentYear(parseInt(year))
  }

  const pendingCount = requests.filter(r => r.status === "pending").length

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

        {/* Filters and Actions */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Left Side - Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {getDateFilterText()}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4">
                  <div className="space-y-4">
                    {/* Custom Month/Year Picker */}
                    <div className="flex justify-center items-center gap-2">
                      <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue>{monthNames[currentMonth]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {monthNames.map((month, index) => (
                            <SelectItem key={month} value={index.toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                        <SelectTrigger className="w-24">
                          <SelectValue>{currentYear}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Calendar */}
                    <div className="relative">
                      <Calendar
                        mode="range"
                        selected={{from: dateRange.from, to: dateRange.to}}
                        onSelect={(range) => {
                          setDateRange(range || {from: undefined, to: undefined})
                          setShowDatePicker(false)
                        }}
                        initialFocus
                        className="rounded-md border-0"
                        month={new Date(currentYear, currentMonth)}
                        onMonthChange={(date) => {
                          setCurrentMonth(date.getMonth())
                          setCurrentYear(date.getFullYear())
                        }}
                        classNames={{
                          caption: "hidden", // Hide default caption
                          nav: "flex items-center",
                          nav_button_previous: "absolute left-1 top-1/2 -translate-y-1/2",
                          nav_button_next: "absolute right-1 top-1/2 -translate-y-1/2",
                          head_cell: "text-gray-600 font-semibold text-center py-2",
                          row: "flex w-full mt-2",
                          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                          day_range_end: "day-range-end",
                          day_selected: "bg-purple-600 text-white hover:bg-purple-700 focus:bg-purple-700",
                          day_today: "bg-purple-100 text-purple-900 font-semibold",
                          day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_middle: "aria-selected:bg-purple-200 aria-selected:text-purple-900",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                  </div>
                  {/* Clear Button */}
                  {(dateRange.from || dateRange.to) && (
                    <div className="pt-3 border-t mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearDateFilter}
                        className="w-full text-gray-600 hover:text-red-600"
                      >
                        Clear Filter
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right Side - Action Buttons */}
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
              <span>Requests ({filteredRequests.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading join requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-500">
                  {requests.length === 0 
                    ? "You don't have any join requests yet" 
                    : "Try adjusting your date filter criteria"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                      request.status === "pending" 
                        ? "bg-white border-purple-200 shadow-sm" 
                        : request.status === "approved"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
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
                              <span className="text-xs font-medium text-green-600">{request.activityCount || 0} {(request.activityCount || 0) === 1 ? 'activity' : 'activities'}</span>
                            </div>
                            {(request.reportCount ?? 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                <span className="text-xs font-medium text-red-600">{request.reportCount} {request.reportCount === 1 ? 'report' : 'reports'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Status and Actions */}
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            request.status === "pending" && "bg-yellow-100 text-yellow-700 border-yellow-200",
                            request.status === "approved" && "bg-green-100 text-green-700 border-green-200",
                            request.status === "rejected" && "bg-red-100 text-red-700 border-red-200"
                          )}
                        >
                          {request.status}
                        </Badge>

                        {/* Actions for pending requests */}
                        {request.status === "pending" && (
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
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
