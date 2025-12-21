"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { FloatingElements } from "@/components/ui/floating-elements";
import { PageTransition } from "@/components/ui/page-transition";
import { SmoothReveal } from "@/components/ui/smooth-reveal";
import { getClientSession } from "@/lib/supabase/client";
import { CheckCircle, Sparkles, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";


// Interest categories
const INTEREST_CATEGORIES = [
  "Hobbies & Crafts",
  "Sports & Fitness",
  "Career & Business",
  "Tech & Innovation",
  "Arts & Culture",
  "Social & Community",
  "Education & Learning",
  "Travel & Adventure",
  "Food & Drink",
  "Entertainment",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // User data
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check authentication
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
    setUserEmail(session.user.email || null);
  };


  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {

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

      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          interests: selectedInterests,
          location: null,
          onboardingCompleted: true,
        }),
      });

      if (!response.ok) {
        // Get detailed error message from API
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Onboarding API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || errorData.message || "Failed to save onboarding data");
      }

      const result = await response.json();
      console.log("Onboarding success:", result);
      
      toast.success("Welcome to ConnectSpace! 🎉");
      router.push("/communities");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 relative overflow-hidden">
        <FloatingElements />

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          {/* Header */}
          <SmoothReveal>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Welcome Aboard!</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Let's Personalize Your Experience
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Help us understand your interests so we can recommend the best
                communities for you
              </p>
            </div>
          </SmoothReveal>

          {/* Progress Steps */}
          <SmoothReveal delay={100}>
            <div className="flex justify-center mb-8">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-purple-600 text-white shadow-lg shadow-purple-500/30">
                1
              </div>
            </div>
          </SmoothReveal>

          <SmoothReveal delay={200}>
            <Card className="max-w-3xl mx-auto border-0 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                    <Tag className="w-7 h-7 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">
                  Choose Your Interests
                </CardTitle>
                <CardDescription className="text-base">
                  Select at least 3 topics you're passionate about
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Interests Selection */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {INTEREST_CATEGORIES.map((interest) => (
                      <Badge
                        key={interest}
                        variant={
                          selectedInterests.includes(interest)
                            ? "default"
                            : "outline"
                        }
                        className={`cursor-pointer transition-all hover:scale-105 py-3 px-4 text-sm justify-center ${
                          selectedInterests.includes(interest)
                            ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                            : "hover:bg-purple-50 hover:border-purple-300"
                        }`}
                        onClick={() => handleInterestToggle(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-600">
                      Selected: {selectedInterests.length}{" "}
                      <span
                        className={
                          selectedInterests.length >= 3
                            ? "text-green-600 font-medium"
                            : "text-gray-500"
                        }
                      >
                        (minimum 3)
                      </span>
                    </p>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-end pt-6 gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedInterests.length < 3 || isSubmitting}
                    className="bg-purple-600 hover:bg-purple-700 px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </SmoothReveal>

          {/* Footer Note */}
          <SmoothReveal delay={300}>
            <p className="text-center text-sm text-gray-500 mt-6">
              You can always update your preferences later in profile
            </p>
          </SmoothReveal>
        </div>
      </div>
    </PageTransition>
  );
}
