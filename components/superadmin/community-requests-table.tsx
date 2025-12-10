"use client"

import { AnimatedButton } from "@/components/ui/animated-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { PulseLoader } from "@/components/ui/loading-indicators"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Eye, XCircle } from "lucide-react"
import { useState } from "react"

// Mock data for community requests
const mockCommunityRequests = [
  {
    id: "req-001",
    name: "Tech Enthusiasts Network",
    description: "A community for tech lovers to discuss the latest trends and innovations in technology.",
    category: "Technology",
    requestedBy: {
      id: "user-001",
      name: "Alex Johnson",
      email: "alex@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "pending",
    createdAt: "2025-06-08T14:30:00Z",
    updatedAt: "2025-06-08T14:30:00Z",
  },
  {
    id: "req-002",
    name: "Fitness Fanatics",
    description: "A community dedicated to fitness enthusiasts who want to share workout tips and nutrition advice.",
    category: "Health & Fitness",
    requestedBy: {
      id: "user-002",
      name: "Sarah Miller",
      email: "sarah@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "approved",
    createdAt: "2025-06-07T10:15:00Z",
    updatedAt: "2025-06-08T09:20:00Z",
    reviewedBy: {
      id: "admin-001",
      name: "Admin User",
    },
    reviewedAt: "2025-06-08T09:20:00Z",
    comments: "Great community idea with clear purpose and guidelines.",
  },
  {
    id: "req-003",
    name: "Book Club Online",
    description: "A virtual book club for literature enthusiasts to discuss books and share recommendations.",
    category: "Books & Literature",
    requestedBy: {
      id: "user-003",
      name: "Michael Brown",
      email: "michael@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "rejected",
    createdAt: "2025-06-06T16:45:00Z",
    updatedAt: "2025-06-07T11:30:00Z",
    reviewedBy: {
      id: "admin-002",
      name: "Admin User",
    },
    reviewedAt: "2025-06-07T11:30:00Z",
    comments: "Similar community already exists. Please consider joining 'Literary Circle' instead.",
  },
  {
    id: "req-004",
    name: "Sustainable Living",
    description:
      "A community focused on sustainable living practices, eco-friendly products, and environmental awareness.",
    category: "Environment",
    requestedBy: {
      id: "user-004",
      name: "Emma Wilson",
      email: "emma@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "pending",
    createdAt: "2025-06-08T09:00:00Z",
    updatedAt: "2025-06-08T09:00:00Z",
  },
  {
    id: "req-005",
    name: "Digital Nomads",
    description: "A community for remote workers and digital nomads to share travel experiences and work tips.",
    category: "Travel & Work",
    requestedBy: {
      id: "user-005",
      name: "David Lee",
      email: "david@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "pending",
    createdAt: "2025-06-07T20:30:00Z",
    updatedAt: "2025-06-07T20:30:00Z",
  },
  {
    id: "req-006",
    name: "Culinary Explorers",
    description: "A community for food enthusiasts to share recipes, cooking techniques, and culinary adventures.",
    category: "Food & Cooking",
    requestedBy: {
      id: "user-006",
      name: "Sophia Garcia",
      email: "sophia@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "approved",
    createdAt: "2025-06-06T12:15:00Z",
    updatedAt: "2025-06-07T14:45:00Z",
    reviewedBy: {
      id: "admin-001",
      name: "Admin User",
    },
    reviewedAt: "2025-06-07T14:45:00Z",
    comments: "Excellent community concept with clear guidelines and purpose.",
  },
  {
    id: "req-007",
    name: "Photography Masters",
    description:
      "A community for photography enthusiasts to share their work, techniques, and equipment recommendations.",
    category: "Photography",
    requestedBy: {
      id: "user-007",
      name: "James Wilson",
      email: "james@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "pending",
    createdAt: "2025-06-08T11:20:00Z",
    updatedAt: "2025-06-08T11:20:00Z",
  },
]

interface CommunityRequestsTableProps {
  limit?: number
  filter?: "all" | "pending" | "approved" | "rejected"
}

export function CommunityRequestsTable({ limit, filter = "all" }: CommunityRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [comments, setComments] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Filter and limit the requests based on props
  const filteredRequests = mockCommunityRequests
    .filter((request) => filter === "all" || request.status === filter)
    .slice(0, limit || mockCommunityRequests.length)

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request)
    setIsViewDialogOpen(true)
  }

  const handleActionClick = (request: any, action: "approve" | "reject") => {
    setSelectedRequest(request)
    setActionType(action)
    setComments("")
    setIsActionDialogOpen(true)
  }

  const handleActionConfirm = () => {
    setIsProcessing(true)

    // Simulate API call
    setTimeout(() => {
      // In a real app, you would update the database here
      setIsProcessing(false)
      setIsActionDialogOpen(false)

      // Show success notification (would be implemented with a toast system)
      console.log(`Request ${actionType === "approve" ? "approved" : "rejected"} with comments: ${comments}`)
    }, 1500)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Community Name</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.map((request) => (
            <TableRow key={request.id} className="group">
              <TableCell className="font-medium">{request.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={request.requestedBy.avatar || "/placeholder.svg"}
                      alt={request.requestedBy.name}
                    />
                    <AvatarFallback>{request.requestedBy.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{request.requestedBy.name}</span>
                </div>
              </TableCell>
              <TableCell>{request.category}</TableCell>
              <TableCell>{formatDate(request.createdAt)}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <AnimatedButton variant="glass" size="sm" onClick={() => handleViewRequest(request)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </AnimatedButton>

                  {request.status === "pending" && (
                    <>
                      <AnimatedButton
                        variant="glass"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleActionClick(request, "approve")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </AnimatedButton>

                      <AnimatedButton
                        variant="glass"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleActionClick(request, "reject")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </AnimatedButton>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Community Request Details</DialogTitle>
            <DialogDescription>Review the details of this community creation request.</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold">{selectedRequest.name}</h3>
                {getStatusBadge(selectedRequest.status)}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-sm">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-sm">{selectedRequest.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Requested On</p>
                  <p className="text-sm">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Requested By</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={selectedRequest.requestedBy.avatar || "/placeholder.svg"}
                      alt={selectedRequest.requestedBy.name}
                    />
                    <AvatarFallback>{selectedRequest.requestedBy.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{selectedRequest.requestedBy.name}</p>
                    <p className="text-xs text-gray-500">{selectedRequest.requestedBy.email}</p>
                  </div>
                </div>
              </div>

              {selectedRequest.status !== "pending" && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Review Comments</p>
                    <p className="text-sm">{selectedRequest.comments || "No comments provided."}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Reviewed By</p>
                      <p className="text-sm">{selectedRequest.reviewedBy?.name || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Reviewed On</p>
                      <p className="text-sm">
                        {selectedRequest.reviewedAt ? formatDate(selectedRequest.reviewedAt) : "N/A"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <div className="flex gap-2">
              {selectedRequest?.status === "pending" && (
                <>
                  <AnimatedButton
                    variant="glass"
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      handleActionClick(selectedRequest, "approve")
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </AnimatedButton>

                  <AnimatedButton
                    variant="glass"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      handleActionClick(selectedRequest, "reject")
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </AnimatedButton>
                </>
              )}
            </div>
            <AnimatedButton variant="glass" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </AnimatedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approve Community Request
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Reject Community Request
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will approve the community creation request and notify the requester."
                : "This will reject the community creation request and notify the requester."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50">
                <h4 className="font-medium">{selectedRequest.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedRequest.description.substring(0, 100)}...</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="comments" className="text-sm font-medium">
                  {actionType === "approve" ? "Approval Comments (Optional)" : "Rejection Reason"}
                </label>
                <Textarea
                  id="comments"
                  placeholder={
                    actionType === "approve"
                      ? "Add any comments or instructions for the community creator..."
                      : "Please provide a reason for rejecting this community request..."
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="min-h-[100px]"
                  required={actionType === "reject"}
                />
                {actionType === "reject" && !comments && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />A reason is required when rejecting a request
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <AnimatedButton variant="glass" onClick={() => setIsActionDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </AnimatedButton>
            <AnimatedButton
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleActionConfirm}
              disabled={isProcessing || (actionType === "reject" && !comments)}
              className={cn(
                actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "",
                "transition-all duration-300",
              )}
            >
              {isProcessing ? (
                <PulseLoader className="mr-2" color="white" />
              ) : actionType === "approve" ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {actionType === "approve" ? "Approve Request" : "Reject Request"}
            </AnimatedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
