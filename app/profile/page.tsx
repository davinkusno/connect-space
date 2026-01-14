"use client";

import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FloatingElements } from "@/components/ui/floating-elements";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/ui/page-transition";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { LocationSearchResult, toStandardizedLocation } from "@/types/location";
import {
    AlertTriangle, Award, Calendar, Camera, Edit3, Eye, EyeOff, KeyRound, Mail,
    MapPin, Plus, Save, User, X
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";

// Standardized location data stored in user_metadata
interface UserLocationData {
  city: string;           // City name in English
  placeId: string;        // OpenStreetMap place_id
  lat: number;            // Latitude
  lon: number;            // Longitude
  displayName: string;    // Full address in English
}

interface UserProfile {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
    username?: string;
    location?: UserLocationData;  // NEW: Standardized location object
    // Legacy fields (kept for backwards compatibility during migration)
    location_city?: string;
    location_city_name?: string;
    location_lat?: string;
    location_lon?: string;
    location_province?: string;
    interests?: string[];
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
  const [pointsCount, setPointsCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [userReports, setUserReports] = useState<Array<{
    id: string;
    report_type: string;
    reason: string;
    details: string | null;
    status: string;
    created_at: string;
    reporter: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
    target_content?: {
      type: "thread" | "reply" | "event";
      id: string;
      preview?: string;
    };
  }>>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);

  // Refs to prevent duplicate API calls
  const userDataFetchedRef = useRef(false);
  const badgesFetchedRef = useRef(false);
  const [showReports, setShowReports] = useState(false);
  const [reportsPage, setReportsPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const reportsPerPage = 5;
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
  const [allCities, setAllCities] = useState<LocationSearchResult[]>([]);
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [searchTimeoutId, setSearchTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authProvider, setAuthProvider] = useState<string>("email"); // "email" or "google"
  const [userProfile, setUserProfile] = useState<any>(null); // Store userProfile from database

  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowser();

  // Report reason labels
  const REPORT_REASON_LABELS: Record<string, string> = {
    violence_hate_harassment: "Violence, Hate Speech, or Harassment",
    nudity_inappropriate: "Nudity or Inappropriate Sexual Content",
    spam_poor_quality: "Spam or Poor Quality Content",
    fraud_scam: "Fraud or Scam",
    copyright_violation: "Intellectual Property or Copyright Violation",
    other: "Other",
    // Legacy reasons
    spam: "Spam",
    harassment: "Harassment",
    inappropriate_content: "Inappropriate Content",
    misinformation: "Misinformation",
    hate_speech: "Hate Speech",
    violence: "Violence",
  };

  const getReportReasonLabel = (reason: string): string => {
    return REPORT_REASON_LABELS[reason] || reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  useEffect(() => {
    // Prevent duplicate fetch in React Strict Mode
    if (userDataFetchedRef.current) return;
    userDataFetchedRef.current = true;

    const fetchUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push("/auth/login");
          return;
        }

        // Check if user has completed onboarding first
        try {
          const onboardingResponse = await fetch("/api/user/onboarding", {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (onboardingResponse.ok) {
            const onboardingData = await onboardingResponse.json();
            if (!onboardingData.onboardingCompleted) {
              // User hasn't completed onboarding, redirect them
              router.push("/onboarding");
              return;
            }
          }
        } catch (onboardingError) {
          // If onboarding check fails, continue but log it
          console.warn("Could not verify onboarding status:", onboardingError);
        }

        // Determine authentication provider
        // OAuth users have app_metadata.provider or identities array
        const provider = session.user.app_metadata?.provider || 
                        session.user.identities?.[0]?.provider || 
                        "email";
        setAuthProvider(provider);

        // Fetch user profile data from API
        const profileResponse = await fetch("/api/user/profile");
        let userProfile: any = null;
        
        if (profileResponse.ok) {
          userProfile = await profileResponse.json();
        } else {
          console.error("Error fetching profile:", profileResponse.status);
          // Continue with metadata fallback
        }
        
        // Store userProfile in a way that's accessible in handleSave
        setUserProfile(userProfile || null);

        // Prioritize avatar_url from users table over user_metadata (to prevent Google OAuth from overriding custom avatars)
        const customAvatarUrl = userProfile?.avatar_url || null;
        const finalAvatarUrl = customAvatarUrl || session.user.user_metadata?.avatar_url;
        
        setUser({
          ...session.user,
          user_metadata: {
            ...session.user.user_metadata,
            avatar_url: finalAvatarUrl,
          },
        });

        // Load user profile data - prioritize users table, fallback to metadata
        const metadata = session.user.user_metadata || {};
        setFormData({
          fullName: userProfile?.full_name || metadata.full_name || metadata.name || "",
          username: userProfile?.username || metadata.username || session.user.email?.split("@")[0] || "",
          interests: userProfile?.interests || metadata.interests || [],
        });
        
        // Fetch points and report counts from API
        try {
          const pointsResponse = await fetch("/api/user/points");
          if (pointsResponse.ok) {
            const pointsData = await pointsResponse.json();
            setPointsCount(pointsData.activity_count || 0);
            setReportCount(pointsData.report_count || 0);
          } else {
            setPointsCount(0);
            setReportCount(0);
          }
        } catch (error) {
          console.error("Error fetching points:", error);
          setPointsCount(0);
          setReportCount(0);
        }

        // Fetch user reports
        setIsLoadingReports(true);
        try {
          const reportsResponse = await fetch("/api/user/reports");
          if (reportsResponse.ok) {
            const reportsData = await reportsResponse.json();
            setUserReports(reportsData || []);
            setTotalReports(reportsData?.length || 0);
          } else {
            setUserReports([]);
            setTotalReports(0);
          }
        } catch (error) {
          console.error("Error fetching reports:", error);
          setUserReports([]);
          setTotalReports(0);
        } finally {
          setIsLoadingReports(false);
        }
        
        // Load location from users table (prioritize), then fallback to metadata
        let locationLoaded = false;
        
        if (userProfile?.location) {
          try {
            // Parse location from users table (stored as JSON string or plain string)
            let locationData;
            if (typeof userProfile.location === 'string') {
              // Try to parse as JSON, if it fails, treat as plain string
              try {
                locationData = JSON.parse(userProfile.location);
              } catch (e) {
                // If parsing fails, it's likely a plain string (legacy data)
                // Create a simple location object from the string
                locationData = {
                  city: userProfile.location,
                  displayName: userProfile.location,
                };
              }
            } else {
              locationData = userProfile.location;
            }
            
            if (locationData && locationData.city) {
              setLocationQuery(locationData.city);
              setSelectedLocation({
                id: locationData.placeId || locationData.city,
                name: locationData.city,
                display_name: locationData.displayName || locationData.fullAddress || locationData.city,
                lat: locationData.lat?.toString() || "0",
                lon: locationData.lon?.toString() || "0",
              });
              locationLoaded = true;
            }
          } catch (e) {
            console.error("Error parsing location from users table:", e);
          }
        }
        
        // Fallback to metadata if not loaded from users table
        if (!locationLoaded) {
          if (metadata.location) {
            // NEW standardized format
            const loc = metadata.location as UserLocationData;
            setLocationQuery(loc.city);
            setSelectedLocation({
              id: loc.placeId,
              name: loc.city,
              display_name: loc.displayName,
              lat: loc.lat.toString(),
              lon: loc.lon.toString(),
            });
          } else if (metadata.location_city) {
            // LEGACY format - still support during migration
            setLocationQuery(metadata.location_city_name || "");
            setSelectedLocation({
              id: metadata.location_city,
              name: metadata.location_city_name || "",
              display_name: metadata.location_city_name || "",
              lat: metadata.location_lat || "0",
              lon: metadata.location_lon || "0",
            });
          } else {
            setLocationQuery("");
            setSelectedLocation(null);
          }
        }
      } catch (error) {
        // Handle errors gracefully
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorDetails = error instanceof Error ? {
          message: errorMessage,
          name: error.name,
          stack: error.stack,
        } : { error };
        
        console.error("Error getting user:", errorDetails);
        
        // Don't show toast if we're redirecting to onboarding
        // Check if error is related to onboarding or if we're already on onboarding
        const isOnboardingError = errorMessage.toLowerCase().includes("onboarding") || 
                                  errorMessage.toLowerCase().includes("not found");
        
        if (!isOnboardingError) {
          toast({
            title: "Error",
            description: "Failed to load profile information. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [supabase.auth, router, toast]);

  const searchCities = async (query: string) => {
    if (!query || query.trim().length < 3) {
      setAllCities([]);
      setLoadingCities(false);
      return;
    }

    setLoadingCities(true);

    try {
      // Call our backend API for location search
      const response = await fetch(
        `/api/locations/search?q=${encodeURIComponent(query.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Location search error:", data.error || data.message);
        setAllCities([]);
        return;
      }

      // Controller returns { cities: [...], count: N }
      setAllCities(data.cities || []);
    } catch (error) {
      console.error("Error searching cities:", error);
      setAllCities([]);
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

  // Debounced search for cities
  const handleLocationQueryChange = (query: string) => {
    setLocationQuery(query);
    setShowLocationDropdown(true);

    // Clear previous timeout
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
    }

    // Set new timeout for debounced search
    const timeoutId = setTimeout(() => {
      searchCities(query);
    }, 500); // 500ms debounce

    setSearchTimeoutId(timeoutId);
  };

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      // Validate user
      if (!user?.id) {
        toast({
          title: "Error",
          description: "Session expired. Please refresh the page.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Validate full name
      if (!formData.fullName.trim()) {
        toast({
          title: "Validation Error",
          description: "Full name is required.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Validate location is required
      if (!selectedLocation) {
        toast({
          title: "Validation Error",
          description: "Location is required. Please select a location.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "Session expired. Please refresh the page.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Prepare location (guaranteed to exist due to validation above)
      const locationData = toStandardizedLocation(selectedLocation);
      const locationString = JSON.stringify(locationData);

      // Prepare update data
      const updateData = {
        full_name: formData.fullName.trim(),
        username: formData.username.trim(),
        interests: formData.interests,
        location: locationString,
      };

      // Call API
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to update" }));
        
        // Check for duplicate username
        if (errorData.error?.message?.toLowerCase().includes("duplicate") || 
            errorData.error?.message?.toLowerCase().includes("unique")) {
          toast({
            title: "Username already taken",
            description: "This username is already in use. Please choose a different username.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
        
        throw new Error(errorData.error?.message || "Failed to update profile");
      }

      // Update local state
      setUser((prev) =>
        prev
          ? {
              ...prev,
              user_metadata: {
                ...prev.user_metadata,
                location: locationData,
                location_city: selectedLocation?.id || undefined,
                location_city_name: selectedLocation?.name || undefined,
                location_lat: selectedLocation?.lat || undefined,
                location_lon: selectedLocation?.lon || undefined,
                interests: formData.interests,
              },
            }
          : null
      );

      setUserProfile((prev: any) => ({
        ...(prev || {}),
        full_name: formData.fullName,
        username: formData.username,
        interests: formData.interests,
        location: locationString,
      }));

      // Update auth metadata in background (non-blocking, fire-and-forget)
      setTimeout(() => {
        supabase.auth.updateUser({
          data: {
            location: locationData,
            location_city: selectedLocation?.id || null,
            location_city_name: selectedLocation?.name || null,
            location_lat: selectedLocation?.lat || null,
            location_lon: selectedLocation?.lon || null,
            interests: formData.interests,
          },
        }).catch((err) => {
          console.warn("Failed to update auth metadata (non-critical):", err);
        });
      }, 0);

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      setIsEditing(false);
      setIsSaving(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedInterest("");
    // Reset form data to original values - fetch from API
    if (user) {
      const resetFormData = async () => {
        try {
          const profileResponse = await fetch("/api/user/profile");
          const userProfile = profileResponse.ok ? await profileResponse.json() : null;

          const metadata = user.user_metadata || {};
          setFormData({
            fullName: userProfile?.full_name || metadata.full_name || metadata.name || "",
            username: userProfile?.username || metadata.username || user.email?.split("@")[0] || "",
            interests: userProfile?.interests || metadata.interests || [],
          });
          
          // Reset location from users table
          let locationReset = false;
          if (userProfile?.location) {
            try {
              let locationData;
              if (typeof userProfile.location === 'string') {
                // Try to parse as JSON, if it fails, treat as plain string
                try {
                  locationData = JSON.parse(userProfile.location);
                } catch (e) {
                  // If parsing fails, it's likely a plain string (legacy data)
                  // Create a simple location object from the string
                  locationData = {
                    city: userProfile.location,
                    displayName: userProfile.location,
                  };
                }
              } else {
                locationData = userProfile.location;
              }
              
              if (locationData && locationData.city) {
                setLocationQuery(locationData.city);
                setSelectedLocation({
                  id: locationData.placeId || locationData.city,
                  name: locationData.city,
                  display_name: locationData.displayName || locationData.fullAddress || locationData.city,
                  lat: locationData.lat?.toString() || "0",
                  lon: locationData.lon?.toString() || "0",
                });
                locationReset = true;
              }
            } catch (e) {
              console.error("Error parsing location:", e);
            }
          }
          
          // Fallback to metadata
          if (!locationReset) {
            if (metadata.location) {
              const loc = metadata.location as UserLocationData;
              setLocationQuery(loc.city);
              setSelectedLocation({
                id: loc.placeId,
                name: loc.city,
                display_name: loc.displayName,
                lat: loc.lat.toString(),
                lon: loc.lon.toString(),
              });
            } else if (metadata.location_city) {
              setLocationQuery(metadata.location_city_name || "");
              setSelectedLocation({
                id: metadata.location_city,
                name: metadata.location_city_name || "",
                display_name: metadata.location_city_name || "",
                lat: metadata.location_lat || "0",
                lon: metadata.location_lon || "0",
              });
            } else {
              setLocationQuery("");
              setSelectedLocation(null);
            }
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          // Continue with metadata fallback
          const metadata = user.user_metadata || {};
          setFormData({
            fullName: metadata.full_name || metadata.name || "",
            username: metadata.username || user.email?.split("@")[0] || "",
            interests: metadata.interests || [],
          });
        }
      };
      
      resetFormData();
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

      if (!user?.id) {
        throw new Error("User session expired");
      }

      // Also fetch from users table to get the saved avatar_url (prioritize over user_metadata)
      const profileResponse = await fetch("/api/user/profile");
      const userProfile = profileResponse.ok ? await profileResponse.json() : null;

      if (newSession?.user) {
        // Prioritize avatar_url from users table (custom avatar) over user_metadata (Google OAuth might override)
        const customAvatarUrl = userProfile?.avatar_url || data.avatar_url;
        const timestamp = Date.now();
        setUser({
          ...newSession.user,
          user_metadata: {
            ...newSession.user.user_metadata,
            avatar_url: `${customAvatarUrl}?t=${timestamp}`,
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

      if (!user?.id) {
        throw new Error("User session expired");
      }

      // Also fetch from users table to get the saved avatar_url (prioritize over user_metadata)
      const profileResponse = await fetch("/api/user/profile");
      const userProfile = profileResponse.ok ? await profileResponse.json() : null;

      if (newSession?.user) {
        // Prioritize avatar_url from users table (custom avatar) over user_metadata (Google OAuth might override)
        const customAvatarUrl = userProfile?.avatar_url || data.avatar_url;
        const timestamp = Date.now();
        setUser({
          ...newSession.user,
          user_metadata: {
            ...newSession.user.user_metadata,
            avatar_url: `${customAvatarUrl}?t=${timestamp}`,
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

  const handleChangePassword = async () => {
    // Validate passwords
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });

      // Reset form and close dialog
      setPasswordForm({
        newPassword: "",
        confirmPassword: "",
      });
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setIsPasswordDialogOpen(false);
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
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


                  {/* Points Stats - Stacked */}
                  <div className="mb-6 space-y-3">
                    {/* Points */}
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                        <div className="flex-1">
                          <div className="text-xs text-green-600 font-medium">
                            Points
                        </div>
                          <div className="text-xl font-bold text-green-900">
                            {pointsCount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Reports */}
                    <div className={`p-3 rounded-xl border ${reportCount > 0 ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${reportCount > 0 ? 'bg-red-500' : 'bg-gray-300'} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className={`text-xs font-medium ${reportCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            Reports
                          </div>
                          <div className={`text-xl font-bold ${reportCount > 0 ? 'text-red-900' : 'text-gray-400'}`}>
                            {totalReports > 0 ? totalReports : reportCount}
                          </div>
                          {totalReports > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setShowReports(!showReports);
                                setReportsPage(1);
                              }}
                            >
                              {showReports ? "Hide Details" : "View Details"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span>Member since {new Date().toLocaleDateString()}</span>
                  </div>

                  {/* Reports List */}
                  {totalReports > 0 && showReports && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Reports Against You ({totalReports})
                        </h3>
                      </div>
                      {isLoadingReports ? (
                        <div className="text-center py-8 text-gray-500">Loading reports...</div>
                      ) : userReports.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No reports found</div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {userReports
                              .slice((reportsPage - 1) * reportsPerPage, reportsPage * reportsPerPage)
                              .map((report) => (
                                <div
                                  key={report.id}
                                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-red-300 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">
                                      {report.report_type}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-600 mb-2">
                                    <span className="font-medium">Reason:</span> {getReportReasonLabel(report.reason)}
                                  </div>
                                      {report.details && (
                                        <div className="text-sm text-gray-600 mb-2">
                                          <span className="font-medium">Details:</span> {report.details}
                                        </div>
                                      )}
                                      {report.target_content && (
                                        <div className="text-sm text-gray-600 mb-2">
                                          <span className="font-medium">Content:</span>{" "}
                                          {report.target_content.preview || `(${report.target_content.type})`}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>Reported by: {report.reporter.full_name || "Unknown"}</span>
                                        <span>•</span>
                                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                          
                          {/* Pagination */}
                          {totalReports > reportsPerPage && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReportsPage(p => Math.max(1, p - 1))}
                                disabled={reportsPage === 1}
                              >
                                Previous
                              </Button>
                              <span className="text-sm text-gray-600">
                                Page {reportsPage} of {Math.ceil(totalReports / reportsPerPage)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReportsPage(p => Math.min(Math.ceil(totalReports / reportsPerPage), p + 1))}
                                disabled={reportsPage >= Math.ceil(totalReports / reportsPerPage)}
                              >
                                Next
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
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
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSave(e);
                        }}
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

                      {/* Password - Only show for email/password users */}
                      {authProvider === "email" && (
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Password
                          </Label>
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <KeyRound className="h-5 w-5 text-purple-600" />
                              </div>
                              <span className="text-gray-900 font-medium">
                                ••••••••
                              </span>
                            </div>
                            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                >
                                  Change Password
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <KeyRound className="h-5 w-5 text-purple-600" />
                                    Change Password
                                  </DialogTitle>
                                  <DialogDescription>
                                    Enter your new password below. Make sure it's at least 6 characters long.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                      <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={passwordForm.newPassword}
                                        onChange={(e) =>
                                          setPasswordForm({
                                            ...passwordForm,
                                            newPassword: e.target.value,
                                          })
                                        }
                                        placeholder="Enter new password"
                                        className="pr-10"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                      >
                                        {showNewPassword ? (
                                          <EyeOff className="h-4 w-4 text-gray-500" />
                                        ) : (
                                          <Eye className="h-4 w-4 text-gray-500" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                      <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) =>
                                          setPasswordForm({
                                            ...passwordForm,
                                            confirmPassword: e.target.value,
                                          })
                                        }
                                        placeholder="Confirm new password"
                                        className="pr-10"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      >
                                        {showConfirmPassword ? (
                                          <EyeOff className="h-4 w-4 text-gray-500" />
                                        ) : (
                                          <Eye className="h-4 w-4 text-gray-500" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setPasswordForm({
                                        newPassword: "",
                                        confirmPassword: "",
                                      });
                                      setShowNewPassword(false);
                                      setShowConfirmPassword(false);
                                      setIsPasswordDialogOpen(false);
                                    }}
                                    disabled={isChangingPassword}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={handleChangePassword}
                                    disabled={isChangingPassword}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                  >
                                    {isChangingPassword ? "Changing..." : "Change Password"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      )}

                      {/* OAuth Provider Info - Show for Google users */}
                      {authProvider !== "email" && (
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Authentication Method
                          </Label>
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <KeyRound className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <span className="text-gray-900 font-medium">
                                Signed in with Google
                              </span>
                              <p className="text-xs text-gray-600 mt-1">
                                Your password is managed by Google. To change it, please visit your Google Account settings.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
                              onChange={(e) => handleLocationQueryChange(e.target.value)}
                              onFocus={() => {
                                setShowLocationDropdown(true);
                                if (locationQuery.length >= 3) {
                                  searchCities(locationQuery);
                                }
                              }}
                              onBlur={() => setTimeout(() => setShowLocationDropdown(false), 300)}
                              placeholder="Type at least 3 characters to search..."
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
                                  setAllCities([]);
                                  if (searchTimeoutId) {
                                    clearTimeout(searchTimeoutId);
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Search Results Dropdown */}
                            {showLocationDropdown && locationQuery.length >= 3 && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                                {loadingCities ? (
                                  <div className="p-4 text-center text-gray-500">
                                    <div className="inline-block h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
                                    Searching...
                                  </div>
                                ) : allCities.length > 0 ? (
                                  <>
                                    {allCities.map((city) => (
                                      <button
                                        key={city.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedLocation(city);
                                          setLocationQuery(city.name);
                                          setShowLocationDropdown(false);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200 border-b border-gray-100 last:border-0"
                                      >
                                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-gray-900 truncate">
                                            {city.name}
                                          </div>
                                          <div className="text-xs text-gray-500 truncate">
                                            {city.display_name}
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </>
                                ) : locationQuery.length >= 3 && !loadingCities ? (
                                  <div className="p-4 text-center text-gray-500">
                                    No cities found. Try a different search.
                                  </div>
                                ) : null}
                              </div>
                            )}
                            {locationQuery.length > 0 && locationQuery.length < 3 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Type at least 3 characters to search
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-orange-600" />
                            </div>
                            <span className="text-gray-900 font-medium">
                              {selectedLocation?.name || "Not provided"}
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
