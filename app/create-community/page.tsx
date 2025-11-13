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
import {
  Users,
  Globe,
  Wand2,
  Sparkles,
  RefreshCw,
  Copy,
  Lightbulb,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import { EnhanceContentButton } from "@/components/ai/enhance-content-button"
import { LocationPicker } from "@/components/ui/location-picker"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface LocationData {
  address: string
  lat: number | null
  lng: number | null
  city?: string
  country?: string
}

export default function CreateCommunityPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    location: null as LocationData | null,
    locationType: "physical" as "physical" | "online" | "hybrid",
    privacy: "public" as "public" | "private",
    profileImage: null as File | null,
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
            location: formData.location?.address || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    // Validation
    if (!formData.name || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.locationType !== "online" && !formData.location?.address) {
      toast.error("Please select a location")
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      
      // Prepare location - can be string or JSON with coordinates
      let locationValue: string
      if (formData.locationType === "online") {
        locationValue = formData.location?.address || "Online"
      } else if (formData.location?.lat && formData.location?.lng) {
        // Store as JSON with coordinates for better location handling
        locationValue = JSON.stringify({
          address: formData.location.address,
          lat: formData.location.lat,
          lng: formData.location.lng,
          city: formData.location.city,
          country: formData.location.country,
        })
      } else {
        locationValue = formData.location?.address || ""
      }

      formDataToSend.append("location", locationValue)
      formDataToSend.append("interests", JSON.stringify([formData.category]))
      formDataToSend.append("name", formData.name)
      formDataToSend.append("description", formData.description)
      
      if (formData.profileImage) {
        formDataToSend.append("profileImage", formData.profileImage)
      }

      const response = await fetch("/api/communities/create", {
        method: "POST",
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create community")
      }

      toast.success("Community created successfully!")
      
      // Redirect to community admin dashboard
      setTimeout(() => {
        router.push(`/community-admin?community=${data.communityId}`)
      }, 1000)
    } catch (error: any) {
      console.error("Error creating community:", error)
      toast.error(error.message || "Failed to create community. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: "Basic Information", description: "Name, description, and category" },
    { number: 2, title: "Location & Privacy", description: "Where and how your community meets" },
    { number: 3, title: "Review & Create", description: "Final review before creating" },
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

                <div className="space-y-3">
                  <Label className="text-gray-700">
                    Location {formData.locationType !== "online" && "*"}
                  </Label>
                  <LocationPicker
                    value={formData.location || undefined}
                    onChange={(location) => handleInputChange("location", location)}
                    locationType={formData.locationType}
                    required={formData.locationType !== "online"}
                  />
                </div>

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

          {/* Step 3: Review & Create */}
          {currentStep === 3 && (
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
                    {formData.location?.address && (
                      <div>
                        <Label className="text-sm text-gray-500">Location</Label>
                        <p className="font-medium text-gray-900">{formData.location.address}</p>
                        {formData.location.city && (
                          <p className="text-sm text-gray-600">{formData.location.city}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm text-gray-500">Privacy</Label>
                      <p className="font-medium text-gray-900 capitalize">{formData.privacy}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Description</Label>
                  <p className="mt-2 text-gray-900 leading-relaxed">
                    {formData.description || "No description provided"}
                  </p>
                </div>

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

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                disabled={
                  (currentStep === 1 && (!formData.name || !formData.description || !formData.category)) ||
                  (currentStep === 2 && (!formData.locationType || !formData.privacy || (formData.locationType !== "online" && !formData.location?.address)))
                }
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
                  "Create Community"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
