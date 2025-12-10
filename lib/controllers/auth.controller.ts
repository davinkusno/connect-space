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
}

// Export singleton instance
export const authController = AuthController.getInstance();

