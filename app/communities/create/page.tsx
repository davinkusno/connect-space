"use client"

import { EnhanceContentButton } from "@/components/ai/enhance-content-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/components/ui/page-transition"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SmoothReveal } from "@/components/ui/smooth-reveal"
import { Textarea } from "@/components/ui/textarea"
import {
    Copy,
    Lightbulb, RefreshCw, Sparkles, Users,
    Wand2
} from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { toast } from "sonner"

export default function CreateCommunityPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    profileImage: null as File | null,
  })

  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)

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

    // Validate description word count (max 500 words)
    const wordCount = formData.description.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 500) {
      toast.error(`Description must be 500 words or less. Current word count: ${wordCount}`)
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      
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
      
      // Redirect to community management page
      if (data.communityId) {
        setTimeout(() => {
          router.push(`/communities/${data.communityId}/admin`)
        }, 1000)
      } else {
        // Fallback to home if no communityId
        setTimeout(() => {
          router.push("/home")
        }, 1000)
      }
    } catch (error: any) {
      console.error("Error creating community:", error)
      toast.error(error.message || "Failed to create community. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <SmoothReveal delay={100} direction="up">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Create Your Community</h1>
                  <p className="text-gray-600 mt-1">Build a space where like-minded people can connect and grow together</p>
                </div>
              </div>
            </div>
          </SmoothReveal>

        <form onSubmit={handleSubmit}>
          {/* Basic Information with AI Integration */}
          <SmoothReveal delay={200} direction="up">
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
                    {(() => {
                      const wordCount = formData.description.trim().split(/\s+/).filter(word => word.length > 0).length;
                      const isOverLimit = wordCount > 500;
                      return (
                        <p className={`text-sm ${isOverLimit ? "text-red-500 font-medium" : "text-gray-500"}`}>
                          {wordCount}/500 words {isOverLimit && "(exceeds limit)"}
                        </p>
                      );
                    })()}
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
          </SmoothReveal>

          {/* Navigation Buttons */}
          <SmoothReveal delay={400} direction="up">
            <div className="flex justify-end mt-12">
              <Button 
                type="submit" 
                className="bg-violet-700 hover:bg-violet-800 text-white"
                disabled={isSubmitting || !formData.name || !formData.description || !formData.category}
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
            </div>
          </SmoothReveal>
        </form>
      </div>
    </div>
    </PageTransition>
  )
}
