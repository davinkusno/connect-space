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

    // Get all approved members of this community to calculate threshold
    const { data: communityMembers, error: membersError } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .eq("status", "approved"); // Only count approved members

    if (membersError || !communityMembers) {
      return ApiResponse.error("Failed to fetch community members", 500);
    }

    const memberIds = communityMembers.map(m => m.user_id);
    const totalMembers = memberIds.length;

    if (totalMembers === 0) {
      return ApiResponse.success({
        reports: [],
        total: 0,
        page: options?.page || 1,
        pageSize: options?.pageSize || 20,
      });
    }

    // Calculate 30% threshold (minimum number of unique reporters needed)
    const threshold = Math.ceil(totalMembers * 0.3);
    
    // Get all reports for members of this community (before filtering by threshold)
    let allReportsQuery = this.supabaseAdmin
      .from("reports")
      .select(`
        id,
        target_id,
        report_type,
        reason,
        details,
        status,
        created_at,
        updated_at,
        resolved_at,
        review_notes,
        reporter_id
      `)
      .in("target_id", memberIds)
      .order("created_at", { ascending: false });

    if (options?.status && options.status !== "all") {
      allReportsQuery = allReportsQuery.eq("status", options.status);
    }

    const { data: allReports, error: allReportsError } = await allReportsQuery;

    if (allReportsError) {
      console.error("Error fetching all reports:", allReportsError);
      return ApiResponse.error("Failed to fetch reports", 500);
    }

    // Group reports by target_id and report_type, count unique reporters
    const reportGroups = new Map<string, {
      target_id: string;
      report_type: string;
      unique_reporters: Set<string>;
      reports: any[];
    }>();

    (allReports || []).forEach((report: any) => {
      const key = `${report.report_type}_${report.target_id}`;
      if (!reportGroups.has(key)) {
        reportGroups.set(key, {
          target_id: report.target_id,
          report_type: report.report_type,
          unique_reporters: new Set<string>(),
          reports: [],
        });
      }
      const group = reportGroups.get(key)!;
      // Only count reporters who are members of the community
      if (memberIds.includes(report.reporter_id)) {
        group.unique_reporters.add(report.reporter_id);
      }
      group.reports.push(report);
    });

    // Filter: Only keep reports where unique_reporters >= threshold
    const filteredReports: any[] = [];
    reportGroups.forEach((group) => {
      if (group.unique_reporters.size >= threshold) {
        // Add all reports for this target (they all meet the threshold)
        filteredReports.push(...group.reports);
      }
    });

    // Sort by created_at descending
    filteredReports.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply pagination
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedReports = filteredReports.slice(from, to);
    const totalCount = filteredReports.length;

    // Get reporter information for paginated reports
    const reporterIds = [...new Set(paginatedReports.map((r: any) => r.reporter_id))];
    const { data: reportersData } = await this.supabaseAdmin
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", reporterIds);

    const reportersMap = new Map(reportersData?.map(r => [r.id, r]) || []);

    // Create a map of report counts per target for display
    const reportCountsMap = new Map<string, number>();
    reportGroups.forEach((group, key) => {
      if (group.unique_reporters.size >= threshold) {
        reportCountsMap.set(key, group.unique_reporters.size);
      }
    });

    // Enrich reports with reporter info
    const reportsData = paginatedReports.map((report: any) => {
      const key = `${report.report_type}_${report.target_id}`;
      const reporterCount = reportCountsMap.get(key) || 0;
      
      return {
        ...report,
        reporter: reportersMap.get(report.reporter_id) || {
          id: report.reporter_id,
          full_name: "Unknown",
          avatar_url: null,
        },
        reporter_count: reporterCount,
        threshold_met: true, // All reports shown here meet the threshold
      };
    });

    // Fetch detailed user information for reported members (only for member reports)
    const memberReportTargets = reportsData
      .filter((r: any) => r.report_type === "member")
      .map((r: any) => r.target_id);
    const reportedUserIds = [...new Set(memberReportTargets)];
    
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

    // Enrich reports with user details (only for member reports)
    const enrichedReports = reportsData.map((report: any) => {
      if (report.report_type === "member") {
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
      } else {
        // For non-member reports, return as-is (reporter_count and threshold_met already included)
        return report;
      }
    });

    return ApiResponse.success({
      reports: enrichedReports,
      total: totalCount,
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

  /**
   * Ban a user from a community
   * @param communityId - The community ID
   * @param userId - The user ID to ban
   * @param adminUserId - The admin performing the ban
   * @param reason - The reason for the ban
   * @param reportId - Optional report ID that led to this ban
   * @returns ServiceResult indicating success or failure
   */
  public async banUserFromCommunity(
    communityId: string,
    userId: string,
    adminUserId: string,
    reason: string,
    reportId?: string
  ): Promise<ServiceResult<{ message: string }>> {
    // Verify the user is an admin or moderator
    const { data: membership, error: membershipError } = await this.supabaseAdmin
      .from("community_members")
      .select("role")
      .eq("community_id", communityId)
      .eq("user_id", adminUserId)
      .single();

    if (membershipError || !membership) {
      return ApiResponse.forbidden("You do not have permission to ban users");
    }

    if (membership.role !== "admin" && membership.role !== "moderator") {
      return ApiResponse.forbidden("Only admins and moderators can ban users");
    }

    // Check if user is the community creator (cannot ban creator)
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single();

    if (community && community.creator_id === userId) {
      return ApiResponse.forbidden("Cannot ban the community creator");
    }

    // Remove user from community if they are a member
    const { error: removeError } = await this.supabaseAdmin
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", userId);

    if (removeError) {
      console.error("Error removing user from community:", removeError);
      // Continue anyway - user might not be a member
    }

    // Check if user is already banned
    const { data: existingBan } = await this.supabaseAdmin
      .from("community_bans")
      .select("id")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingBan) {
      return ApiResponse.success({ message: "User is already banned from this community" });
    }

    // Create ban record
    const { error: banError } = await this.supabaseAdmin
      .from("community_bans")
      .insert({
        community_id: communityId,
        user_id: userId,
        banned_by: adminUserId,
        reason,
        report_id: reportId || null,
      });

    if (banError) {
      console.error("Error creating ban:", banError);
      return ApiResponse.error("Failed to ban user", 500);
    }

    return ApiResponse.success({ 
      message: "User has been banned from the community and removed from membership" 
    });
  }

  /**
   * Check if a user is banned from a community
   * @param communityId - The community ID
   * @param userId - The user ID to check
   * @returns ServiceResult with ban status
   */
  public async isUserBannedFromCommunity(
    communityId: string,
    userId: string
  ): Promise<ServiceResult<{ isBanned: boolean; ban?: { reason: string; created_at: string } }>> {
    const { data: ban, error } = await this.supabaseAdmin
      .from("community_bans")
      .select("reason, created_at")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking ban status:", error);
      return ApiResponse.error("Failed to check ban status", 500);
    }

    return ApiResponse.success({
      isBanned: !!ban,
      ban: ban || undefined,
    });
  }
}

// Export singleton instance
export const reportService: ReportService = ReportService.getInstance();
