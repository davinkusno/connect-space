import { ServiceResult } from "@/lib/services/base.service";
import { createServerClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

/**
 * Standard API response structure
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

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
   * @throws UnauthorizedError if not authenticated
   */
  protected async requireAuth(): Promise<User> {
    const user: User | null = await this.getAuthenticatedUser();
    if (!user) {
      throw new UnauthorizedError();
    }
    return user;
  }

  /**
   * Get optional authentication - returns user if authenticated, null otherwise
   * Does not throw if not authenticated
   * @returns User or null
   */
  protected async getOptionalAuth(): Promise<User | null> {
    return this.getAuthenticatedUser();
  }

  /**
   * Create JSON response with proper typing
   */
  protected json<T>(data: T, status: number = 200): NextResponse<T> {
    return NextResponse.json(data, { status });
  }

  /**
   * Create success response with data
   */
  protected success<T>(data: T, status: number = 200): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json({ success: true, data }, { status });
  }

  /**
   * Create error response
   */
  protected error(
    message: string, 
    status: number = 500, 
    code: string = "INTERNAL_ERROR"
  ): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
      { 
        success: false, 
        error: { code, message } 
      }, 
      { status }
    );
  }

  /**
   * 401 Unauthorized response
   */
  protected unauthorized(message: string = "Unauthorized"): NextResponse<ApiErrorResponse> {
    return this.error(message, 401, "UNAUTHORIZED");
  }

  /**
   * 403 Forbidden response
   */
  protected forbidden(message: string = "Forbidden"): NextResponse<ApiErrorResponse> {
    return this.error(message, 403, "FORBIDDEN");
  }

  /**
   * 404 Not Found response
   */
  protected notFound(message: string = "Not found"): NextResponse<ApiErrorResponse> {
    return this.error(message, 404, "NOT_FOUND");
  }

  /**
   * 400 Bad Request response
   */
  protected badRequest(message: string = "Bad request"): NextResponse<ApiErrorResponse> {
    return this.error(message, 400, "BAD_REQUEST");
  }

  /**
   * 409 Conflict response
   */
  protected conflict(message: string = "Resource conflict"): NextResponse<ApiErrorResponse> {
    return this.error(message, 409, "CONFLICT");
  }

  /**
   * 500 Internal Server Error response
   */
  protected serverError(message: string = "Internal server error"): NextResponse<ApiErrorResponse> {
    return this.error(message, 500, "INTERNAL_ERROR");
  }

  /**
   * Convert service result to HTTP response
   */
  protected serviceResultToResponse<T>(result: ServiceResult<T>): NextResponse {
    if (result.success) {
      return this.success(result.data, result.status);
    }
    return this.error(
      result.error?.message || "An error occurred",
      result.status,
      result.error?.code || "ERROR"
    );
  }

  /**
   * Parse JSON body from request with type safety
   */
  protected async parseBody<T>(request: NextRequest): Promise<T> {
    try {
      const body: T = await request.json();
      return body;
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
   * Get query parameter as number
   */
  protected getQueryParamAsNumber(
    request: NextRequest, 
    key: string, 
    defaultValue: number
  ): number {
    const value: string | null = this.getQueryParam(request, key);
    if (!value) return defaultValue;
    const parsed: number = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get all query parameters as object
   */
  protected getQueryParams(request: NextRequest): Record<string, string> {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    searchParams.forEach((value: string, key: string) => {
      params[key] = value;
    });
    return params;
  }

  /**
   * Validate request body against a Zod schema
   */
  protected async validateBody<T>(
    request: NextRequest,
    schema: ZodSchema<T>
  ): Promise<T> {
    try {
      const body = await request.json().catch(() => ({}));
      return schema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError("Invalid request data", error.format());
      }
      throw new BadRequestError("Failed to validate request data");
    }
  }

  /**
   * Validate query parameters against a Zod schema
   */
  protected validateQuery<T>(
    request: NextRequest,
    schema: ZodSchema<T>
  ): T {
    try {
      const params = this.getQueryParams(request);
      return schema.parse(params);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError("Invalid query parameters", error.format());
      }
      throw new BadRequestError("Failed to validate query parameters");
    }
  }

  /**
   * Validate request (body for POST/PUT/PATCH, query for GET)
   */
  protected async validateRequest<T>(
    request: NextRequest,
    schema: ZodSchema<T>
  ): Promise<T> {
    if (request.method === "GET") {
      return this.validateQuery(request, schema);
    }
    return this.validateBody(request, schema);
  }

  /**
   * Parse path parameters from URL
   * Example: /api/events/123 -> getPathParam(request, "events") returns "123"
   */
  protected getPathParam(request: NextRequest, afterSegment: string): string | null {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const index = pathParts.findIndex((part) => part === afterSegment);

    if (index !== -1 && index < pathParts.length - 1) {
      return pathParts[index + 1];
    }

    return null;
  }

  /**
   * Rate limiting check (placeholder - can be extended with Redis)
   */
  protected async checkRateLimit(_request: NextRequest): Promise<boolean> {
    // Rate limiting disabled by default - implement with Redis if needed
    return true;
  }

  /**
   * Handle controller errors uniformly
   */
  protected handleError(error: unknown): NextResponse<ApiErrorResponse> {
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
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
            details: error.details,
          },
        },
        { status: 400 }
      );
    }
    if (error instanceof ConflictError) {
      return this.conflict(error.message);
    }
    
    // Log unexpected errors in development
    if (process.env.NODE_ENV === "development") {
      console.error("Controller error:", error);
    }
    
    return this.serverError();
  }
}

/**
 * Controller error classes with proper typing
 */
export class UnauthorizedError extends Error {
  public readonly statusCode: number = 401;
  public readonly code: string = "UNAUTHORIZED";
  
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  public readonly statusCode: number = 403;
  public readonly code: string = "FORBIDDEN";
  
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  public readonly statusCode: number = 404;
  public readonly code: string = "NOT_FOUND";
  
  constructor(message: string = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  public readonly statusCode: number = 400;
  public readonly code: string = "BAD_REQUEST";
  
  constructor(message: string = "Bad request") {
    super(message);
    this.name = "BadRequestError";
  }
}

export class ConflictError extends Error {
  public readonly statusCode: number = 409;
  public readonly code: string = "CONFLICT";
  
  constructor(message: string = "Resource conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export class ValidationError extends Error {
  public readonly statusCode: number = 400;
  public readonly code: string = "VALIDATION_ERROR";
  public readonly details: unknown;
  
  constructor(message: string = "Validation failed", details?: unknown) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}
