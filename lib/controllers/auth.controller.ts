import { NextRequest, NextResponse } from "next/server";
import { BaseController } from "./base.controller";
import { AuthService, authService } from "../services/auth.service";

// ==================== Auth Controller ====================
export class AuthController extends BaseController {
  private static instance: AuthController;
  private readonly service: AuthService;

  private constructor() {
    super();
    this.service = authService;
  }

  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  /**
   * GET /auth/callback
   * Handle OAuth callback from Supabase
   */
  public async handleCallback(request: NextRequest): Promise<NextResponse> {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const origin = requestUrl.origin;

    // No code provided
    if (!code) {
      return NextResponse.redirect(
        this.service.getRedirectUrl(origin, "login")
      );
    }

    try {
      // Exchange code for session
      const sessionResult = await this.service.exchangeCodeForSession(code);

      if (!sessionResult.success || !sessionResult.data) {
        return NextResponse.redirect(
          this.service.getRedirectUrl(origin, "login", sessionResult.error?.message)
        );
      }

      const { user } = sessionResult.data;

      // Update OAuth metadata (non-blocking, errors are logged)
      await this.service.updateOAuthMetadata(user);

      // Get user status
      const statusResult = await this.service.getUserStatus(user.id);

      if (!statusResult.success || !statusResult.data) {
        // Default to root if we can't fetch user data
        return NextResponse.redirect(
          this.service.getRedirectUrl(origin, "root")
        );
      }

      // Determine redirect destination
      const redirect = this.service.determineRedirect(statusResult.data);

      return NextResponse.redirect(
        this.service.getRedirectUrl(origin, redirect.destination, redirect.error)
      );
    } catch (error) {
      return NextResponse.redirect(
        this.service.getRedirectUrl(origin, "login", "unexpected_error")
      );
    }
  }

  /**
   * POST /api/auth/resend-verification
   * Resend verification email for unverified user
   * @param request - The incoming request with email in body
   * @returns NextResponse indicating success or failure
   */
  public async resendVerification(
    request: NextRequest
  ): Promise<NextResponse<{ success: true; message: string; requestId?: string } | ApiErrorResponse>> {
    try {
      const body = await this.parseBody<{ email: string }>(request);
      const { email } = body;

      if (!email || typeof email !== "string") {
        return this.badRequest("Email is required");
      }

      const result = await this.service.resendVerificationEmail(email);

      if (result.success) {
        return this.json(result.data!, result.status);
      }

      // Return error in format expected by frontend
      // Frontend expects: { error: string, details?: string, code?: string }
      const errorMessage = result.error?.message || "Failed to resend verification email";
      const errorDetailsObj = result.error?.details as any;
      const errorDetails = typeof errorDetailsObj === 'string' 
        ? errorDetailsObj
        : errorDetailsObj?.details || errorDetailsObj?.originalError || undefined;
      const errorCode = errorDetailsObj?.code || 'UNKNOWN_ERROR';

      return this.json(
        {
          error: errorMessage,
          details: errorDetails,
          code: errorCode
        },
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/auth/check-email
   * Check if an email exists in the users table
   * @param request - The incoming request with email in body
   * @returns NextResponse with exists boolean
   */
  public async checkEmail(
    request: NextRequest
  ): Promise<NextResponse<{ exists: boolean } | ApiErrorResponse>> {
    try {
      const body = await this.parseBody<{ email: string }>(request);
      const { email } = body;

      if (!email || typeof email !== "string") {
        return this.badRequest("Email is required");
      }

      const result = await this.service.checkEmailExists(email);

      if (result.success) {
        return this.json(result.data!, 200);
      }

      return this.error(
        result.error?.message || "Failed to check email",
        result.status || 500
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const authController = AuthController.getInstance();

