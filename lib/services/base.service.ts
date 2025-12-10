import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

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
   * @throws Error if user is not authenticated
   */
  protected async getCurrentUser() {
    const supabase = await this.getAuthClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new AuthenticationError("Authentication required");
    }

    return user;
  }

  /**
   * Get current user or null (doesn't throw)
   */
  protected async getCurrentUserOrNull() {
    try {
      return await this.getCurrentUser();
    } catch {
      return null;
    }
  }
}

/**
 * Custom error classes for better error handling
 */
export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Permission denied") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message: string = "Validation failed") {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message: string = "Resource conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * API Response helper
 */
export class ApiResponse {
  static success<T>(data: T, status: number = 200) {
    return { success: true, data, status };
  }

  static error(message: string, status: number = 500, details?: any) {
    return { success: false, error: { message, details }, status };
  }

  static created<T>(data: T) {
    return this.success(data, 201);
  }

  static noContent() {
    return { success: true, status: 204 };
  }
}

/**
 * Type for service method results
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
  status: number;
}

