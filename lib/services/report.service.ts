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
  reported_user_id?: string;
  reported_community_id?: string;
  reported_event_id?: string;
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
    // Validate at least one target is specified
    if (!input.reported_user_id && !input.reported_community_id && !input.reported_event_id) {
      return ApiResponse.badRequest("Report target is required");
    }

    if (!input.reason) {
      return ApiResponse.badRequest("Report reason is required");
    }

    const { data, error } = await this.supabaseAdmin
      .from("reports")
      .insert({
        reporter_id: reporterId,
        reported_user_id: input.reported_user_id,
        reported_community_id: input.reported_community_id,
        reported_event_id: input.reported_event_id,
        reason: input.reason,
        description: input.description,
        status: "pending" as ReportStatus,
      })
      .select()
      .single();

    if (error) {
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
}

// Export singleton instance
export const reportService: ReportService = ReportService.getInstance();
