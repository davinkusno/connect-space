import { LoginForm } from "@/components/auth/login-form"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  // Check if user is already logged in via API
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/check-session`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.isAuthenticated && data.redirectUrl) {
        redirect(data.redirectUrl);
      }
    }
  } catch (error) {
    // If API fails, just render login form
    console.error('Error checking session:', error);
  }

  // If not logged in, render the login form
  return <LoginForm />
}
