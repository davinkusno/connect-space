import { createServerClient } from "./server"
import type { Database, InsertTables, UpdateTables } from "./types"

// Generic CRUD operations for any table
export const dbHelpers = {
  // Create a new record
  async create<T extends keyof Database["public"]["Tables"]>(table: T, data: InsertTables<T>) {
    const supabase = createServerClient()

    const { data: result, error } = await supabase.from(table).insert(data).select().single()

    if (error) {
      console.error(`Error creating ${table}:`, error)
      throw error
    }

    return result
  },

  // Get a record by ID
  async getById<T extends keyof Database["public"]["Tables"]>(table: T, id: string) {
    const supabase = createServerClient()

    const { data, error } = await supabase.from(table).select("*").eq("id", id).single()

    if (error) {
      console.error(`Error getting ${table} by ID:`, error)
      return null
    }

    return data
  },

  // Update a record
  async update<T extends keyof Database["public"]["Tables"]>(table: T, id: string, data: UpdateTables<T>) {
    const supabase = createServerClient()

    const { data: result, error } = await supabase.from(table).update(data).eq("id", id).select().single()

    if (error) {
      console.error(`Error updating ${table}:`, error)
      throw error
    }

    return result
  },

  // Delete a record
  async delete<T extends keyof Database["public"]["Tables"]>(table: T, id: string) {
    const supabase = createServerClient()

    const { error } = await supabase.from(table).delete().eq("id", id)

    if (error) {
      console.error(`Error deleting ${table}:`, error)
      throw error
    }

    return true
  },

  // List records with optional filters
  async list<T extends keyof Database["public"]["Tables"]>(
    table: T,
    options: {
      page?: number
      pageSize?: number
      filters?: Record<string, any>
      orderBy?: { column: string; ascending?: boolean }
    } = {},
  ) {
    const supabase = createServerClient()
    const { page = 1, pageSize = 10, filters = {}, orderBy } = options

    let query = supabase.from(table).select("*")

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, {
        ascending: orderBy.ascending ?? true,
      })
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error(`Error listing ${table}:`, error)
      throw error
    }

    return { data, count }
  },
}
