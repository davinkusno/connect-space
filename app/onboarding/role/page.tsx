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
import { Users, Crown, Check } from "lucide-react";
import { toast } from "sonner";
import { getClientSession } from "@/lib/supabase/client";
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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const session = await getClientSession();

    if (!session || !session.user) {
      toast.error("Please sign in first");
      router.push("/auth/login");
      return;
    }

    setUserId(session.user.id);
  };

  const handleRoleSelect = (role: "user" | "community_admin") => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    if (!userId) {
      toast.error("Authentication error. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await getClientSession();
      if (!session) {
        throw new Error("No session found");
      }

      // Save role to database
      const response = await fetch("/api/user/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save role");
      }

      // Redirect based on role
      if (selectedRole === "community_admin") {
        toast.success("Welcome! Let's set up your community.");
        router.push("/community-admin-registration");
      } else {
        toast.success("Welcome! Let's personalize your experience.");
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Role selection error:", error);
      toast.error("Failed to save role. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                onClick={handleContinue}
                disabled={!selectedRole || isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-lg h-auto"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              <div className="text-sm text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-lg py-3 px-6">
                ⚠️ Please choose carefully. Your role cannot be changed later.
              </div>
            </div>
          </SmoothReveal>
        </div>
      </div>
    </PageTransition>
  );
}
