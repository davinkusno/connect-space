import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage() {
  // Check if user is already logged in
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    // Get user role and redirect accordingly
    const { data: userData } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", session.user.id)
      .single()

    const userRole = userData?.user_type

    // Redirect based on role
    if (userRole === "community_admin") {
      redirect("/community-admin")
    } else if (userRole === "super_admin") {
      redirect("/superadmin")
    } else {
      redirect("/dashboard")
    }
  }

  // If not logged in, render the login form
  return <LoginForm />
}
