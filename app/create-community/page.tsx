"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  X,
  Plus,
  MapPin,
  Users,
  Globe,
  Wand2,
  Sparkles,
  RefreshCw,
  Copy,
  Lightbulb,
  Hash,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { EnhanceContentButton } from "@/components/ai/enhance-content-button"

export default function CreateCommunityPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    location: "",
    locationType: "physical",
    privacy: "public",
    tags: [] as string[],
    rules: [""],
    coverImage: null as File | null,
    profileImage: null as File | null,
  })

  const [newTag, setNewTag] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isGeneratingTags, setIsGeneratingTags] = useState(false)
  const [isGeneratingRules, setIsGeneratingRules] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)

  const categories = [
    "Technology",
    "Sports & Fitness",
    "Arts & Culture",
    "Food & Dining",
    "Outdoors",
    "Business",
    "Education",
    "Health & Wellness",
    "Gaming",
    "Music",
    "Photography",
    "Travel",
    "Volunteering",
    "Parenting",
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateDescription = async () => {
    if (!formData.name || !formData.category) {
      alert("Please enter a community name and select a category first")
      return
    }

    setIsGeneratingDescription(true)
    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "community-description",
          params: {
            name: formData.name,
            category: formData.category,
            locationType: formData.locationType,
            location: formData.location,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({ ...prev, description: data.description }))
        setAiSuggestions(data)
      }
    } catch (error) {
      console.error("Failed to generate description:", error)
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const generateTags = async () => {
    if (!formData.name || !formData.category) {
      alert("Please enter a community name and select a category first")
      return
    }

    setIsGeneratingTags(true)
    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "community-tags",
          params: {
            name: formData.name,
            category: formData.category,
            description: formData.description,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, ...data.tags] }))
      }
    } catch (error) {
      console.error("Failed to generate tags:", error)
    } finally {
      setIsGeneratingTags(false)
    }
  }

  const generateRules = async () => {
    if (!formData.name || !formData.category) {
      alert("Please enter a community name and select a category first")
      return
    }

    setIsGeneratingRules(true)
    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "community-rules",
          params: {
            name: formData.name,
            category: formData.category,
            privacy: formData.privacy,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({ ...prev, rules: data.rules }))
      }
    } catch (error) {
      console.error("Failed to generate rules:", error)
    } finally {
      setIsGeneratingRules(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const addRule = () => {
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, ""],
    }))
  }

  const updateRule = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) => (i === index ? value : rule)),
    }))
  }

  const removeRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating community:", formData)
  }

  const steps = [
    { number: 1, title: "Basic Information", description: "Name, description, and category" },
    { number: 2, title: "Location & Privacy", description: "Where and how your community meets" },
    { number: 3, title: "Customization", description: "Images, tags, and rules" },
    { number: 4, title: "Review & Create", description: "Final review before creating" },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-3">Create Your Community</h1>
          <p className="text-gray-600">Build a space where like-minded people can connect and grow together</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200 ${
                    currentStep >= step.number
                      ? "bg-violet-700 border-violet-700 text-white"
                      : "border-gray-300 text-gray-500"
                  }`}
                >
                  {step.number}
                </div>
                <div className="ml-4 hidden sm:block">
                  <p
                    className={`text-sm font-medium transition-colors duration-200 ${
                      currentStep >= step.number ? "text-violet-700" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 ml-4 transition-colors duration-200 ${
                      currentStep > step.number ? "bg-violet-700" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information with AI Integration */}
          {currentStep === 1 && (
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-2">
                  Basic Information
                  <Badge variant="secondary" className="ml-2">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Powered
                  </Badge>
                </CardTitle>
                <p className="text-gray-600">
                  Tell us about your community and let AI help you craft the perfect description
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name" className="text-gray-700">
                      Community Name *
                    </Label>
                    <EnhanceContentButton
                      content={formData.name}
                      contentType="title"
                      onEnhanced={(enhanced) => handleInputChange("name", enhanced)}
                      context={{ category: formData.category }}
                      disabled={!formData.name}
                    />
                  </div>
                  <Input
                    id="name"
                    placeholder="e.g., Tech Innovators NYC"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 transition-colors duration-200"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Choose a clear, descriptive name that reflects your community's purpose
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="category" className="text-gray-700">
                    Category *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="border-gray-200 focus:border-violet-300 focus:ring-violet-200">
                      <SelectValue placeholder="Select a category" />
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
                          name: formData.name,
                          category: formData.category,
                          type: "community",
                        }}
                        disabled={!formData.description}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateDescription}
                        disabled={!formData.name || !formData.category || isGeneratingDescription}
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
                    placeholder="Describe what your community is about, what activities you'll do, and who should join..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="min-h-[120px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 transition-colors duration-200 resize-none"
                    required
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">{formData.description.length}/500 characters</p>
                    {aiSuggestions && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(formData.description)}
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
          )}

          {/* Step 2: Location & Privacy */}
          {currentStep === 2 && (
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-gray-900">Location & Privacy</CardTitle>
                <p className="text-gray-600">Set up where your community meets and who can join</p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-gray-700">Meeting Type *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.locationType === "physical"
                          ? "border-violet-700 bg-violet-50"
                          : "border-gray-200 hover:border-violet-300"
                      }`}
                      onClick={() => handleInputChange("locationType", "physical")}
                    >
                      <MapPin className="h-6 w-6 mb-3 text-violet-700" />
                      <h4 className="font-medium text-gray-900">In-Person</h4>
                      <p className="text-sm text-gray-600">Meet at physical locations</p>
                    </div>
                    <div
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.locationType === "online"
                          ? "border-violet-700 bg-violet-50"
                          : "border-gray-200 hover:border-violet-300"
                      }`}
                      onClick={() => handleInputChange("locationType", "online")}
                    >
                      <Globe className="h-6 w-6 mb-3 text-violet-700" />
                      <h4 className="font-medium text-gray-900">Online</h4>
                      <p className="text-sm text-gray-600">Virtual meetings and events</p>
                    </div>
                    <div
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.locationType === "hybrid"
                          ? "border-violet-700 bg-violet-50"
                          : "border-gray-200 hover:border-violet-300"
                      }`}
                      onClick={() => handleInputChange("locationType", "hybrid")}
                    >
                      <Users className="h-6 w-6 mb-3 text-violet-700" />
                      <h4 className="font-medium text-gray-900">Hybrid</h4>
                      <p className="text-sm text-gray-600">Both online and in-person</p>
                    </div>
                  </div>
                </div>

                {formData.locationType !== "online" && (
                  <div className="space-y-3">
                    <Label htmlFor="location" className="text-gray-700">
                      Location
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g., New York, NY or San Francisco Bay Area"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 transition-colors duration-200"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-gray-700">Privacy Settings *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.privacy === "public"
                          ? "border-violet-700 bg-violet-50"
                          : "border-gray-200 hover:border-violet-300"
                      }`}
                      onClick={() => handleInputChange("privacy", "public")}
                    >
                      <h4 className="font-medium text-gray-900">Public</h4>
                      <p className="text-sm text-gray-600">Anyone can find and join your community</p>
                    </div>
                    <div
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.privacy === "private"
                          ? "border-violet-700 bg-violet-50"
                          : "border-gray-200 hover:border-violet-300"
                      }`}
                      onClick={() => handleInputChange("privacy", "private")}
                    >
                      <h4 className="font-medium text-gray-900">Private</h4>
                      <p className="text-sm text-gray-600">People need approval to join</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Customization with AI Integration */}
          {currentStep === 3 && (
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-2">
                  Customization
                  <Badge variant="secondary" className="ml-2">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Enhanced
                  </Badge>
                </CardTitle>
                <p className="text-gray-600">Add images, tags, and rules with AI assistance</p>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Images */}
                <div className="space-y-4">
                  <Label className="text-gray-700">Community Images</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-600">Cover Image</Label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-violet-300 transition-colors duration-200">
                        <Upload className="h-8 w-8 mx-auto text-violet-400 mb-3" />
                        <p className="text-sm text-gray-600">Upload cover image</p>
                        <p className="text-xs text-gray-500">Recommended: 800x300px</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-600">Profile Image</Label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-violet-300 transition-colors duration-200">
                        <Upload className="h-8 w-8 mx-auto text-violet-400 mb-3" />
                        <p className="text-sm text-gray-600">Upload profile image</p>
                        <p className="text-xs text-gray-500">Recommended: 200x200px</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-200" />

                {/* AI-Enhanced Tags */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700">Tags</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateTags}
                      disabled={!formData.name || !formData.category || isGeneratingTags}
                      className="border-violet-200 text-violet-600 hover:bg-violet-50"
                    >
                      {isGeneratingTags ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Hash className="h-4 w-4 mr-2" />
                          Generate Tags
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 transition-colors duration-200"
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
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
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

                <Separator className="bg-gray-200" />

                {/* AI-Enhanced Rules */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700">Community Rules</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateRules}
                        disabled={!formData.name || !formData.category || isGeneratingRules}
                        className="border-violet-200 text-violet-600 hover:bg-violet-50"
                      >
                        {isGeneratingRules ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Generate Rules
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Set clear guidelines to help maintain a positive community environment
                  </p>
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        placeholder={`Rule ${index + 1}...`}
                        value={rule}
                        onChange={(e) => updateRule(index, e.target.value)}
                        className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 transition-colors duration-200"
                      />
                      <div className="flex gap-2">
                        {rule && (
                          <EnhanceContentButton
                            content={rule}
                            contentType="rules"
                            onEnhanced={(enhanced) => updateRule(index, enhanced)}
                            context={{
                              name: formData.name,
                              category: formData.category,
                            }}
                            size="icon"
                            className="flex-shrink-0"
                          >
                            <Sparkles className="h-4 w-4" />
                          </EnhanceContentButton>
                        )}
                        {formData.rules.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeRule(index)}
                            className="border-gray-200 hover:border-violet-300 hover:bg-violet-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRule}
                    className="border-gray-200 hover:border-violet-300 hover:bg-violet-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review & Create */}
          {currentStep === 4 && (
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-gray-900">Review & Create</CardTitle>
                <p className="text-gray-600">Review your community details before creating</p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm text-gray-500">Community Name</Label>
                      <p className="font-medium text-gray-900">{formData.name || "Not specified"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Category</Label>
                      <p className="font-medium text-gray-900">{formData.category || "Not specified"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Meeting Type</Label>
                      <p className="font-medium text-gray-900 capitalize">{formData.locationType}</p>
                    </div>
                    {formData.location && (
                      <div>
                        <Label className="text-sm text-gray-500">Location</Label>
                        <p className="font-medium text-gray-900">{formData.location}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm text-gray-500">Privacy</Label>
                      <p className="font-medium text-gray-900 capitalize">{formData.privacy}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.length > 0 ? (
                          formData.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs border-gray-200 text-gray-600">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-gray-500">No tags added</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Description</Label>
                  <p className="mt-2 text-gray-900 leading-relaxed">
                    {formData.description || "No description provided"}
                  </p>
                </div>

                {formData.rules.some((rule) => rule.trim()) && (
                  <div>
                    <Label className="text-sm text-gray-500">Community Rules</Label>
                    <ul className="mt-2 space-y-2">
                      {formData.rules
                        .filter((rule) => rule.trim())
                        .map((rule, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="text-violet-700 font-medium">{index + 1}.</span>
                            <span className="text-gray-900">{rule}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Checkbox id="terms" required className="text-violet-700 border-gray-300 focus:ring-violet-200" />
                  <Label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{" "}
                    <Link href="/terms" className="text-violet-700 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/community-guidelines" className="text-violet-700 hover:underline">
                      Community Guidelines
                    </Link>
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="border-gray-200 hover:border-violet-300 hover:bg-violet-50"
            >
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                disabled={
                  (currentStep === 1 && (!formData.name || !formData.description || !formData.category)) ||
                  (currentStep === 2 && (!formData.locationType || !formData.privacy))
                }
                className="bg-violet-700 hover:bg-violet-800 text-white"
              >
                Next
              </Button>
            ) : (
              <Button type="submit" className="bg-violet-700 hover:bg-violet-800 text-white">
                Create Community
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
