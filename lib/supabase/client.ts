import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./types"

// Create a singleton instance for client components
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowser() {
  if (!clientInstance) {
    clientInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return clientInstance
}

// Alternative export name for consistency
export function createClient() {
  return getSupabaseBrowser()
}

// Helper to get current session on client side
export async function getClientSession() {
  const supabase = getSupabaseBrowser()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("Error getting client session:", error)
    return null
  }

  return session
}

// Helper to get current user on client side
export async function getClientUser() {
  const supabase = getSupabaseBrowser()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error("Error getting client user:", error)
    return null
  }

  return user
}

// Export the singleton instance getter as default
export default getSupabaseBrowser
