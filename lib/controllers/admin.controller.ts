import { adminService, AdminService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { InactiveCommunity, Report } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, BaseController, ForbiddenError } from "./base.controller";

// ==================== Request Body Types ====================

interface UpdateReportBody {
  action: "resolve" | "dismiss";
  resolution: string;
  userAction?: "warn" | "suspend" | "ban" | "none";
}

interface ManageCommunityBody {
  communityId: string;
  action: "suspend" | "reactivate";
  reason?: string;
}

// ==================== Response Types ====================

interface ReportsListResponse {
  reports: Report[];
  total: number;
}

interface CommunitiesListResponse {
  communities: InactiveCommunity[];
}

interface MessageResponse {
  message: string;
}

// ==================== Admin Controller Class ====================

/**
 * Controller for admin API endpoints
 * Handles HTTP requests and delegates to AdminService
 * All methods require super admin access
 */
export class AdminController extends BaseController {
  private readonly service: AdminService;

  constructor() {
    super();
    this.service = adminService;
  }

  /**
   * Verify user is a super admin
   * @throws ForbiddenError if not super admin
   */
  private async requireSuperAdmin(): Promise<User> {
    const user: User = await this.requireAuth();
    const isAdmin: boolean = await this.service.isSuperAdmin(user.id);
    if (!isAdmin) {
      throw new ForbiddenError("Super admin access required");
    }
    return user;
  }

  /**
   * GET /api/admin/reports
   * Get all reports with pagination
   * @param request - The incoming request with query params
   * @returns NextResponse with array of reports
   */
  public async getReports(
    request: NextRequest
  ): Promise<NextResponse<ReportsListResponse | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();

      const status: string | null = this.getQueryParam(request, "status");
      const page: number = this.getQueryParamAsNumber(request, "page", 1);
      const pageSize: number = this.getQueryParamAsNumber(request, "pageSize", 20);

      const result: ServiceResult<ReportsListResponse> = await this.service.getReports({ 
        status: status || undefined, 
        page, 
        pageSize 
      });

      if (result.success && result.data) {
        return this.json<ReportsListResponse>(
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
   * GET /api/admin/reports/[id]
   * Get report by ID
   * @param request - The incoming request
   * @param reportId - The report ID to fetch
   * @returns NextResponse with report data
   */
  public async getReportById(
    request: NextRequest, 
    reportId: string
  ): Promise<NextResponse<Report | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();
      const result: ServiceResult<Report> = await this.service.getReportById(reportId);

      if (result.success) {
        return this.json<Report>(result.data as Report, result.status);
      }
      
      return this.error(result.error?.message || "Report not found", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/admin/reports/[id]
   * Resolve or dismiss a report
   * @param request - The incoming request with action data
   * @param reportId - The report ID to update
   * @returns NextResponse with updated report
   */
  public async updateReport(
    request: NextRequest, 
    reportId: string
  ): Promise<NextResponse<Report | ApiErrorResponse>> {
    try {
      const user: User = await this.requireSuperAdmin();
      const body: UpdateReportBody = await this.parseBody<UpdateReportBody>(request);

      let result: ServiceResult<Report>;
      
      if (body.action === "resolve") {
        result = await this.service.resolveReport(
          reportId, 
          user.id, 
          body.resolution, 
          body.userAction
        );
      } else if (body.action === "dismiss") {
        result = await this.service.dismissReport(reportId, user.id, body.resolution);
      } else {
        return this.badRequest("Invalid action. Must be 'resolve' or 'dismiss'");
      }

      if (result.success) {
        return this.json<Report>(result.data as Report, result.status);
      }
      
      return this.error(result.error?.message || "Failed to update report", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/admin/inactive-communities
   * Get all inactive communities
   * @param request - The incoming request
   * @returns NextResponse with array of inactive communities
   */
  public async getInactiveCommunities(
    request: NextRequest
  ): Promise<NextResponse<CommunitiesListResponse | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();
      const result: ServiceResult<InactiveCommunity[]> = 
        await this.service.getInactiveCommunities();

      if (result.success) {
        return this.json<CommunitiesListResponse>(
          { communities: result.data || [] }, 
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to fetch communities", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/admin/inactive-communities
   * Suspend or reactivate a community
   * @param request - The incoming request with action data
   * @returns NextResponse indicating success
   */
  public async manageCommunity(
    request: NextRequest
  ): Promise<NextResponse<MessageResponse | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();
      const body: ManageCommunityBody = await this.parseBody<ManageCommunityBody>(request);

      if (!body.communityId || !body.action) {
        return this.badRequest("Community ID and action are required");
      }

      let result: ServiceResult<void>;
      
      if (body.action === "suspend") {
        result = await this.service.suspendCommunity(
          body.communityId, 
          body.reason || "Inactivity"
        );
      } else if (body.action === "reactivate") {
        result = await this.service.reactivateCommunity(body.communityId);
      } else {
        return this.badRequest("Invalid action. Must be 'suspend' or 'reactivate'");
      }

      if (result.success) {
        return this.json<MessageResponse>(
          { message: `Community ${body.action}d successfully` },
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to manage community", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/admin/communities/[id]
   * Get community details for superadmin (read-only)
   * @param request - The incoming request
   * @param communityId - The community ID
   * @returns NextResponse with community details
   */
  public async getCommunityDetails(
    request: NextRequest,
    communityId: string
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      await this.requireSuperAdmin();
      const result = await this.service.getCommunityDetails(communityId);

      if (result.success) {
        return this.json(result.data!, result.status);
      }

      return this.error(result.error?.message || "Failed to fetch community details", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const adminController: AdminController = new AdminController();
