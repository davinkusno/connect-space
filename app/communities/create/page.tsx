"use client"

import { EnhanceContentButton } from "@/components/ai/enhance-content-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/components/ui/page-transition"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SmoothReveal } from "@/components/ui/smooth-reveal"
import { Textarea } from "@/components/ui/textarea"
import {
    ImageIcon,
    RefreshCw, Users,
    X
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

  const [isSubmitting, setIsSubmitting] = useState(false)

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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    // Validation
    if (!formData.name || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields")
      return
    }

    // Validate profile picture is required
    if (!formData.profileImage) {
      toast.error("Profile picture is required to create a community")
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
      
      // Profile picture is now mandatory
      if (!formData.profileImage) {
        toast.error("Profile picture is required")
        setIsSubmitting(false)
        return
      }
      
      formDataToSend.append("profileImage", formData.profileImage)

      const response = await fetch("/api/communities/create", {
        method: "POST",
        body: formDataToSend,
      })

      // Try to parse JSON response
      let data: any;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        // Extract error message from different possible formats
        let errorMessage = "Failed to create community";
        
        if (data.error) {
          if (typeof data.error === "string") {
            errorMessage = data.error;
          } else if (data.error.message) {
            errorMessage = data.error.message;
          } else if (typeof data.error === "object") {
            errorMessage = JSON.stringify(data.error);
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        throw new Error(errorMessage);
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
      
      // Extract error message properly
      let errorMessage = "Failed to create community. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage)
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
                <CardTitle className="text-xl font-medium text-gray-900">
                  Basic Information
                </CardTitle>
                <p className="text-gray-600">
                  Tell us about your community
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-gray-700">
                    Community Name *
                  </Label>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </SmoothReveal>

          {/* Profile Picture Upload */}
          <SmoothReveal delay={300} direction="up">
            <Card className="border-gray-200/50 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-2">
                  Profile Picture *
                </CardTitle>
                <p className="text-gray-600">
                  Upload a profile picture for your community (required)
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                    {formData.profileImage ? (
                      <AvatarImage 
                        src={URL.createObjectURL(formData.profileImage)} 
                        alt="Community preview" 
                      />
                    ) : (
                      <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        {formData.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleInputChange("profileImage", file);
                    }}
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300"
                      onClick={() => document.getElementById("profile-upload")?.click()}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {formData.profileImage ? "Change Picture" : "Choose Picture"}
                    </Button>
                    {formData.profileImage && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        onClick={() => handleInputChange("profileImage", null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    PNG/JPG, recommended 400x400px, max 2MB
                  </p>
                </div>
              </CardContent>
            </Card>
          </SmoothReveal>

          {/* Navigation Buttons */}
          <SmoothReveal delay={400} direction="up">
            <div className="flex justify-end mt-12">
              <Button 
                type="submit" 
                className="bg-violet-700 hover:bg-violet-800 text-white"
                disabled={isSubmitting || !formData.name || !formData.description || !formData.category || !formData.profileImage}
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
