import { createServerClient } from "@/lib/supabase/server";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Base service class providing common database operations
 * All domain services should extend this class
 */
export abstract class BaseService {
  protected supabaseAdmin: SupabaseClient;

  constructor() {
    this.supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get authenticated Supabase client for user context
   */
  protected async getAuthClient(): Promise<SupabaseClient> {
    return await createServerClient();
  }

  /**
   * Get current authenticated user
   * @throws AuthenticationError if user is not authenticated
   */
  protected async getCurrentUser(): Promise<User> {
    const supabase: SupabaseClient = await this.getAuthClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new AuthenticationError("Authentication required");
    }

    return user;
  }

  /**
   * Get current user or null (doesn't throw)
   */
  protected async getCurrentUserOrNull(): Promise<User | null> {
    try {
      return await this.getCurrentUser();
    } catch {
      return null;
    }
  }

  /**
   * Parse location data that can be either JSON string or object
   */
  protected parseLocation<T>(location: string | T | null | undefined): T | null {
    if (!location) return null;
    if (typeof location === "string") {
      try {
        return JSON.parse(location) as T;
      } catch {
        return null;
      }
    }
    return location;
  }

  /**
   * Format location for display
   */
  protected formatLocationDisplay(location: unknown): string {
    if (!location) return "Location not specified";
    
    if (typeof location === "string") {
      try {
        const parsed = JSON.parse(location);
        return parsed.address || parsed.city || "Location not specified";
      } catch {
        return location;
      }
    }
    
    if (typeof location === "object" && location !== null) {
      const loc = location as Record<string, unknown>;
      return (loc.address as string) || (loc.city as string) || "Location not specified";
    }
    
    return "Location not specified";
  }
}

/**
 * Custom error classes for better error handling
 */
export class AuthenticationError extends Error {
  public readonly statusCode: number = 401;
  
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  public readonly statusCode: number = 403;
  
  constructor(message: string = "Permission denied") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  public readonly statusCode: number = 404;
  
  constructor(resource: string = "Resource") {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  public readonly statusCode: number = 400;
  
  constructor(message: string = "Validation failed") {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  public readonly statusCode: number = 409;
  
  constructor(message: string = "Resource conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * Service result type - standardized response from service methods
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  status: number;
}

export interface ServiceError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * API Response helper class for creating standardized responses
 */
export class ApiResponse {
  static success<T>(data: T, status: number = 200): ServiceResult<T> {
    return { success: true, data, status };
  }

  static error(message: string, status: number = 500, details?: unknown): ServiceResult<never> {
    return { 
      success: false, 
      error: { message, details }, 
      status 
    };
  }

  static created<T>(data: T): ServiceResult<T> {
    return this.success(data, 201);
  }

  static noContent(): ServiceResult<void> {
    return { success: true, status: 204 };
  }

  static notFound(resource: string = "Resource"): ServiceResult<never> {
    return this.error(`${resource} not found`, 404);
  }

  static unauthorized(message: string = "Authentication required"): ServiceResult<never> {
    return this.error(message, 401);
  }

  static forbidden(message: string = "Permission denied"): ServiceResult<never> {
    return this.error(message, 403);
  }

  static badRequest(message: string = "Invalid request"): ServiceResult<never> {
    return this.error(message, 400);
  }
}

/**
 * Pagination helper types
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
