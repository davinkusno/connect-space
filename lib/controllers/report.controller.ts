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
  ): Promise<NextResponse<{ message: string } | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body = await this.parseBody<{
        status: "pending" | "reviewing" | "resolved" | "dismissed";
        review_notes?: string;
      }>(request);

      if (!body.status) {
        return this.badRequest("Status is required");
      }

      const result = await this.service.updateReportStatus(
        reportId,
        communityId,
        user.id,
        body.status,
        body.review_notes
      );

      if (result.success) {
        return this.json(result.data!, result.status);
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
}

// Export singleton instance
export const reportController: ReportController = new ReportController();
