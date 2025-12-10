"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Loader2, MapPin, Clock, Users, Globe, FileText, Sparkles, Map, Wand2, Upload, Image as ImageIcon, X, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { LocationPicker } from "@/components/ui/location-picker";
import { EnhanceContentButton } from "@/components/ai/enhance-content-button";
import { ContentEnhancerDialog } from "@/components/ai/content-enhancer-dialog";
import { PageTransition } from "@/components/ui/page-transition";
import { SmoothReveal } from "@/components/ui/smooth-reveal";

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = searchParams.get("community_id");

  const [isLoading, setIsLoading] = useState(true);
  const [community, setCommunity] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [useMapPicker, setUseMapPicker] = useState(true);
  const [locationData, setLocationData] = useState<{
    address: string;
    city?: string;
    lat: number | null;
    lng: number | null;
  }>({
    address: "",
    city: "",
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
    link: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [enhanceDialogOpen, setEnhanceDialogOpen] = useState(false);
  const [enhancingContentType, setEnhancingContentType] = useState<"description" | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    loadCommunity();
  }, [communityId]);

  // Memoize location change handler to prevent map re-initialization
  const handleLocationChange = useCallback((location: {
    address: string;
    city?: string;
    lat: number | null;
    lng: number | null;
  }) => {
    setLocationData(location);
    setFormData((prev) => ({ ...prev, location: location.address }));
  }, []);

  // AI Enhancement handlers (only for description)
  const handleEnhanceDescription = () => {
    if (!formData.description.trim()) {
      toast.error("Please enter a description first");
      return;
    }
    setEnhancingContentType("description");
    setEnhanceDialogOpen(true);
  };

  const handleAcceptEnhancedContent = (enhancedContent: string) => {
    if (enhancingContentType === "description") {
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

    // Validate description word count (max 500 words)
    const wordCount = formData.description.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 500) {
      toast.error(`Description must be 500 words or less. Current word count: ${wordCount}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare location data with city for searchability
      let locationPayload = formData.location;
      if (!formData.is_online && locationData.address) {
        locationPayload = JSON.stringify({
          address: locationData.address,
          city: locationData.city || "",
          lat: locationData.lat || 0,
          lng: locationData.lng || 0,
        });
      }

      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          location: locationPayload,
          community_id: communityId,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      // Show success notification
      toast.success("Event successfully created!", {
        duration: 3000,
      });
      
      // Wait a moment for user to see the notification, then redirect
      setTimeout(() => {
        // Redirect to community page with events tab to show the new event
        if (communityId) {
          router.push(`/community/${communityId}?tab=events`);
        } else if (data.id) {
          router.push(`/events/${data.id}`);
        } else {
          router.push("/events");
        }
      }, 500);
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Basic Information" },
    { number: 2, title: "Date, Location & Details" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading event creator...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <SmoothReveal delay={100} direction="up">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <Link href={communityId ? `/community/${communityId}` : "/events"}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hover:bg-violet-50 transition-colors group"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back
                  </Button>
                </Link>
                {community && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                    <span className="text-sm font-medium text-violet-700">{community.name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Create Your Event</h1>
                  <p className="text-gray-600 mt-1">
                    {community 
                      ? `Create an exciting event for ${community.name}`
                      : "Fill in the details below to create your event"
                    }
                  </p>
                </div>
              </div>
            </div>
          </SmoothReveal>

          {/* Progress Steps */}
          <SmoothReveal delay={200} direction="up">
            <div className="mb-8 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <React.Fragment key={step.number}>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div
                        className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-200 shadow-sm ${
                          currentStep >= step.number
                            ? "bg-violet-600 border-violet-600 text-white scale-110"
                            : "border-gray-300 text-gray-500 bg-white"
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-medium">{step.number}</span>
                      </div>
                      <p
                        className={`text-xs sm:text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${
                          currentStep >= step.number ? "text-violet-700" : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 sm:mx-4 max-w-[60px] sm:max-w-none transition-colors duration-200 ${
                          currentStep > step.number ? "bg-violet-600" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </SmoothReveal>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <SmoothReveal delay={300} direction="up">
              <Card className="border-gray-200/50 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-2">
                  Basic Information
                  <Badge variant="secondary" className="ml-2">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Powered
                  </Badge>
                </CardTitle>
                <p className="text-gray-600">
                  Tell us about your event and let AI help you craft the perfect description
                </p>
          </CardHeader>
              <CardContent className="space-y-8">
                {/* Event Image Upload */}
              <div className="space-y-3">
                  <Label htmlFor="event-image" className="text-gray-700">
                  Event Image
                    <span className="text-sm font-normal text-gray-500 ml-2">(optional but recommended)</span>
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
                              ? "border-violet-300 bg-violet-50"
                              : "border-gray-300 hover:border-violet-400 hover:bg-violet-50/50"
                        }`}
                      >
                        {isUploadingImage ? (
                          <>
                              <Loader2 className="h-8 w-8 text-violet-600 animate-spin mb-3" />
                              <span className="text-sm font-medium text-violet-600">Uploading image...</span>
                          </>
                        ) : (
                          <>
                              <div className="p-3 rounded-full bg-violet-100 mb-3">
                                <Upload className="h-6 w-6 text-violet-600" />
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
                <Label htmlFor="title" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Event Title *
                </Label>
                <Input
                  id="title"
                    placeholder="e.g., Tech Meetup: Building Modern Web Apps"
                  value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 transition-colors duration-200"
                  required
                />
                  <p className="text-sm text-gray-500">
                    Choose a clear, descriptive title that captures your event's essence
                  </p>
              </div>

                {/* Description */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="text-gray-700">
                    Description *
                  </Label>
                  <div className="flex gap-2">
                      <EnhanceContentButton
                        content={formData.description}
                        contentType="description"
                        onEnhanced={(enhanced) => handleInputChange("description", enhanced)}
                        context={{
                          name: formData.title,
                          category: community?.name || "",
                          type: "event",
                        }}
                        disabled={!formData.description}
                      />
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
                  </div>
                </div>
                <Textarea
                  id="description"
                    placeholder="Describe your event in detail. What will attendees learn or experience? What should they bring? What makes this event special?"
                  value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="min-h-[120px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 transition-colors duration-200 resize-none"
                  required
                />
                  <div className="flex justify-between items-center">
                    {(() => {
                      const wordCount = formData.description.trim().split(/\s+/).filter(word => word.length > 0).length;
                      const isOverLimit = wordCount > 500;
                      return (
                        <p className={`text-sm ${isOverLimit ? "text-red-500 font-medium" : "text-gray-500"}`}>
                          {wordCount}/500 words {isOverLimit && "(exceeds limit)"}
                        </p>
                      );
                    })()}
                  </div>
              </div>

                {/* AI Suggestions Panel */}
                {aiSuggestions && (
                  <Card className="border-violet-200 bg-violet-50/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-violet-700 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {aiSuggestions.alternativeDescriptions && (
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Alternative Descriptions:</Label>
                          <div className="space-y-2 mt-1">
                            {aiSuggestions.alternativeDescriptions.slice(0, 2).map((alt: string, index: number) => (
                              <div key={index} className="p-2 bg-white rounded border text-sm">
                                <p className="text-gray-700">{alt}</p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleInputChange("description", alt)}
                                  className="mt-1 h-6 px-2 text-xs text-violet-600"
                                >
                                  Use this
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
            </SmoothReveal>
          )}

          {/* Step 2: Date, Location & Details */}
          {currentStep === 2 && (
            <SmoothReveal delay={300} direction="up">
              <Card className="border-gray-200/50 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-gray-900">Date, Location & Details</CardTitle>
                <p className="text-gray-600">Set when, where, and capacity for your event</p>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Date and Time */}
                <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                      <Label htmlFor="start_time" className="text-gray-700 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-violet-600" />
                      Start Date & Time *
                    </Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                        onChange={(e) => handleInputChange("start_time", e.target.value)}
                        className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 transition-colors duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                      <Label htmlFor="end_time" className="text-gray-700 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-violet-600" />
                      End Date & Time *
                    </Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                        onChange={(e) => handleInputChange("end_time", e.target.value)}
                        className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 transition-colors duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

                {/* Online Event Checkbox */}
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200">
                  <Checkbox
                    id="is_online"
                    checked={formData.is_online}
                    onCheckedChange={(checked) => {
                      const isOnline = checked as boolean;
                      handleInputChange("is_online", isOnline);
                      if (isOnline) {
                        handleInputChange("location", "");
                        setUseMapPicker(false);
                        setLocationData({ address: "", city: "", lat: null, lng: null });
                      }
                    }}
                    className="border-gray-300 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                  />
                  <Label htmlFor="is_online" className="cursor-pointer font-medium text-gray-700 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-violet-600" />
                    This is an online event
                  </Label>
                </div>

              {/* Location Section */}
                {!formData.is_online ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-700 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-violet-600" />
                      Location *
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUseMapPicker(!useMapPicker)}
                        className="text-sm border-violet-200 hover:bg-violet-50 hover:border-violet-300"
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
                        {locationData.city && (
                          <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg border border-violet-200">
                            <MapPin className="h-4 w-4 text-violet-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                                {locationData.city}
                            </p>
                              {locationData.lat && locationData.lng && (
                            <p className="text-xs text-gray-600">
                                  Coordinates: {locationData.lat.toFixed(4)}, {locationData.lng.toFixed(4)}
                            </p>
                              )}
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
                            handleInputChange("location", e.target.value);
                            setLocationData({ address: e.target.value, city: e.target.value, lat: null, lng: null });
                        }}
                          className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 transition-colors duration-200"
                        required
                      />
                    </div>
                  )}
                </div>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="location" className="text-gray-700 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-violet-600" />
                    Online Meeting Link
                    <span className="text-sm font-normal text-gray-500">(optional)</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="Online meeting link (e.g., Zoom, Google Meet, Discord)"
                    value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 transition-colors duration-200"
                  />
                </div>
                )}

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

              {/* Registration Link Section */}
              <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 border border-purple-100/50">
                <Label htmlFor="link" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-600" />
                  Registration Link
                  <span className="text-sm font-normal text-gray-500">(optional)</span>
                </Label>
                <Input
                  type="url"
                  id="link"
                  placeholder="https://example.com/register"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all bg-white"
                />
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <span className="text-purple-600">💡</span>
                  Add a link to external registration page
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
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="border-gray-200 hover:border-violet-300 hover:bg-violet-50"
            >
              Previous
            </Button>

            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={() => {
                  // Validation before moving to next step
                  if (currentStep === 1 && (!formData.title || !formData.description)) {
                    toast.error("Please fill in title and description");
                    return;
                  }
                  setCurrentStep(Math.min(2, currentStep + 1));
                }}
                className="bg-violet-700 hover:bg-violet-800 text-white"
              >
                Next
              </Button>
            ) : (
              <Button 
                type="submit"
                className="bg-violet-700 hover:bg-violet-800 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            )}
          </div>
          </SmoothReveal>
        </form>
      </div>

      {/* AI Enhancement Dialog */}
      {enhancingContentType === "description" && (
        <ContentEnhancerDialog
          open={enhanceDialogOpen}
          onOpenChange={setEnhanceDialogOpen}
          originalContent={formData.description}
          contentType="description"
          context={{
            name: formData.title,
            category: community?.name || "",
          }}
          onAccept={handleAcceptEnhancedContent}
        />
      )}
    </div>
    </PageTransition>
  );
}
