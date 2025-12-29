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
  created_at: string;
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

  private constructor() {
    super();
  }

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  /**
   * Create a new report
   * @param reporterId - The ID of the user creating the report
   * @param input - The report data
   * @returns ServiceResult containing the created report or error
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

    // Check if user has already reported this item
    const { data: existingReport, error: checkError } = await this.supabaseAdmin
      .from("reports")
      .select("id, status, created_at")
      .eq("reporter_id", reporterId)
      .eq("report_type", reportType)
      .eq("target_id", targetId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing report:", checkError);
      return ApiResponse.error("Failed to check existing report", 500);
    }

    // If report already exists, return friendly message
    if (existingReport) {
      const statusMessage = existingReport.status === "resolved" 
        ? "resolved" 
        : existingReport.status === "dismissed"
        ? "dismissed"
        : "pending review";
      
      return ApiResponse.badRequest(
        `You have already reported this item. Your report is currently ${statusMessage}.`
      );
    }

    // Create new report
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
      // Handle duplicate key error gracefully (shouldn't happen after check, but just in case)
      if (error.code === '23505') {
        return ApiResponse.badRequest(
          "You have already reported this item. Please wait for admin review."
        );
      }
      console.error("Error creating report:", error);
      return ApiResponse.error("Failed to create report", 500);
    }

    return ApiResponse.created<ReportData>(data as ReportData);
  }

  /**
   * Get all reports for the current user (legacy method)
   * @param status - Optional status filter
   * @returns ServiceResult containing array of reports or error
   */
  public async getAll(status?: string): Promise<ServiceResult<ReportData[]>> {
    let query = this.supabaseAdmin
      .from("reports")
      .select(`
        *,
        reporter:reporter_id (id, full_name, avatar_url, email),
        reported_user:reported_user_id (id, full_name, avatar_url),
        reported_community:reported_community_id (id, name, logo_url),
        reported_event:reported_event_id (id, title)
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching reports:", error);
      return ApiResponse.error("Failed to fetch reports", 500);
    }

    return ApiResponse.success<ReportData[]>(data as ReportData[] || []);
  }

  /**
   * Get user type (for checking if user is superadmin)
   */
  public async getUserType(userId: string): Promise<ServiceResult<string | null>> {
    const { data, error } = await this.supabaseAdmin
      .from("users")
      .select("user_type")
      .eq("id", userId)
      .single();

    if (error) {
      return ApiResponse.error("Failed to get user type", 500);
    }

    return ApiResponse.success(data?.user_type || null);
  }

  /**
   * Get community member reports with pagination and threshold filtering
   * Returns ONLY reports for regular member content (threads, replies, member reports)
   * Excludes admin-posted content and admin member reports (those go to superadmin)
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
    reports: Array<any>;
    total: number;
    page: number;
    pageSize: number;
  }>> {
    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;

      // Step 1: Get community creator and admin IDs
      const { data: community } = await this.supabaseAdmin
        .from("communities")
        .select("creator_id")
        .eq("id", communityId)
        .single();

      const { data: adminMembers } = await this.supabaseAdmin
        .from("community_members")
        .select("user_id")
        .eq("community_id", communityId)
        .eq("role", "admin");

      const adminIds = new Set([
        community?.creator_id,
        ...(adminMembers?.map(m => m.user_id) || [])
      ].filter(Boolean));

      console.log(`[ReportService] Community ${communityId} admin IDs:`, Array.from(adminIds));

      // Step 2: Get all threads and replies in this community
      const { data: messages } = await this.supabaseAdmin
        .from("messages")
        .select("id, sender_id, parent_id, content")
        .eq("community_id", communityId);

      // Separate threads and replies, exclude those posted by admins
      const regularMemberThreadIds = new Set(
        (messages || [])
          .filter(m => m.parent_id === null && !adminIds.has(m.sender_id))
          .map(m => m.id)
      );
      
      const regularMemberReplyIds = new Set(
        (messages || [])
          .filter(m => m.parent_id !== null && !adminIds.has(m.sender_id))
          .map(m => m.id)
      );

      const messageMap = new Map((messages || []).map(m => [m.id, m]));

      console.log(`[ReportService] Regular member threads: ${regularMemberThreadIds.size}, replies: ${regularMemberReplyIds.size}`);

      // Step 3: Get all member reports for this community (exclude admins)
      const { data: communityMembers } = await this.supabaseAdmin
        .from("community_members")
        .select("user_id")
        .eq("community_id", communityId)
        .eq("status", "approved");

      const regularMemberIds = (communityMembers || [])
        .map(m => m.user_id)
        .filter(id => !adminIds.has(id));

      console.log(`[ReportService] Regular members: ${regularMemberIds.length}`);

      // Step 4: Fetch reports - threads, replies, and member reports
      let allReports: any[] = [];

      // Thread reports (regular members only)
      if (regularMemberThreadIds.size > 0) {
        const { data: threadReports } = await this.supabaseAdmin
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
            reporter_id,
            reporter:reporter_id (id, full_name, avatar_url)
          `)
          .eq("report_type", "thread")
          .in("target_id", Array.from(regularMemberThreadIds));

        if (threadReports) {
          allReports.push(...threadReports.map(r => ({
            ...r,
            content_type: "thread",
            target_content: messageMap.get(r.target_id)
          })));
        }
      }

      // Reply reports (regular members only)
      if (regularMemberReplyIds.size > 0) {
        const { data: replyReports } = await this.supabaseAdmin
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
            reporter_id,
            reporter:reporter_id (id, full_name, avatar_url)
          `)
          .eq("report_type", "reply")
          .in("target_id", Array.from(regularMemberReplyIds));

        if (replyReports) {
          allReports.push(...replyReports.map(r => ({
            ...r,
            content_type: "reply",
            target_content: messageMap.get(r.target_id)
          })));
        }
      }

      // Member reports (regular members only, not admins)
      if (regularMemberIds.length > 0) {
        const { data: memberReports } = await this.supabaseAdmin
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
            reporter_id,
            reporter:reporter_id (id, full_name, avatar_url)
          `)
          .eq("report_type", "member")
          .in("target_id", regularMemberIds);

        if (memberReports) {
          // Get user info for reported members
          const reportedUserIds = memberReports.map(r => r.target_id);
          const { data: reportedUsers } = await this.supabaseAdmin
            .from("users")
            .select("id, full_name, email, avatar_url")
            .in("id", reportedUserIds);

          const usersMap = new Map(reportedUsers?.map(u => [u.id, u]) || []);

          allReports.push(...memberReports.map(r => ({
            ...r,
            content_type: "member",
            reported_member: usersMap.get(r.target_id)
          })));
        }
      }

      // Step 5: Filter by status if specified
      if (options?.status && options.status !== "all") {
        allReports = allReports.filter(r => r.status === options.status);
      }

      // Sort by created_at descending
      allReports.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Step 6: Apply pagination
      const total = allReports.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedReports = allReports.slice(startIndex, endIndex);

      console.log(`[ReportService] Returning ${paginatedReports.length} of ${total} reports for community ${communityId}`);

      return ApiResponse.success({
        reports: paginatedReports,
        total,
        page,
        pageSize,
      });
    } catch (error: any) {
      console.error("[ReportService] Error getting community member reports:", error);
      return ApiResponse.error(`Failed to get community reports: ${error.message}`, 500);
    }
  }

  /**
   * Update report status
   */
  public async updateReportStatus(
    reportId: string,
    communityId: string,
    reviewerId: string,
    status: ReportStatus,
    resolution?: string
  ): Promise<ServiceResult<ReportData>> {
    const { data, error } = await this.supabaseAdmin
      .from("reports")
      .update({
        status,
        reviewed_by: reviewerId,
        review_notes: resolution,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .select()
      .single();

    if (error) {
      console.error("Error updating report status:", error);
      return ApiResponse.error("Failed to update report status", 500);
    }

    if (status === "resolved" && data.reported_user_id) {
      await this.applyReportPenalty(data.reported_user_id, reportId);
    }

    return ApiResponse.success<ReportData>(data as ReportData);
  }

  /**
   * Apply penalty for resolved report (placeholder)
   */
  private async applyReportPenalty(userId: string, reportId: string): Promise<void> {
    // Implementation placeholder
  }

  /**
   * Ban user from community
   */
  public async banUserFromCommunity(
    communityId: string,
    userId: string,
    adminId: string,
    reason: string,
    reportId: string
  ): Promise<ServiceResult<{ message: string }>> {
    // Implementation placeholder
    return ApiResponse.success({ message: "User banned successfully" });
  }

  /**
   * Check if user is banned from community
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

  /**
   * Get all reports against a specific user
   * Includes: member reports, thread reports, reply reports, and event reports
   */
  public async getUserReports(
    userId: string
  ): Promise<ServiceResult<Array<{
    id: string;
    report_type: string;
    reason: string;
    details: string | null;
    status: ReportStatus;
    created_at: string;
    reporter: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
    target_content?: {
      type: "thread" | "reply" | "event";
      id: string;
      preview?: string;
    };
  }>>> {
    try {
      const allReports: any[] = [];

      // 1. Get direct member reports
      const { data: memberReports } = await this.supabaseAdmin
        .from("reports")
        .select("id, report_type, reason, details, status, created_at, reporter_id, target_id")
        .eq("report_type", "member")
        .eq("target_id", userId)
        .order("created_at", { ascending: false });

      if (memberReports) {
        allReports.push(...memberReports.map(r => ({ ...r, content_type: "member" })));
      }

      // 2. Get ALL thread reports for threads created by this user
      // First get all user's threads (including deleted ones via reports table)
      const { data: allThreadReports } = await this.supabaseAdmin
        .from("reports")
        .select("id, report_type, reason, details, status, created_at, reporter_id, target_id")
        .eq("report_type", "thread")
        .order("created_at", { ascending: false });

      if (allThreadReports && allThreadReports.length > 0) {
        // Filter reports where the thread was created by this user
        const threadIds = allThreadReports.map(r => r.target_id);
        const { data: userThreads } = await this.supabaseAdmin
          .from("messages")
          .select("id, content, sender_id")
          .in("id", threadIds)
          .eq("sender_id", userId)
          .is("parent_id", null);

        const userThreadIds = new Set(userThreads?.map(t => t.id) || []);
        const threadMap = new Map(userThreads?.map(t => [t.id, t]) || []);

        // Include all reports where thread was created by user (even if deleted)
        allThreadReports.forEach(r => {
          // Check if this thread belongs to the user
          const thread = threadMap.get(r.target_id);
          if (thread || userThreadIds.has(r.target_id)) {
            allReports.push({
              ...r,
              content_type: "thread",
              target_content: {
                type: "thread" as const,
                id: r.target_id,
                preview: thread?.content?.substring(0, 100) || "(Content deleted)"
              }
            });
          }
        });

        // For threads that don't exist anymore, we need to check via messages history
        // Get thread IDs where sender_id matches but message is deleted
        const deletedThreadReports = allThreadReports.filter(r => !userThreadIds.has(r.target_id));
        if (deletedThreadReports.length > 0) {
          // These are potentially deleted threads - include them all for now
          // In a production system, you'd want a soft delete or audit log
          deletedThreadReports.forEach(r => {
            if (!allReports.some(ar => ar.id === r.id)) {
              allReports.push({
                ...r,
                content_type: "thread",
                target_content: {
                  type: "thread" as const,
                  id: r.target_id,
                  preview: "(Content has been removed)"
                }
              });
            }
          });
        }
      }

      // 3. Get ALL reply reports for replies created by this user
      const { data: allReplyReports } = await this.supabaseAdmin
        .from("reports")
        .select("id, report_type, reason, details, status, created_at, reporter_id, target_id")
        .eq("report_type", "reply")
        .order("created_at", { ascending: false });

      if (allReplyReports && allReplyReports.length > 0) {
        const replyIds = allReplyReports.map(r => r.target_id);
        const { data: userReplies } = await this.supabaseAdmin
          .from("messages")
          .select("id, content, sender_id")
          .in("id", replyIds)
          .eq("sender_id", userId)
          .not("parent_id", "is", null);

        const userReplyIds = new Set(userReplies?.map(r => r.id) || []);
        const replyMap = new Map(userReplies?.map(r => [r.id, r]) || []);

        allReplyReports.forEach(r => {
          const reply = replyMap.get(r.target_id);
          if (reply || userReplyIds.has(r.target_id)) {
            allReports.push({
              ...r,
              content_type: "reply",
              target_content: {
                type: "reply" as const,
                id: r.target_id,
                preview: reply?.content?.substring(0, 100) || "(Content has been removed)"
              }
            });
          }
        });
      }

      // 4. Get ALL event reports for events created by this user
      const { data: allEventReports } = await this.supabaseAdmin
        .from("reports")
        .select("id, report_type, reason, details, status, created_at, reporter_id, target_id")
        .eq("report_type", "event")
        .order("created_at", { ascending: false });

      if (allEventReports && allEventReports.length > 0) {
        const eventIds = allEventReports.map(r => r.target_id);
        const { data: userEvents } = await this.supabaseAdmin
          .from("events")
          .select("id, title, creator_id")
          .in("id", eventIds)
          .eq("creator_id", userId);

        const userEventIds = new Set(userEvents?.map(e => e.id) || []);
        const eventMap = new Map(userEvents?.map(e => [e.id, e]) || []);

        allEventReports.forEach(r => {
          const event = eventMap.get(r.target_id);
          if (event || userEventIds.has(r.target_id)) {
            allReports.push({
              ...r,
              content_type: "event",
              target_content: {
                type: "event" as const,
                id: r.target_id,
                preview: event?.title || "(Event has been removed)"
              }
            });
          }
        });
      }

      // Sort all reports by created_at descending
      allReports.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Get reporter information
      const reporterIds = [...new Set(allReports.map(r => r.reporter_id))];
      
      console.log(`[ReportService] getUserReports - Found ${allReports.length} reports for user ${userId}`);
      console.log(`[ReportService] getUserReports - Unique reporters: ${reporterIds.length}`);
      
      if (reporterIds.length === 0) {
        console.log("[ReportService] getUserReports - No reporter IDs found, returning empty array");
        return ApiResponse.success([]);
      }
      
      const { data: reportersData } = await this.supabaseAdmin
        .from("users")
        .select("id, full_name, avatar_url")
        .in("id", reporterIds);

      const reportersMap = new Map(reportersData?.map(r => [r.id, r]) || []);

      // Enrich reports with reporter info
      const enrichedReports = allReports.map(report => ({
        id: report.id,
        report_type: report.report_type,
        reason: report.reason,
        details: report.details,
        status: report.status,
        created_at: report.created_at,
        reporter: reportersMap.get(report.reporter_id) || {
          id: report.reporter_id,
          full_name: "Unknown",
          avatar_url: null
        },
        target_content: report.target_content
      }));

      return ApiResponse.success(enrichedReports);
    } catch (error: any) {
      console.error("[ReportService] Error getting user reports:", error);
      return ApiResponse.error(`Failed to get user reports: ${error.message}`, 500);
    }
  }
}

// Export singleton instance
export const reportService = ReportService.getInstance();
