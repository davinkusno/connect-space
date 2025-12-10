import { NextRequest, NextResponse } from "next/server";
import { User } from "@supabase/supabase-js";
import { BaseController, ApiErrorResponse } from "./base.controller";
import { reportService, ReportService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { Report, ReportReason } from "@/lib/types";

// ==================== Request Body Types ====================

interface CreateReportBody {
  reported_user_id?: string;
  reported_community_id?: string;
  reported_event_id?: string;
  reason: ReportReason;
  description?: string;
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
      const body: CreateReportBody = await this.parseBody<CreateReportBody>(request);

      const result: ServiceResult<Report> = await this.service.create(user.id, body);

      if (result.success) {
        return this.json<Report>(result.data as Report, result.status);
      }
      
      return this.error(result.error?.message || "Failed to create report", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const reportController: ReportController = new ReportController();
