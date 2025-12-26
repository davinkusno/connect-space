"use client";

import { Spinner } from "@/components/ui/loading-indicators";
import { getClientSession } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * OnboardingGuard - Ensures user has completed onboarding before accessing protected routes
 * Redirects to /onboarding if not completed
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Routes that don't require onboarding check
  const publicRoutes = [
    "/onboarding",
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/communities/create",
  ];

  // Check if current route is a public route
  const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route));

  useEffect(() => {
    // For public routes, immediately allow access (no async check needed)
    if (isPublicRoute) {
      setIsChecking(false);
      setIsOnboardingComplete(true);
      return;
    }
    
    checkOnboarding();
  }, [pathname, isPublicRoute]);

  const checkOnboarding = async () => {
    // Skip check for public routes (shouldn't reach here, but double-check)
    if (isPublicRoute) {
      setIsChecking(false);
      setIsOnboardingComplete(true);
      return;
    }

    try {
      const session = await getClientSession();

      // Not logged in - let auth guard handle it
      if (!session || !session.user) {
        setIsChecking(false);
        setIsOnboardingComplete(true);
        return;
      }

      // Check onboarding status
      const response = await fetch("/api/user/onboarding", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Check if user has completed onboarding
        if (!data.onboardingCompleted) {
          // Redirect to onboarding if not completed
          router.push("/onboarding");
          setIsChecking(false);
          setIsOnboardingComplete(false);
          return;
        }

        setIsOnboardingComplete(true);
      } else {
        // If API fails, check if it's a 404 (user not found) - redirect to onboarding
        if (response.status === 404) {
          router.push("/onboarding");
          setIsChecking(false);
          setIsOnboardingComplete(false);
          return;
        }
        
        // For other errors, allow access (fail gracefully)
        console.warn(
          "Onboarding API failed, allowing access:",
          response.status
        );
        setIsOnboardingComplete(true);
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
      // On error, allow access (fail gracefully)
      setIsOnboardingComplete(true);
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show children if onboarding is complete
  if (isOnboardingComplete) {
    return <>{children}</>;
  }

  // Don't show anything while redirecting
  return null;
}
