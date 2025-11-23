"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ArrowLeft, Calendar, Loader2, MapPin, Clock, Users, Globe, FileText, Sparkles, Map, Wand2, Upload, Image as ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getSupabaseBrowser, getClientSession } from "@/lib/supabase/client";
import { LocationPicker } from "@/components/ui/location-picker";
import { ContentEnhancerDialog } from "@/components/ai/content-enhancer-dialog";

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = searchParams.get("community_id");

  const [isLoading, setIsLoading] = useState(true);
  const [community, setCommunity] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useMapPicker, setUseMapPicker] = useState(false);
  const [locationData, setLocationData] = useState<{
    address: string;
    lat: number | null;
    lng: number | null;
  }>({
    address: "",
    lat: null,
    lng: null,
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    is_online: false,
    max_attendees: "",
    image_url: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [enhanceDialogOpen, setEnhanceDialogOpen] = useState(false);
  const [enhancingContentType, setEnhancingContentType] = useState<"title" | "description" | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    loadCommunity();
  }, [communityId]);

  // Memoize location change handler to prevent map re-initialization
  const handleLocationChange = useCallback((location: {
    address: string;
    lat: number | null;
    lng: number | null;
  }) => {
    setLocationData(location);
    setFormData((prev) => ({ ...prev, location: location.address }));
  }, []);

  // AI Enhancement handlers
  const handleEnhanceTitle = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title first");
      return;
    }
    setEnhancingContentType("title");
    setEnhanceDialogOpen(true);
  };

  const handleEnhanceDescription = () => {
    if (!formData.description.trim()) {
      toast.error("Please enter a description first");
      return;
    }
    setEnhancingContentType("description");
    setEnhanceDialogOpen(true);
  };

  const handleGenerateContent = async (type: "title" | "description") => {
    if (type === "title" && !formData.title.trim()) {
      toast.error("Please enter a title first");
      return;
    }
    if (type === "description" && !formData.description.trim()) {
      toast.error("Please enter a description first");
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch("/api/ai/enhance-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: type === "title" ? formData.title : formData.description,
          contentType: type,
          enhancementType: "improve",
          tone: "professional",
          context: {
            name: formData.title,
            category: community?.name || "",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enhance content");
      }

      const data = await response.json();
      if (type === "title") {
        setFormData((prev) => ({ ...prev, title: data.enhancedContent }));
      } else {
        setFormData((prev) => ({ ...prev, description: data.enhancedContent }));
      }
      toast.success(`${type === "title" ? "Title" : "Description"} enhanced successfully!`);
    } catch (error: any) {
      console.error("Enhancement error:", error);
      toast.error(`Failed to enhance ${type}. Please try again.`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAcceptEnhancedContent = (enhancedContent: string) => {
    if (enhancingContentType === "title") {
      setFormData((prev) => ({ ...prev, title: enhancedContent }));
    } else if (enhancingContentType === "description") {
      setFormData((prev) => ({ ...prev, description: enhancedContent }));
    }
    setEnhanceDialogOpen(false);
    setEnhancingContentType(null);
  };

  const loadCommunity = async () => {
    if (!communityId) {
      toast.error("Community ID is required");
      router.push("/communities");
      return;
    }

    try {
      const supabase = getSupabaseBrowser();
      const { data: communityData, error } = await supabase
        .from("communities")
        .select("id, name, logo_url")
        .eq("id", communityId)
        .single();

      if (error || !communityData) {
        toast.error("Community not found");
        router.push("/communities");
        return;
      }

      setCommunity(communityData);
    } catch (error) {
      console.error("Error loading community:", error);
      toast.error("Failed to load community");
      router.push("/communities");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formDataToUpload = new FormData();
      formDataToUpload.append("image", file);

      const response = await fetch("/api/events/upload-image", {
        method: "POST",
        body: formDataToUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setFormData((prev) => ({ ...prev, image_url: data.url }));
      setImagePreview(data.url);
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image_url: "" }));
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.start_time || !formData.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.is_online && !formData.location) {
      toast.error("Please provide a location for the event");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          community_id: communityId,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      toast.success("Event created successfully!");
      
      // Redirect to community page with events tab to show the new event
      if (communityId) {
        router.push(`/community/${communityId}?tab=events`);
      } else if (data.id) {
        router.push(`/events/${data.id}`);
      } else {
        router.push("/events");
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
            <Sparkles className="h-6 w-6 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Loading event creator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Enhanced Header with better back button placement */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href={communityId ? `/community/${communityId}` : "/events"}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-purple-50 transition-colors group -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back
              </Button>
            </Link>
            {community && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-sm font-medium text-purple-700">{community.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 shadow-xl">
              <Calendar className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1 pt-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Create New Event
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                {community 
                  ? `Create an exciting event for ${community.name}`
                  : "Fill in the details below to create your event"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Form Card */}
        <AnimatedCard variant="glass" className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="pb-6 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-b border-purple-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Event Details</CardTitle>
                <CardDescription className="text-base mt-1 text-gray-600">
                  Fill in the details below to create your event
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Event Image Upload Section */}
              <div className="space-y-3">
                <Label htmlFor="event-image" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-purple-600" />
                  Event Image
                  <span className="text-sm font-normal text-gray-500">(optional but recommended)</span>
                </Label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative group">
                      <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={imagePreview}
                          alt="Event preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        id="event-image"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                      <label
                        htmlFor="event-image"
                        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          isUploadingImage
                            ? "border-purple-300 bg-purple-50"
                            : "border-gray-300 hover:border-purple-400 hover:bg-purple-50/50"
                        }`}
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="h-8 w-8 text-purple-600 animate-spin mb-3" />
                            <span className="text-sm font-medium text-purple-600">Uploading image...</span>
                          </>
                        ) : (
                          <>
                            <div className="p-3 rounded-full bg-purple-100 mb-3">
                              <Upload className="h-6 w-6 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 mb-1">
                              Click to upload event image
                            </span>
                            <span className="text-xs text-gray-500">
                              PNG, JPG, or GIF up to 5MB
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Title Section */}
              <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 border border-purple-100/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Label htmlFor="title" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    Event Title *
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEnhanceTitle}
                      disabled={!formData.title.trim() || isEnhancing}
                      className="text-xs border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Enhance
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateContent("title")}
                      disabled={!formData.title.trim() || isEnhancing}
                      className="text-xs border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                    >
                      {isEnhancing ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      Quick Enhance
                    </Button>
                  </div>
                </div>
                <Input
                  id="title"
                  placeholder="Enter a captivating event title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all text-base"
                  required
                />
              </div>

              {/* Description Section */}
              <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 border border-purple-100/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Label htmlFor="description" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    Description *
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEnhanceDescription}
                      disabled={!formData.description.trim() || isEnhancing}
                      className="text-xs border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Enhance
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateContent("description")}
                      disabled={!formData.description.trim() || isEnhancing}
                      className="text-xs border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                    >
                      {isEnhancing ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      Quick Enhance
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe your event in detail. What will attendees learn or experience?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[140px] border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none transition-all text-base"
                  required
                />
              </div>

              {/* Date and Time Section */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 border border-purple-100/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="start_time" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      Start Date & Time *
                    </Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="end_time" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      End Date & Time *
                    </Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location Section */}
              {!formData.is_online && (
                <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 border border-purple-100/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <Label htmlFor="location" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-purple-600" />
                      Location *
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUseMapPicker(!useMapPicker)}
                      className="text-sm border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                    >
                      <Map className="h-4 w-4 mr-2" />
                      {useMapPicker ? "Use Text Input" : "Pick on Map"}
                    </Button>
                  </div>

                  {useMapPicker ? (
                    <div className="space-y-3">
                      <LocationPicker
                        value={locationData.address ? locationData : undefined}
                        onChange={handleLocationChange}
                        locationType="physical"
                        required={true}
                      />
                      {locationData.lat && locationData.lng && (
                        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <MapPin className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              Location pinned on map
                            </p>
                            <p className="text-xs text-gray-600">
                              Coordinates: {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        id="location"
                        placeholder="Event location or address"
                        value={formData.location}
                        onChange={(e) => {
                          setFormData({ ...formData, location: e.target.value });
                          setLocationData({ address: e.target.value, lat: null, lng: null });
                        }}
                        className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all"
                        required
                      />
                      {locationData.lat && locationData.lng && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-purple-600" />
                          Location has coordinates from map picker
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Online Location Section */}
              {formData.is_online && (
                <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 border border-purple-100/50">
                  <Label htmlFor="location" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purple-600" />
                    Online Meeting Link
                    <span className="text-sm font-normal text-gray-500">(optional)</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="Online meeting link (e.g., Zoom, Google Meet, Discord)"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all bg-white"
                  />
                </div>
              )}

              {/* Online Event Checkbox */}
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
                <Checkbox
                  id="is_online"
                  checked={formData.is_online}
                  onCheckedChange={(checked) => {
                    const isOnline = checked as boolean;
                    setFormData({ ...formData, is_online: isOnline, location: isOnline ? "" : formData.location });
                    if (isOnline) {
                      setUseMapPicker(false);
                      setLocationData({ address: "", lat: null, lng: null });
                    }
                  }}
                  className="border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <Label htmlFor="is_online" className="cursor-pointer font-medium text-gray-700 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-600" />
                  This is an online event
                </Label>
              </div>

              {/* Max Attendees Section */}
              <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 border border-purple-100/50">
                <Label htmlFor="max_attendees" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  Max Attendees
                  <span className="text-sm font-normal text-gray-500">(optional)</span>
                </Label>
                <Input
                  id="max_attendees"
                  type="number"
                  placeholder="No limit"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                  className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all bg-white"
                  min="1"
                />
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <span className="text-purple-600">💡</span>
                  Leave empty for unlimited attendees
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-8"></div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 bg-gradient-to-r from-gray-50 to-purple-50/30 -mx-6 px-6 py-6 rounded-b-xl">
                <Link href={communityId ? `/community/${communityId}` : "/events"} className="flex-1 sm:flex-initial sm:w-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full sm:w-auto min-w-[120px] h-12 text-base border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    Cancel
                  </Button>
                </Link>
                <AnimatedButton
                  type="submit"
                  disabled={isSubmitting}
                  variant="default"
                  className="flex-1 sm:flex-initial sm:min-w-[200px] h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Event...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5 mr-2" />
                      Create Event
                    </>
                  )}
                </AnimatedButton>
              </div>
            </form>
          </CardContent>
        </AnimatedCard>
      </div>

      {/* AI Enhancement Dialog */}
      {enhancingContentType && (
        <ContentEnhancerDialog
          open={enhanceDialogOpen}
          onOpenChange={setEnhanceDialogOpen}
          originalContent={
            enhancingContentType === "title" ? formData.title : formData.description
          }
          contentType={enhancingContentType}
          context={{
            name: formData.title,
            category: community?.name || "",
          }}
          onAccept={handleAcceptEnhancedContent}
        />
      )}
    </div>
  );
}





