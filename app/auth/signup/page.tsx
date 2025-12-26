"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Checkbox } from "@/components/ui/checkbox";
import { FloatingElements } from "@/components/ui/floating-elements";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/ui/page-transition";
import { Separator } from "@/components/ui/separator";
import { SmoothReveal } from "@/components/ui/smooth-reveal";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
    AlertCircle,
    CheckCircle, Eye,
    EyeOff, Lock, Mail, User
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState, useEffect, useRef } from "react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
}

export default function SignupPage() {
  const [selectedRole] = useState<"user">("user");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [verificationEmailSentAt, setVerificationEmailSentAt] = useState<Date | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resendCooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  // Check if email exists
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      return false;
    }
  };

  // Validate email format
  const validateEmailFormat = (email: string): boolean => {
    // More robust email validation regex
    // Allows: letters, numbers, dots, hyphens, underscores, plus signs before @
    // Requires: @ symbol, domain name, and TLD (at least 2 characters)
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  };

  // Handle email blur to validate format and check if it exists
  const handleEmailBlur = async () => {
    const email = formData.email.trim();
    if (!email) {
      setValidationErrors((prev) => ({
        ...prev,
        email: "Email is required",
      }));
      return;
    }

    // Validate email format first
    if (!validateEmailFormat(email)) {
      setValidationErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address (e.g., name@example.com)",
      }));
      return;
    }

    // Clear format error if format is valid
    setValidationErrors((prev) => {
      const { email: _, ...rest } = prev;
      return rest;
    });

    // Check if email exists
    setIsCheckingEmail(true);
    const exists = await checkEmailExists(email);
    setIsCheckingEmail(false);

    if (exists) {
      setValidationErrors((prev) => ({
        ...prev,
        email: "This email is already registered. Please sign in instead.",
      }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const errors: ValidationErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmailFormat(formData.email)) {
      errors.email = "Please enter a valid email address (e.g., name@example.com)";
    } else {
      // Check if email exists before submitting
      const exists = await checkEmailExists(formData.email.trim());
      if (exists) {
        errors.email = "This email is already registered. Please sign in instead.";
      }
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      errors.agreeToTerms =
        "You must agree to the Terms of Service and Privacy Policy";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Effect to show resend button after 30 seconds
  useEffect(() => {
    if (verificationEmailSentAt) {
      const timer = setTimeout(() => {
        setShowResendButton(true);
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, [verificationEmailSentAt]);

  // Resend verification email
  const handleResendVerification = async () => {
    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setIsResendingEmail(true);
    try {
      // Call API endpoint to resend verification email
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show more detailed error message
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || "Failed to resend verification email";
        throw new Error(errorMessage);
      }

      setVerificationEmailSentAt(new Date());
      setShowResendButton(false);
      
      // Start cooldown timer (60 seconds)
      const cooldownSeconds = 60;
      setResendCooldown(cooldownSeconds);
      
      // Clear any existing interval
      if (resendCooldownIntervalRef.current) {
        clearInterval(resendCooldownIntervalRef.current);
      }
      
      // Start countdown
      resendCooldownIntervalRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (resendCooldownIntervalRef.current) {
              clearInterval(resendCooldownIntervalRef.current);
              resendCooldownIntervalRef.current = null;
            }
            setShowResendButton(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Show warning if email sending might not be configured
      if (data.warning) {
        toast({
          title: "Email Configuration Warning",
          description: data.warning,
          variant: "default",
        });
      } else {
        toast({
          title: "Verification email sent!",
          description: "Please check your inbox for the verification link.",
          variant: "success",
        });
      }
    } catch (err: any) {
      toast({
        title: "Failed to resend email",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResendingEmail(false);
    }
  };
  
  // Cleanup cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (resendCooldownIntervalRef.current) {
        clearInterval(resendCooldownIntervalRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user && !data.session) {
        setVerificationEmailSentAt(new Date());
        setSuccess(
          "Please check your email for a verification link to complete your registration."
        );
        toast({
          title: "Registration successful!",
          description: "Please check your email to verify your account.",
          variant: "success",
        });
      } else if (data.session) {
        toast({
          title: "Welcome to ConnectSpace!",
          description: "Your account has been created successfully.",
          variant: "success",
        });

        // Redirect to onboarding after signup
        router.push("/onboarding");
      }
    } catch (err: any) {
      // Handle specific Supabase errors
      let errorMessage = err.message || "An error occurred during registration. Please try again.";
      
      if (err.message?.includes("User already registered")) {
        errorMessage = "This email is already registered. Please sign in instead.";
        setValidationErrors((prev) => ({
          ...prev,
          email: errorMessage,
        }));
      } else if (err.message?.includes("email address is already")) {
        errorMessage = "This email is already registered. Please sign in instead.";
        setValidationErrors((prev) => ({
          ...prev,
          email: errorMessage,
        }));
      } else if (err.message?.includes("confirmation email") || err.message?.includes("Error sending")) {
        errorMessage = "Email verification failed. Please check your email configuration or try again later.";
      }
      
      setError(errorMessage);
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null);

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
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Redirecting...",
        description: "Creating account with Google...",
        variant: "info",
      });
    } catch (err: any) {
      setError(
        err.message || "Failed to sign up with Google. Please try again."
      );
      toast({
        title: "Sign-up failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // For email field, validate format in real-time
    if (field === "email" && typeof value === "string") {
      const email = value.trim();
      // Clear error if email is empty or format is valid
      if (!email) {
        setValidationErrors((prev) => ({ ...prev, email: undefined }));
      } else if (validateEmailFormat(email)) {
        // Only clear format-related errors, keep existence errors
        const currentError = validationErrors.email;
        if (currentError && currentError.includes("valid email")) {
          setValidationErrors((prev) => ({ ...prev, email: undefined }));
        }
      } else if (email.length > 0) {
        // Show format error only if user has typed something and format is invalid
        // But only if they've moved away from the field or typed enough characters
        if (email.length > 5) {
          setValidationErrors((prev) => ({
            ...prev,
            email: "Please enter a valid email address (e.g., name@example.com)",
          }));
        }
      }
    } else {
      // Clear validation error when user starts typing other fields
      if (validationErrors[field]) {
        setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    }
  };


  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6 relative overflow-hidden">
        <FloatingElements />

        <div className="w-full max-w-lg relative z-10">
          <SmoothReveal>
            <AnimatedCard
              variant="glass"
              className="overflow-hidden smooth-hover"
            >
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
                    Create Account
                  </h1>
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

                {success && (
                  <SmoothReveal>
                    <Alert className="mb-4 border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-600">
                        <div className="space-y-2">
                          <p>{success}</p>
                          {showResendButton && (
                            <div className="mt-3">
                              <AnimatedButton
                                type="button"
                                variant="glass"
                                onClick={handleResendVerification}
                                disabled={isResendingEmail || resendCooldown > 0}
                                className="text-sm h-8 px-3"
                              >
                                {isResendingEmail ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                    Sending...
                                  </div>
                                ) : resendCooldown > 0 ? (
                                  <span>Resend in {resendCooldown}s</span>
                                ) : (
                                  "Resend Verification Email"
                                )}
                              </AnimatedButton>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  </SmoothReveal>
                )}

                <div className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <SmoothReveal delay={50}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="firstName"
                            className="text-gray-700 font-medium form-label"
                          >
                            First Name
                          </Label>
                          <div className="group flex h-10 items-center rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 focus-within:border-purple-400">
                            <User className="mx-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-colors duration-300 group-focus-within:text-purple-600" />
                            <Input
                              id="firstName"
                              type="text"
                              placeholder="John"
                              value={formData.firstName}
                              onChange={(e) =>
                                handleInputChange("firstName", e.target.value)
                              }
                              className="h-full w-full border-0 bg-transparent p-0 pr-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                              required
                            />
                          </div>
                          {validationErrors.firstName && (
                            <p className="text-xs text-red-600">
                              {validationErrors.firstName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="lastName"
                            className="text-gray-700 font-medium form-label"
                          >
                            Last Name
                          </Label>
                          <div className="group flex h-10 items-center rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 focus-within:border-purple-400">
                            <User className="mx-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-colors duration-300 group-focus-within:text-purple-600" />
                            <Input
                              id="lastName"
                              type="text"
                              placeholder="Doe"
                              value={formData.lastName}
                              onChange={(e) =>
                                handleInputChange("lastName", e.target.value)
                              }
                              className="h-full w-full border-0 bg-transparent p-0 pr-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                              required
                            />
                          </div>
                          {validationErrors.lastName && (
                            <p className="text-xs text-red-600">
                              {validationErrors.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    </SmoothReveal>

                    <SmoothReveal delay={100}>
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-gray-700 font-medium form-label"
                        >
                          Email Address
                        </Label>
                        <div className="group relative flex h-10 items-center rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 focus-within:border-purple-400">
                          <Mail className="mx-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-colors duration-300 group-focus-within:text-purple-600" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="john.doe@example.com"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            onBlur={handleEmailBlur}
                            className="h-full w-full border-0 bg-transparent p-0 pr-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                            required
                          />
                          {isCheckingEmail && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        {validationErrors.email && (
                          <p className="text-xs text-red-600">
                            {validationErrors.email}
                          </p>
                        )}
                      </div>
                    </SmoothReveal>

                    <SmoothReveal delay={150}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="password"
                            className="text-gray-700 font-medium form-label"
                          >
                            Password
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
                                handleInputChange(
                                  "confirmPassword",
                                  e.target.value
                                )
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
                      </div>
                    </SmoothReveal>

                    <SmoothReveal delay={250}>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="terms"
                            checked={formData.agreeToTerms}
                            onCheckedChange={(checked) =>
                              handleInputChange(
                                "agreeToTerms",
                                checked as boolean
                              )
                            }
                            className="mt-1 text-purple-600 border-gray-300 focus:ring-purple-200 transition-colors duration-200"
                          />
                          <Label
                            htmlFor="terms"
                            className="text-sm text-gray-600 leading-relaxed"
                          >
                            I agree to the{" "}
                            <Link
                              href="/terms"
                              className="text-purple-600 hover:text-purple-700 hover:underline transition-colors duration-300"
                            >
                              Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                              href="/privacy"
                              className="text-purple-600 hover:text-purple-700 hover:underline transition-colors duration-300"
                            >
                              Privacy Policy
                            </Link>
                          </Label>
                        </div>
                        {validationErrors.agreeToTerms && (
                          <p className="text-sm text-red-600 mt-1">
                            {validationErrors.agreeToTerms}
                          </p>
                        )}
                      </div>
                    </SmoothReveal>

                    <SmoothReveal delay={300}>
                      <AnimatedButton
                        type="submit"
                        variant="gradient"
                        className="w-full h-10 text-base font-medium smooth-hover"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Creating Account...
                          </div>
                        ) : (
                          "Create Account"
                        )}
                      </AnimatedButton>
                    </SmoothReveal>

                    <SmoothReveal delay={350}>
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="bg-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-4 text-gray-500 font-medium">
                            Or continue with
                          </span>
                        </div>
                      </div>
                    </SmoothReveal>

                    <SmoothReveal delay={400}>
                      <div className="w-full">
                        <AnimatedButton
                          type="button"
                          onClick={handleOAuthSignUp}
                          variant="glass"
                          className="w-full h-10 border-2 border-gray-200 hover:border-purple-300 smooth-hover"
                          disabled={isGoogleLoading || isLoading}
                        >
                          {isGoogleLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              Signing up...
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

                    <SmoothReveal delay={450}>
                      <div className="text-center mt-6">
                        <span className="text-gray-600">
                          Already have an account?{" "}
                        </span>
                        <Link
                          href="/auth/login"
                          className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300 hover:underline nav-item"
                        >
                          Sign in
                        </Link>
                      </div>
                    </SmoothReveal>
                  </form>
                </div>
              </div>
            </AnimatedCard>
          </SmoothReveal>
        </div>
      </div>
    </PageTransition>
  );
}
