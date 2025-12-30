import { reportService, ReportService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { Report, ReportReason } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, BaseController } from "./base.controller";

// ==================== Request Body Types ====================

interface CreateReportBody {
  // Legacy format (for backward compatibility)
  reported_user_id?: string;
  reported_community_id?: string;
  reported_event_id?: string;
  // New format (matches database schema)
  report_type?: "community" | "post" | "member" | "event" | "thread" | "reply";
  target_id?: string;
  reason: ReportReason;
  description?: string;
  details?: string; // Alias for description
}

// ==================== Response Types ====================

interface ReportsListResponse {
  reports: Report[];
}

// ==================== Report Controller Class ====================

/**
 * Controller for report-related API endpoints
 * Handles HTTP requests and delegates to ReportService
 */
export class ReportController extends BaseController {
  private readonly service: ReportService;

  constructor() {
    super();
    this.service = reportService;
  }

  /**
   * GET /api/reports
   * Get all reports (requires authentication)
   * @param request - The incoming request with optional status filter
   * @returns NextResponse with array of reports
   */
  public async getAll(
    request: NextRequest
  ): Promise<NextResponse<ReportsListResponse | ApiErrorResponse>> {
    try {
      await this.requireAuth();
      const status: string | null = this.getQueryParam(request, "status");
      const result: ServiceResult<Report[]> = await this.service.getAll(status || undefined);

      if (result.success) {
        return this.json<ReportsListResponse>({ reports: result.data || [] }, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch reports", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/reports
   * Create a new report
   * @param request - The incoming request with report data
   * @returns NextResponse with created report
   */
  public async create(
    request: NextRequest
  ): Promise<NextResponse<Report | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      
      // Check if user is superadmin - superadmins cannot report
      const userResult = await this.service.getUserType(user.id);
      if (userResult.success && userResult.data === "super_admin") {
        return this.forbidden("Superadmins cannot submit reports");
      }
      
      const body: CreateReportBody = await this.parseBody<CreateReportBody>(request);

      // Map description to details if provided
      const reportInput = {
        ...body,
        description: body.description || body.details,
      };

      const result: ServiceResult<Report> = await this.service.create(user.id, reportInput);

      if (result.success) {
        return this.json<Report>(result.data as Report, result.status);
      }
      
      return this.error(result.error?.message || "Failed to create report", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/communities/[id]/reports
   * Get member reports for a specific community (admin/moderator only)
   * @param request - The incoming request
   * @param communityId - The community ID
   * @returns NextResponse with reports list
   */
  public async getCommunityReports(
    request: NextRequest,
    communityId: string
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const status: string | null = this.getQueryParam(request, "status");
      const page: number = this.getQueryParamAsNumber(request, "page", 1);
      const pageSize: number = this.getQueryParamAsNumber(request, "pageSize", 20);

      const result = await this.service.getCommunityMemberReports(
        communityId,
        user.id,
        {
          status: status || undefined,
          page,
          pageSize,
        }
      );

      if (result.success) {
        return this.json(result.data!, result.status);
      }

      return this.error(result.error?.message || "Failed to fetch reports", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/communities/[communityId]/reports/[reportId]
   * Update report status (admin/moderator only)
   * @param request - The incoming request with status and notes
   * @param communityId - The community ID
   * @param reportId - The report ID
   * @returns NextResponse with success message
   */
  public async updateCommunityReportStatus(
    request: NextRequest,
    communityId: string,
    reportId: string
  ): Promise<NextResponse<{ message: string; report?: Report } | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body = await this.parseBody<{
        status: "pending" | "reviewed" | "resolved" | "dismissed";
      }>(request);

      if (!body.status) {
        return this.badRequest("Status is required");
      }

      const result = await this.service.updateReportStatus(
        reportId,
        communityId,
        user.id,
        body.status
      );

      if (result.success) {
        return this.json(
          { 
            message: "Report status updated successfully",
            report: result.data as any
          }, 
          result.status
        );
      }

      return this.error(result.error?.message || "Failed to update report", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/communities/[communityId]/reports/[reportId]/ban
   * Ban a user from the community based on a report (admin/moderator only)
   * @param request - The incoming request with ban reason
   * @param communityId - The community ID
   * @param reportId - The report ID
   * @returns NextResponse with success message
   */
  public async banUserFromCommunity(
    request: NextRequest,
    communityId: string,
    reportId: string
  ): Promise<NextResponse<{ message: string } | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body = await this.parseBody<{
        reason?: string;
      }>(request);

      // Get the report to find the target user - we need to access supabaseAdmin through the service
      // First, let's get the report using a service method or directly query
      const reportService = this.service as any;
      const { data: report, error: reportError } = await reportService.supabaseAdmin
        .from("reports")
        .select("target_id, report_type, reason, details")
        .eq("id", reportId)
        .single();

      if (reportError || !report) {
        return this.notFound("Report not found");
      }

      if (report.report_type !== "member") {
        return this.badRequest("Only member reports can result in bans");
      }

      const banReason = body.reason || report.reason || "Violation of community guidelines";

      const result = await this.service.banUserFromCommunity(
        communityId,
        report.target_id,
        user.id,
        banReason,
        reportId
      );

      if (result.success) {
        // Also update the report status to resolved
        await this.service.updateReportStatus(
          reportId,
          communityId,
          user.id,
          "resolved",
          `User banned: ${banReason}`
        );
        return this.json(result.data!, result.status);
      }

      return this.error(result.error?.message || "Failed to ban user", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/communities/[communityId]/reports/[reportId]
   * Delete a report (admin/moderator only)
   * @param request - The incoming request
   * @param communityId - The community ID
   * @param reportId - The report ID
   * @returns NextResponse with success message
   */
  public async deleteCommunityReport(
    request: NextRequest,
    communityId: string,
    reportId: string
  ): Promise<NextResponse<{ message: string } | ApiErrorResponse>> {
    try {
      await this.requireAuth();

      // Delete the report
      const reportService = this.service as any;
      const { error } = await reportService.supabaseAdmin
        .from("reports")
        .delete()
        .eq("id", reportId);

      if (error) {
        console.error("Error deleting report:", error);
        return this.error("Failed to delete report", 500);
      }

      return this.json({ message: "Report deleted successfully" }, 200);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/communities/[communityId]/reports/[reportId]/dismiss
   * Dismiss a report (mark as invalid/false report)
   * @param request - The incoming request
   * @param communityId - The community ID
   * @param reportId - The report ID
   * @returns NextResponse with success message
   */
  public async dismissCommunityReport(
    request: NextRequest,
    communityId: string,
    reportId: string
  ): Promise<NextResponse<{ message: string } | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();

      const result = await this.service.updateReportStatus(
        reportId,
        communityId,
        user.id,
        "dismissed"
      );

      if (result.success) {
        return this.json({ message: "Report dismissed successfully" }, 200);
      }

      return this.error(result.error?.message || "Failed to dismiss report", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/communities/[communityId]/reports/[reportId]/delete-content
   * Delete reported thread or reply content (admin/moderator only)
   * @param request - The incoming request with deletion reason
   * @param communityId - The community ID
   * @param reportId - The report ID
   * @returns NextResponse with success message
   */
  public async deleteReportedContent(
    request: NextRequest,
    communityId: string,
    reportId: string
  ): Promise<NextResponse<{ message: string } | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body = await this.parseBody<{
        reason?: string;
      }>(request);

      // Get the report to find the target content
      const reportService = this.service as any;
      const { data: report, error: reportError } = await reportService.supabaseAdmin
        .from("reports")
        .select("target_id, report_type, reason, details")
        .eq("id", reportId)
        .single();

      if (reportError || !report) {
        return this.notFound("Report not found");
      }

      if (report.report_type !== "thread" && report.report_type !== "reply") {
        return this.badRequest("Only thread and reply reports can have content deleted");
      }

      const deletionReason = body.reason || report.reason || "Violation of community guidelines";

      // Delete the message (thread or reply)
      const { error: deleteError } = await reportService.supabaseAdmin
        .from("messages")
        .delete()
        .eq("id", report.target_id);

      if (deleteError) {
        console.error("Error deleting message:", deleteError);
        return this.error("Failed to delete content", 500);
      }

      // Update the report status to resolved and set community_id
      await reportService.supabaseAdmin
        .from("reports")
        .update({ 
          status: "resolved",
          reported_community_id: communityId,
          updated_at: new Date().toISOString()
        })
        .eq("id", reportId);

      const contentType = report.report_type === "thread" ? "Thread" : "Reply";
      return this.json({ 
        message: `${contentType} deleted successfully. Reason: ${deletionReason}` 
      }, 200);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  // ==================== Superadmin Methods ====================

  /**
   * GET /api/admin/reports
   * Get all reports for superadmin view (admin-level reports only)
   * @param request - The incoming request with query params
   * @returns NextResponse with array of reports
   */
  public async getSuperadminReports(
    request: NextRequest
  ): Promise<NextResponse<{ reports: any[]; total: number } | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();

      const status: string | null = this.getQueryParam(request, "status");
      const page: number = this.getQueryParamAsNumber(request, "page", 1);
      const pageSize: number = this.getQueryParamAsNumber(request, "pageSize", 20);

      const result = await this.service.getSuperadminReports({ 
        status: status || undefined, 
        page, 
        pageSize 
      });

      if (result.success && result.data) {
        return this.json(
          { reports: result.data.reports, total: result.data.total },
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to fetch reports", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/admin/member-reports
   * Get all member reports with 30% threshold information
   * @param request - The incoming request
   * @returns NextResponse with all reports and review queue
   */
  public async getMemberReportsWithThreshold(
    request: NextRequest
  ): Promise<NextResponse<any | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();

      const status: string | null = this.getQueryParam(request, "status");

      const result = await this.service.getMemberReportsWithThreshold({ 
        status: status || undefined
      });

      if (result.success && result.data) {
        return this.json(result.data, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch member reports", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/admin/reports-review-queue
   * Get all reports that meet the 30% threshold for review
   * @param request - The incoming request with query params
   * @returns NextResponse with reports meeting threshold
   */
  public async getReportsReviewQueue(
    request: NextRequest
  ): Promise<NextResponse<{ reports: any[]; total: number } | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();

      const status: string | null = this.getQueryParam(request, "status");
      const page: number = this.getQueryParamAsNumber(request, "page", 1);
      const pageSize: number = this.getQueryParamAsNumber(request, "pageSize", 20);

      const result = await this.service.getReportsReviewQueue({
        status: status || undefined,
        page,
        pageSize
      });

      if (result.success && result.data) {
        return this.json(
          { reports: result.data.reports, total: result.data.total },
          result.status
        );
      }

      return this.error(result.error?.message || "Failed to fetch reports for review queue", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/admin/reports/[id]
   * Get report by ID for superadmin
   * @param request - The incoming request
   * @param reportId - The report ID to fetch
   * @returns NextResponse with report data
   */
  public async getReportByIdForSuperadmin(
    request: NextRequest, 
    reportId: string
  ): Promise<NextResponse<any | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();
      const result = await this.service.getReportByIdForSuperadmin(reportId);

      if (result.success) {
        return this.json(result.data, result.status);
      }
      
      return this.error(result.error?.message || "Report not found", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/admin/reports/[id]
   * Resolve or dismiss a report (superadmin)
   * @param request - The incoming request with action data
   * @param reportId - The report ID to update
   * @returns NextResponse with updated report
   */
  public async updateReportForSuperadmin(
    request: NextRequest, 
    reportId: string
  ): Promise<NextResponse<any | ApiErrorResponse>> {
    try {
      const user: User = await this.requireSuperAdmin();
      const body = await this.parseBody<{
        action: "resolve" | "dismiss";
        resolution: string;
        userAction?: "warn" | "ban" | "ban" | "none";
      }>(request);

      let result: ServiceResult<any>;
      
      if (body.action === "resolve") {
        result = await this.service.resolveReportForSuperadmin(
          reportId, 
          user.id, 
          body.resolution, 
          body.userAction
        );
      } else if (body.action === "dismiss") {
        result = await this.service.dismissReportForSuperadmin(reportId, user.id, body.resolution);
      } else {
        return this.badRequest("Invalid action. Must be 'resolve' or 'dismiss'");
      }

      if (result.success) {
        return this.json(result.data, result.status);
      }
      
      return this.error(result.error?.message || "Failed to update report", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/admin/reports/[id]
   * Delete a report (superadmin)
   * @param request - The incoming request
   * @param reportId - The report ID to delete
   * @returns NextResponse indicating success
   */
  public async deleteReportForSuperadmin(
    request: NextRequest,
    reportId: string
  ): Promise<NextResponse<{ message: string } | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();
      const result = await this.service.deleteReportForSuperadmin(reportId);

      if (result.success) {
        return this.json(
          { message: "Report deleted successfully" },
          result.status
        );
      }

      return this.error(result.error?.message || "Failed to delete report", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/admin/reports/[id]/ban
   * Ban reported content and apply appropriate moderation actions
   * @param request - The incoming request with ban reason
   * @param reportId - The report ID to ban
   * @returns NextResponse with ban result
   */
  public async banReportedContent(
    request: NextRequest,
    reportId: string
  ): Promise<NextResponse<{ message: string; actions: string[] } | ApiErrorResponse>> {
    try {
      const user: User = await this.requireSuperAdmin();
      const body = await this.parseBody<{ reason: string }>(request);

      if (!body.reason || typeof body.reason !== "string" || body.reason.trim().length === 0) {
        return this.badRequest("Ban reason is required");
      }

      const result = await this.service.banReportedContent(
        reportId,
        body.reason.trim(),
        user.id
      );

      if (result.success) {
        return this.json(result.data!, result.status);
      }

      return this.error(result.error?.message || "Failed to ban content", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/admin/reports/[id]/ban-community-admin
   * Ban a community admin from creating communities (superadmin only)
   * @param request - The incoming request with ban reason
   * @param reportId - The report ID
   * @returns NextResponse with success message
   */
  public async banCommunityAdmin(
    request: NextRequest,
    reportId: string
  ): Promise<NextResponse<{ message: string } | ApiErrorResponse>> {
    try {
      const user: User = await this.requireSuperAdmin();
      const body = await this.parseBody<{
        reason?: string;
      }>(request);

      // Get the report to find the target community
      const reportService = this.service as any;
      const { data: report, error: reportError } = await reportService.supabaseAdmin
        .from("reports")
        .select("target_id, report_type, reason, details")
        .eq("id", reportId)
        .single();

      if (reportError || !report) {
        return this.notFound("Report not found");
      }

      if (report.report_type !== "community") {
        return this.badRequest("This endpoint is only for banning community admins. Use the ban endpoint for other report types.");
      }

      // Get the community to find the admin
      const { data: community, error: communityError } = await reportService.supabaseAdmin
        .from("communities")
        .select("creator_id")
        .eq("id", report.target_id)
        .single();

      if (communityError || !community) {
        return this.notFound("Community not found");
      }

      const adminUserId = community.creator_id;
      const banReason = body.reason || report.reason || "Violation of platform guidelines";

      // Import UserService to access banUserFromCreatingCommunities
      const { userService } = await import("@/lib/services");
      const result = await userService.banUserFromCreatingCommunities(
        adminUserId,
        user.id,
        banReason,
        reportId
      );

      if (result.success) {
        // Also update the report status to resolved
        await this.service.resolveReportForSuperadmin(
          reportId,
          user.id,
          `Community admin banned from creating communities: ${banReason}`,
          "ban"
        );
        return this.json(result.data!, result.status);
      }

      return this.error(result.error?.message || "Failed to ban community admin", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const reportController: ReportController = new ReportController();
