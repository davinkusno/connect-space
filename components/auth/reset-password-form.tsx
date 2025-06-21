"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Lock, CheckCircle } from "lucide-react"

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowser()

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
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
}, [router, supabase])


  async function onSubmit(data: ResetPasswordValues) {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      })

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (error: any) {
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
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Password updated!</CardTitle>
          <CardDescription>
            Your password has been successfully updated. You'll be redirected to the login page shortly.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Lock className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Set new password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="group flex h-12 items-center rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 focus-within:border-purple-400">
                      <Lock className="mx-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-colors duration-300 group-focus-within:text-purple-600" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-full w-full border-0 bg-transparent p-0 pr-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="group flex h-12 items-center rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 focus-within:border-purple-400">
                      <Lock className="mx-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-colors duration-300 group-focus-within:text-purple-600" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-full w-full border-0 bg-transparent p-0 pr-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
