import {
  BaseService,
  ApiResponse,
  ServiceResult,
} from "./base.service";
import {
  Report,
  ReportStatus,
  AdminStats,
  InactiveCommunity,
  UserType,
} from "@/lib/types";

// ==================== Admin Service Types ====================

interface ReportData {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  reported_community_id?: string;
  reported_event_id?: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  resolution?: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
}

interface ReportsResult {
  reports: ReportData[];
  total: number;
}

interface ReportsQueryOptions {
  status?: string;
  page?: number;
  pageSize?: number;
}

type UserAction = "warn" | "suspend" | "ban";

// ==================== Admin Service Class ====================

/**
 * Service for admin/super-admin operations
 * Handles reports, inactive communities, and user moderation
 */
export class AdminService extends BaseService {
  private static instance: AdminService;
  private readonly INACTIVE_DAYS_THRESHOLD: number = 30;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance of AdminService
   */
  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  /**
   * Check if user is a super admin
   * @param userId - The user ID to check
   * @returns Boolean indicating if user is super admin
   */
  public async isSuperAdmin(userId: string): Promise<boolean> {
    const { data } = await this.supabaseAdmin
      .from("users")
      .select("user_type")
      .eq("id", userId)
      .single();

    return data?.user_type === "super_admin";
  }

  /**
   * Get admin dashboard statistics
   * @returns ServiceResult containing dashboard stats
   */
  public async getStats(): Promise<ServiceResult<AdminStats>> {
    const [users, communities, events, reports, inactive] = await Promise.all([
      this.supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      this.supabaseAdmin.from("communities").select("id", { count: "exact", head: true }),
      this.supabaseAdmin.from("events").select("id", { count: "exact", head: true }),
      this.supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      this.getInactiveCommunities(),
    ]);

    const stats: AdminStats = {
      totalUsers: users.count || 0,
      totalCommunities: communities.count || 0,
      totalEvents: events.count || 0,
      pendingReports: reports.count || 0,
      inactiveCommunities: inactive.data?.length || 0,
    };

    return ApiResponse.success<AdminStats>(stats);
  }

  /**
   * Get all reports with filters and pagination
   * @param options - Query options
   * @returns ServiceResult containing paginated reports
   */
  public async getReports(
    options?: ReportsQueryOptions
  ): Promise<ServiceResult<ReportsResult>> {
    const page: number = options?.page || 1;
    const pageSize: number = options?.pageSize || 20;
    const from: number = (page - 1) * pageSize;
    const to: number = from + pageSize - 1;

    let query = this.supabaseAdmin
      .from("reports")
      .select(`
        *,
        reporter:reporter_id (id, full_name, avatar_url),
        reported_user:reported_user_id (id, full_name, avatar_url),
        reported_community:reported_community_id (id, name, logo_url),
        reported_event:reported_event_id (id, title)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return ApiResponse.error("Failed to fetch reports", 500);
    }

    return ApiResponse.success<ReportsResult>({
      reports: (data || []) as ReportData[],
      total: count || 0,
    });
  }

  /**
   * Get report by ID
   * @param reportId - The report ID to fetch
   * @returns ServiceResult containing report data
   */
  public async getReportById(reportId: string): Promise<ServiceResult<ReportData>> {
    const { data, error } = await this.supabaseAdmin
      .from("reports")
      .select(`
        *,
        reporter:reporter_id (id, full_name, avatar_url, email),
        reported_user:reported_user_id (id, full_name, avatar_url, email),
        reported_community:reported_community_id (id, name, logo_url),
        reported_event:reported_event_id (id, title)
      `)
      .eq("id", reportId)
      .single();

    if (error || !data) {
      return ApiResponse.notFound("Report");
    }

    return ApiResponse.success<ReportData>(data as ReportData);
  }

  /**
   * Resolve a report with optional user action
   * @param reportId - The report ID to resolve
   * @param adminId - The admin resolving the report
   * @param resolution - Resolution notes
   * @param action - Optional action to take against reported user
   * @returns ServiceResult containing resolved report
   */
  public async resolveReport(
    reportId: string,
    adminId: string,
    resolution: string,
    action?: UserAction | "none"
  ): Promise<ServiceResult<ReportData>> {
    const { data: report, error: fetchError } = await this.supabaseAdmin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return ApiResponse.notFound("Report");
    }

    // Update report status
    const { data, error } = await this.supabaseAdmin
      .from("reports")
      .update({
        status: "resolved" as ReportStatus,
        resolution,
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .select()
      .single();

    if (error) {
      return ApiResponse.error("Failed to resolve report", 500);
    }

    // Apply action if specified
    if (action && action !== "none" && report.reported_user_id) {
      await this.applyUserAction(report.reported_user_id, action as UserAction, reportId);
    }

    return ApiResponse.success<ReportData>(data as ReportData);
  }

  /**
   * Dismiss a report
   * @param reportId - The report ID to dismiss
   * @param adminId - The admin dismissing the report
   * @param reason - Optional dismissal reason
   * @returns ServiceResult containing dismissed report
   */
  public async dismissReport(
    reportId: string,
    adminId: string,
    reason?: string
  ): Promise<ServiceResult<ReportData>> {
    const { data, error } = await this.supabaseAdmin
      .from("reports")
      .update({
        status: "dismissed" as ReportStatus,
        resolution: reason || "Report dismissed by admin",
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .select()
      .single();

    if (error) {
      return ApiResponse.error("Failed to dismiss report", 500);
    }

    return ApiResponse.success<ReportData>(data as ReportData);
  }

  /**
   * Get inactive communities
   * @returns ServiceResult containing array of inactive communities
   */
  public async getInactiveCommunities(): Promise<ServiceResult<InactiveCommunity[]>> {
    const thresholdDate: Date = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - this.INACTIVE_DAYS_THRESHOLD);

    const { data, error } = await this.supabaseAdmin
      .from("communities")
      .select("id, name, creator_id, member_count, last_activity_date, status")
      .or(`last_activity_date.lt.${thresholdDate.toISOString()},last_activity_date.is.null`)
      .neq("status", "suspended")
      .order("last_activity_date", { ascending: true, nullsFirst: true });

    if (error) {
      return ApiResponse.error("Failed to fetch inactive communities", 500);
    }

    const communities: InactiveCommunity[] = (data || []).map((c) => ({
      ...c,
      days_inactive: c.last_activity_date
        ? Math.floor((Date.now() - new Date(c.last_activity_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999,
    }));

    return ApiResponse.success<InactiveCommunity[]>(communities);
  }

  /**
   * Suspend a community
   * @param communityId - The community to suspend
   * @param reason - The suspension reason
   * @returns ServiceResult indicating success
   */
  public async suspendCommunity(
    communityId: string,
    reason: string
  ): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin
      .from("communities")
      .update({
        status: "suspended",
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
      })
      .eq("id", communityId);

    if (error) {
      return ApiResponse.error("Failed to suspend community", 500);
    }

    return ApiResponse.success<void>(undefined);
  }

  /**
   * Reactivate a suspended community
   * @param communityId - The community to reactivate
   * @returns ServiceResult indicating success
   */
  public async reactivateCommunity(communityId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin
      .from("communities")
      .update({
        status: "active",
        suspension_reason: null,
        suspended_at: null,
      })
      .eq("id", communityId);

    if (error) {
      return ApiResponse.error("Failed to reactivate community", 500);
    }

    return ApiResponse.success<void>(undefined);
  }

  // ==================== Private Helper Methods ====================

  /**
   * Apply action against a user (warn, suspend, ban)
   * @param userId - The user to apply action to
   * @param action - The action to take
   * @param reportId - The report ID for reference
   */
  private async applyUserAction(
    userId: string,
    action: UserAction,
    reportId: string
  ): Promise<void> {
    switch (action) {
      case "warn":
        await this.supabaseAdmin.from("user_points").insert({
          user_id: userId,
          points: -10,
          reason: `Warning issued for report: ${reportId}`,
          source: "admin_warning",
        });
        break;

      case "suspend":
        await this.supabaseAdmin
          .from("users")
          .update({
            status: "suspended",
            suspended_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", userId);
        break;

      case "ban":
        await this.supabaseAdmin
          .from("users")
          .update({ status: "banned" })
          .eq("id", userId);
        break;
    }
  }
}

// Export singleton instance
export const adminService: AdminService = AdminService.getInstance();
