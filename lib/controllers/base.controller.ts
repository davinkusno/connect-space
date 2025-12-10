import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";

/**
 * Base controller class providing common HTTP handling functionality
 * All domain controllers should extend this class
 */
export abstract class BaseController {
  /**
   * Get authenticated user from request
   * @returns User object or null if not authenticated
   */
  protected async getAuthenticatedUser(): Promise<User | null> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Require authentication - throws if not authenticated
   * @returns Authenticated user
   */
  protected async requireAuth(): Promise<User> {
    const user = await this.getAuthenticatedUser();
    if (!user) {
      throw new UnauthorizedError();
    }
    return user;
  }

  /**
   * Create JSON response
   */
  protected json<T>(data: T, status: number = 200): NextResponse {
    return NextResponse.json(data, { status });
  }

  /**
   * Create success response
   */
  protected success<T>(data: T, status: number = 200): NextResponse {
    return NextResponse.json({ success: true, data }, { status });
  }

  /**
   * Create error response
   */
  protected error(message: string, status: number = 500): NextResponse {
    return NextResponse.json({ error: message }, { status });
  }

  /**
   * 401 Unauthorized response
   */
  protected unauthorized(message: string = "Unauthorized"): NextResponse {
    return this.error(message, 401);
  }

  /**
   * 403 Forbidden response
   */
  protected forbidden(message: string = "Forbidden"): NextResponse {
    return this.error(message, 403);
  }

  /**
   * 404 Not Found response
   */
  protected notFound(message: string = "Not found"): NextResponse {
    return this.error(message, 404);
  }

  /**
   * 400 Bad Request response
   */
  protected badRequest(message: string = "Bad request"): NextResponse {
    return this.error(message, 400);
  }

  /**
   * 500 Internal Server Error response
   */
  protected serverError(message: string = "Internal server error"): NextResponse {
    return this.error(message, 500);
  }

  /**
   * Parse JSON body from request
   */
  protected async parseBody<T>(request: NextRequest): Promise<T> {
    try {
      return await request.json();
    } catch {
      throw new BadRequestError("Invalid JSON body");
    }
  }

  /**
   * Get query parameter from URL
   */
  protected getQueryParam(request: NextRequest, key: string): string | null {
    const { searchParams } = new URL(request.url);
    return searchParams.get(key);
  }

  /**
   * Get all query parameters as object
   */
  protected getQueryParams(request: NextRequest): Record<string, string> {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  /**
   * Handle controller errors uniformly
   */
  protected handleError(error: unknown): NextResponse {
    if (error instanceof UnauthorizedError) {
      return this.unauthorized(error.message);
    }
    if (error instanceof ForbiddenError) {
      return this.forbidden(error.message);
    }
    if (error instanceof NotFoundError) {
      return this.notFound(error.message);
    }
    if (error instanceof BadRequestError) {
      return this.badRequest(error.message);
    }
    return this.serverError();
  }
}

/**
 * Controller error classes
 */
export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  constructor(message: string = "Bad request") {
    super(message);
    this.name = "BadRequestError";
  }
}

