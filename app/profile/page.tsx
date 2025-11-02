"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/ui/page-transition";
import { FloatingElements } from "@/components/ui/floating-elements";
import {
  User,
  Mail,
  MapPin,
  Globe,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
    username?: string;
    bio?: string;
    location?: string;
    website?: string;
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
    bio: "",
    location: "",
    website: "",
  });

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
          bio: metadata.bio || "",
          location: metadata.location || "",
          website: metadata.website || "",
        });
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
  }, [supabase.auth, router, toast]);

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

      if (formData.website && !formData.website.startsWith("http")) {
        setFormData((prev) => ({
          ...prev,
          website: `https://${prev.website}`,
        }));
      }

      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          username: formData.username,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
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
                bio: formData.bio,
                location: formData.location,
                website: formData.website,
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
    // Reset form data to original values
    if (user) {
      setFormData({
        fullName:
          user.user_metadata?.full_name || user.user_metadata?.name || "",
        username:
          user.user_metadata?.username || user.email?.split("@")[0] || "",
        bio: user.user_metadata?.bio || "",
        location: user.user_metadata?.location || "",
        website: user.user_metadata?.website || "",
      });
    }
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

                  {/* Badges */}
                  <div className="flex justify-center gap-2 mb-6">
                    <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 px-3 py-1">
                      Community Member
                    </Badge>
                    <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 px-3 py-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
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
                      <div className="space-y-2">
                        <Label
                          htmlFor="bio"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Bio
                        </Label>
                        {isEditing ? (
                          <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) =>
                              setFormData({ ...formData, bio: e.target.value })
                            }
                            placeholder="Tell us about yourself..."
                            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
                            rows={4}
                          />
                        ) : (
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <p className="text-gray-900 leading-relaxed">
                              {formData.bio || "No bio provided yet."}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="location"
                            className="text-sm font-semibold text-gray-700"
                          >
                            Location
                          </Label>
                          {isEditing ? (
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  location: e.target.value,
                                })
                              }
                              placeholder="City, Country"
                              className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                            />
                          ) : (
                            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-orange-600" />
                              </div>
                              <span className="text-gray-900 font-medium">
                                {formData.location || "Not provided"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="website"
                            className="text-sm font-semibold text-gray-700"
                          >
                            Website
                          </Label>
                          {isEditing ? (
                            <Input
                              id="website"
                              value={formData.website}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  website: e.target.value,
                                })
                              }
                              placeholder="https://yourwebsite.com"
                              className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                            />
                          ) : (
                            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Globe className="h-5 w-5 text-indigo-600" />
                              </div>
                              <span className="text-gray-900 font-medium">
                                {formData.website || "Not provided"}
                              </span>
                            </div>
                          )}
                        </div>
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
