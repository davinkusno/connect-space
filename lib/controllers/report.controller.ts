import { NextRequest, NextResponse } from "next/server";
import { BaseController } from "./base.controller";
import { reportService } from "@/lib/services";

/**
 * Controller for report-related API endpoints
 */
export class ReportController extends BaseController {
  /**
   * GET /api/reports
   * Get all reports
   */
  async getAll(request: NextRequest): Promise<NextResponse> {
    try {
      await this.requireAuth();
      const status = this.getQueryParam(request, "status") || undefined;
      const result = await reportService.getAll(status);
      return this.json(
        result.success ? { reports: result.data } : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/reports
   * Create a new report
   */
  async create(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const body = await this.parseBody<{
        reported_user_id?: string;
        reported_community_id?: string;
        reported_event_id?: string;
        reason: string;
        description?: string;
      }>(request);

      const result = await reportService.create(user.id, body);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const reportController = new ReportController();

