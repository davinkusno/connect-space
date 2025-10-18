import { z } from "zod"

// Common response structure
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page?: number
    pageSize?: number
    totalCount?: number
    totalPages?: number
  }
}

// Community validation schemas
export const communityQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  onlyJoined: z.coerce.boolean().optional().default(false),
  onlyAdmin: z.coerce.boolean().optional().default(false),
  sortBy: z.enum(["created_at", "name", "member_count"]).optional().default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
})

export const communityIdSchema = z.object({
  id: z.string().uuid(),
})

export const createCommunitySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.string().optional(),
  location: z.string().optional(),
  is_private: z.boolean().optional().default(false),
  logo_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
})

export const updateCommunitySchema = createCommunitySchema.partial()

export type CommunityQuery = z.infer<typeof communityQuerySchema>
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>
