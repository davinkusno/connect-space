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
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, Sparkles } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowser()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/dashboard")
        router.refresh()
        toast({
          title: "Signed in successfully!",
          description: "Welcome back to ConnectSpace!",
          variant: "success",
        })
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: "Redirecting...",
        description: "Signing in with Google...",
        variant: "info",
      })
    } catch (err: any) {
      console.error("Google sign-in error:", err)
      setError(err.message || "Failed to sign in with Google. Please try again.")
      toast({
        title: "Sign-in failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
                  <h1 className="text-3xl font-bold text-gradient mb-2">Welcome Back</h1>
                  <p className="text-gray-600">Sign in to your account</p>
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
                        Email
                      </Label>
                      <div className="group flex h-12 items-center rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 focus-within:border-purple-400">
                        <Mail className="mx-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-colors duration-300 group-focus-within:text-purple-600" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-full w-full border-0 bg-transparent p-0 pr-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>
                  </SmoothReveal>

                  <SmoothReveal delay={200}>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium form-label">
                        Password
                      </Label>
                      <div className="group flex h-12 items-center rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 focus-within:border-purple-400">
                        <Lock className="mx-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-colors duration-300 group-focus-within:text-purple-600" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-full w-full border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="mx-4 text-gray-400 transition-colors duration-300 hover:text-purple-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </SmoothReveal>

                  <SmoothReveal delay={300}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="remember"
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 transition-colors duration-200"
                        />
                        <Label htmlFor="remember" className="text-sm text-gray-600">
                          Remember me
                        </Label>
                      </div>
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-purple-600 hover:text-purple-700 transition-colors duration-300 hover:underline nav-item"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </SmoothReveal>

                  <SmoothReveal delay={400}>
                    <AnimatedButton
                      type="submit"
                      variant="gradient"
                      className="w-full h-12 text-lg font-medium smooth-hover"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Signing In...
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </AnimatedButton>
                  </SmoothReveal>

                  <SmoothReveal delay={500}>
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="bg-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-4 text-gray-500 font-medium">Or continue with</span>
                      </div>
                    </div>
                  </SmoothReveal>

                  <SmoothReveal delay={600}>
                    <div className="grid">
                      <AnimatedButton
                        type="button"
                        onClick={() => handleOAuthSignIn()}
                        variant="glass"
                        className="h-12 border-2 border-gray-200 hover:border-purple-300 smooth-hover"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            Signing in...
                          </div>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                            Google
                          </>
                        )}
                      </AnimatedButton>
                    </div>
                  </SmoothReveal>

                  <SmoothReveal delay={700}>
                    <div className="text-center mt-8">
                      <span className="text-gray-600">Don't have an account? </span>
                      <Link
                        href="/auth/signup"
                        className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300 hover:underline nav-item"
                      >
                        Sign up
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
