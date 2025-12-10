import {
  BaseService,
  ApiResponse,
  ServiceResult,
  ValidationError,
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
  created_at: string;
}

interface CreateReportInput {
  reported_user_id?: string;
  reported_community_id?: string;
  reported_event_id?: string;
  reason: string;
  description?: string;
}

/**
 * Service for managing reports
 */
export class ReportService extends BaseService {
  private static instance: ReportService;
  private readonly REPORT_PENALTY_POINTS = -10;

  private constructor() {
    super();
  }

  static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  /**
   * Create a new report
   */
  async create(
    reporterId: string,
    input: CreateReportInput
  ): Promise<ServiceResult<ReportData>> {
    // Validate at least one target
    if (!input.reported_user_id && !input.reported_community_id && !input.reported_event_id) {
      return ApiResponse.error("Report target is required", 400);
    }

    if (!input.reason) {
      return ApiResponse.error("Report reason is required", 400);
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
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return ApiResponse.error("Failed to create report", 500);
    }

    return ApiResponse.created(data);
  }

  /**
   * Get all reports (admin only)
   */
  async getAll(status?: string): Promise<ServiceResult<ReportData[]>> {
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

    return ApiResponse.success(data || []);
  }

  /**
   * Update report status
   */
  async updateStatus(
    reportId: string,
    status: ReportData["status"],
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

    return ApiResponse.success(data);
  }

  /**
   * Apply penalty points for upheld report
   */
  private async applyReportPenalty(userId: string, reportId: string): Promise<void> {
    await this.supabaseAdmin.from("user_points").insert({
      user_id: userId,
      points: this.REPORT_PENALTY_POINTS,
      reason: `Report upheld: ${reportId}`,
      source: "report_penalty",
    });
  }
}

export const reportService = ReportService.getInstance();

