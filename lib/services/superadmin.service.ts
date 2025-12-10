import {
  BaseService,
  ApiResponse,
  ServiceResult,
} from "./base.service";

interface ReportData {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  reported_community_id?: string;
  reported_event_id?: string;
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  resolution?: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
}

interface InactiveCommunity {
  id: string;
  name: string;
  creator_id: string;
  member_count: number;
  last_activity_date?: string;
  status: string;
  days_inactive: number;
}

interface AdminStats {
  totalUsers: number;
  totalCommunities: number;
  totalEvents: number;
  pendingReports: number;
  inactiveCommunities: number;
}

/**
 * Service for super admin operations
 */
export class SuperAdminService extends BaseService {
  private static instance: SuperAdminService;
  private readonly INACTIVE_DAYS_THRESHOLD = 30;

  private constructor() {
    super();
  }

  static getInstance(): SuperAdminService {
    if (!SuperAdminService.instance) {
      SuperAdminService.instance = new SuperAdminService();
    }
    return SuperAdminService.instance;
  }

  /**
   * Check if user is a super admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const { data } = await this.supabaseAdmin
      .from("users")
      .select("user_type")
      .eq("id", userId)
      .single();

    return data?.user_type === "super_admin";
  }

  /**
   * Get admin dashboard statistics
   */
  async getStats(): Promise<ServiceResult<AdminStats>> {
    const [users, communities, events, reports, inactive] = await Promise.all([
      this.supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      this.supabaseAdmin.from("communities").select("id", { count: "exact", head: true }),
      this.supabaseAdmin.from("events").select("id", { count: "exact", head: true }),
      this.supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      this.getInactiveCommunities(),
    ]);

    return ApiResponse.success({
      totalUsers: users.count || 0,
      totalCommunities: communities.count || 0,
      totalEvents: events.count || 0,
      pendingReports: reports.count || 0,
      inactiveCommunities: inactive.data?.length || 0,
    });
  }

  /**
   * Get all reports with filters
   */
  async getReports(options?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<{ reports: ReportData[]; total: number }>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

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

    return ApiResponse.success({
      reports: data || [],
      total: count || 0,
    });
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string): Promise<ServiceResult<ReportData>> {
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
      return ApiResponse.error("Report not found", 404);
    }

    return ApiResponse.success(data);
  }

  /**
   * Resolve a report
   */
  async resolveReport(
    reportId: string,
    adminId: string,
    resolution: string,
    action?: "warn" | "suspend" | "ban" | "none"
  ): Promise<ServiceResult<ReportData>> {
    const { data: report, error: fetchError } = await this.supabaseAdmin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return ApiResponse.error("Report not found", 404);
    }

    // Update report status
    const { data, error } = await this.supabaseAdmin
      .from("reports")
      .update({
        status: "resolved",
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
      await this.applyUserAction(report.reported_user_id, action, reportId);
    }

    return ApiResponse.success(data);
  }

  /**
   * Dismiss a report
   */
  async dismissReport(
    reportId: string,
    adminId: string,
    reason?: string
  ): Promise<ServiceResult<ReportData>> {
    const { data, error } = await this.supabaseAdmin
      .from("reports")
      .update({
        status: "dismissed",
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

    return ApiResponse.success(data);
  }

  /**
   * Get inactive communities
   */
  async getInactiveCommunities(): Promise<ServiceResult<InactiveCommunity[]>> {
    const thresholdDate = new Date();
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

    const communities = (data || []).map((c) => ({
      ...c,
      days_inactive: c.last_activity_date
        ? Math.floor((Date.now() - new Date(c.last_activity_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999,
    }));

    return ApiResponse.success(communities);
  }

  /**
   * Suspend a community
   */
  async suspendCommunity(
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

    return ApiResponse.success(undefined);
  }

  /**
   * Reactivate a suspended community
   */
  async reactivateCommunity(communityId: string): Promise<ServiceResult<void>> {
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

    return ApiResponse.success(undefined);
  }

  // Private helper methods

  private async applyUserAction(
    userId: string,
    action: "warn" | "suspend" | "ban",
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

export const superAdminService = SuperAdminService.getInstance();

