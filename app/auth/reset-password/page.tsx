import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set your new password",
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
