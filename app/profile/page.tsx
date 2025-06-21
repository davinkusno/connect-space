"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { PageTransition } from "@/components/ui/page-transition"
import { FloatingElements } from "@/components/ui/floating-elements"
import { User, Mail, MapPin, Globe, Calendar, Edit3, Save, X, Camera, Users, MessageSquare, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    name?: string
    username?: string
    bio?: string
    location?: string
    website?: string
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    bio: "",
    location: "",
    website: "",
  })

  const router = useRouter()
  const supabase = getSupabaseBrowser()
  const { toast } = useToast()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          router.push("/auth/login")
          return
        }

        setUser(session.user)

        // Load user profile data from metadata
        const metadata = session.user.user_metadata || {}
        setFormData({
          fullName: metadata.full_name || metadata.name || "",
          username: metadata.username || session.user.email?.split("@")[0] || "",
          bio: metadata.bio || "",
          location: metadata.location || "",
          website: metadata.website || "",
        })
      } catch (error) {
        console.error("Error getting user:", error)
        toast({
          title: "Error",
          description: "Failed to load profile information.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [supabase.auth, router, toast])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Validate form data
      if (!formData.fullName.trim()) {
        toast({
          title: "Validation Error",
          description: "Full name is required.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      if (formData.website && !formData.website.startsWith("http")) {
        setFormData((prev) => ({ ...prev, website: `https://${prev.website}` }))
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
      })

      if (error) {
        throw error
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
          : null,
      )

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to original values
    if (user) {
      setFormData({
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || "",
        username: user.user_metadata?.username || user.email?.split("@")[0] || "",
        bio: user.user_metadata?.bio || "",
        location: user.user_metadata?.location || "",
        website: user.user_metadata?.website || "",
      })
    }
  }

  const getUserDisplayName = () => {
    if (!user) return "User"
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User"
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Here you would typically upload to Supabase Storage or another service
      // For now, we'll create a local URL for demonstration
      const imageUrl = URL.createObjectURL(file)

      // Update user avatar
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: imageUrl,
        },
      })

      if (error) throw error

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      })
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      toast({
        title: "Error",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
        <FloatingElements />
        <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />

      <PageTransition>
        <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-xl text-gray-600">Manage your account information and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <AnimatedCard variant="glass" className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="h-24 w-24 ring-4 ring-purple-100">
                    <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={getUserDisplayName()} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-2xl font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="profile-picture-upload" className="absolute bottom-0 right-0 cursor-pointer">
                    <AnimatedButton variant="glass" size="sm" className="rounded-full p-2" asChild>
                      <div>
                        <Camera className="h-4 w-4" />
                      </div>
                    </AnimatedButton>
                    <input
                      id="profile-picture-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-1">{getUserDisplayName()}</h2>
                <p className="text-gray-600 mb-4">{user.email}</p>

                <div className="flex justify-center space-x-2 mb-6">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">Community Member</Badge>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">Verified</Badge>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">12</div>
                    <div className="text-sm text-gray-600">Communities</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">48</div>
                    <div className="text-sm text-gray-600">Events</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">156</div>
                    <div className="text-sm text-gray-600">Posts</div>
                  </div>
                </div>
              </AnimatedCard>

              {/* Activity Summary */}
              <AnimatedCard variant="glass" className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Joined Tech Innovators</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Posted in Writers Circle</p>
                      <p className="text-xs text-gray-500">1 week ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Earned Community Helper badge</p>
                      <p className="text-xs text-gray-500">2 weeks ago</p>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-2">
              <AnimatedCard variant="glass" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
                  {!isEditing ? (
                    <AnimatedButton variant="glass" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </AnimatedButton>
                  ) : (
                    <div className="flex space-x-2">
                      <AnimatedButton variant="glass" size="sm" onClick={handleCancel} disabled={isSaving}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </AnimatedButton>
                      <AnimatedButton variant="gradient" size="sm" onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </AnimatedButton>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                          Full Name
                        </Label>
                        {isEditing ? (
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{formData.fullName || "Not provided"}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                          Username
                        </Label>
                        {isEditing ? (
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 flex items-center space-x-2">
                            <span className="text-gray-400">@</span>
                            <span className="text-gray-900">{formData.username || "Not provided"}</span>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email Address
                        </Label>
                        <div className="mt-1 flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{user.email}</span>
                          <Badge variant="outline" className="text-xs">
                            Verified
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Additional Information */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                          Bio
                        </Label>
                        {isEditing ? (
                          <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                            className="mt-1"
                            rows={3}
                          />
                        ) : (
                          <p className="mt-1 text-gray-900">{formData.bio || "No bio provided yet."}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                            Location
                          </Label>
                          {isEditing ? (
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                              placeholder="City, Country"
                              className="mt-1"
                            />
                          ) : (
                            <div className="mt-1 flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-900">{formData.location || "Not provided"}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                            Website
                          </Label>
                          {isEditing ? (
                            <Input
                              id="website"
                              value={formData.website}
                              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                              placeholder="https://yourwebsite.com"
                              className="mt-1"
                            />
                          ) : (
                            <div className="mt-1 flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-900">{formData.website || "Not provided"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Account Information */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Account Information</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Member since {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  )
}
