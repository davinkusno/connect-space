"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Eye,
  Loader2,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  UserX,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getReportReasonLabel } from "@/lib/utils/report-utils";

interface Reporter {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface ReportedMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  points_count: number;
  report_count: number;
}

interface Report {
  id: string;
  target_id: string;
  report_type: "member" | "event" | "thread" | "reply" | "community" | "post";
  reason: string;
  details: string | null;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  review_notes: string | null;
  reporter: Reporter;
  reported_member?: ReportedMember;
  target_name?: string; // Generic name for the reported item
  target_type_label?: string; // Human-readable type label
  reporter_count?: number; // Number of unique community members who reported this
  threshold_met?: boolean; // Whether this report meets the 30% threshold
}

interface ReportsData {
  reports: Report[];
  total: number;
  page: number;
  pageSize: number;
}

interface ReportsManagementProps {
  communityId: string;
}

export function ReportsManagement({ communityId }: ReportsManagementProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  // Report detail dialog state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<Report["status"]>("pending");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isBanning, setIsBanning] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [showBanDialog, setShowBanDialog] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    loadReports();
  }, [communityId, statusFilter, currentPage]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/communities/${communityId}/reports?${params.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to load reports");
      }

      const data: ReportsData = await response.json();
      setReports(data.reports);
      setTotalReports(data.total);
      setTotalPages(Math.ceil(data.total / pageSize));
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const openReportDetail = (report: Report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setReviewNotes(report.review_notes || "");
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;

    try {
      setIsUpdating(true);

      const response = await fetch(
        `/api/communities/${communityId}/reports/${selectedReport.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            review_notes: reviewNotes.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to update report");
      }

      const result = await response.json();
      toast.success(result.message);
      setIsDetailOpen(false);
      loadReports(); // Reload reports
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update report");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedReport || selectedReport.report_type !== "member") return;

    try {
      setIsBanning(true);

      const response = await fetch(
        `/api/communities/${communityId}/reports/${selectedReport.id}/ban`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: banReason.trim() || selectedReport.reason || "Violation of community guidelines",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to ban user");
      }

      const result = await response.json();
      toast.success(result.message);
      setShowBanDialog(false);
      setIsDetailOpen(false);
      setBanReason("");
      loadReports(); // Reload reports
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to ban user");
    } finally {
      setIsBanning(false);
    }
  };

  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "reviewing":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Eye className="w-3 h-3 mr-1" />
            Reviewing
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolved
          </Badge>
        );
      case "dismissed":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <XCircle className="w-3 h-3 mr-1" />
            Dismissed
          </Badge>
        );
    }
  };

  const getReasonIcon = (reason: string) => {
    if (reason.toLowerCase().includes("spam") || reason.toLowerCase().includes("inappropriate")) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (reason.toLowerCase().includes("harassment") || reason.toLowerCase().includes("abuse")) {
      return <ShieldAlert className="w-4 h-4 text-red-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-orange-500" />;
  };

  const getReportTypeBadge = (reportType: Report["report_type"]) => {
    switch (reportType) {
      case "member":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Member
          </Badge>
        );
      case "event":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Event
          </Badge>
        );
      case "thread":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Thread
          </Badge>
        );
      case "reply":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Reply
          </Badge>
        );
      case "community":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Community
          </Badge>
        );
      case "post":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Post
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {reportType}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate statistics
  const stats = {
    pending: reports.filter((r) => r.status === "pending").length,
    reviewing: reports.filter((r) => r.status === "reviewing").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <p className="text-gray-600 mt-1">
          Review and manage all reports in this community
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Reviewing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.reviewing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Dismissed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.dismissed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-gray-600">
          {totalReports} {totalReports === 1 ? "report" : "reports"} total
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {statusFilter === "all"
                ? "No reports found"
                : `No ${statusFilter} reports`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openReportDetail(report)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Reported Item Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {report.reported_member && (
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={report.reported_member.avatar_url || undefined} />
                        <AvatarFallback>
                          {report.reported_member.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Report Type Badge */}
                        {getReportTypeBadge(report.report_type)}
                        
                        {/* Reported Item Name */}
                        <h3 className="font-semibold text-gray-900">
                          {report.reported_member?.full_name || report.target_name || "Unknown"}
                        </h3>
                        
                        {/* Member-specific info */}
                        {report.reported_member && report.reported_member.report_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {report.reported_member.report_count}{" "}
                            {report.reported_member.report_count === 1
                              ? "report"
                              : "reports"}
                          </Badge>
                        )}
                        
                        {/* Threshold indicator */}
                        {report.reporter_count !== undefined && report.reporter_count > 0 && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {report.reporter_count} {report.reporter_count === 1 ? "member" : "members"} reported
                          </Badge>
                        )}
                      </div>

                      {/* Member-specific details */}
                      {report.reported_member && (
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="truncate">{report.reported_member.email}</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            {report.reported_member.points_count} points
                          </span>
                          {report.reported_member.report_count > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingDown className="w-4 h-4 text-red-600" />
                              {report.reported_member.report_count} reports
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-start gap-2 mb-2">
                        {getReasonIcon(report.reason)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {getReportReasonLabel(report.reason)}
                          </div>
                          {report.details && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {report.details}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Reported by {report.reporter.full_name}</span>
                        {report.reporter_count !== undefined && report.reporter_count > 1 && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">
                              {report.reporter_count} total reporters
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Badge */}
                  <div className="flex-shrink-0">{getStatusBadge(report.status)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Review and take action on this report
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Report Type & Status */}
              <div className="flex items-center gap-3 border-b pb-4">
                {getReportTypeBadge(selectedReport.report_type)}
                {getStatusBadge(selectedReport.status)}
              </div>

              {/* Reported Item Section */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Reported {selectedReport.report_type === "member" ? "Member" : 
                           selectedReport.report_type === "event" ? "Event" :
                           selectedReport.report_type === "thread" ? "Thread" :
                           selectedReport.report_type === "reply" ? "Reply" : "Item"}
                </h3>
                {selectedReport.reported_member ? (
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage
                        src={selectedReport.reported_member.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {selectedReport.reported_member.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {selectedReport.reported_member.full_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedReport.reported_member.email}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {selectedReport.reported_member.points_count} points
                        </Badge>
                        <Badge
                          variant={
                            selectedReport.reported_member.report_count > 0
                              ? "destructive"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {selectedReport.reported_member.report_count} reports
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 font-medium">
                      {selectedReport.target_name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      ID: {selectedReport.target_id}
                    </p>
                  </div>
                )}
              </div>

              {/* Report Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Report Reason</h3>
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    {getReasonIcon(selectedReport.reason)}
                    <span className="font-medium text-red-900">
                      {getReportReasonLabel(selectedReport.reason)}
                    </span>
                  </div>
                </div>

                {selectedReport.details && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Details</h3>
                    <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">
                      {selectedReport.details}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Reporter</h3>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={selectedReport.reporter.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {selectedReport.reporter.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedReport.reporter.full_name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(selectedReport.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedReport.review_notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Previous Review Notes</h3>
                    <p className="text-gray-700 p-3 bg-blue-50 rounded-lg text-sm">
                      {selectedReport.review_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Section */}
              <div className="space-y-4 border-t pt-4">
                {/* Ban Button for Member Reports */}
                {selectedReport.report_type === "member" && selectedReport.status !== "resolved" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 mb-1">Ban User from Community</h4>
                        <p className="text-sm text-red-700 mb-3">
                          This will remove the user from the community and prevent them from joining again.
                        </p>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setBanReason(selectedReport.reason || "");
                            setShowBanDialog(true);
                          }}
                          className="w-full"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Ban User from Community
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Report["status"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="resolved">Resolved (Action Taken)</SelectItem>
                      <SelectItem value="dismissed">Dismissed (No Action)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Add notes about your decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {newStatus === "resolved" && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Warning: Marking as Resolved</p>
                        <p>
                          This will add a report record to the member's profile and may
                          affect their standing in the community. Make sure you've
                          thoroughly reviewed the report.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Confirmation Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User from Community</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban this user? They will be removed from the community
              and will not be able to join again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedReport?.reported_member && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={selectedReport.reported_member.avatar_url || undefined}
                    />
                    <AvatarFallback>
                      {selectedReport.reported_member.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">
                      {selectedReport.reported_member.full_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedReport.reported_member.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ban Reason
              </label>
              <Textarea
                placeholder="Enter the reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">This action cannot be undone</p>
                  <p>
                    The user will be immediately removed from the community and will not
                    be able to rejoin unless you manually unban them.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBanDialog(false);
                setBanReason("");
              }}
              disabled={isBanning}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={isBanning || !banReason.trim()}
            >
              {isBanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Banning...
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Confirm Ban
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



