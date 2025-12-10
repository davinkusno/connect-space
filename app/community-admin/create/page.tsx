"use client"

import type React from "react"

import { EnhanceContentButton } from "@/components/ai/enhance-content-button"
import { CommunityAdminNav } from "@/components/navigation/community-admin-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ArrowLeft, CalendarIcon, CheckCircle, Copy, Lightbulb, Plus, RefreshCw, Sparkles, Wand2, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function CreateEventPage() {
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    category: "",
    date: undefined as Date | undefined,
    time: "",
    duration: "",
    location: "",
    capacity: "",
    price: "",
    tags: [] as string[],
    agenda: [""],
    requirements: "",
  })

  const [newTag, setNewTag] = useState("")
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isGeneratingAgenda, setIsGeneratingAgenda] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)

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
  }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating event:", eventData)
  }

  return (
    <div className="min-h-screen bg-white">
      <CommunityAdminNav />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-light text-gray-900 mb-3">Create Your Event</h1>
              <p className="text-gray-600">Organize memorable experiences with AI-powered assistance</p>
            </div>
            <Link href="/community-admin/events">
              <Button variant="outline" size="icon" className="border-gray-200 hover:border-purple-300 hover:bg-purple-50">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
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
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={eventData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="border-gray-200 focus:border-violet-300 focus:ring-violet-200">
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
                </div>
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
                  className="min-h-[120px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 resize-none"
                  required
                />
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="time">Start Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={eventData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                    required
                  />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., 123 Main St, New York, NY or Online"
                    value={eventData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                    required
                  />
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
                  />
                </div>
              </div>
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
            <Button type="submit" className="bg-violet-700 hover:bg-violet-800 text-white px-8">
              Create Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
