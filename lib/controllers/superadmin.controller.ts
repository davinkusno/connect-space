import { NextRequest, NextResponse } from "next/server";
import { BaseController, ForbiddenError } from "./base.controller";
import { superAdminService } from "@/lib/services";

/**
 * Controller for super admin API endpoints
 */
export class SuperAdminController extends BaseController {
  /**
   * Verify user is a super admin
   */
  private async requireSuperAdmin(): Promise<void> {
    const user = await this.requireAuth();
    const isAdmin = await superAdminService.isSuperAdmin(user.id);
    if (!isAdmin) {
      throw new ForbiddenError("Super admin access required");
    }
  }

  /**
   * GET /api/superadmin/reports
   * Get all reports
   */
  async getReports(request: NextRequest): Promise<NextResponse> {
    try {
      await this.requireSuperAdmin();

      const status = this.getQueryParam(request, "status") || undefined;
      const page = parseInt(this.getQueryParam(request, "page") || "1");
      const pageSize = parseInt(this.getQueryParam(request, "pageSize") || "20");

      const result = await superAdminService.getReports({ status, page, pageSize });

      return this.json(
        result.success
          ? { reports: result.data?.reports, total: result.data?.total }
          : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/superadmin/reports/[id]
   * Get report by ID
   */
  async getReportById(request: NextRequest, reportId: string): Promise<NextResponse> {
    try {
      await this.requireSuperAdmin();
      const result = await superAdminService.getReportById(reportId);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/superadmin/reports/[id]
   * Resolve or dismiss a report
   */
  async updateReport(request: NextRequest, reportId: string): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      await this.requireSuperAdmin();

      const { action, resolution, userAction } = await this.parseBody<{
        action: "resolve" | "dismiss";
        resolution: string;
        userAction?: "warn" | "suspend" | "ban" | "none";
      }>(request);

      let result;
      if (action === "resolve") {
        result = await superAdminService.resolveReport(reportId, user.id, resolution, userAction);
      } else if (action === "dismiss") {
        result = await superAdminService.dismissReport(reportId, user.id, resolution);
      } else {
        return this.badRequest("Invalid action");
      }

      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/superadmin/inactive-communities
   * Get inactive communities
   */
  async getInactiveCommunities(request: NextRequest): Promise<NextResponse> {
    try {
      await this.requireSuperAdmin();
      const result = await superAdminService.getInactiveCommunities();
      return this.json(
        result.success ? { communities: result.data } : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/superadmin/inactive-communities
   * Suspend or reactivate a community
   */
  async manageCommunity(request: NextRequest): Promise<NextResponse> {
    try {
      await this.requireSuperAdmin();

      const { communityId, action, reason } = await this.parseBody<{
        communityId: string;
        action: "suspend" | "reactivate";
        reason?: string;
      }>(request);

      if (!communityId || !action) {
        return this.badRequest("Community ID and action are required");
      }

      let result;
      if (action === "suspend") {
        result = await superAdminService.suspendCommunity(communityId, reason || "Inactivity");
      } else if (action === "reactivate") {
        result = await superAdminService.reactivateCommunity(communityId);
      } else {
        return this.badRequest("Invalid action");
      }

      return this.json(
        result.success
          ? { message: `Community ${action}d successfully` }
          : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const superAdminController = new SuperAdminController();

