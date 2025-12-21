import {
    ReportReason,
    ReportStatus,
    User
} from "@/lib/types";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";

// ==================== Report Service Types ====================

interface ReportData {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  reported_community_id?: string;
  reported_event_id?: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolution?: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
}

interface CreateReportInput {
  // Legacy format (for backward compatibility)
  reported_user_id?: string;
  reported_community_id?: string;
  reported_event_id?: string;
  // New format (matches database schema)
  report_type?: "community" | "post" | "member" | "event" | "thread" | "reply";
  target_id?: string;
  reason: ReportReason;
  description?: string;
}

interface ReportWithRelations extends ReportData {
  reporter?: Partial<User>;
  reported_user?: Partial<User>;
  reported_community?: { id: string; name: string; logo_url?: string };
  reported_event?: { id: string; title: string };
}

// ==================== Report Service Class ====================

/**
 * Service for managing user reports
 * Handles report creation, retrieval, and resolution
 */
export class ReportService extends BaseService {
  private static instance: ReportService;
  private readonly REPORT_PENALTY_POINTS: number = -10;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance of ReportService
   */
  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  /**
   * Create a new report
   * @param reporterId - The user ID creating the report
   * @param input - The report data
   * @returns ServiceResult containing created report or error
   */
  public async create(
    reporterId: string,
    input: CreateReportInput
  ): Promise<ServiceResult<ReportData>> {
    // Support both old format (reported_user_id, etc.) and new format (report_type, target_id)
    let reportType: string | undefined;
    let targetId: string | undefined;

    if (input.report_type && input.target_id) {
      // New format
      reportType = input.report_type;
      targetId = input.target_id;
    } else if (input.reported_user_id) {
      // Legacy format - member report
      reportType = "member";
      targetId = input.reported_user_id;
    } else if (input.reported_community_id) {
      // Legacy format - community report
      reportType = "community";
      targetId = input.reported_community_id;
    } else if (input.reported_event_id) {
      // Legacy format - event report
      reportType = "event";
      targetId = input.reported_event_id;
    }

    // Validate at least one target is specified
    if (!reportType || !targetId) {
      return ApiResponse.badRequest("Report target is required");
    }

    if (!input.reason) {
      return ApiResponse.badRequest("Report reason is required");
    }

    const { data, error } = await this.supabaseAdmin
      .from("reports")
      .insert({
        reporter_id: reporterId,
        report_type: reportType,
        target_id: targetId,
        reason: input.reason,
        details: input.description,
        status: "pending" as ReportStatus,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating report:", error);
      return ApiResponse.error("Failed to create report", 500);
    }

    return ApiResponse.created<ReportData>(data as ReportData);
  }

  /**
   * Get all reports with optional status filter
   * @param status - Optional status filter
   * @returns ServiceResult containing array of reports
   */
  public async getAll(status?: string): Promise<ServiceResult<ReportWithRelations[]>> {
    let query = this.supabaseAdmin
      .from("reports")
      .select(`
        *,
        reporter:reporter_id (id, full_name, avatar_url),
        reported_user:reported_user_id (id, full_name, avatar_url),
        reported_community:reported_community_id (id, name, logo_url),
        reported_event:reported_event_id (id, title)
      `)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return ApiResponse.error("Failed to fetch reports", 500);
    }

    return ApiResponse.success<ReportWithRelations[]>(
      (data || []) as ReportWithRelations[]
    );
  }

  /**
   * Update report status
   * @param reportId - The report ID to update
   * @param status - The new status
   * @param resolution - Optional resolution notes
   * @returns ServiceResult containing updated report
   */
  public async updateStatus(
    reportId: string,
    status: ReportStatus,
    resolution?: string
  ): Promise<ServiceResult<ReportData>> {
    const { data, error } = await this.supabaseAdmin
      .from("reports")
      .update({
        status,
        resolution,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", reportId)
      .select()
      .single();

    if (error) {
      return ApiResponse.error("Failed to update report", 500);
    }

    // If resolved against user, apply penalty points
    if (status === "resolved" && data.reported_user_id) {
      await this.applyReportPenalty(data.reported_user_id, reportId);
    }

    return ApiResponse.success<ReportData>(data as ReportData);
  }

  /**
   * Apply penalty points for upheld report
   * @param userId - The user to penalize
   * @param reportId - The report ID for reference
   */
  private async applyReportPenalty(
    userId: string, 
    reportId: string
  ): Promise<void> {
    await this.supabaseAdmin.from("user_points").insert({
      user_id: userId,
      points: this.REPORT_PENALTY_POINTS,
      reason: `Report upheld: ${reportId}`,
      source: "report_penalty",
    });
  }

  /**
   * Get reports for a specific community (member reports)
   * Only accessible by community admins/moderators
   * @param communityId - The community ID
   * @param userId - The requesting user ID (must be admin/moderator)
   * @param options - Optional filters
   * @returns ServiceResult containing array of reports with member details
   */
  public async getCommunityMemberReports(
    communityId: string,
    userId: string,
    options?: {
      status?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<ServiceResult<{
    reports: Array<{
      id: string;
      target_id: string;
      reason: string;
      details: string | null;
      status: ReportStatus;
      created_at: string;
      updated_at: string;
      resolved_at: string | null;
      review_notes: string | null;
      reporter: {
        id: string;
        full_name: string;
        avatar_url: string | null;
      };
      reported_member: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
        points_count: number;
        report_count: number;
      };
    }>;
    total: number;
    page: number;
    pageSize: number;
  }>> {
    // First, verify the user is an admin or moderator of this community
    const { data: membership, error: membershipError } = await this.supabaseAdmin
      .from("community_members")
      .select("role")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      return ApiResponse.forbidden("You do not have permission to view reports for this community");
    }

    if (membership.role !== "admin" && membership.role !== "moderator") {
      return ApiResponse.forbidden("Only admins and moderators can view member reports");
    }

    // Get all members of this community to filter reports
    const { data: communityMembers, error: membersError } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id")
      .eq("community_id", communityId);

    if (membersError || !communityMembers) {
      return ApiResponse.error("Failed to fetch community members", 500);
    }

    const memberIds = communityMembers.map(m => m.user_id);

    if (memberIds.length === 0) {
      return ApiResponse.success({
        reports: [],
        total: 0,
        page: options?.page || 1,
        pageSize: options?.pageSize || 20,
      });
    }

    // Build query for member reports
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabaseAdmin
      .from("reports")
      .select(`
        id,
        target_id,
        reason,
        details,
        status,
        created_at,
        updated_at,
        resolved_at,
        review_notes,
        reporter:reporter_id (id, full_name, avatar_url)
      `, { count: "exact" })
      .eq("report_type", "member")
      .in("target_id", memberIds)
      .order("created_at", { ascending: false });

    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    const { data: reportsData, count, error: reportsError } = await query.range(from, to);

    if (reportsError) {
      console.error("Error fetching community reports:", reportsError);
      return ApiResponse.error("Failed to fetch reports", 500);
    }

    // Fetch detailed user information for reported members
    const reportedUserIds = [...new Set(reportsData?.map(r => r.target_id) || [])];
    
    const { data: usersData, error: usersError } = await this.supabaseAdmin
      .from("users")
      .select("id, full_name, email, avatar_url")
      .in("id", reportedUserIds);

    if (usersError) {
      console.error("Error fetching user data:", usersError);
      return ApiResponse.error("Failed to fetch user details", 500);
    }

    // Fetch points data for each user
    const { data: userPointsData } = await this.supabaseAdmin
      .from("user_points")
      .select("user_id, point_type")
      .in("user_id", reportedUserIds);

    // Count points and reports per user
    const userStatsMap: Record<string, { points_count: number; report_count: number }> = {};
    if (userPointsData) {
      userPointsData.forEach((record: any) => {
        if (!userStatsMap[record.user_id]) {
          userStatsMap[record.user_id] = { points_count: 0, report_count: 0 };
        }
        if (record.point_type === 'report_received') {
          userStatsMap[record.user_id].report_count += 1;
        } else {
          userStatsMap[record.user_id].points_count += 1;
        }
      });
    }

    // Map user data by ID for easy lookup
    const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

    // Enrich reports with user details
    const enrichedReports = reportsData?.map(report => {
      const stats = userStatsMap[report.target_id] || { points_count: 0, report_count: 0 };
      return {
        ...report,
        reporter: report.reporter as { id: string; full_name: string; avatar_url: string | null },
        reported_member: {
          id: report.target_id,
          full_name: usersMap.get(report.target_id)?.full_name || "Unknown User",
          email: usersMap.get(report.target_id)?.email || "",
          avatar_url: usersMap.get(report.target_id)?.avatar_url || null,
          points_count: stats.points_count,
          report_count: stats.report_count,
        },
      };
    }) || [];

    return ApiResponse.success({
      reports: enrichedReports,
      total: count || 0,
      page,
      pageSize,
    });
  }

  /**
   * Update report status (community admin action)
   * @param reportId - The report ID
   * @param communityId - The community ID (for permission check)
   * @param userId - The admin/moderator user ID
   * @param status - New status
   * @param reviewNotes - Optional review notes
   * @returns ServiceResult with updated report
   */
  public async updateReportStatus(
    reportId: string,
    communityId: string,
    userId: string,
    status: ReportStatus,
    reviewNotes?: string
  ): Promise<ServiceResult<{ message: string }>> {
    // Verify the user is an admin or moderator
    const { data: membership, error: membershipError } = await this.supabaseAdmin
      .from("community_members")
      .select("role")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      return ApiResponse.forbidden("You do not have permission to manage reports");
    }

    if (membership.role !== "admin" && membership.role !== "moderator") {
      return ApiResponse.forbidden("Only admins and moderators can update report status");
    }

    // Get the report to verify it's for this community
    const { data: report, error: reportError } = await this.supabaseAdmin
      .from("reports")
      .select("target_id, report_type, status")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      return ApiResponse.notFound("Report not found");
    }

    if (report.report_type !== "member") {
      return ApiResponse.badRequest("Only member reports can be managed by community admins");
    }

    // Verify the reported user is a member of this community
    const { data: memberCheck } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .eq("user_id", report.target_id)
      .single();

    if (!memberCheck) {
      return ApiResponse.forbidden("This report is not for a member of your community");
    }

    // Update the report
    const updateData: any = {
      status,
      reviewed_by: userId,
      review_notes: reviewNotes,
      updated_at: new Date().toISOString(),
    };

    if (status === "resolved" || status === "dismissed") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error: updateError } = await this.supabaseAdmin
      .from("reports")
      .update(updateData)
      .eq("id", reportId);

    if (updateError) {
      console.error("Error updating report:", updateError);
      return ApiResponse.error("Failed to update report status", 500);
    }

    // If resolved, add report penalty to user_points
    if (status === "resolved" && report.status !== "resolved") {
      await this.supabaseAdmin.from("user_points").insert({
        user_id: report.target_id,
        points: 1, // This will increment report_count via trigger
        point_type: "report_received",
        related_id: reportId,
        related_type: "report",
        description: reviewNotes || "Report upheld by community admin",
      });
    }

    return ApiResponse.success({ 
      message: `Report ${status === "resolved" ? "resolved" : status === "dismissed" ? "dismissed" : "updated"} successfully` 
    });
  }

  /**
   * Get user type
   * @param userId - The user ID
   * @returns ServiceResult containing user type or error
   */
  public async getUserType(userId: string): Promise<ServiceResult<string>> {
    const { data, error } = await this.supabaseAdmin
      .from("users")
      .select("user_type")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user type:", error);
      return ApiResponse.error("Failed to fetch user type", 500);
    }

    return ApiResponse.success(data.user_type);
  }
}

// Export singleton instance
export const reportService: ReportService = ReportService.getInstance();
