"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Crown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getClientSession, getSupabaseBrowser } from "@/lib/supabase/client";
import { PageTransition } from "@/components/ui/page-transition";
import { SmoothReveal } from "@/components/ui/smooth-reveal";
import { FloatingElements } from "@/components/ui/floating-elements";

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<
    "user" | "community_admin" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [shouldAutoRedirect, setShouldAutoRedirect] = useState(false);

  useEffect(() => {
    checkAuthAndRole();
  }, []);

  const checkAuthAndRole = async () => {
    setIsChecking(true);
    try {
      const session = await getClientSession();

      if (!session || !session.user) {
        toast.error("Please sign in first");
        router.push("/auth/login");
        return;
      }

      const userId = session.user.id;
      setUserId(userId);

      // Check if user already has community_admin role
      const supabase = getSupabaseBrowser();
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_type")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        setIsChecking(false);
        return;
      }

      // If user is already community_admin, check if they have a community
      if (userData?.user_type === "community_admin") {
        // Check if user has created a community (as creator)
        const { data: createdCommunities, error: createdError } = await supabase
          .from("communities")
          .select("id")
          .eq("creator_id", userId)
          .limit(1);

        // Also check if user is admin of any community
        const { data: adminMemberships, error: adminError } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", userId)
          .eq("role", "admin")
          .limit(1);

        // If user doesn't have a community, auto-select community_admin and redirect
        const hasCommunity = 
          (!createdError && createdCommunities && createdCommunities.length > 0) ||
          (!adminError && adminMemberships && adminMemberships.length > 0);

        if (!hasCommunity) {
          setSelectedRole("community_admin");
          setShouldAutoRedirect(true);
          // Auto-submit after a short delay to show the selection
          setTimeout(() => {
            handleContinue("community_admin", userId);
          }, 500);
          return;
        }
      }

      setIsChecking(false);
    } catch (error) {
      console.error("Error checking auth and role:", error);
      setIsChecking(false);
    }
  };

  const handleRoleSelect = (role: "user" | "community_admin") => {
    setSelectedRole(role);
  };

  const handleContinue = async (
    roleOverride?: "user" | "community_admin",
    userIdOverride?: string
  ) => {
    const roleToUse = roleOverride || selectedRole;
    const userIdToUse = userIdOverride || userId;

    if (!roleToUse) {
      toast.error("Please select a role");
      return;
    }

    if (!userIdToUse) {
      toast.error("Authentication error. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await getClientSession();
      if (!session) {
        throw new Error("No session found");
      }

      // Save role to database (only if not already set)
      const supabase = getSupabaseBrowser();
      const { data: currentUser } = await supabase
        .from("users")
        .select("user_type, role_selected")
        .eq("id", userIdToUse)
        .single();

      // Mark role as selected (optional preference, not required)
      if (!currentUser?.role_selected) {
        const response = await fetch("/api/user/role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: userIdToUse,
            role: roleToUse,
          }),
        });

        if (!response.ok) {
          // Don't fail if role save fails - it's optional now
          console.warn("Failed to save role preference:", response.statusText);
        }
      }

      // Redirect based on role preference
      if (roleToUse === "community_admin") {
        if (!shouldAutoRedirect) {
          toast.success("Welcome! You can create your community anytime.");
        }
        // Check if user already has a community
        const { data: communities } = await supabase
          .from("communities")
          .select("id")
          .eq("creator_id", userIdToUse)
          .limit(1);

        const { data: adminMemberships } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", userIdToUse)
          .eq("role", "admin")
          .limit(1);

        const hasCommunity = 
          (communities && communities.length > 0) ||
          (adminMemberships && adminMemberships.length > 0);

        if (hasCommunity) {
          router.push("/dashboard");
        } else {
          router.push("/community-admin-registration");
        }
      } else {
        toast.success("Welcome! Let's personalize your experience.");
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Role selection error:", error);
      toast.error("Failed to save role. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking
  if (isChecking) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6 relative overflow-hidden">
          <FloatingElements />
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6 relative overflow-hidden">
        <FloatingElements />

        <div className="w-full max-w-4xl relative z-10">
          <SmoothReveal>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Welcome to ConnectSpace! 👋
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Before we get started, let us know how you'd like to use
                ConnectSpace
              </p>
            </div>
          </SmoothReveal>

          <SmoothReveal delay={100}>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* User Role Card */}
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                  selectedRole === "user"
                    ? "border-2 border-purple-500 shadow-lg shadow-purple-500/20"
                    : "border-2 border-gray-200 hover:border-purple-300"
                }`}
                onClick={() => handleRoleSelect("user")}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      selectedRole === "user" ? "bg-purple-100" : "bg-gray-100"
                    }`}
                  >
                    <Users
                      className={`w-10 h-10 ${
                        selectedRole === "user"
                          ? "text-purple-600"
                          : "text-gray-600"
                      }`}
                    />
                  </div>
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    I'm a Member
                    {selectedRole === "user" && (
                      <Check className="w-6 h-6 text-purple-600" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base leading-relaxed">
                    I want to discover and join communities, attend events, and
                    connect with like-minded people.
                  </CardDescription>

                  <div className="mt-6 space-y-2">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Browse and join communities
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Attend events and activities
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Connect with members
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Get personalized recommendations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Admin Role Card */}
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                  selectedRole === "community_admin"
                    ? "border-2 border-purple-500 shadow-lg shadow-purple-500/20"
                    : "border-2 border-gray-200 hover:border-purple-300"
                }`}
                onClick={() => handleRoleSelect("community_admin")}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      selectedRole === "community_admin"
                        ? "bg-purple-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Crown
                      className={`w-10 h-10 ${
                        selectedRole === "community_admin"
                          ? "text-purple-600"
                          : "text-gray-600"
                      }`}
                    />
                  </div>
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    I'm an Organizer
                    {selectedRole === "community_admin" && (
                      <Check className="w-6 h-6 text-purple-600" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base leading-relaxed">
                    I want to create and manage my own community, organize
                    events, and grow my member base.
                  </CardDescription>

                  <div className="mt-6 space-y-2">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Create your own community
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Organize events and activities
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Manage members and content
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Access admin dashboard
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SmoothReveal>

          <SmoothReveal delay={200}>
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={() => handleContinue()}
                disabled={!selectedRole || isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-lg h-auto"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              <div className="text-sm text-blue-700 font-medium bg-blue-50 border border-blue-200 rounded-lg py-3 px-6">
                💡 You can create communities and join others regardless of your selection. This just helps us personalize your experience.
              </div>
            </div>
          </SmoothReveal>
        </div>
      </div>
    </PageTransition>
  );
}
