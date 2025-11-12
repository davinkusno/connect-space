import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot Password - Reset Your Password",
  description: "Reset your password securely and regain access to your account.",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
