"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { MapPin, Upload, Wand2, Users, Tag, FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Types for API response
interface Province {
  id: string;
  name: string;
}

interface City {
  id: string;
  id_provinsi: string;
  name: string;
}

// Predefined interest categories
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

export default function CommunityAdminRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    location: "",
    interests: [] as string[],
    name: "",
    description: "",
    profileImage: null as File | null,
  });
  const [customLocation, setCustomLocation] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for location API
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedProvinceName, setSelectedProvinceName] = useState(""); // Store province name
  const [selectedCity, setSelectedCity] = useState(""); // Store selected city name only
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetchCities(selectedProvince);
    } else {
      setCities([]);
    }
  }, [selectedProvince]);

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

  // Convert city name from CAPSLOCK to Title Case
  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleLocationChange = (value: string) => {
    // Store the selected city name
    setSelectedCity(value);
    // Format location as "Province, City" (with Title Case for city)
    const cityTitleCase = toTitleCase(value);
    const fullLocation = selectedProvinceName
      ? `${selectedProvinceName}, ${cityTitleCase}`
      : cityTitleCase;
    setFormData((prev) => ({ ...prev, location: fullLocation }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profileImage: file }));
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, profileImage: null }));
    // Reset file input
    const fileInput = document.getElementById(
      "profileImage"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const generateDescription = async () => {
    if (!formData.name || !formData.interests.length) {
      toast.error("Please provide community name and select interests first");
      return;
    }

    if (formData.name.length < 3) {
      toast.error("Community name must be at least 3 characters long");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await fetch("/api/ai/generate-community-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          interests: formData.interests,
          location: formData.location,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate description");
      }

      const { description } = await response.json();

      // Validate that the generated description meets minimum requirements
      if (description && description.length >= 50) {
        setFormData((prev) => ({ ...prev, description }));
        toast.success("AI-generated description created successfully!");
      } else {
        toast.error(
          "Generated description is too short. Please try again or write manually."
        );
      }
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Failed to generate description. Please try again.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.location ||
      !formData.interests.length ||
      !formData.name ||
      !formData.description
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.description.length < 50) {
      toast.error("Description must be at least 50 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("location", formData.location);
      formDataToSend.append("interests", JSON.stringify(formData.interests));
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      if (formData.profileImage) {
        formDataToSend.append("profileImage", formData.profileImage);
      }

      console.log("Submitting community creation...");
      const response = await fetch("/api/communities/create", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create community");
      }

      toast.success("Community created successfully!");

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error: any) {
      console.error("Error creating community:", error);
      toast.error(
        error.message || "Failed to create community. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.location) {
      toast.error("Please select a location");
      return;
    }
    if (step === 2 && formData.interests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }
    if (step === 3 && !formData.name.trim()) {
      toast.error("Please enter a community name");
      return;
    }
    if (
      step === 4 &&
      (!formData.description.trim() || formData.description.length < 50)
    ) {
      toast.error("Please enter a description with at least 50 characters");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Become a Community Admin
          </h1>
          <p className="text-xl text-gray-600">
            Create your own community and start connecting people with shared
            interests
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber <= step
                      ? "bg-violet-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div
                    className={`w-8 h-1 mx-2 ${
                      stepNumber < step ? "bg-violet-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 1 && <MapPin className="w-5 h-5" />}
              {step === 2 && <Tag className="w-5 h-5" />}
              {step === 3 && <Users className="w-5 h-5" />}
              {step === 4 && <FileText className="w-5 h-5" />}
              {step === 5 && <Upload className="w-5 h-5" />}
              {step === 1 && "Select Location"}
              {step === 2 && "Choose Interests"}
              {step === 3 && "Community Name"}
              {step === 4 && "Community Description"}
              {step === 5 && "Profile Image"}
            </CardTitle>
            <CardDescription>
              {step === 1 &&
                "Where is your community based? This helps members find local events and meetups."}
              {step === 2 &&
                "What topics and activities will your community focus on?"}
              {step === 3 &&
                "Give your community a memorable and descriptive name."}
              {step === 4 &&
                "Describe what your community is about and what members can expect."}
              {step === 5 &&
                "Upload a profile image that represents your community."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Province Select */}
                <div className="space-y-2">
                  <Label
                    htmlFor="province"
                    className="text-base font-medium text-gray-700"
                  >
                    Provinsi *
                  </Label>
                  <Select
                    value={selectedProvince}
                    onValueChange={(value) => {
                      setSelectedProvince(value);
                      // Save province name as well
                      const province = provinces.find((p) => p.id === value);
                      setSelectedProvinceName(province?.name || "");
                      // Reset city selection
                      setSelectedCity("");
                      setFormData((prev) => ({ ...prev, location: "" }));
                    }}
                    disabled={loadingProvinces}
                  >
                    <SelectTrigger className="h-11 text-base">
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
                          className="text-base py-2.5"
                        >
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City Select - Only show after province is selected */}
                {selectedProvince && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="city"
                      className="text-base font-medium text-gray-700"
                    >
                      Kota/Kabupaten *
                    </Label>
                    <Select
                      value={selectedCity}
                      onValueChange={handleLocationChange}
                      disabled={loadingCities}
                    >
                      <SelectTrigger className="h-11 text-base">
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
                            className="text-base py-2.5"
                          >
                            {toTitleCase(city.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <p className="text-sm text-gray-500 leading-relaxed">
                  Pilih provinsi dan kota untuk lokasi utama community Anda.
                  Data dari API Wilayah Indonesia.
                </p>
              </div>
            )}

            {/* Step 2: Interests */}
            {step === 2 && (
              <div className="space-y-4">
                <Label className="text-base font-medium text-gray-700">
                  Community Interests *
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {INTEREST_CATEGORIES.map((interest) => (
                    <Badge
                      key={interest}
                      variant={
                        formData.interests.includes(interest)
                          ? "default"
                          : "outline"
                      }
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        formData.interests.includes(interest)
                          ? "bg-violet-600 text-white"
                          : "hover:bg-violet-50"
                      }`}
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Select all interests that apply to your community. You can
                  choose multiple categories.
                </p>
              </div>
            )}

            {/* Step 3: Community Name */}
            {step === 3 && (
              <div className="space-y-4">
                <Label
                  htmlFor="name"
                  className="text-base font-medium text-gray-700"
                >
                  Community Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Jakarta Tech Enthusiasts"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-11 text-base"
                />
                <p className="text-sm text-gray-500">
                  Choose a name that clearly represents your community and is
                  easy to remember.
                </p>
              </div>
            )}

            {/* Step 4: Description */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="description"
                    className="text-base font-medium text-gray-700"
                  >
                    Community Description *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateDescription}
                    disabled={isGeneratingDescription}
                    className="flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    {isGeneratingDescription
                      ? "Generating..."
                      : "Generate with AI"}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe what your community is about, what members can expect, and what makes it special..."
                  value={formData.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  className="min-h-[140px] text-base leading-relaxed"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    A good description helps potential members understand what
                    your community offers.
                  </p>
                  <p
                    className={`text-sm ${
                      formData.description.length < 50
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {formData.description.length}/50 characters minimum
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Profile Image */}
            {step === 5 && (
              <div className="space-y-4">
                <Label
                  htmlFor="profileImage"
                  className="text-base font-medium text-gray-700"
                >
                  Community Profile Image
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-violet-400 transition-colors">
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="profileImage" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      {formData.profileImage
                        ? formData.profileImage.name
                        : "Click to upload image"}
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, or GIF up to 10MB
                    </p>
                  </label>
                </div>
                {formData.profileImage && (
                  <div className="mt-4 flex justify-center">
                    <div className="relative inline-block">
                      <img
                        src={URL.createObjectURL(formData.profileImage)}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  A good profile image helps your community stand out and
                  attract members.
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
              >
                Previous
              </Button>

              {step < 5 ? (
                <Button onClick={nextStep}>Next</Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="bg-violet-600 hover:bg-violet-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating Community..." : "Create Community"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
