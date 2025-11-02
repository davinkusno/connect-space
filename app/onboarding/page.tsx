"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Tag, Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getClientSession } from "@/lib/supabase/client";
import { PageTransition } from "@/components/ui/page-transition";
import { SmoothReveal } from "@/components/ui/smooth-reveal";
import { FloatingElements } from "@/components/ui/floating-elements";

// Types
interface Province {
  id: string;
  name: string;
}

interface City {
  id: string;
  id_provinsi: string;
  name: string;
}

// Interest categories
const INTEREST_CATEGORIES = [
  "Technology",
  "Business & Entrepreneurship",
  "Health & Wellness",
  "Education",
  "Arts & Culture",
  "Sports & Fitness",
  "Food & Cooking",
  "Travel & Adventure",
  "Environment & Sustainability",
  "Social Impact",
  "Gaming",
  "Photography",
  "Music",
  "Writing & Literature",
  "Science & Research",
  "Finance & Investment",
  "Design & Creative",
  "Language Learning",
  "Parenting & Family",
  "Professional Development",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedProvinceName, setSelectedProvinceName] = useState(""); // Store province name
  const [selectedCity, setSelectedCity] = useState("");

  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  // User data
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    checkAuth();
    fetchProvinces();
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetchCities(selectedProvince);
    } else {
      setCities([]);
      setSelectedCity("");
    }
  }, [selectedProvince]);

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

  const fetchProvinces = async () => {
    try {
      const response = await fetch(
        "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json"
      );
      const data = await response.json();
      setProvinces(data);
    } catch (error) {
      console.error("Error fetching provinces:", error);
      toast.error("Failed to load provinces");
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchCities = async (provinceId: string) => {
    setLoadingCities(true);
    try {
      const response = await fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`
      );
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to load cities");
    } finally {
      setLoadingCities(false);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  // Convert city name from CAPSLOCK to Title Case
  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleNext = () => {
    if (step === 1) {
      if (selectedInterests.length < 3) {
        toast.error("Please select at least 3 interests");
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkipLocation = async () => {
    await handleSubmit(true);
  };

  const handleSubmit = async (skipLocation = false) => {
    if (!skipLocation && (!selectedProvince || !selectedCity)) {
      toast.error("Please select your location or click Skip");
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

      // Format location as "Province, City" (with Title Case for city)
      const fullLocation = skipLocation
        ? null
        : `${selectedProvinceName}, ${toTitleCase(selectedCity)}`;

      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          interests: selectedInterests,
          location: fullLocation,
          onboardingCompleted: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save onboarding data");
      }

      toast.success("Welcome to ConnectSpace! 🎉");
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to complete onboarding. Please try again.");
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
              <div className="flex items-center space-x-4">
                {[1, 2].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                        stepNumber <= step
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {stepNumber < step ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        stepNumber
                      )}
                    </div>
                    {stepNumber < 2 && (
                      <div
                        className={`w-16 h-1 mx-2 transition-all duration-300 ${
                          stepNumber < step ? "bg-purple-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SmoothReveal>

          <SmoothReveal delay={200}>
            <Card className="max-w-3xl mx-auto border-0 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  {step === 1 ? (
                    <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                      <Tag className="w-7 h-7 text-purple-600" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-7 h-7 text-blue-600" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-2xl">
                  {step === 1 && "Choose Your Interests"}
                  {step === 2 && "Select Your Location"}
                </CardTitle>
                <CardDescription className="text-base">
                  {step === 1 &&
                    "Select at least 3 topics you're passionate about"}
                  {step === 2 &&
                    "Help us find local communities near you (optional)"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Step 1: Interests */}
                {step === 1 && (
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
                )}

                {/* Step 2: Location */}
                {step === 2 && (
                  <div className="space-y-6">
                    {/* Province Select */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="province"
                        className="text-base font-medium text-gray-700"
                      >
                        Provinsi
                      </Label>
                      <Select
                        value={selectedProvince}
                        onValueChange={(value) => {
                          setSelectedProvince(value);
                          // Save province name as well
                          const province = provinces.find(
                            (p) => p.id === value
                          );
                          setSelectedProvinceName(province?.name || "");
                          setSelectedCity("");
                        }}
                        disabled={loadingProvinces}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue
                            placeholder={
                              loadingProvinces ? "Loading..." : "Pilih Provinsi"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-[280px]">
                          {provinces.map((province) => (
                            <SelectItem
                              key={province.id}
                              value={province.id}
                              className="text-base py-3"
                            >
                              {province.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* City Select */}
                    {selectedProvince && (
                      <div className="space-y-2">
                        <Label
                          htmlFor="city"
                          className="text-base font-medium text-gray-700"
                        >
                          Kota/Kabupaten
                        </Label>
                        <Select
                          value={selectedCity}
                          onValueChange={setSelectedCity}
                          disabled={loadingCities}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue
                              placeholder={
                                loadingCities
                                  ? "Loading..."
                                  : "Pilih Kota/Kabupaten"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="max-h-[280px]">
                            {cities.map((city) => (
                              <SelectItem
                                key={city.id}
                                value={city.name}
                                className="text-base py-3"
                              >
                                {toTitleCase(city.name)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> Adding your location helps us
                        show you local communities and events in your area.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1 || isSubmitting}
                    className="px-6"
                  >
                    Back
                  </Button>

                  <div className="flex gap-3">
                    {step === 2 && (
                      <Button
                        variant="ghost"
                        onClick={handleSkipLocation}
                        disabled={isSubmitting}
                        className="px-6"
                      >
                        Skip
                      </Button>
                    )}

                    {step < 2 ? (
                      <Button
                        onClick={handleNext}
                        disabled={selectedInterests.length < 3}
                        className="bg-purple-600 hover:bg-purple-700 px-8"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubmit(false)}
                        disabled={
                          isSubmitting || (!selectedProvince && !selectedCity)
                        }
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
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </SmoothReveal>

          {/* Footer Note */}
          <SmoothReveal delay={300}>
            <p className="text-center text-sm text-gray-500 mt-6">
              You can always update your preferences later in settings
            </p>
          </SmoothReveal>
        </div>
      </div>
    </PageTransition>
  );
}
