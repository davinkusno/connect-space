"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
    picture?: string;
  };
}

interface AuthHandlerProps {
  onAuthStateChange?: (user: AuthUser | null) => void;
  children: React.ReactNode;
}

export function EnhancedAuthHandler({
  onAuthStateChange,
  children,
}: AuthHandlerProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setUser(null);
        } else {
          const currentUser = session?.user || null;
          setUser(currentUser);
          onAuthStateChange?.(currentUser);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, session?.user?.email);

      const currentUser = session?.user || null;
      setUser(currentUser);
      onAuthStateChange?.(currentUser);
      setIsLoading(false);

      // Handle different auth events
      switch (event) {
        case "SIGNED_IN":
          if (currentUser) {
            toast({
              title: "Welcome back!",
              description: `Signed in as ${currentUser.email}`,
            });
            // Redirect to homepage after successful sign in
            router.push("/");
          }
          break;

        case "SIGNED_OUT":
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          });
          setUser(null);
          router.push("/");
          break;

        case "TOKEN_REFRESHED":
          console.log("Token refreshed successfully");
          break;

        case "USER_UPDATED":
          if (currentUser) {
            toast({
              title: "Profile updated",
              description: "Your profile has been updated successfully.",
            });
          }
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router, toast, onAuthStateChange]);

  return <>{children}</>;
}
