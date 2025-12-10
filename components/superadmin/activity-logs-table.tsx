"use client"

import type React from "react"

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
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Calendar, CheckCircle, Eye, Filter, Search, Settings, UserPlus, XCircle } from "lucide-react"
import { useState } from "react"

// Mock data for activity logs
const mockActivityLogs = [
  {
    id: "log-001",
    action: "community_request_approved",
    description: "Approved community creation request: Tech Enthusiasts Network",
    performedBy: {
      id: "admin-001",
      name: "Admin User",
      role: "superadmin",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2025-06-09T10:30:00Z",
    entityType: "community",
    entityId: "req-001",
    metadata: {
      communityName: "Tech Enthusiasts Network",
      requesterId: "user-001",
      requesterName: "Alex Johnson",
    },
  },
  {
    id: "log-002",
    action: "community_request_rejected",
    description: "Rejected community creation request: Gaming Legends",
    performedBy: {
      id: "admin-002",
      name: "Moderator User",
      role: "admin",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2025-06-09T09:15:00Z",
    entityType: "community",
    entityId: "req-008",
    metadata: {
      communityName: "Gaming Legends",
      requesterId: "user-008",
      requesterName: "Thomas Wright",
      rejectionReason: "Similar community already exists",
    },
  },
  {
    id: "log-003",
    action: "user_role_updated",
    description: "Updated user role: Sarah Miller promoted to Community Admin",
    performedBy: {
      id: "admin-001",
      name: "Admin User",
      role: "superadmin",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2025-06-08T16:45:00Z",
    entityType: "user",
    entityId: "user-002",
    metadata: {
      userId: "user-002",
      userName: "Sarah Miller",
      oldRole: "member",
      newRole: "admin",
      communityId: "comm-002",
      communityName: "Fitness Fanatics",
    },
  },
  {
    id: "log-004",
    action: "system_settings_updated",
    description: "Updated system settings: Changed maximum community size limit",
    performedBy: {
      id: "admin-001",
      name: "Admin User",
      role: "superadmin",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2025-06-08T14:20:00Z",
    entityType: "system",
    entityId: "settings",
    metadata: {
      setting: "maxCommunitySize",
      oldValue: 1000,
      newValue: 2000,
    },
  },
  {
    id: "log-005",
    action: "community_request_submitted",
    description: "New community creation request submitted: Photography Masters",
    performedBy: {
      id: "user-007",
      name: "James Wilson",
      role: "user",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2025-06-08T11:20:00Z",
    entityType: "community",
    entityId: "req-007",
    metadata: {
      communityName: "Photography Masters",
      category: "Photography",
    },
  },
  {
    id: "log-006",
    action: "user_account_created",
    description: "New user account created: Olivia Martinez",
    performedBy: {
      id: "system",
      name: "System",
      role: "system",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2025-06-08T10:05:00Z",
    entityType: "user",
    entityId: "user-010",
    metadata: {
      userId: "user-010",
      userName: "Olivia Martinez",
      email: "olivia@example.com",
    },
  },
  {
    id: "log-007",
    action: "community_request_approved",
    description: "Approved community creation request: Culinary Explorers",
    performedBy: {
      id: "admin-001",
      name: "Admin User",
      role: "superadmin",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2025-06-07T14:45:00Z",
    entityType: "community",
    entityId: "req-006",
    metadata: {
      communityName: "Culinary Explorers",
      requesterId: "user-006",
      requesterName: "Sophia Garcia",
    },
  },
  {
    id: "log-008",
    action: "system_backup_completed",
    description: "System backup completed successfully",
    performedBy: {
      id: "system",
      name: "System",
      role: "system",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2025-06-07T02:00:00Z",
    entityType: "system",
    entityId: "backup",
    metadata: {
      backupId: "backup-2025-06-07",
      backupSize: "2.3GB",
      duration: "15 minutes",
    },
  },
  {
    id: "log-009",
    action: "community_request_rejected",
    description: "Rejected community creation request: Book Club Online",
    performedBy: {
      id: "admin-002",
      name: "Moderator User",
      role: "admin",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2025-06-07T11:30:00Z",
    entityType: "community",
    entityId: "req-003",
    metadata: {
      communityName: "Book Club Online",
      requesterId: "user-003",
      requesterName: "Michael Brown",
      rejectionReason: "Similar community already exists. Please consider joining 'Literary Circle' instead.",
    },
  },
  {
    id: "log-010",
    action: "security_alert",
    description: "Multiple failed login attempts detected",
    performedBy: {
      id: "system",
      name: "System",
      role: "system",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2025-06-06T22:15:00Z",
    entityType: "security",
    entityId: "alert-001",
    metadata: {
      ipAddress: "192.168.1.1",
      attempts: 5,
      targetUser: "admin@example.com",
    },
  },
]

export function ActivityLogsTable() {
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLogs, setFilteredLogs] = useState(mockActivityLogs)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)

    if (!query) {
      setFilteredLogs(mockActivityLogs)
      return
    }

    const filtered = mockActivityLogs.filter(
      (log) =>
        log.description.toLowerCase().includes(query) ||
        log.performedBy.name.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        (log.metadata?.communityName && log.metadata.communityName.toLowerCase().includes(query)),
    )

    setFilteredLogs(filtered)
  }

  const handleViewLog = (log: any) => {
    setSelectedLog(log)
    setIsViewDialogOpen(true)
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

  const getActionBadge = (action: string) => {
    if (action.includes("approved")) {
      return <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">Approved</Badge>
    } else if (action.includes("rejected")) {
      return <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">Rejected</Badge>
    } else if (action.includes("submitted")) {
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0">Submitted</Badge>
    } else if (action.includes("updated")) {
      return <Badge className="bg-purple-500 hover:bg-purple-600 text-white border-0">Updated</Badge>
    } else if (action.includes("created")) {
      return <Badge className="bg-teal-500 hover:bg-teal-600 text-white border-0">Created</Badge>
    } else if (action.includes("alert")) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">Alert</Badge>
    } else {
      return <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0">System</Badge>
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes("approved")) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (action.includes("rejected")) {
      return <XCircle className="h-4 w-4 text-red-500" />
    } else if (action.includes("created") || action.includes("submitted")) {
      return <UserPlus className="h-4 w-4 text-blue-500" />
    } else if (action.includes("updated") || action.includes("settings")) {
      return <Settings className="h-4 w-4 text-purple-500" />
    } else if (action.includes("alert")) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    } else {
      return <Calendar className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search activity logs..." className="pl-10" value={searchQuery} onChange={handleSearch} />
        </div>
        <AnimatedButton variant="glass" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </AnimatedButton>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Performed By</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.map((log) => (
            <TableRow key={log.id} className="group">
              <TableCell>
                <div className="flex items-center gap-2">
                  {getActionIcon(log.action)}
                  {getActionBadge(log.action)}
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate">{log.description}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={log.performedBy.avatar || "/placeholder.svg"} alt={log.performedBy.name} />
                    <AvatarFallback>{log.performedBy.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{log.performedBy.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{log.performedBy.role}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{formatDate(log.timestamp)}</TableCell>
              <TableCell className="text-right">
                <AnimatedButton
                  variant="glass"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleViewLog(log)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </AnimatedButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* View Log Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
            <DialogDescription>Detailed information about this system activity.</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getActionIcon(selectedLog.action)}
                <h3 className="text-lg font-semibold">{selectedLog.description}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Action Type</p>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Timestamp</p>
                  <p className="text-sm">{formatDate(selectedLog.timestamp)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Performed By</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={selectedLog.performedBy.avatar || "/placeholder.svg"}
                      alt={selectedLog.performedBy.name}
                    />
                    <AvatarFallback>{selectedLog.performedBy.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{selectedLog.performedBy.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{selectedLog.performedBy.role}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Entity Type</p>
                  <p className="text-sm capitalize">{selectedLog.entityType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Entity ID</p>
                  <p className="text-sm">{selectedLog.entityId}</p>
                </div>
              </div>

              {selectedLog.metadata && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Additional Details</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {Object.entries(selectedLog.metadata).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-2 mb-1">
                        <p className="text-xs font-medium text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-xs">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <AnimatedButton variant="glass" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </AnimatedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
