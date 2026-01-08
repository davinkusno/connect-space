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

      // Step 2: Get all messages in this community (for content preview and filtering)
      const { data: messages } = await this.supabaseAdmin
        .from("messages")
        .select("id, sender_id, parent_id, content, community_id")
        .eq("community_id", communityId);

      const messageMap = new Map((messages || []).map(m => [m.id, m]));
      
      // Get IDs of messages from regular members (not admins)
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

      console.log(`[ReportService] Regular member threads: ${regularMemberThreadIds.size}, replies: ${regularMemberReplyIds.size}`);

      // Step 3: Fetch reports for this community's content
      let allReports: any[] = [];

      // Fetch thread reports - filter by community_id or by existing message IDs
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
          reported_community_id,
          reporter:reporter_id (id, full_name, avatar_url)
        `)
        .eq("report_type", "thread");

      if (threadReports) {
        for (const report of threadReports) {
          const content = messageMap.get(report.target_id);
          
          // Include if: content exists in this community AND posted by regular member
          // OR report has reported_community_id set to this community (for deleted content)
          if (content && content.community_id === communityId && !adminIds.has(content.sender_id)) {
            const targetName = content.content 
              ? (content.content.substring(0, 50) + (content.content.length > 50 ? "..." : ""))
              : "Thread";
            
            allReports.push({
              ...report,
              content_type: "thread",
              target_content: content,
              target_name: targetName
            });
          } else if (!content && report.reported_community_id === communityId) {
            // Content deleted but report belongs to this community
            allReports.push({
              ...report,
              content_type: "thread",
              target_content: null,
              target_name: "Thread (deleted)"
            });
          }
        }
      }

      // Fetch reply reports
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
          reported_community_id,
          reporter:reporter_id (id, full_name, avatar_url)
        `)
        .eq("report_type", "reply");

      if (replyReports) {
        for (const report of replyReports) {
          const content = messageMap.get(report.target_id);
          
          if (content && content.community_id === communityId && !adminIds.has(content.sender_id)) {
            const targetName = content.content 
              ? (content.content.substring(0, 50) + (content.content.length > 50 ? "..." : ""))
              : "Reply";
            
            allReports.push({
              ...report,
              content_type: "reply",
              target_content: content,
              target_name: targetName
            });
          } else if (!content && report.reported_community_id === communityId) {
            // Content deleted but report belongs to this community
            allReports.push({
              ...report,
              content_type: "reply",
              target_content: null,
              target_name: "Reply (deleted)"
            });
          }
        }
      }

      console.log(`[ReportService] Found ${allReports.length} thread/reply reports`);

      // Step 4: Get all member reports for this community (exclude admins)
      const { data: communityMembers } = await this.supabaseAdmin
        .from("community_members")
        .select("user_id")
        .eq("community_id", communityId)
        .eq("status", "approved");

      const regularMemberIds = (communityMembers || [])
        .map(m => m.user_id)
        .filter(id => !adminIds.has(id));

      console.log(`[ReportService] Regular members: ${regularMemberIds.length}`);

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

          allReports.push(...memberReports.map(r => {
            const user = usersMap.get(r.target_id);
            return {
              ...r,
              content_type: "member",
              reported_member: user,
              target_name: user?.full_name || "User (not found)"
            };
          }));
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

  /**
   * Get all reports for superadmin view
   * Returns community reports, event reports, and threads/replies by ADMINS only
   * @param options - Query options with status filter and pagination
   * @returns ServiceResult containing paginated reports
   */
  public async getSuperadminReports(options?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<{ reports: any[]; total: number }>> {
    try {
      // STEP 1: Fetch community and event reports (admin-level reports)
      let query = this.supabaseAdmin
        .from("reports")
        .select(`
          *,
          reporter:reporter_id (id, full_name, avatar_url, email)
        `)
        .in("report_type", ["community", "event"])
        .order("created_at", { ascending: false });

      if (options?.status && options.status !== "all") {
        query = query.eq("status", options.status);
      }

      const { data: adminReports, error } = await query;

      if (error) {
        return ApiResponse.error("Failed to fetch reports", 500);
      }

      // STEP 2: Fetch thread and reply reports, but only those posted by admins
      const { data: allThreadReplyReports } = await this.supabaseAdmin
        .from("reports")
        .select(`
          *,
          reporter:reporter_id (id, full_name, avatar_url, email)
        `)
        .in("report_type", ["thread", "reply"])
        .order("created_at", { ascending: false });

      // Filter thread/reply reports to only include admin-posted content
      const threadReplyIds = (allThreadReplyReports || []).map(r => r.target_id);
      
      let adminPostedReports: any[] = [];
      if (threadReplyIds.length > 0) {
        // Get all messages with their community info
        const { data: messages } = await this.supabaseAdmin
          .from("messages")
          .select("id, sender_id, community_id, parent_id")
          .in("id", threadReplyIds);

        if (messages && messages.length > 0) {
          // Get community info to identify admins
          const communityIds = [...new Set(messages.map(m => m.community_id))];
          const { data: communities } = await this.supabaseAdmin
            .from("communities")
            .select("id, creator_id")
            .in("id", communityIds);

          const { data: adminMembers } = await this.supabaseAdmin
            .from("community_members")
            .select("user_id, community_id")
            .in("community_id", communityIds)
            .eq("role", "admin");

          // Build admin lookup: communityId -> Set of admin user IDs
          const communityAdmins = new Map<string, Set<string>>();
          
          for (const comm of communities || []) {
            const admins = new Set<string>();
            admins.add(comm.creator_id); // Creator is always admin
            
            (adminMembers || [])
              .filter(m => m.community_id === comm.id)
              .forEach(m => admins.add(m.user_id));
            
            communityAdmins.set(comm.id, admins);
          }

          // Filter reports where sender is admin in that community
          const messageMap = new Map(messages.map(m => [m.id, m]));
          
          adminPostedReports = (allThreadReplyReports || []).filter(report => {
            const message = messageMap.get(report.target_id);
            if (!message) return false;
            
            const admins = communityAdmins.get(message.community_id);
            return admins && admins.has(message.sender_id);
          });
        }
      }

      // Combine admin reports with admin-posted thread/reply reports
      const allReports = [...(adminReports || []), ...adminPostedReports];

      if (!allReports || allReports.length === 0) {
        return ApiResponse.success({ reports: [], total: 0 });
      }

      // STEP 3: Group reports by target_id + report_type
      const groupMap = new Map<string, any[]>();

      for (const report of allReports) {
        const groupKey = `${report.report_type}|${report.target_id}`;
        
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, []);
        }
        
        groupMap.get(groupKey)!.push(report);
      }

      // STEP 4: Create group objects with aggregated data
      const groups: any[] = [];
      
      for (const [groupKey, reportsInGroup] of groupMap.entries()) {
        const [reportType, targetId] = groupKey.split('|');
        
        // Sort by date to get the latest
        reportsInGroup.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const latestReport = reportsInGroup[0];
        const uniqueReporterIds = new Set(reportsInGroup.map(r => r.reporter_id));
        
        groups.push({
          id: latestReport.id,
          report_type: reportType,
          target_id: targetId,
          report_count: reportsInGroup.length,
          unique_reporters: uniqueReporterIds.size,
          reports: reportsInGroup,
          created_at: latestReport.created_at,
          status: latestReport.status,
          reporter: latestReport.reporter,
          reporter_id: latestReport.reporter_id,
          reason: latestReport.reason,
          description: latestReport.description,
        });
      }

      // Sort groups by latest report date
      groups.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // STEP 5: Paginate the groups
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      const paginatedGroups = groups.slice(startIndex, endIndex);

      // STEP 6: Enrich each group with target details
      const enrichedGroups = await Promise.all(
        paginatedGroups.map(async (group) => {
          let targetName = "Unknown";
          let targetData: any = {};
          let communityId: string | null = null;

          try {
            if (group.report_type === "community") {
              const { data: community } = await this.supabaseAdmin
                .from("communities")
                .select("id, name, logo_url, status, banned_at, ban_reason")
                .eq("id", group.target_id)
                .single();
              
              if (community) {
                targetName = community.name;
                targetData.reported_community = community;
                communityId = community.id;
              }
            }
            else if (group.report_type === "event") {
              const { data: event } = await this.supabaseAdmin
                .from("events")
                .select("id, title, community_id")
                .eq("id", group.target_id)
                .single();
              
              if (event) {
                targetName = event.title;
                targetData.reported_event = event;
                communityId = event.community_id;
              }
            }
            else if (group.report_type === "thread") {
              const { data: thread } = await this.supabaseAdmin
                .from("messages")
                .select("id, content, community_id")
                .eq("id", group.target_id)
                .is("parent_id", null)
                .single();
              
              if (thread) {
                targetName = thread.content?.substring(0, 50) + 
                  (thread.content && thread.content.length > 50 ? "..." : "");
                communityId = thread.community_id;
                
                if (communityId) {
                  const { data: community } = await this.supabaseAdmin
                    .from("communities")
                    .select("id, name")
                    .eq("id", communityId)
                    .single();
                  
                  targetData.reported_thread = {
                    ...thread,
                    communities: community
                  };
                } else {
                  targetData.reported_thread = thread;
                }
              } else {
                targetName = "Thread (deleted or not found)";
              }
            }
            else if (group.report_type === "reply") {
              const { data: reply } = await this.supabaseAdmin
                .from("messages")
                .select("id, content, parent_id, community_id")
                .eq("id", group.target_id)
                .not("parent_id", "is", null)
                .single();
              
              if (reply) {
                targetName = reply.content?.substring(0, 50) + 
                  (reply.content && reply.content.length > 50 ? "..." : "");
                communityId = reply.community_id;
                
                let parentData = null;
                if (reply.parent_id) {
                  const { data: parent } = await this.supabaseAdmin
                    .from("messages")
                    .select("id, community_id")
                    .eq("id", reply.parent_id)
                    .single();
                  
                  if (parent && parent.community_id) {
                    const { data: community } = await this.supabaseAdmin
                      .from("communities")
                      .select("id, name")
                      .eq("id", parent.community_id)
                      .single();
                    
                    parentData = {
                      ...parent,
                      communities: community
                    };
                  }
                }
                
                targetData.reported_reply = {
                  ...reply,
                  parent: parentData
                };
              } else {
                targetName = "Reply (deleted or not found)";
              }
            }
          } catch (err) {
            console.error(`[ReportService] Error enriching ${group.report_type} ${group.target_id}:`, err);
          }

          return {
            ...group,
            ...targetData,
            target_name: targetName,
            community_id: communityId,
          };
        })
      );

      return ApiResponse.success({
        reports: enrichedGroups,
        total: groups.length,
      });

    } catch (error) {
      console.error('[ReportService] Unexpected error in getSuperadminReports:', error);
      return ApiResponse.error("Failed to fetch reports", 500);
    }
  }

  /**
   * Get all reports with 30% threshold information
   * @param options - Query options with status filter
   * @returns ServiceResult containing all reports and review queue
   */
  public async getMemberReportsWithThreshold(options?: {
    status?: string;
  }): Promise<ServiceResult<{
    allReports: any[];
    reviewQueue: any[];
    totalAll: number;
    totalReview: number;
  }>> {
    try {
      // Get ALL reports (all types)
      const { data: allReports, error: reportsError } = await this.supabaseAdmin
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
          reporter:reporter_id (id, full_name, avatar_url, email)
        `)
        .order("created_at", { ascending: false });

      if (reportsError) {
        console.error("Error fetching reports:", reportsError);
        return ApiResponse.error("Failed to fetch reports", 500);
      }

      // Get all communities to calculate thresholds
      const { data: communities, error: communitiesError } = await this.supabaseAdmin
        .from("communities")
        .select("id, name");

      if (communitiesError) {
        return ApiResponse.error("Failed to fetch communities", 500);
      }

      // For each community, get member count and calculate 30% threshold
      const communityThresholds = new Map<string, { threshold: number; name: string; memberCount: number }>();
      
      for (const community of communities || []) {
        const { count: memberCount } = await this.supabaseAdmin
          .from("community_members")
          .select("user_id", { count: "exact", head: true })
          .eq("community_id", community.id)
          .eq("status", "approved");

        const threshold = Math.ceil((memberCount || 0) * 0.3);
        communityThresholds.set(community.id, { 
          threshold, 
          name: community.name,
          memberCount: memberCount || 0
        });
      }

      // Group reports by target_id and report_type to count unique reporters
      const reportGroups = new Map<string, {
        reports: any[];
        uniqueReporters: Set<string>;
        communityId: string | null;
      }>();

      for (const report of allReports || []) {
        const key = `${report.report_type}-${report.target_id}`;
        
        if (!reportGroups.has(key)) {
          let communityId: string | null = null;
          
          if (report.report_type === "member") {
            const { data: memberCommunities } = await this.supabaseAdmin
              .from("community_members")
              .select("community_id")
              .eq("user_id", report.target_id)
              .eq("status", "approved")
              .limit(1);
            communityId = memberCommunities?.[0]?.community_id || null;
          } else if (report.report_type === "event") {
            const { data: event } = await this.supabaseAdmin
              .from("events")
              .select("community_id")
              .eq("id", report.target_id)
              .single();
            communityId = event?.community_id || null;
          } else if (report.report_type === "thread" || report.report_type === "reply") {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isValidUUID = uuidRegex.test(report.target_id) || report.target_id.length === 32;
            
            if (isValidUUID) {
              const { data: message, error: messageError } = await this.supabaseAdmin
                .from("messages")
                .select("community_id")
                .eq("id", report.target_id)
                .single();
              
              if (messageError && messageError.code !== '22P02') {
                console.error(`[ReportService] Error fetching ${report.report_type} ${report.target_id} for community context:`, messageError);
              }
              
              communityId = message?.community_id || null;
            } else {
              console.error(`[ReportService] ⚠️ Invalid UUID format for ${report.report_type} target_id: "${report.target_id}" (report ${report.id}). Skipping community context fetch.`);
              communityId = null;
            }
          } else if (report.report_type === "community") {
            communityId = report.target_id;
          }
          
          reportGroups.set(key, {
            reports: [],
            uniqueReporters: new Set(),
            communityId,
          });
        }
        
        const group = reportGroups.get(key)!;
        group.reports.push(report);
        group.uniqueReporters.add(report.reporter_id);
      }

      // Enrich reports with target data and threshold information
      const enrichedAllReports: any[] = [];
      const enrichedReviewQueue: any[] = [];

      for (const [key, group] of reportGroups.entries()) {
        const [reportType, ...targetIdParts] = key.split('-');
        const targetId = targetIdParts.join('-');
        const reportCount = group.uniqueReporters.size;
        const communityInfo = group.communityId ? communityThresholds.get(group.communityId) : null;
        const threshold = communityInfo?.threshold || 0;
        const thresholdMet = threshold > 0 && reportCount >= threshold;

        // Get target data based on report type
        let targetData: any = null;
        let targetName = "Unknown";
        
        if (reportType === "member") {
          const { data: member } = await this.supabaseAdmin
            .from("users")
            .select("id, full_name, email, avatar_url")
            .eq("id", targetId)
            .single();
          targetData = member;
          targetName = member?.full_name || "Unknown Member";
        } else if (reportType === "community") {
          const { data: community } = await this.supabaseAdmin
            .from("communities")
            .select("id, name, logo_url, status, banned_at, ban_reason")
            .eq("id", targetId)
            .single();
          targetData = community;
          targetName = community?.name || "Unknown Community";
        } else if (reportType === "event") {
          const { data: event } = await this.supabaseAdmin
            .from("events")
            .select("id, title")
            .eq("id", targetId)
            .single();
          targetData = event;
          targetName = event?.title || "Unknown Event";
        } else if (reportType === "thread" || reportType === "reply") {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const isValidUUID = uuidRegex.test(targetId) || targetId.length === 32;
          
          if (!isValidUUID) {
            console.error(`[ReportService] ⚠️ Invalid UUID format for ${reportType} target_id: "${targetId}". This is a data integrity issue.`);
            targetName = `${reportType === "thread" ? "Thread" : "Reply"} (invalid ID: ${targetId})`;
            targetData = null;
          } else {
            const { data: message, error: messageError } = await this.supabaseAdmin
              .from("messages")
              .select("id, content")
              .eq("id", targetId)
              .single();
            
            if (messageError) {
              if (messageError.code === '22P02') {
                console.error(`[ReportService] ⚠️ Invalid UUID format in database for ${reportType} ${targetId}:`, messageError.message);
                targetName = `${reportType === "thread" ? "Thread" : "Reply"} (invalid ID format: ${targetId})`;
              } else {
                console.error(`[ReportService] Error fetching ${reportType} ${targetId}:`, messageError);
                targetName = `${reportType === "thread" ? "Thread" : "Reply"} (error fetching)`;
              }
            } else if (!message) {
              console.warn(`[ReportService] ${reportType} ${targetId} not found. Message may have been deleted.`);
              targetName = `${reportType === "thread" ? "Thread" : "Reply"} (deleted or not found)`;
            } else if (message.content) {
              targetName = message.content.length > 50 
                ? message.content.substring(0, 50) + "..." 
                : message.content;
            } else {
              targetName = `${reportType === "thread" ? "Thread" : "Reply"} (no content)`;
            }
            
            targetData = message;
          }
        }

        // Sort reports by date (latest first)
        const sortedReports = group.reports.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const finalCommunityName = reportType === "community" && targetData?.name
          ? targetData.name
          : communityInfo?.name || "Unknown Community";
        
        const groupedReport = {
          id: sortedReports[0].id,
          reporter_id: sortedReports[0].reporter_id,
          reporter: sortedReports[0].reporter,
          report_type: reportType,
          target_id: targetId,
          reason: sortedReports[0].reason,
          details: sortedReports[0].details,
          status: sortedReports[0].status,
          created_at: sortedReports[0].created_at,
          updated_at: sortedReports[0].updated_at,
          reports: sortedReports,
          report_count: reportCount,
          unique_reporters: reportCount,
          threshold,
          threshold_met: thresholdMet,
          target_data: targetData,
          target_name: targetName,
          community_name: finalCommunityName,
          community_id: group.communityId,
          member_count: communityInfo?.memberCount || 0,
          reported_community: reportType === "community" ? targetData : null,
          reported_event: reportType === "event" ? targetData : null,
          reported_thread: reportType === "thread" ? targetData : null,
          reported_reply: reportType === "reply" ? targetData : null,
        };

        enrichedAllReports.push(groupedReport);

        if (thresholdMet) {
          enrichedReviewQueue.push(groupedReport);
        }
      }

      return ApiResponse.success({
        allReports: enrichedAllReports,
        reviewQueue: enrichedReviewQueue,
        totalAll: enrichedAllReports.length,
        totalReview: enrichedReviewQueue.length,
      });
    } catch (error) {
      console.error("Error in getMemberReportsWithThreshold:", error);
      return ApiResponse.error("Failed to fetch reports", 500);
    }
  }

  /**
   * Get only reports that meet the 30% threshold for review
   * @param options - Query options with status filter and pagination
   * @returns ServiceResult containing paginated review queue reports
   */
  public async getReportsReviewQueue(options?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<{ reports: any[]; total: number }>> {
    try {
      let query = this.supabaseAdmin
        .from("reports")
        .select(`
          *,
          reporter:reporter_id (id, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      query = query.in("report_type", ["community", "event", "thread", "reply"]);

      if (options?.status && options.status !== "all") {
        query = query.eq("status", options.status);
      }

      const { data: allReports, error: reportsError } = await query;

      if (reportsError) {
        return ApiResponse.error("Failed to fetch reports", 500);
      }

      if (!allReports || allReports.length === 0) {
        return ApiResponse.success({
          reports: [],
          total: 0,
        });
      }

      const { data: communities } = await this.supabaseAdmin
        .from("communities")
        .select("id, name");

      const communityThresholds = new Map<string, { threshold: number; name: string; memberCount: number }>();
      
      if (communities) {
        for (const community of communities) {
          const { count: memberCount } = await this.supabaseAdmin
            .from("community_members")
            .select("user_id", { count: "exact", head: true })
            .eq("community_id", community.id)
            .eq("status", "approved");

          const threshold = Math.ceil((memberCount || 0) * 0.3);
          communityThresholds.set(community.id, {
            threshold,
            name: community.name,
            memberCount: memberCount || 0,
          });
        }
      }

      const reportGroups = new Map<string, {
        reports: any[];
        uniqueReporters: Set<string>;
        communityId: string | null;
      }>();

      for (const report of allReports) {
        const key = `${report.report_type}-${report.target_id}`;
        
        if (!reportGroups.has(key)) {
          let communityId: string | null = null;
          
          if (report.report_type === "community") {
            communityId = report.target_id;
          } else if (report.report_type === "event" && report.target_id) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isValidUUID = uuidRegex.test(report.target_id) || report.target_id.length === 32;
            
            if (isValidUUID) {
              const { data: event } = await this.supabaseAdmin
                .from("events")
                .select("community_id")
                .eq("id", report.target_id)
                .single();
              communityId = event?.community_id || null;
            }
          } else if ((report.report_type === "thread" || report.report_type === "reply") && report.target_id) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isValidUUID = uuidRegex.test(report.target_id) || report.target_id.length === 32;
            
            if (isValidUUID) {
              const { data: message } = await this.supabaseAdmin
                .from("messages")
                .select("community_id")
                .eq("id", report.target_id)
                .single();
              communityId = message?.community_id || null;
            }
          }
          
          reportGroups.set(key, {
            reports: [],
            uniqueReporters: new Set(),
            communityId,
          });
        }
        
        const group = reportGroups.get(key)!;
        group.reports.push(report);
        group.uniqueReporters.add(report.reporter_id);
      }

      const thresholdMetGroups: any[] = [];

      for (const [key, group] of reportGroups.entries()) {
        const [reportType, ...targetIdParts] = key.split('-');
        const targetId = targetIdParts.join('-');
        const reportCount = group.uniqueReporters.size;
        const communityInfo = group.communityId ? communityThresholds.get(group.communityId) : null;
        const threshold = communityInfo?.threshold || 0;
        const thresholdMet = threshold > 0 && reportCount >= threshold;

        if (!thresholdMet) continue;

        let targetData: any = null;
        let targetName = "Unknown";
        let enrichedCommunityId: string | null = group.communityId;
        
        if (reportType === "community" && targetId) {
          const { data: community } = await this.supabaseAdmin
            .from("communities")
            .select("id, name, logo_url, status")
            .eq("id", targetId)
            .single();
          targetData = community;
          targetName = community?.name || "Unknown Community";
          enrichedCommunityId = targetId;
        } else if (reportType === "event" && targetId) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const isValidUUID = uuidRegex.test(targetId) || targetId.length === 32;
          
          if (isValidUUID) {
            const { data: event } = await this.supabaseAdmin
              .from("events")
              .select("id, title, community_id")
              .eq("id", targetId)
              .single();
            targetData = event;
            targetName = event?.title || "Unknown Event";
            enrichedCommunityId = event?.community_id || null;
          } else {
            targetName = `Event (invalid ID: ${targetId})`;
          }
        } else if (reportType === "thread" && targetId) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const isValidUUID = uuidRegex.test(targetId) || targetId.length === 32;
          
          if (!isValidUUID) {
            targetName = `Thread (invalid ID: ${targetId})`;
            targetData = null;
          } else {
            const { data: message, error: messageError } = await this.supabaseAdmin
              .from("messages")
              .select("id, content, community_id")
              .eq("id", targetId)
              .is("parent_id", null)
              .single();
            
            if (messageError) {
              if (messageError.code === '22P02') {
                targetName = `Thread (invalid ID format: ${targetId})`;
              } else {
                targetName = "Thread (error fetching)";
              }
            } else if (!message) {
              targetName = "Thread (deleted or not found)";
            } else if (message.content) {
              targetName = message.content.length > 50 
                ? message.content.substring(0, 50) + "..." 
                : message.content;
            } else {
              targetName = "Thread (no content)";
            }
            
            enrichedCommunityId = message?.community_id || null;
            
            let communityInfoData = null;
            if (enrichedCommunityId) {
              const { data: community } = await this.supabaseAdmin
                .from("communities")
                .select("id, name")
                .eq("id", enrichedCommunityId)
                .single();
              communityInfoData = community;
            }
            
            targetData = message ? {
              ...message,
              communities: communityInfoData
            } : null;
          }
        } else if (reportType === "reply" && targetId) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const isValidUUID = uuidRegex.test(targetId) || targetId.length === 32;
          
          if (!isValidUUID) {
            targetName = `Reply (invalid ID: ${targetId})`;
            targetData = null;
          } else {
            const { data: message, error: messageError } = await this.supabaseAdmin
              .from("messages")
              .select("id, content, parent_id, community_id")
              .eq("id", targetId)
              .not("parent_id", "is", null)
              .single();
            
            if (messageError) {
              if (messageError.code === '22P02') {
                targetName = `Reply (invalid ID format: ${targetId})`;
              } else {
                targetName = "Reply (error fetching)";
              }
            } else if (!message) {
              targetName = "Reply (deleted or not found)";
            } else if (message.content) {
              targetName = message.content.length > 50 
                ? message.content.substring(0, 50) + "..." 
                : message.content;
            } else {
              targetName = "Reply (no content)";
            }
            
            enrichedCommunityId = message?.community_id || null;
            
            let parentInfo = null;
            let communityInfoData = null;
            if (message?.parent_id) {
              const { data: parent } = await this.supabaseAdmin
                .from("messages")
                .select("id, community_id")
                .eq("id", message.parent_id)
                .single();
              parentInfo = parent;
              if (parent?.community_id) {
                const { data: community } = await this.supabaseAdmin
                  .from("communities")
                  .select("id, name")
                  .eq("id", parent.community_id)
                  .single();
                communityInfoData = community;
              }
            } else if (enrichedCommunityId) {
              const { data: community } = await this.supabaseAdmin
                .from("communities")
                .select("id, name")
                .eq("id", enrichedCommunityId)
                .single();
              communityInfoData = community;
            }
            
            targetData = message ? {
              ...message,
              parent: parentInfo ? {
                ...parentInfo,
                communities: communityInfoData
              } : null
            } : null;
          }
        }

        const sortedReports = group.reports.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        const groupedReport = {
          id: sortedReports[0].id,
          reporter_id: sortedReports[0].reporter_id,
          reporter: sortedReports[0].reporter,
          report_type: reportType,
          target_id: targetId,
          reason: sortedReports[0].reason,
          details: sortedReports[0].details,
          status: sortedReports[0].status,
          created_at: sortedReports[0].created_at,
          updated_at: sortedReports[0].updated_at,
          reports: sortedReports,
          report_count: reportCount,
          unique_reporters: reportCount,
          threshold,
          threshold_met: true,
          target_name: targetName,
          community_id: enrichedCommunityId,
          community_name: communityInfo?.name || "Unknown Community",
          member_count: communityInfo?.memberCount || 0,
          reported_community: reportType === "community" ? targetData : null,
          reported_event: reportType === "event" ? targetData : null,
          reported_thread: reportType === "thread" ? targetData : null,
          reported_reply: reportType === "reply" ? targetData : null,
        };

        thresholdMetGroups.push(groupedReport);
      }

      const page: number = options?.page || 1;
      const pageSize: number = options?.pageSize || 20;
      const from: number = (page - 1) * pageSize;
      const to: number = from + pageSize;
      
      const paginatedGroups = thresholdMetGroups.slice(from, to);

      return ApiResponse.success({
        reports: paginatedGroups,
        total: thresholdMetGroups.length,
      });
    } catch (error) {
      console.error("Error in getReportsReviewQueue:", error);
      return ApiResponse.error("Failed to fetch review queue reports", 500);
    }
  }

  /**
   * Get report by ID (for superadmin view)
   * @param reportId - The report ID to fetch
   * @returns ServiceResult containing report data
   */
  public async getReportByIdForSuperadmin(reportId: string): Promise<ServiceResult<any>> {
    const { data: report, error } = await this.supabaseAdmin
      .from("reports")
      .select(`
        *,
        reporter:reporter_id (id, full_name, avatar_url, email)
      `)
      .eq("id", reportId)
      .single();

    if (error || !report) {
      return ApiResponse.notFound("Report");
    }

    // Enrich with target data based on report_type
    let targetData: any = null;
    
    if (report.report_type === "community" && report.target_id) {
      const { data: community } = await this.supabaseAdmin
        .from("communities")
        .select("id, name, logo_url")
        .eq("id", report.target_id)
        .single();
      targetData = { reported_community: community };
    } else if (report.report_type === "member" && report.target_id) {
      const { data: user } = await this.supabaseAdmin
        .from("users")
        .select("id, full_name, avatar_url, email")
        .eq("id", report.target_id)
        .single();
      targetData = { reported_user: user };
    } else if (report.report_type === "event" && report.target_id) {
      const { data: event } = await this.supabaseAdmin
        .from("events")
        .select("id, title, community_id")
        .eq("id", report.target_id)
        .single();
      targetData = { reported_event: event };
    } else if (report.report_type === "thread" && report.target_id) {
      const { data: thread } = await this.supabaseAdmin
        .from("messages")
        .select(`
          id, 
          content, 
          community_id, 
          sender_id,
          communities (
            id,
            name
          )
        `)
        .eq("id", report.target_id)
        .is("parent_id", null)
        .single();
      targetData = { reported_thread: thread };
    } else if (report.report_type === "reply" && report.target_id) {
      const { data: reply } = await this.supabaseAdmin
        .from("messages")
        .select(`
          id, 
          content, 
          parent_id, 
          sender_id,
          community_id,
          parent:parent_id (
            id,
            community_id,
            communities (
              id,
              name
            )
          )
        `)
        .eq("id", report.target_id)
        .not("parent_id", "is", null)
        .single();
      targetData = { reported_reply: reply };
    }

    return ApiResponse.success({ ...report, ...targetData });
  }

  /**
   * Resolve a report with optional user action (superadmin)
   * @param reportId - The report ID to resolve
   * @param adminId - The admin resolving the report
   * @param resolution - Resolution notes
   * @param action - Optional action to take against reported user
   * @returns ServiceResult containing resolved report
   */
  public async resolveReportForSuperadmin(
    reportId: string,
    adminId: string,
    resolution: string,
    action?: "warn" | "ban" | "ban" | "none"
  ): Promise<ServiceResult<any>> {
    const { data: report, error: fetchError } = await this.supabaseAdmin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return ApiResponse.notFound("Report");
    }

    const { data, error } = await this.supabaseAdmin
      .from("reports")
      .update({
        status: "resolved" as ReportStatus,
        resolution,
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
   * Dismiss a report (superadmin)
   * @param reportId - The report ID to dismiss
   * @param adminId - The admin dismissing the report
   * @param reason - Optional dismissal reason
   * @returns ServiceResult containing dismissed report
   */
  public async dismissReportForSuperadmin(
    reportId: string,
    adminId: string,
    reason?: string
  ): Promise<ServiceResult<any>> {
    const { data, error } = await this.supabaseAdmin
      .from("reports")
      .update({
        status: "dismissed" as ReportStatus,
        resolution: reason || "Report dismissed by admin",
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
   * Delete a report (superadmin)
   * @param reportId - The report ID to delete
   * @returns ServiceResult indicating success
   */
  public async deleteReportForSuperadmin(reportId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin
      .from("reports")
      .delete()
      .eq("id", reportId);

    if (error) {
      return ApiResponse.error("Failed to delete report", 500);
    }

    return ApiResponse.success(undefined);
  }

  /**
   * Ban reported content and apply appropriate moderation actions
   * This is the main method for handling bans from the superadmin side
   * @param reportId - The report ID to process
   * @param banReason - Reason provided by superadmin
   * @param superadminId - ID of the superadmin performing the ban
   * @returns ServiceResult with ban details
   */
  public async banReportedContent(
    reportId: string,
    banReason: string,
    superadminId: string
  ): Promise<ServiceResult<{ message: string; actions: string[] }>> {
    const actions: string[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Fetch the report
      const { data: report, error: reportError } = await this.supabaseAdmin
        .from("reports")
        .select(`
          id,
          report_type,
          target_id,
          reporter_id,
          reason,
          details,
          status,
          created_at,
          updated_at
        `)
        .eq("id", reportId)
        .single();

      if (reportError || !report) {
        console.error("Report lookup failed:", { reportId, reportError });
        return ApiResponse.error("Report not found", 404);
      }

      // Step 1b: Fetch related data based on report_type
      let reportedCommunity = null;
      let reportedThread = null;
      let reportedEvent = null;
      let reporter = null;

      const { data: reporterData } = await this.supabaseAdmin
        .from("users")
        .select("id, full_name")
        .eq("id", report.reporter_id)
        .single();
      reporter = reporterData;

      if (report.report_type === "community") {
        const { data } = await this.supabaseAdmin
          .from("communities")
          .select("id, name, creator_id")
          .eq("id", report.target_id)
          .single();
        reportedCommunity = data;
      } else if (report.report_type === "thread") {
        const { data } = await this.supabaseAdmin
          .from("messages")
          .select("id, content, sender_id, community_id")
          .eq("id", report.target_id)
          .is("parent_id", null)
          .single();
        reportedThread = data;
      } else if (report.report_type === "reply") {
        const { data } = await this.supabaseAdmin
          .from("messages")
          .select("id, content, sender_id, community_id, parent_id")
          .eq("id", report.target_id)
          .not("parent_id", "is", null)
          .single();
        reportedThread = data;
      } else if (report.report_type === "event") {
        const { data, error } = await this.supabaseAdmin
          .from("events")
          .select("id, title, organizer_id, community_id")
          .eq("id", report.target_id)
          .single();
        
        console.log("[ReportService] Event fetch result:", {
          targetId: report.target_id,
          data,
          error,
          hasData: !!data
        });
        
        reportedEvent = data;
      }

      const enrichedReport = {
        ...report,
        reporter,
        reported_community: reportedCommunity,
        reported_thread: reportedThread,
        reported_event: reportedEvent,
      };

      const reportType = enrichedReport.report_type as "community" | "thread" | "reply" | "event" | "member";
      const targetId = enrichedReport.target_id;

      console.log("[ReportService] Ban report details:", {
        reportType,
        targetId,
        hasReportedCommunity: !!enrichedReport.reported_community,
        hasReportedThread: !!enrichedReport.reported_thread,
        hasReportedEvent: !!enrichedReport.reported_event,
        reportedEvent: enrichedReport.reported_event
      });

      // Step 2: Execute ban logic based on report type
      if (reportType === "community") {
        let community = enrichedReport.reported_community;
        
        if (!community) {
          const { data: fetchedCommunity, error: fetchError } = await this.supabaseAdmin
            .from("communities")
            .select("id, name, logo_url, status, creator_id")
            .eq("id", targetId)
            .single();
          
          if (fetchError || !fetchedCommunity) {
            console.error("[ReportService] Failed to fetch community:", fetchError);
            return ApiResponse.error("Community not found", 404);
          }
          community = fetchedCommunity;
        }
        
        if (!community) {
          return ApiResponse.error("Community not found", 404);
        }
        const adminId = community.creator_id;

        const { error: banError } = await this.supabaseAdmin
          .from("communities")
          .update({ 
            status: "banned",
            banned_at: new Date().toISOString(),
            ban_reason: banReason
          })
          .eq("id", targetId);

        if (banError) {
          console.error("[ReportService] Failed to ban community:", banError);
          errors.push(`Failed to ban community: ${banError.message}`);
          return ApiResponse.error("Failed to ban community", 500);
        }
        actions.push("Community banned");

        const { error: adminBanError } = await this.supabaseAdmin
          .from("users")
          .update({ can_create_communities: false })
          .eq("id", adminId);

        if (adminBanError) {
          console.error("[ReportService] Failed to ban admin from creating communities:", adminBanError);
          errors.push(`Failed to ban admin: ${adminBanError.message}`);
          return ApiResponse.error("Failed to ban admin from creating communities", 500);
        }
        actions.push("Admin banned from creating communities");

        try {
          const notificationService = (await import("./notification.service")).NotificationService.getInstance();
          await notificationService.onCommunityBanned(
            adminId,
            targetId,
            community.name,
            banReason
          );
          actions.push("Admin notified");
        } catch (notifyError) {
          console.error("[ReportService] Failed to notify admin of community ban:", notifyError);
          actions.push("Failed to notify admin (check logs)");
        }

        const { data: members, error: membersError } = await this.supabaseAdmin
          .from("community_members")
          .select("user_id")
          .eq("community_id", targetId)
          .eq("status", "approved");

        if (members && members.length > 0) {
          const memberIds = members.map(m => m.user_id).filter(id => id !== adminId);
          
          if (memberIds.length > 0) {
            try {
              const notificationService = (await import("./notification.service")).NotificationService.getInstance();
              await notificationService.createBulk(
                memberIds,
                "community_banned",
                "Community Banned",
                `The community ${community.name} has been banned by platform administrators.`,
                targetId,
                "community"
              );
              actions.push(`${memberIds.length} members notified`);
            } catch (notifyError) {
              console.error("[ReportService] Failed to notify members:", notifyError);
              errors.push(`Failed to notify members: ${notifyError instanceof Error ? notifyError.message : "Unknown error"}`);
            }
          } else {
            actions.push("No members to notify");
          }
        } else {
          if (membersError) {
            errors.push(`Failed to fetch members: ${membersError.message}`);
          } else {
            actions.push("No members found");
          }
        }

      } else if (reportType === "thread" && enrichedReport.reported_thread) {
        const thread = enrichedReport.reported_thread;
        if (!thread) {
          return ApiResponse.error("Thread not found", 404);
        }
        const creatorId = thread.sender_id;
        const communityId = thread.community_id;

        const { data: replies, error: repliesError } = await this.supabaseAdmin
          .from("messages")
          .select("id")
          .eq("parent_id", targetId);
        
        if (repliesError) {
          console.error("Error fetching replies:", repliesError);
        } else if (replies && replies.length > 0) {
          const { error: deleteRepliesError } = await this.supabaseAdmin
            .from("messages")
            .delete()
            .eq("parent_id", targetId);
          
          if (deleteRepliesError) {
            console.error("Error deleting replies:", deleteRepliesError);
            return ApiResponse.error(`Failed to delete ${replies.length} replies: ${deleteRepliesError.message}`, 500);
          }
          actions.push(`Deleted ${replies.length} replies`);
        }

        const { error: deleteError } = await this.supabaseAdmin
          .from("messages")
          .delete()
          .eq("id", targetId);

        if (deleteError) {
          console.error("Error deleting thread:", deleteError);
          return ApiResponse.error(`Failed to delete thread: ${deleteError.message}`, 500);
        }
        actions.push("Thread deleted");

        const { error: restrictError } = await this.supabaseAdmin
          .from("users")
          .update({ can_post: false })
          .eq("id", creatorId);

        if (restrictError) {
          return ApiResponse.error("Failed to restrict creator", 500);
        }
        actions.push("Creator restricted from posting");

        const { data: community } = await this.supabaseAdmin
          .from("communities")
          .select("id, name, creator_id")
          .eq("id", communityId)
          .single();

        if (community) {
          const adminId = community.creator_id;

          let newStrikeCount = 1;
          const { data: adminData, error: adminError } = await this.supabaseAdmin
            .from("users")
            .select("moderation_strikes")
            .eq("id", adminId)
            .single();

          if (!adminError && adminData) {
            newStrikeCount = (adminData.moderation_strikes || 0) + 1;
            
            const { error: strikeError } = await this.supabaseAdmin
              .from("users")
              .update({ moderation_strikes: newStrikeCount })
              .eq("id", adminId);

            if (!strikeError) {
              actions.push(`Admin received strike ${newStrikeCount}/3`);

              if (newStrikeCount >= 3) {
                await this.supabaseAdmin
                  .from("users")
                  .update({ can_create_communities: false })
                  .eq("id", adminId);
                actions.push("Admin banned from creating communities (3 strikes)");
              }
            } else {
              console.error("[ReportService] Failed to update admin strikes:", strikeError);
              actions.push("Failed to update admin strikes (check logs)");
            }
          } else {
            console.error("[ReportService] Failed to fetch admin data:", adminError);
            actions.push("Failed to fetch admin data (check logs)");
          }

          try {
            const notificationService = (await import("./notification.service")).NotificationService.getInstance();
            await notificationService.onCommunityStrike(
              adminId,
              communityId,
              community.name,
              newStrikeCount,
              banReason
            );
            actions.push("Admin notified of strike");
          } catch (notifyError: any) {
            console.error("[ReportService] Failed to notify admin of strike:", {
              error: notifyError,
              message: notifyError?.message,
              stack: notifyError?.stack,
              adminId,
              communityId,
              strikeCount: newStrikeCount
            });
            actions.push(`Failed to notify admin: ${notifyError?.message || "Unknown error"}`);
          }

          try {
            const notificationService = (await import("./notification.service")).NotificationService.getInstance();
            await notificationService.onContentBanned(
              creatorId,
              "thread",
              community.name,
              banReason,
              communityId
            );
            actions.push("Creator notified");
          } catch (notifyError) {
            console.error("[ReportService] Failed to notify content creator:", notifyError);
            actions.push("Failed to notify creator (check logs)");
          }
        }

      } else if (reportType === "event") {
        console.log("[ReportService] Processing event ban, enrichedReport.reported_event:", enrichedReport.reported_event);
        
        const event = enrichedReport.reported_event;
        if (!event) {
          console.error("[ReportService] Event not found in enriched report, attempting to fetch directly");
          // Try to fetch event directly
          const { data: fetchedEvent, error: fetchError } = await this.supabaseAdmin
            .from("events")
            .select("id, title, organizer_id, community_id")
            .eq("id", targetId)
            .single();
          
          if (fetchError || !fetchedEvent) {
            console.error("[ReportService] Failed to fetch event:", fetchError);
            return ApiResponse.error("Event not found", 404);
          }
          
          // Use the fetched event
          const event = fetchedEvent;
          const creatorId = event.organizer_id;
          const communityId = event.community_id;

          console.log("[ReportService] Banning event (fetched directly):", { 
            eventId: targetId, 
            creatorId, 
            communityId,
            hasCreatorId: !!creatorId,
            hasCommunityId: !!communityId
          });

          // Validate required fields
          if (!creatorId) {
            console.error("[ReportService] Event has no organizer_id");
            return ApiResponse.error("Event has no organizer, cannot ban", 400);
          }

          const { error: deleteError } = await this.supabaseAdmin
            .from("events")
            .delete()
            .eq("id", targetId);

          if (deleteError) {
            console.error("[ReportService] Failed to delete event:", deleteError);
            return ApiResponse.error("Failed to delete event", 500);
          }
          actions.push("Event deleted");

          const { error: restrictError } = await this.supabaseAdmin
            .from("users")
            .update({ can_post: false })
            .eq("id", creatorId);

          if (restrictError) {
            console.error("[ReportService] Failed to restrict event creator:", restrictError);
            return ApiResponse.error("Failed to restrict creator", 500);
          }
          actions.push("Creator restricted from posting");

          // Only process community-related actions if event belongs to a community
          if (communityId) {
            const { data: community, error: communityError } = await this.supabaseAdmin
              .from("communities")
              .select("id, name, creator_id")
              .eq("id", communityId)
              .single();

            if (communityError) {
              console.error("[ReportService] Failed to fetch community:", communityError);
              actions.push("Warning: Could not fetch community for admin strikes");
            } else if (community) {
              const adminId = community.creator_id;

              const { data: adminData, error: adminError } = await this.supabaseAdmin
                .from("users")
                .select("moderation_strikes")
                .eq("id", adminId)
                .single();

              let newStrikeCount = 1;
              if (!adminError && adminData) {
                newStrikeCount = (adminData.moderation_strikes || 0) + 1;
                
                const { error: strikeError } = await this.supabaseAdmin
                  .from("users")
                  .update({ moderation_strikes: newStrikeCount })
                  .eq("id", adminId);

                if (!strikeError) {
                  actions.push(`Admin received strike ${newStrikeCount}/3`);

                  if (newStrikeCount >= 3) {
                    await this.supabaseAdmin
                      .from("users")
                      .update({ can_create_communities: false })
                      .eq("id", adminId);
                    actions.push("Admin banned from creating communities (3 strikes)");
                  }
                } else {
                  console.error("[ReportService] Failed to update admin strikes:", strikeError);
                  actions.push("Failed to update admin strikes (check logs)");
                }
              } else {
                console.error("[ReportService] Failed to fetch admin data:", adminError);
                actions.push("Failed to fetch admin data (check logs)");
              }

              try {
                const notificationService = (await import("./notification.service")).NotificationService.getInstance();
                await notificationService.onCommunityStrike(
                  adminId,
                  communityId,
                  community.name,
                  newStrikeCount,
                  banReason
                );
                actions.push("Admin notified of strike");
              } catch (notifyError: any) {
                console.error("[ReportService] Failed to notify admin of strike:", {
                  error: notifyError,
                  message: notifyError?.message,
                  stack: notifyError?.stack,
                  adminId,
                  communityId,
                  strikeCount: newStrikeCount
                });
                actions.push(`Failed to notify admin: ${notifyError?.message || "Unknown error"}`);
              }

              try {
                const notificationService = (await import("./notification.service")).NotificationService.getInstance();
                await notificationService.onContentBanned(
                  creatorId,
                  "event",
                  community.name,
                  banReason,
                  communityId
                );
                actions.push("Creator notified");
              } catch (notifyError) {
                console.error("[ReportService] Failed to notify event creator:", notifyError);
                actions.push("Failed to notify creator (check logs)");
              }
            }
          } else {
            // Event doesn't belong to a community - just notify the creator
            console.log("[ReportService] Event has no community, skipping admin strikes");
            actions.push("Event has no community (standalone event)");
            
            try {
              const notificationService = (await import("./notification.service")).NotificationService.getInstance();
              await notificationService.onContentBanned(
                creatorId,
                "event",
                "Platform",
                banReason
              );
              actions.push("Creator notified");
            } catch (notifyError) {
              console.error("[ReportService] Failed to notify event creator:", notifyError);
              actions.push("Failed to notify creator (check logs)");
            }
          }
        } else {
          // Event was found in enriched report
          const creatorId = event.organizer_id;
          const communityId = event.community_id;

          console.log("[ReportService] Banning event:", { 
            eventId: targetId, 
            creatorId, 
            communityId,
            hasCreatorId: !!creatorId,
            hasCommunityId: !!communityId
          });

          // Validate required fields
          if (!creatorId) {
            console.error("[ReportService] Event has no organizer_id");
            return ApiResponse.error("Event has no organizer, cannot ban", 400);
          }

          const { error: deleteError} = await this.supabaseAdmin
            .from("events")
            .delete()
            .eq("id", targetId);

          if (deleteError) {
            console.error("[ReportService] Failed to delete event:", deleteError);
            return ApiResponse.error("Failed to delete event", 500);
          }
          actions.push("Event deleted");

          const { error: restrictError } = await this.supabaseAdmin
            .from("users")
            .update({ can_post: false })
            .eq("id", creatorId);

          if (restrictError) {
            console.error("[ReportService] Failed to restrict event creator:", restrictError);
            return ApiResponse.error("Failed to restrict creator", 500);
          }
          actions.push("Creator restricted from posting");

          // Only process community-related actions if event belongs to a community
          if (communityId) {
            const { data: community, error: communityError } = await this.supabaseAdmin
              .from("communities")
              .select("id, name, creator_id")
              .eq("id", communityId)
              .single();

            if (communityError) {
              console.error("[ReportService] Failed to fetch community:", communityError);
              actions.push("Warning: Could not fetch community for admin strikes");
            } else if (community) {
              const adminId = community.creator_id;

              const { data: adminData, error: adminError } = await this.supabaseAdmin
                .from("users")
                .select("moderation_strikes")
                .eq("id", adminId)
                .single();

              let newStrikeCount = 1;
              if (!adminError && adminData) {
                newStrikeCount = (adminData.moderation_strikes || 0) + 1;
                
                const { error: strikeError } = await this.supabaseAdmin
                  .from("users")
                  .update({ moderation_strikes: newStrikeCount })
                  .eq("id", adminId);

                if (!strikeError) {
                  actions.push(`Admin received strike ${newStrikeCount}/3`);

                  if (newStrikeCount >= 3) {
                    await this.supabaseAdmin
                      .from("users")
                      .update({ can_create_communities: false })
                      .eq("id", adminId);
                    actions.push("Admin banned from creating communities (3 strikes)");
                  }
                } else {
                  console.error("[ReportService] Failed to update admin strikes:", strikeError);
                  actions.push("Failed to update admin strikes (check logs)");
                }
              } else {
                console.error("[ReportService] Failed to fetch admin data:", adminError);
                actions.push("Failed to fetch admin data (check logs)");
              }

              try {
                const notificationService = (await import("./notification.service")).NotificationService.getInstance();
                await notificationService.onCommunityStrike(
                  adminId,
                  communityId,
                  community.name,
                  newStrikeCount,
                  banReason
                );
                actions.push("Admin notified of strike");
              } catch (notifyError: any) {
                console.error("[ReportService] Failed to notify admin of strike:", {
                  error: notifyError,
                  message: notifyError?.message,
                  stack: notifyError?.stack,
                  adminId,
                  communityId,
                  strikeCount: newStrikeCount
                });
                actions.push(`Failed to notify admin: ${notifyError?.message || "Unknown error"}`);
              }

              try {
                const notificationService = (await import("./notification.service")).NotificationService.getInstance();
                await notificationService.onContentBanned(
                  creatorId,
                  "event",
                  community.name,
                  banReason,
                  communityId
                );
                actions.push("Creator notified");
              } catch (notifyError) {
                console.error("[ReportService] Failed to notify event creator:", notifyError);
                actions.push("Failed to notify creator (check logs)");
              }
            }
          } else {
            // Event doesn't belong to a community - just notify the creator
            console.log("[ReportService] Event has no community, skipping admin strikes");
            actions.push("Event has no community (standalone event)");
            
            try {
              const notificationService = (await import("./notification.service")).NotificationService.getInstance();
              await notificationService.onContentBanned(
                creatorId,
                "event",
                "Platform",
                banReason
              );
              actions.push("Creator notified");
            } catch (notifyError) {
              console.error("[ReportService] Failed to notify event creator:", notifyError);
              actions.push("Failed to notify creator (check logs)");
            }
          }
        }

      } else if (reportType === "reply") {
        const { data: reply } = await this.supabaseAdmin
          .from("messages")
          .select("id, content, sender_id, community_id")
          .eq("id", targetId)
          .single();

        if (reply) {
          const creatorId = reply.sender_id;
          const communityId = reply.community_id;

          const { error: deleteError } = await this.supabaseAdmin
            .from("messages")
            .delete()
            .eq("id", targetId);

          if (deleteError) {
            return ApiResponse.error("Failed to delete reply", 500);
          }
          actions.push("Reply deleted");

          const { error: restrictError } = await this.supabaseAdmin
            .from("users")
            .update({ can_post: false })
            .eq("id", creatorId);

          if (restrictError) {
            return ApiResponse.error("Failed to restrict creator", 500);
          }
          actions.push("Creator restricted from posting");

          const { data: community } = await this.supabaseAdmin
            .from("communities")
            .select("id, name, creator_id")
            .eq("id", communityId)
            .single();

          if (community) {
            const adminId = community.creator_id;

            const { data: adminData, error: adminError } = await this.supabaseAdmin
              .from("users")
              .select("moderation_strikes")
              .eq("id", adminId)
              .single();

            let newStrikeCount = 1;
            if (!adminError && adminData) {
              newStrikeCount = (adminData.moderation_strikes || 0) + 1;
              
              const { error: strikeError } = await this.supabaseAdmin
                .from("users")
                .update({ moderation_strikes: newStrikeCount })
                .eq("id", adminId);

              if (!strikeError) {
                actions.push(`Admin received strike ${newStrikeCount}/3`);

                if (newStrikeCount >= 3) {
                  await this.supabaseAdmin
                    .from("users")
                    .update({ can_create_communities: false })
                    .eq("id", adminId);
                  actions.push("Admin banned from creating communities (3 strikes)");
                }
              } else {
                console.error("[ReportService] Failed to update admin strikes:", strikeError);
                actions.push("Failed to update admin strikes (check logs)");
              }
            } else {
              console.error("[ReportService] Failed to fetch admin data:", adminError);
              actions.push("Failed to fetch admin data (check logs)");
            }

            try {
              const notificationService = (await import("./notification.service")).NotificationService.getInstance();
              await notificationService.onCommunityStrike(
                adminId,
                communityId,
                community.name,
                newStrikeCount,
                banReason
              );
              actions.push("Admin notified of strike");
            } catch (notifyError: any) {
              console.error("[ReportService] Failed to notify admin of strike:", {
                error: notifyError,
                message: notifyError?.message,
                stack: notifyError?.stack,
                adminId,
                communityId,
                strikeCount: newStrikeCount
              });
              actions.push(`Failed to notify admin: ${notifyError?.message || "Unknown error"}`);
            }

            try {
              const notificationService = (await import("./notification.service")).NotificationService.getInstance();
              await notificationService.onContentBanned(
                creatorId,
                "reply",
                community.name,
                banReason,
                communityId
              );
              actions.push("Creator notified");
            } catch (notifyError) {
              console.error("[ReportService] Failed to notify reply creator:", notifyError);
              actions.push("Failed to notify creator (check logs)");
            }
          }
        }
      } else if (reportType === "member") {
        actions.push("Member report marked as resolved");
      } else {
        return ApiResponse.error(`Unsupported report type: ${reportType}`, 400);
      }

      // Step 3: Update report status to resolved
      const { error: updateError } = await this.supabaseAdmin
        .from("reports")
        .update({ 
          status: "resolved",
          updated_at: new Date().toISOString()
        })
        .eq("id", reportId);

      if (updateError) {
        return ApiResponse.error("Failed to update report status", 500);
      }
      actions.push("Report marked as resolved");

      return ApiResponse.success({
        message: "Content banned successfully",
        actions
      });

    } catch (error) {
      console.error("Error in banReportedContent:", error);
      return ApiResponse.error("Failed to ban content", 500);
    }
  }

  /**
   * Apply action against a user (warn, ban, ban) - helper method
   * @param userId - The user to apply action to
   * @param action - The action to take
   * @param reportId - The report ID for reference
   */
  private async applyUserAction(
    userId: string,
    action: "warn" | "ban" | "ban",
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

      case "ban":
        await this.supabaseAdmin
          .from("users")
          .update({
            status: "banned",
            banned_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
export const reportService = ReportService.getInstance();
