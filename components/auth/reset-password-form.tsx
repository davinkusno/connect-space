"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FloatingElements } from "@/components/ui/floating-elements"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/components/ui/page-transition"
import { SmoothReveal } from "@/components/ui/smooth-reveal"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"

interface FormData {
  password: string
  confirmPassword: string
}

interface ValidationErrors {
  password?: string
  confirmPassword?: string
}

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowser()
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormData>({
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const url = new URL(window.location.href)
    const token = url.searchParams.get("token")
    const type = url.searchParams.get("type")
    const error = url.searchParams.get("error")
    const errorDescription = url.searchParams.get("error_description")

    // Handle expired or invalid OTP token
    if (error === "access_denied" && errorDescription?.includes("expired")) {
      toast({
        title: "Invalid or expired link",
        description: "Your reset password link is invalid or has expired.",
        variant: "destructive",
      })
      router.push("/auth/forgot-password")
      return
    }

    if (!token || type !== "recovery") return

    const runExchange = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(token)

      if (error) {
        toast({
          title: "Invalid or expired link",
          description: error.message,
          variant: "destructive",
        })
        router.push("/auth/forgot-password")
      }
    }

    runExchange()
  }, [router, supabase, toast])

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required"
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords don't match"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
        variant: "success",
      })

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (error: any) {
      setError(error.message || "Something went wrong. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6 relative overflow-hidden">
          <FloatingElements />

          <div className="w-full max-w-lg relative z-10">
            <SmoothReveal>
              <AnimatedCard variant="glass" className="overflow-hidden smooth-hover">
                <div className="absolute inset-0 gradient-primary opacity-5"></div>

                <div className="relative z-10 p-6">
                  <div className="text-center mb-4">
                    <div className="flex justify-center mb-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gradient mb-2">
                      Password Updated!
                    </h1>
                    <p className="text-gray-600">
                      Your password has been successfully updated. You'll be redirected to the login page shortly.
                    </p>
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

        <div className="w-full max-w-lg relative z-10">
          <SmoothReveal>
            <AnimatedCard variant="glass" className="overflow-hidden smooth-hover">
              <div className="absolute inset-0 gradient-primary opacity-5"></div>

              <div className="relative z-10 p-6">
                <div className="text-center mb-4">
                  <div className="flex justify-center mb-2">
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      width={32}
                      height={32}
                      className="w-8 h-8"
                    />
                  </div>
                  <h1 className="text-xl font-bold text-gradient mb-1">
                    Set New Password
                  </h1>
                  <p className="text-sm text-gray-600">
                    Enter your new password below
                  </p>
                </div>

                {error && (
                  <SmoothReveal>
                    <Alert className="mb-4 border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-600">
                        {error}
                      </AlertDescription>
                    </Alert>
                  </SmoothReveal>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <SmoothReveal delay={50}>
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-gray-700 font-medium form-label"
                      >
                        New Password
                      </Label>
                      <div className="group flex h-10 items-center rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 focus-within:border-purple-400">
                        <Lock className="mx-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-colors duration-300 group-focus-within:text-purple-600" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="8+ characters"
                          value={formData.password}
                          onChange={(e) =>
                            handleInputChange("password", e.target.value)
                          }
                          className="h-full w-full border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="mx-4 text-gray-400 transition-colors duration-300 hover:text-purple-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {validationErrors.password && (
                        <p className="text-xs text-red-600">
                          {validationErrors.password}
                        </p>
                      )}
                    </div>
                  </SmoothReveal>

                  <SmoothReveal delay={100}>
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-gray-700 font-medium form-label"
                      >
                        Confirm Password
                      </Label>
                      <div className="group flex h-10 items-center rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 focus-within:border-purple-400">
                        <Lock className="mx-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-colors duration-300 group-focus-within:text-purple-600" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            handleInputChange("confirmPassword", e.target.value)
                          }
                          className="h-full w-full border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="mx-4 text-gray-400 transition-colors duration-300 hover:text-purple-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {validationErrors.confirmPassword && (
                        <p className="text-xs text-red-600">
                          {validationErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </SmoothReveal>

                  <SmoothReveal delay={150}>
                    <AnimatedButton
                      type="submit"
                      variant="gradient"
                      className="w-full h-10 text-base font-medium smooth-hover"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </div>
                      ) : (
                        "Update Password"
                      )}
                    </AnimatedButton>
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
