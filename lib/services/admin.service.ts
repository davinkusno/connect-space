import {
    AdminStats,
    InactiveCommunity, ReportStatus
} from "@/lib/types";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";

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
  created_at: string;
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
        reporter:reporter_id (id, full_name, avatar_url)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    // Superadmin sees community, event, thread, and reply reports
    // Member reports are handled by community admins
    query = query.in("report_type", ["community", "event", "thread", "reply"]);

    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return ApiResponse.error("Failed to fetch reports", 500);
    }

    // Enrich reports with target data based on report_type
    const enrichedReports = await Promise.all(
      (data || []).map(async (report: any) => {
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
            .select("id, full_name, avatar_url")
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
        } else if (report.report_type === "post" && report.target_id) {
          const { data: post } = await this.supabaseAdmin
            .from("discussion_threads")
            .select("id, title")
            .eq("id", report.target_id)
            .single();
          targetData = { reported_post: post };
        }

        return { ...report, ...targetData };
      })
    );

    return ApiResponse.success<ReportsResult>({
      reports: enrichedReports as ReportData[],
      total: count || 0,
    });
  }

  /**
   * Get all reports across all types with 30% threshold information
   * Returns both all reports and reports that meet the 30% threshold for review
   * @param options - Query options
   * @returns ServiceResult containing all reports and review queue
   */
  public async getMemberReports(
    options?: ReportsQueryOptions
  ): Promise<ServiceResult<{
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
          // Try to determine community context
          let communityId: string | null = null;
          
          // For different report types, fetch community context
          if (report.report_type === "member") {
            // Get community from member's communities (use first one for now)
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
            const { data: message } = await this.supabaseAdmin
              .from("messages")
              .select("community_id")
              .eq("id", report.target_id)
              .single();
            communityId = message?.community_id || null;
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
        const [reportType, targetId] = key.split('-');
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
            .select("id, name, logo_url, status")
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
          const { data: message } = await this.supabaseAdmin
            .from("messages")
            .select("id, content")
            .eq("id", targetId)
            .single();
          targetData = message;
          targetName = message?.content?.substring(0, 50) + "..." || "Unknown Message";
        }

        // Add each report with enriched data
        for (const report of group.reports) {
          // For community reports, use targetData name; for others, use communityInfo
          const finalCommunityName = reportType === "community" && targetData?.name
            ? targetData.name
            : communityInfo?.name || "Unknown Community";
          
          const enrichedReport = {
            ...report,
            target_data: targetData,
            target_name: targetName,
            report_count: reportCount,
            unique_reporters: reportCount,
            threshold,
            threshold_met: thresholdMet,
            community_name: finalCommunityName,
            community_id: group.communityId,
            member_count: communityInfo?.memberCount || 0,
            communityStatus: reportType === "community" && targetData ? targetData.status : null,
          };

          enrichedAllReports.push(enrichedReport);

          // Add to review queue if threshold is met
          if (thresholdMet) {
            enrichedReviewQueue.push(enrichedReport);
          }
        }
      }

      // Remove duplicates from enrichedReviewQueue (keep only one per group)
      const uniqueReviewQueue = Array.from(
        new Map(enrichedReviewQueue.map(r => [`${r.report_type}-${r.target_id}`, r])).values()
      );

      return ApiResponse.success({
        allReports: enrichedAllReports,
        reviewQueue: uniqueReviewQueue,
        totalAll: enrichedAllReports.length,
        totalReview: uniqueReviewQueue.length,
      });
    } catch (error) {
      console.error("Error in getMemberReports:", error);
      return ApiResponse.error("Failed to fetch reports", 500);
    }
  }

  /**
   * Get only reports that meet the 30% threshold for review
   * @param options - Query options
   * @returns ServiceResult containing paginated review queue reports
   */
  public async getReportsReviewQueue(
    options?: ReportsQueryOptions
  ): Promise<ServiceResult<ReportsResult>> {
    try {
      // Use getMemberReports to get all reports with threshold calculation
      const memberReportsResult = await this.getMemberReports(options);
      
      if (!memberReportsResult.success || !memberReportsResult.data) {
        return ApiResponse.error("Failed to fetch review queue reports", 500);
      }

      // Extract only the review queue (reports that meet 30% threshold)
      const reviewQueue = memberReportsResult.data.reviewQueue;

      // Apply pagination manually since getMemberReports doesn't paginate the reviewQueue
      const page: number = options?.page || 1;
      const pageSize: number = options?.pageSize || 20;
      const from: number = (page - 1) * pageSize;
      const to: number = from + pageSize;
      
      const paginatedReports = reviewQueue.slice(from, to);

      return ApiResponse.success<ReportsResult>({
        reports: paginatedReports as ReportData[],
        total: reviewQueue.length,
      });
    } catch (error) {
      console.error("Error in getReportsReviewQueue:", error);
      return ApiResponse.error("Failed to fetch review queue reports", 500);
    }
  }

  /**
   * Get report by ID
   * @param reportId - The report ID to fetch
   * @returns ServiceResult containing report data
   */
  public async getReportById(reportId: string): Promise<ServiceResult<ReportData>> {
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
    } else if (report.report_type === "post" && report.target_id) {
      const { data: post } = await this.supabaseAdmin
        .from("discussion_threads")
        .select("id, title")
        .eq("id", report.target_id)
        .single();
      targetData = { reported_post: post };
    }

    return ApiResponse.success<ReportData>({ ...report, ...targetData } as ReportData);
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
   * Delete a report
   * @param reportId - The report ID to delete
   * @returns ServiceResult indicating success
   */
  public async deleteReport(reportId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin
      .from("reports")
      .delete()
      .eq("id", reportId);

    if (error) {
      return ApiResponse.error("Failed to delete report", 500);
    }

    return ApiResponse.success<void>(undefined);
  }

  /**
   * Get inactive communities
   * @returns ServiceResult containing array of inactive communities
   */
  public async getInactiveCommunities(): Promise<ServiceResult<InactiveCommunity[]>> {
    const thresholdDate: Date = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - this.INACTIVE_DAYS_THRESHOLD);

    // Fetch communities with their created date
    const { data, error } = await this.supabaseAdmin
      .from("communities")
      .select("id, name, creator_id, member_count, created_at, status")
      .neq("status", "suspended")
      .order("created_at", { ascending: true, nullsFirst: true });

    if (error) {
      return ApiResponse.error("Failed to fetch inactive communities", 500);
    }

    // Filter and calculate days inactive based on created_at
    const communities: InactiveCommunity[] = (data || [])
      .map((c) => {
        // Use created_at to determine inactivity
        const lastActiveDate = c.created_at;
        const daysInactive = lastActiveDate
          ? Math.floor((Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        return {
          ...c,
          // Store the actual date used for calculation
          effective_last_activity: lastActiveDate,
          days_inactive: daysInactive,
        };
      })
      // Only include communities that are actually inactive (more than threshold days)
      .filter((c) => c.days_inactive >= this.INACTIVE_DAYS_THRESHOLD);

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
    // Get community name before suspending
    const { data: community, error: communityError } = await this.supabaseAdmin
      .from("communities")
      .select("id, name")
      .eq("id", communityId)
      .single();

    if (communityError || !community) {
      return ApiResponse.error("Community not found", 404);
    }

    // Suspend the community
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

    // Get all community members (approved members only)
    const { data: members, error: membersError } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .eq("status", "approved");

    // Notify all members about the suspension
    if (!membersError && members && members.length > 0) {
      const memberIds = members.map(m => m.user_id);
      
      try {
        const { NotificationService } = await import("./notification.service");
        const notificationService = NotificationService.getInstance();
        
        await notificationService.createBulk(
          memberIds,
          "community_suspended",
          "Community Suspended",
          `The community "${community.name}" has been suspended. Reason: ${reason}. The community is no longer visible on your home page.`,
          communityId,
          "community"
        );
      } catch (notifError) {
        // Log error but don't fail the suspension
        console.error("Failed to send suspension notifications:", notifError);
      }
    }

    return ApiResponse.success<void>(undefined);
  }

  /**
   * Reactivate a suspended community
   * @param communityId - The community to reactivate
   * @returns ServiceResult indicating success
   */
  public async reactivateCommunity(communityId: string): Promise<ServiceResult<void>> {
    // Get community name before reactivating
    const { data: community, error: communityError } = await this.supabaseAdmin
      .from("communities")
      .select("id, name")
      .eq("id", communityId)
      .single();

    if (communityError || !community) {
      return ApiResponse.error("Community not found", 404);
    }

    // Reactivate the community
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

    // Get all community members (approved members only)
    const { data: members, error: membersError } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .eq("status", "approved");

    // Notify all members about the reactivation
    if (!membersError && members && members.length > 0) {
      const memberIds = members.map(m => m.user_id);
      
      try {
        const { NotificationService } = await import("./notification.service");
        const notificationService = NotificationService.getInstance();
        
        await notificationService.createBulk(
          memberIds,
          "community_reactivated",
          "Community Reactivated",
          `The community "${community.name}" has been reactivated and is now visible on your home page again.`,
          communityId,
          "community"
        );
      } catch (notifError) {
        // Log error but don't fail the reactivation
        console.error("Failed to send reactivation notifications:", notifError);
      }
    }

    return ApiResponse.success<void>(undefined);
  }

  /**
   * Get community details for superadmin view (read-only)
   * @param communityId - The community ID
   * @returns ServiceResult containing community details with stats
   */
  public async getCommunityDetails(communityId: string): Promise<ServiceResult<unknown>> {
    const { data: community, error: communityError } = await this.supabaseAdmin
      .from("communities")
      .select(`
        *,
        creator:creator_id (id, full_name, email, avatar_url)
      `)
      .eq("id", communityId)
      .single();

    if (communityError || !community) {
      return ApiResponse.notFound("Community not found");
    }

    // Get member count
    const { count: memberCount } = await this.supabaseAdmin
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId)
      .eq("status", "approved");

    // Get event count
    const { count: eventCount } = await this.supabaseAdmin
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId);

    // Get report count for this community
    const { count: reportCount } = await this.supabaseAdmin
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("report_type", "community")
      .eq("target_id", communityId);

    // Get pending join requests
    const { count: pendingRequests } = await this.supabaseAdmin
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId)
      .eq("status", "pending");

    // Get recent activity (recent messages, events, etc.)
    const { data: recentEvents } = await this.supabaseAdmin
      .from("events")
      .select("id, title, start_time, created_at")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })
      .limit(5);

    return ApiResponse.success({
      ...community,
      stats: {
        memberCount: memberCount || 0,
        eventCount: eventCount || 0,
        reportCount: reportCount || 0,
        pendingRequests: pendingRequests || 0,
      },
      recentEvents: recentEvents || [],
    });
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

  /**
   * Ban a user from creating communities (platform-wide ban)
   * Used when community admins are reported and banned
   * @param userId - The user ID to ban
   * @param adminId - The superadmin performing the ban
   * @param reason - The reason for the ban
   * @param reportId - Optional report ID that led to this ban
   * @returns ServiceResult indicating success or failure
   */
  public async banUserFromCreatingCommunities(
    userId: string,
    adminId: string,
    reason: string,
    reportId?: string
  ): Promise<ServiceResult<{ message: string }>> {
    // Check if user is already banned
    const { data: existingBan } = await this.supabaseAdmin
      .from("banned_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingBan) {
      return ApiResponse.success({ message: "User is already banned from creating communities" });
    }

    // Create ban record
    const { error: banError } = await this.supabaseAdmin
      .from("banned_users")
      .insert({
        user_id: userId,
        banned_by: adminId,
        reason,
        report_id: reportId || null,
      });

    if (banError) {
      console.error("Error creating platform ban:", banError);
      return ApiResponse.error("Failed to ban user from creating communities", 500);
    }

    return ApiResponse.success({ 
      message: "User has been banned from creating communities" 
    });
  }

  /**
   * Check if a user is banned from creating communities
   * @param userId - The user ID to check
   * @returns ServiceResult with ban status
   */
  public async isUserBannedFromCreatingCommunities(
    userId: string
  ): Promise<ServiceResult<{ isBanned: boolean; ban?: { reason: string; created_at: string } }>> {
    const { data: ban, error } = await this.supabaseAdmin
      .from("banned_users")
      .select("reason, created_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking platform ban status:", error);
      return ApiResponse.error("Failed to check ban status", 500);
    }

    return ApiResponse.success({
      isBanned: !!ban,
      ban: ban || undefined,
    });
  }
}

// Export singleton instance
export const adminService: AdminService = AdminService.getInstance();
