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
    redirect("/dashboard")
  }

  // If not logged in, render the login form
  return <LoginForm />
}
