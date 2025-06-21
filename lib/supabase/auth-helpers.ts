import { getServerUser, getServerSession } from "./server"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const user = await getServerUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

export async function requireSession() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  return session
}

export async function getCurrentUserProfile() {
  const user = await getServerUser()

  if (!user) {
    return null
  }

  // You can add additional profile fetching logic here
  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
    created_at: user.created_at,
    email_confirmed_at: user.email_confirmed_at,
  }
}
