import { type NextRequest, NextResponse } from "next/server"
import { ZodError, type ZodSchema } from "zod"
import type { ApiResponse } from "./types"
import { createServerClient } from "@/lib/supabase/server"

// Validate request data against a schema
export async function validateRequest<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
): Promise<{
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: any }
}> {
  try {
    // For GET requests, validate query parameters
    if (req.method === "GET") {
      const url = new URL(req.url)
      const queryParams: Record<string, string> = {}

      url.searchParams.forEach((value, key) => {
        queryParams[key] = value
      })

      const data = schema.parse(queryParams)
      return { success: true, data }
    }
    // For POST, PUT, PATCH requests, validate body
    else {
      const body = await req.json().catch(() => ({}))
      const data = schema.parse(body)
      return { success: true, data }
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.format(),
        },
      }
    }

    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Failed to validate request data",
      },
    }
  }
}

// Check if user is authenticated
export async function requireAuth() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Authentication required")
  }

  return session
}

// Format API response
export function formatResponse<T>(data?: T, meta?: ApiResponse<T>["meta"], status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, meta }, { status })
}

// Format API error response
export function formatError(
  code: string,
  message: string,
  details?: any,
  status = 400,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status })
}

// Apply rate limiting to API routes (disabled - no Redis)
export async function applyRateLimit(req: NextRequest): Promise<boolean> {
  // Rate limiting disabled - always allow requests
  return true
}

// Parse path parameters
export function parsePathParams(req: NextRequest, param: string): string | null {
  const url = new URL(req.url)
  const pathParts = url.pathname.split("/")
  const index = pathParts.findIndex((part) => part === param)

  if (index !== -1 && index < pathParts.length - 1) {
    return pathParts[index + 1]
  }

  return null
}
