"use client";

import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FloatingElements } from "@/components/ui/floating-elements";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/ui/page-transition";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
    Award, Calendar, Camera, Edit3, Mail,
    MapPin, Plus, Save, User, X
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

interface City {
  id: string;
  id_provinsi: string;
  name: string;
}

interface UserProfile {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
    username?: string;
    location_city?: string;
    location_city_name?: string;
    location_province?: string;
    interests?: string[];
    points?: number;
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    interests: [] as string[],
  });
  const [points, setPoints] = useState(0);
  const [selectedInterest, setSelectedInterest] = useState("");
  
  // Available categories for interests
  const categories = [
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
  
  // Location data
  const [allCities, setAllCities] = useState<City[]>([]);
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<City | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push("/auth/login");
          return;
        }

        setUser(session.user);

        // Load user profile data from metadata
        const metadata = session.user.user_metadata || {};
        setFormData({
          fullName: metadata.full_name || metadata.name || "",
          username:
            metadata.username || session.user.email?.split("@")[0] || "",
          interests: metadata.interests || ["Technology", "Community", "Networking"],
        });
        setPoints(metadata.points || 1250);
        
        // Load location from metadata
        if (metadata.location_city) {
          setLocationQuery(metadata.location_city_name || "");
          setSelectedLocation({
            id: metadata.location_city,
            id_provinsi: metadata.location_province || "",
            name: metadata.location_city_name || "",
          });
        }
      } catch (error) {
        console.error("Error getting user:", error);
        toast({
          title: "Error",
          description: "Failed to load profile information.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
    fetchAllCities();
  }, [supabase.auth, router, toast]);

  const fetchAllCities = async () => {
    setLoadingCities(true);
    try {
      // First, fetch all provinces
      const provincesResponse = await fetch(
        "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json"
      );
      const provinces: Province[] = await provincesResponse.json();

      // Then, fetch cities for all provinces
      const allCitiesPromises = provinces.map((province) =>
        fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${province.id}.json`
        ).then((res) => res.json())
      );

      const citiesArrays = await Promise.all(allCitiesPromises);
      const flattenedCities = citiesArrays.flat();
      
      setAllCities(flattenedCities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast({
        title: "Error",
        description: "Failed to load cities",
        variant: "destructive",
      });
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate form data
      if (!formData.fullName.trim()) {
        toast({
          title: "Validation Error",
          description: "Full name is required.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Validate interests minimum
      if (formData.interests.length < 3) {
        toast({
          title: "Validation Error",
          description: "Please add at least 3 interests.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          username: formData.username,
          location_city: selectedLocation?.id || null,
          location_city_name: selectedLocation?.name || null,
          location_province: selectedLocation?.id_provinsi || null,
          interests: formData.interests,
          points: points,
        },
      });

      if (error) {
        throw error;
      }

      // Update local user state
      setUser((prev) =>
        prev
          ? {
              ...prev,
              user_metadata: {
                ...prev.user_metadata,
                full_name: formData.fullName,
                username: formData.username,
                location_city: selectedLocation?.id || null,
                location_city_name: selectedLocation?.name || null,
                location_province: selectedLocation?.id_provinsi || null,
                interests: formData.interests,
                points: points,
              },
            }
          : null
      );

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedInterest("");
    // Reset form data to original values
    if (user) {
      setFormData({
        fullName:
          user.user_metadata?.full_name || user.user_metadata?.name || "",
        username:
          user.user_metadata?.username || user.email?.split("@")[0] || "",
        interests: user.user_metadata?.interests || ["Technology", "Community", "Networking"],
      });
      setPoints(user.user_metadata?.points || 1250);
      
      // Reset location
      if (user.user_metadata?.location_city) {
        setLocationQuery(user.user_metadata.location_city_name || "");
        setSelectedLocation({
          id: user.user_metadata.location_city,
          id_provinsi: user.user_metadata.location_province || "",
          name: user.user_metadata.location_city_name || "",
        });
      } else {
        setLocationQuery("");
        setSelectedLocation(null);
      }
    }
  };

  const handleAddInterest = () => {
    if (!selectedInterest) {
      toast({
        title: "Error",
        description: "Please select an interest.",
        variant: "destructive",
      });
      return;
    }

    if (formData.interests.includes(selectedInterest)) {
      toast({
        title: "Error",
        description: "This interest already exists.",
        variant: "destructive",
      });
      return;
    }

    setFormData({
      ...formData,
      interests: [...formData.interests, selectedInterest],
    });
    setSelectedInterest("");
    toast({
      title: "Interest added",
      description: "Your interest has been added successfully.",
    });
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((i) => i !== interestToRemove),
    });
    toast({
      title: "Interest removed",
      description: "Your interest has been removed.",
    });
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User"
    );
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const isPlaceholderAvatar = () => {
    const avatarUrl = user?.user_metadata?.avatar_url || "";
    // Check if avatar is placeholder (starts with /placeholder or includes placeholder)
    return (
      avatarUrl.startsWith("/placeholder") ||
      avatarUrl.includes("placeholder-user")
    );
  };

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB for profile pictures)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Show loading toast
      toast({
        title: "Uploading...",
        description: "Please wait while we upload your profile picture.",
      });

      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No authentication token");
      }

      // Prepare form data
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      // Include old image URL for cleanup
      if (user?.user_metadata?.avatar_url) {
        uploadFormData.append("oldImageUrl", user.user_metadata.avatar_url);
      }

      // Upload to API
      const response = await fetch("/api/user/profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload profile picture");
      }

      const data = await response.json();

      // ✅ Refresh user session to get updated metadata
      const {
        data: { session: newSession },
      } = await supabase.auth.refreshSession();

      if (newSession?.user) {
        // Update local state with new avatar URL and cache-busting
        const timestamp = Date.now();
        setUser({
          ...newSession.user,
          user_metadata: {
            ...newSession.user.user_metadata,
            avatar_url: `${data.avatar_url}?t=${timestamp}`,
          },
        });
      }

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });

      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!user?.user_metadata?.avatar_url) {
      return;
    }

    setIsDeletingImage(true);

    try {
      // Show loading toast
      toast({
        title: "Deleting...",
        description: "Please wait while we delete your profile picture.",
      });

      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No authentication token");
      }

      // Delete via API
      const response = await fetch(
        `/api/user/profile-picture?imageUrl=${encodeURIComponent(
          user.user_metadata.avatar_url
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete profile picture");
      }

      const data = await response.json();

      // ✅ Refresh user session to get updated metadata
      const {
        data: { session: newSession },
      } = await supabase.auth.refreshSession();

      if (newSession?.user) {
        // Update local state with placeholder avatar
        const timestamp = Date.now();
        setUser({
          ...newSession.user,
          user_metadata: {
            ...newSession.user.user_metadata,
            avatar_url: `${data.avatar_url}?t=${timestamp}`,
          },
        });
      }

      toast({
        title: "Profile picture deleted",
        description: "Your profile picture has been reset to default.",
      });
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
        <FloatingElements />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="h-80 bg-gray-200 rounded-xl"></div>
              <div className="lg:col-span-2 h-80 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />

      <PageTransition>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {/* Header */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                Profile
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Manage your personal information and account details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <AnimatedCard
                variant="glass"
                className="p-8 text-center relative overflow-hidden"
              >
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-600"></div>

                <div className="relative">
                  {/* Avatar Section */}
                  <div className="relative inline-block mb-6">
                    <div className="relative">
                      <Avatar className="h-28 w-28 ring-4 ring-white shadow-xl">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url || ""}
                          alt={getUserDisplayName()}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-3xl font-bold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Delete Button (only show if avatar exists and is not placeholder) */}
                      {user.user_metadata?.avatar_url &&
                        !isPlaceholderAvatar() && (
                          <button
                            onClick={handleDeleteProfilePicture}
                            disabled={isDeletingImage || isUploadingImage}
                            className={`absolute -top-2 -left-2 ${
                              isDeletingImage ? "cursor-wait" : "cursor-pointer"
                            }`}
                            title="Remove profile picture"
                          >
                            <AnimatedButton
                              variant="glass"
                              size="sm"
                              className="rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-white hover:bg-red-50"
                              disabled={isDeletingImage || isUploadingImage}
                              asChild
                            >
                              <div>
                                {isDeletingImage ? (
                                  <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <X className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            </AnimatedButton>
                          </button>
                        )}

                      {/* Upload Button */}
                      <label
                        htmlFor="profile-picture-upload"
                        className={`absolute -bottom-2 -right-2 ${
                          isUploadingImage || isDeletingImage
                            ? "cursor-wait"
                            : "cursor-pointer"
                        }`}
                      >
                        <AnimatedButton
                          variant="glass"
                          size="sm"
                          className="rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200"
                          disabled={isUploadingImage || isDeletingImage}
                          asChild
                        >
                          <div className="bg-white">
                            {isUploadingImage ? (
                              <div className="h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                        </AnimatedButton>
                        <input
                          id="profile-picture-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureUpload}
                          className="hidden"
                          disabled={isUploadingImage || isDeletingImage}
                        />
                      </label>
                    </div>
                  </div>

                  {/* User Info */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {getUserDisplayName()}
                  </h2>
                  <p className="text-gray-600 mb-1 flex items-center justify-center gap-2">
                    <span>@{formData.username || "username"}</span>
                  </p>
                  <p className="text-sm text-gray-500 mb-6">{user.email}</p>

                  {/* Status Badge */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 px-3 py-1">
                      Community Member
                    </Badge>
                  </div>

                  {/* Points */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-900">
                          {points.toLocaleString()}
                        </div>
                        <div className="text-xs text-purple-600 font-medium">
                          Total Points
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span>Member since {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </AnimatedCard>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-2">
              <AnimatedCard variant="glass" className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Profile Information
                    </h3>
                    <p className="text-gray-600">
                      Update your personal details and preferences
                    </p>
                  </div>
                  {!isEditing ? (
                    <AnimatedButton
                      variant="gradient"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </AnimatedButton>
                  ) : (
                    <div className="flex gap-3">
                      <AnimatedButton
                        variant="glass"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="px-6 py-2"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </AnimatedButton>
                      <AnimatedButton
                        variant="gradient"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </AnimatedButton>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></div>
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="fullName"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Full Name
                        </Label>
                        {isEditing ? (
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                fullName: e.target.value,
                              })
                            }
                            className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                            placeholder="Enter your full name"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <span className="text-gray-900 font-medium">
                              {formData.fullName || "Not provided"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="username"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Username
                        </Label>
                        {isEditing ? (
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                username: e.target.value,
                              })
                            }
                            className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                            placeholder="Choose a username"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 font-bold">@</span>
                            </div>
                            <span className="text-gray-900 font-medium">
                              {formData.username || "Not provided"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Email Address
                        </Label>
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Mail className="h-5 w-5 text-green-600" />
                          </div>
                          <span className="text-gray-900 font-medium">
                            {user.email}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-300"
                          >
                            Verified
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Additional Information */}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                      Additional Information
                    </h4>
                    <div className="space-y-6">
                      {/* Location Search */}
                      <div className="space-y-2 relative">
                        <Label
                          htmlFor="location"
                          className="text-sm font-semibold text-gray-700"
                        >
                          City / Regency
                        </Label>
                        {isEditing ? (
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                            <Input
                              id="location"
                              value={locationQuery}
                              onChange={(e) => {
                                setLocationQuery(e.target.value);
                                setShowLocationDropdown(true);
                              }}
                              onFocus={() => setShowLocationDropdown(true)}
                              onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                              placeholder="Search for your city..."
                              className="pl-12 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                            />
                            {locationQuery && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                                onClick={() => {
                                  setLocationQuery("");
                                  setSelectedLocation(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Search Results Dropdown */}
                            {showLocationDropdown && locationQuery && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                                {loadingCities ? (
                                  <div className="p-4 text-center text-gray-500">
                                    Loading cities...
                                  </div>
                                ) : (
                                  <>
                                    {allCities
                                      .filter((city) =>
                                        city.name
                                          .toLowerCase()
                                          .includes(locationQuery.toLowerCase())
                                      )
                                      .slice(0, 10)
                                      .map((city) => (
                                        <button
                                          key={city.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedLocation(city);
                                            setLocationQuery(toTitleCase(city.name));
                                            setShowLocationDropdown(false);
                                          }}
                                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200 border-b border-gray-100 last:border-0"
                                        >
                                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900">
                                              {toTitleCase(city.name)}
                                            </div>
                                          </div>
                                        </button>
                                      ))}
                                    {allCities.filter((city) =>
                                      city.name
                                        .toLowerCase()
                                        .includes(locationQuery.toLowerCase())
                                    ).length === 0 && (
                                      <div className="p-4 text-center text-gray-500">
                                        No cities found
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-orange-600" />
                            </div>
                            <span className="text-gray-900 font-medium">
                              {selectedLocation
                                ? toTitleCase(selectedLocation.name)
                                : "Not provided"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Interests Section */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Interests
                        </Label>
                        {isEditing ? (
                          <div className="space-y-3">
                            {/* Add Interest Select */}
                            <div className="flex gap-2">
                              <Select value={selectedInterest} onValueChange={setSelectedInterest}>
                                <SelectTrigger className="h-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                                  <SelectValue placeholder="Select an interest" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <AnimatedButton
                                variant="gradient"
                                size="sm"
                                onClick={handleAddInterest}
                                className="px-4"
                              >
                                <Plus className="h-4 w-4" />
                              </AnimatedButton>
                            </div>

                            {/* Interests List */}
                            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[80px]">
                              {formData.interests.length === 0 ? (
                                <p className="text-sm text-gray-500 w-full text-center py-4">
                                  No interests added yet.
                                </p>
                              ) : (
                                formData.interests.map((interest, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="px-3 py-1.5 text-sm flex items-center gap-2 bg-purple-100 text-purple-800 border-purple-300"
                                  >
                                    {interest}
                                    <button
                                      onClick={() => handleRemoveInterest(interest)}
                                      className="hover:text-red-600 transition-colors"
                                      title="Remove interest"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {formData.interests.length} {formData.interests.length === 1 ? 'interest' : 'interests'} added
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <div className="flex flex-wrap gap-2">
                              {formData.interests.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  No interests added yet.
                                </p>
                              ) : (
                                formData.interests.map((interest, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="px-3 py-1.5 text-sm bg-purple-100 text-purple-800 border-purple-300"
                                  >
                                    {interest}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
