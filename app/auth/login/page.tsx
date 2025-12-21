import { LoginForm } from "@/components/auth/login-form"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  // Check if user is already logged in
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    // Get user role and check if they're admin of any community
    const { data: userData } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", session.user.id)
      .single()

    const userType = userData?.user_type

    // Check if user is admin of any community
    const { data: adminCommunities } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .limit(1)

    const isAdminOfAnyCommunity = adminCommunities && adminCommunities.length > 0

    // Redirect based on role
    if (userType === "super_admin") {
      redirect("/superadmin")
    } else {
      redirect("/home")
    }
  }

  // If not logged in, render the login form
  return <LoginForm />
}
