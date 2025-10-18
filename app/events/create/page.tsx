"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Wand2, Sparkles, RefreshCw, Copy, Lightbulb, CheckCircle, Plus, X, Users, MapPin, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EnhanceContentButton } from "@/components/ai/enhance-content-button"
import { useToast } from "@/hooks/use-toast"

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  role: string; // 'admin' or 'moderator'
}

export default function CreateEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    category: "",
    date: undefined as Date | undefined,
    time: "",
    endTime: "",
    location: "",
    locationCity: "",
    isOnline: false,
    capacity: "",
    price: "",
    tags: [] as string[],
    agenda: [""],
    requirements: "",
    communityId: "",
  })

  const [newTag, setNewTag] = useState("")
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isGeneratingAgenda, setIsGeneratingAgenda] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [communities, setCommunities] = useState<Community[]>([])
  const [loadingCommunities, setLoadingCommunities] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    "Workshop",
    "Seminar",
    "Meetup",
    "Conference",
    "Networking",
    "Hackathon",
    "Social",
    "Educational",
    "Sports",
    "Arts & Culture",
  ]

  const durations = ["1 hour", "2 hours", "3 hours", "Half day", "Full day", "2 days", "3 days"]

  const handleInputChange = (field: string, value: any) => {
    setEventData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  // Fetch user's community (they can only have one)
  const fetchUserCommunity = async () => {
    try {
      setLoadingCommunities(true);
      const response = await fetch('/api/communities/my-community');
      if (response.ok) {
        const data = await response.json();
        if (data.community) {
          setCommunities([data.community]);
          // Auto-select the user's community
          setEventData(prev => ({ ...prev, communityId: data.community.id }));
        } else {
          setCommunities([]);
        }
      } else {
        throw new Error('Failed to fetch your community');
      }
    } catch (error) {
      console.error('Error fetching user community:', error);
      toast({
        title: "Error",
        description: "Failed to load your community. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingCommunities(false);
    }
  }

  // Load user's community on component mount
  useEffect(() => {
    fetchUserCommunity();
  }, []);

  // Calculate end time based on duration
  const calculateEndTime = (startTime: string, duration: string) => {
    if (!startTime || !duration) return "";
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    let durationHours = 0;
    switch (duration) {
      case "1 hour": durationHours = 1; break;
      case "2 hours": durationHours = 2; break;
      case "3 hours": durationHours = 3; break;
      case "Half day": durationHours = 4; break;
      case "Full day": durationHours = 8; break;
      case "2 days": durationHours = 16; break;
      case "3 days": durationHours = 24; break;
      default: durationHours = 2;
    }
    
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
    return endDate.toTimeString().slice(0, 5);
  }

  // Update end time when start time or duration changes
  useEffect(() => {
    if (eventData.time && eventData.duration) {
      const endTime = calculateEndTime(eventData.time, eventData.duration);
      setEventData((prev) => ({ ...prev, endTime }));
    }
  }, [eventData.time, eventData.duration]);

  const generateDescription = async () => {
    if (!eventData.title || !eventData.category) {
      alert("Please enter an event title and select a category first")
      return
    }

    setIsGeneratingDescription(true)
    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "event-description",
          params: {
            title: eventData.title,
            category: eventData.category,
            duration: eventData.duration,
            location: eventData.location,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEventData((prev) => ({ ...prev, description: data.description }))
        setAiSuggestions(data)
      }
    } catch (error) {
      console.error("Failed to generate description:", error)
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const generateAgenda = async () => {
    if (!eventData.title || !eventData.category || !eventData.duration) {
      alert("Please enter event title, category, and duration first")
      return
    }

    setIsGeneratingAgenda(true)
    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "event-agenda",
          params: {
            title: eventData.title,
            category: eventData.category,
            duration: eventData.duration,
            description: eventData.description,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEventData((prev) => ({ ...prev, agenda: data.agenda }))
      }
    } catch (error) {
      console.error("Failed to generate agenda:", error)
    } finally {
      setIsGeneratingAgenda(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !eventData.tags.includes(newTag.trim())) {
      setEventData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setEventData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const addAgendaItem = () => {
    setEventData((prev) => ({
      ...prev,
      agenda: [...prev.agenda, ""],
    }))
  }

  const updateAgendaItem = (index: number, value: string) => {
    setEventData((prev) => ({
      ...prev,
      agenda: prev.agenda.map((item, i) => (i === index ? value : item)),
    }))
  }

  const removeAgendaItem = (index: number) => {
    setEventData((prev) => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index),
    }))
  }

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!eventData.title.trim()) newErrors.title = "Event title is required";
    if (!eventData.description.trim()) newErrors.description = "Event description is required";
    if (!eventData.category) newErrors.category = "Please select a category";
    if (!eventData.date) newErrors.date = "Please select a date";
    if (!eventData.time) newErrors.time = "Please select a start time";
    if (!eventData.location.trim()) newErrors.location = "Location is required";
    if (!eventData.communityId) newErrors.communityId = "Please select a community";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare the event data for API
      const eventPayload = {
        title: eventData.title.trim(),
        description: eventData.description.trim(),
        category: eventData.category,
        start_time: `${eventData.date?.toISOString().split('T')[0]}T${eventData.time}:00`,
        end_time: `${eventData.date?.toISOString().split('T')[0]}T${eventData.endTime}:00`,
        location: eventData.location.trim(),
        is_online: eventData.isOnline,
        max_attendees: eventData.capacity ? parseInt(eventData.capacity) : null,
        community_id: eventData.communityId,
        image_url: null, // We'll add image upload later
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success!",
          description: "Your event has been created successfully.",
        });
        
        // Redirect to the event page
        router.push(`/events/${result.event.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-light text-gray-900">Create Your Event</h1>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
              Admin Only
            </Badge>
          </div>
          <p className="text-gray-600">Organize memorable experiences for your community with AI-powered assistance</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information with AI Integration */}
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-2">
                Event Details
                <Badge variant="secondary" className="ml-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
              </CardTitle>
              <p className="text-gray-600">Let AI help you create compelling event details</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title">Event Title *</Label>
                    <EnhanceContentButton
                      content={eventData.title}
                      contentType="title"
                      onEnhanced={(enhanced) => handleInputChange("title", enhanced)}
                      context={{ category: eventData.category, type: "event" }}
                      disabled={!eventData.title}
                    />
                  </div>
                  <Input
                    id="title"
                    placeholder="e.g., AI Workshop for Beginners"
                    value={eventData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={cn(
                      "border-gray-200 focus:border-violet-300 focus:ring-violet-200",
                      errors.title && "border-red-300 focus:border-red-500 focus:ring-red-200"
                    )}
                    required
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={eventData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className={cn(
                      "border-gray-200 focus:border-violet-300 focus:ring-violet-200",
                      errors.category && "border-red-300 focus:border-red-500 focus:ring-red-200"
                    )}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>

              {/* Community Display (Auto-selected) */}
              <div className="space-y-3">
                <Label>Your Community</Label>
                {loadingCommunities ? (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ) : communities.length > 0 ? (
                  <div className="p-4 border border-violet-200 rounded-lg bg-violet-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-violet-900">{communities[0].name}</div>
                        <div className="text-sm text-violet-600 flex items-center gap-2">
                          <span>{communities[0].category}</span>
                          <span>•</span>
                          <span className="font-medium">Admin</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                        Your Community
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-amber-600" />
                      <div className="flex-1">
                        <div className="font-medium text-amber-800">No Community Found</div>
                        <div className="text-sm text-amber-700">You need to create a community first to organize events</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Link href="/create-community">
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your Community
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description *</Label>
                  <div className="flex gap-2">
                    <EnhanceContentButton
                      content={eventData.description}
                      contentType="description"
                      onEnhanced={(enhanced) => handleInputChange("description", enhanced)}
                      context={{
                        name: eventData.title,
                        category: eventData.category,
                        type: "event",
                      }}
                      disabled={!eventData.description}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescription}
                      disabled={!eventData.title || !eventData.category || isGeneratingDescription}
                      className="border-violet-200 text-violet-600 hover:bg-violet-50"
                    >
                      {isGeneratingDescription ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe what your event is about, what attendees will learn or experience..."
                  value={eventData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className={cn(
                    "min-h-[120px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 resize-none",
                    errors.description && "border-red-300 focus:border-red-500 focus:ring-red-200"
                  )}
                  required
                />
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">{eventData.description.length}/1000 characters</p>
                  {aiSuggestions && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(eventData.description)}
                      className="text-violet-600 hover:text-violet-700"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  )}
                </div>
              </div>

              {/* AI Suggestions Panel */}
              {aiSuggestions && (
                <Card className="border-violet-200 bg-violet-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-violet-700 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
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

          {/* Date, Time & Location */}
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-gray-900">When & Where</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-gray-200",
                          !eventData.date && "text-muted-foreground",
                          errors.date && "border-red-300"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventData.date ? format(eventData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={eventData.date}
                        onSelect={(date) => handleInputChange("date", date)}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.date}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="time">Start Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={eventData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className={cn(
                      "border-gray-200 focus:border-violet-300 focus:ring-violet-200",
                      errors.time && "border-red-300 focus:border-red-500 focus:ring-red-200"
                    )}
                    required
                  />
                  {errors.time && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.time}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="duration">Duration *</Label>
                  <Select value={eventData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
                    <SelectTrigger className="border-gray-200 focus:border-violet-300 focus:ring-violet-200">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((duration) => (
                        <SelectItem key={duration} value={duration}>
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Online Event Toggle */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isOnline"
                    checked={eventData.isOnline}
                    onChange={(e) => handleInputChange("isOnline", e.target.checked)}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <Label htmlFor="isOnline" className="text-sm font-medium">
                    This is an online event
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder={eventData.isOnline ? "e.g., Zoom, Google Meet, or platform name" : "e.g., 123 Main St, New York, NY"}
                    value={eventData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className={cn(
                      "border-gray-200 focus:border-violet-300 focus:ring-violet-200",
                      errors.location && "border-red-300 focus:border-red-500 focus:ring-red-200"
                    )}
                    required
                  />
                  {errors.location && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.location}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="e.g., 50"
                    value={eventData.capacity}
                    onChange={(e) => handleInputChange("capacity", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                    min="1"
                  />
                </div>
              </div>

              {!eventData.isOnline && (
                <div className="space-y-3">
                  <Label htmlFor="locationCity">City</Label>
                  <Input
                    id="locationCity"
                    placeholder="e.g., New York, NY"
                    value={eventData.locationCity}
                    onChange={(e) => handleInputChange("locationCity", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI-Enhanced Agenda */}
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-2">
                Event Agenda
                <Badge variant="secondary" className="ml-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Enhanced
                </Badge>
              </CardTitle>
              <p className="text-gray-600">Create a detailed agenda with AI assistance</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label>Agenda Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateAgenda}
                  disabled={!eventData.title || !eventData.category || !eventData.duration || isGeneratingAgenda}
                  className="border-violet-200 text-violet-600 hover:bg-violet-50"
                >
                  {isGeneratingAgenda ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Generate Agenda
                    </>
                  )}
                </Button>
              </div>

              {eventData.agenda.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-700">
                    {index + 1}
                  </div>
                  <div className="flex-1 flex gap-3">
                    <Input
                      placeholder={`Agenda item ${index + 1}...`}
                      value={item}
                      onChange={(e) => updateAgendaItem(index, e.target.value)}
                      className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                    />
                    <div className="flex gap-2">
                      {item && (
                        <EnhanceContentButton
                          content={item}
                          contentType="agenda"
                          onEnhanced={(enhanced) => updateAgendaItem(index, enhanced)}
                          context={{
                            name: eventData.title,
                            category: eventData.category,
                          }}
                          size="icon"
                          className="flex-shrink-0"
                        >
                          <Sparkles className="h-4 w-4" />
                        </EnhanceContentButton>
                      )}
                      {eventData.agenda.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeAgendaItem(index)}
                          className="border-gray-200 hover:border-violet-300 hover:bg-violet-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addAgendaItem}
                className="border-gray-200 hover:border-violet-300 hover:bg-violet-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Agenda Item
              </Button>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-gray-900">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    placeholder="e.g., Free, $25, $50"
                    value={eventData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Tags</Label>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      variant="outline"
                      className="border-gray-200 hover:border-violet-300 hover:bg-violet-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {eventData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {eventData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-2 border-gray-200 text-gray-700"
                        >
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requirements">Requirements</Label>
                  <EnhanceContentButton
                    content={eventData.requirements}
                    contentType="requirements"
                    onEnhanced={(enhanced) => handleInputChange("requirements", enhanced)}
                    context={{
                      name: eventData.title,
                      category: eventData.category,
                    }}
                    disabled={!eventData.requirements}
                  />
                </div>
                <Textarea
                  id="requirements"
                  placeholder="Any prerequisites, materials needed, or special requirements..."
                  value={eventData.requirements}
                  onChange={(e) => handleInputChange("requirements", e.target.value)}
                  className="h-24 border-gray-200 focus:border-violet-300 focus:ring-violet-200 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-violet-700 hover:bg-violet-800 text-white px-8"
              disabled={isSubmitting || communities.length === 0 || loadingCommunities}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Event...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
          
          {communities.length === 0 && !loadingCommunities && (
            <div className="text-center py-8">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-amber-800 mb-2">
                  Create Your Community First
                </h3>
                <p className="text-amber-700 mb-4">
                  You need to create your own community before you can organize events. Each user can create and manage one community.
                </p>
                <Link href="/create-community">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your Community
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
