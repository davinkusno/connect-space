"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FloatingElements } from "@/components/ui/floating-elements"
import { PageTransition } from "@/components/ui/page-transition"
import { SmoothReveal } from "@/components/ui/smooth-reveal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowser()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setIsEmailSent(true)
        toast({
          title: "Email sent!",
          description: "Check your inbox for password reset instructions.",
        })
      }
    } catch (err: any) {
      setError("An unexpected error occurred")
      console.error(err)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = () => {
    setIsEmailSent(false)
    setError(null)
  }

  if (isEmailSent) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6 relative overflow-hidden">
          <FloatingElements />

          <div className="w-full max-w-md relative z-10">
            <SmoothReveal>
              <AnimatedCard variant="glass" className="overflow-hidden smooth-hover">
                <div className="absolute inset-0 gradient-primary opacity-5"></div>

                <div className="relative z-10 p-8 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center pulse-glow floating-animation">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <h1 className="text-3xl font-bold text-gradient mb-2">Check Your Email</h1>
                  <p className="text-gray-600 mb-6">
                    We've sent password reset instructions to <span className="font-medium text-gray-800">{email}</span>
                  </p>

                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Didn't receive the email? Check your spam folder or try again.
                    </p>

                    <AnimatedButton
                      onClick={handleResendEmail}
                      variant="glass"
                      className="w-full h-12 border-2 border-gray-200 hover:border-purple-300 smooth-hover"
                    >
                      Send Another Email
                    </AnimatedButton>

                    <Link
                      href="/auth/login"
                      className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 transition-colors duration-300 hover:underline nav-item"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Link>
                  </div>
                </div>
              </AnimatedCard>
            </SmoothReveal>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6 relative overflow-hidden">
        <FloatingElements />

        <div className="w-full max-w-md relative z-10">
          <SmoothReveal>
            <AnimatedCard variant="glass" className="overflow-hidden smooth-hover">
              <div className="absolute inset-0 gradient-primary opacity-5"></div>

              <div className="relative z-10 p-8">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <Image src="/logo.png" alt="Logo" width={64} height={64} className="w-16 h-16" />
                  </div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">Forgot Password?</h1>
                  <p className="text-gray-600">No worries! Enter your email and we'll send you reset instructions.</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <SmoothReveal delay={100}>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium form-label">
                        Email Address
                      </Label>
                      <div className="group flex h-12 items-center rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 focus-within:border-purple-400">
                        <Mail className="mx-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-colors duration-300 group-focus-within:text-purple-600" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-full w-full border-0 bg-transparent p-0 pr-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>
                  </SmoothReveal>

                  <SmoothReveal delay={200}>
                    <AnimatedButton
                      type="submit"
                      variant="gradient"
                      className="w-full h-12 text-lg font-medium smooth-hover"
                      disabled={isLoading || !email}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending Email...
                        </div>
                      ) : (
                        "Send Reset Instructions"
                      )}
                    </AnimatedButton>
                  </SmoothReveal>

                  <SmoothReveal delay={300}>
                    <div className="text-center">
                      <Link
                        href="/auth/login"
                        className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 transition-colors duration-300 hover:underline nav-item"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                      </Link>
                    </div>
                  </SmoothReveal>
                </form>
              </div>
            </AnimatedCard>
          </SmoothReveal>
        </div>
      </div>
    </PageTransition>
  )
}
