"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Mail,
  Bell,
  Target,
  Users,
  Calendar,
  MessageCircle,
  TrendingUp,
  Award,
  Lightbulb,
  X,
} from "lucide-react"
import type { SummaryPreferences } from "@/lib/ai-services/daily-summary-service"

interface SummaryPreferencesDialogProps {
  isOpen: boolean
  onClose: () => void
  preferences: SummaryPreferences
  onSave: (preferences: SummaryPreferences) => void
}

export function SummaryPreferencesDialog({ isOpen, onClose, preferences, onSave }: SummaryPreferencesDialogProps) {
  const [localPreferences, setLocalPreferences] = useState<SummaryPreferences>(preferences)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setLocalPreferences(preferences)
  }, [preferences])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(localPreferences)
      onClose()
    } catch (error) {
      console.error("Error saving preferences:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const updatePreferences = (updates: Partial<SummaryPreferences>) => {
    setLocalPreferences((prev) => ({ ...prev, ...updates }))
  }

  const toggleFocusArea = (area: string) => {
    const currentAreas = localPreferences.focusAreas
    const newAreas = currentAreas.includes(area) ? currentAreas.filter((a) => a !== area) : [...currentAreas, area]
    updatePreferences({ focusAreas: newAreas })
  }

  const focusAreaOptions = [
    { id: "communities", label: "Communities", icon: Users, color: "bg-blue-100 text-blue-800" },
    { id: "events", label: "Events", icon: Calendar, color: "bg-green-100 text-green-800" },
    { id: "messages", label: "Messages", icon: MessageCircle, color: "bg-purple-100 text-purple-800" },
    { id: "networking", label: "Networking", icon: Users, color: "bg-pink-100 text-pink-800" },
    { id: "achievements", label: "Achievements", icon: Award, color: "bg-yellow-100 text-yellow-800" },
    { id: "goals", label: "Goals", icon: Target, color: "bg-indigo-100 text-indigo-800" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            Daily Summary Preferences
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="focus">Focus Areas</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="metrics">Key Metrics</Label>
                    </div>
                    <Switch
                      id="metrics"
                      checked={localPreferences.includeMetrics}
                      onCheckedChange={(checked) => updatePreferences({ includeMetrics: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <Label htmlFor="trends">Trends & Insights</Label>
                    </div>
                    <Switch
                      id="trends"
                      checked={localPreferences.includeTrends}
                      onCheckedChange={(checked) => updatePreferences({ includeTrends: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4 text-orange-600" />
                      <Label htmlFor="recommendations">Recommendations</Label>
                    </div>
                    <Switch
                      id="recommendations"
                      checked={localPreferences.includeRecommendations}
                      onCheckedChange={(checked) => updatePreferences({ includeRecommendations: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <Label htmlFor="goals">Goals & Progress</Label>
                    </div>
                    <Switch
                      id="goals"
                      checked={localPreferences.includeGoals}
                      onCheckedChange={(checked) => updatePreferences({ includeGoals: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-yellow-600" />
                      <Label htmlFor="achievements">Achievements</Label>
                    </div>
                    <Switch
                      id="achievements"
                      checked={localPreferences.includeAchievements}
                      onCheckedChange={(checked) => updatePreferences({ includeAchievements: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="upcoming">Upcoming Events</Label>
                    </div>
                    <Switch
                      id="upcoming"
                      checked={localPreferences.includeUpcoming}
                      onCheckedChange={(checked) => updatePreferences({ includeUpcoming: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={localPreferences.frequency}
                    onValueChange={(value: "daily" | "weekly" | "monthly") => updatePreferences({ frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notification Time</Label>
                  <Input
                    type="time"
                    value={localPreferences.notificationTime}
                    onChange={(e) => updatePreferences({ notificationTime: e.target.value })}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Delivery Methods</h4>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="push">Push Notifications</Label>
                    </div>
                    <Switch
                      id="push"
                      checked={localPreferences.pushNotification}
                      onCheckedChange={(checked) => updatePreferences({ pushNotification: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      <Label htmlFor="email">Email Delivery</Label>
                    </div>
                    <Switch
                      id="email"
                      checked={localPreferences.emailDelivery}
                      onCheckedChange={(checked) => updatePreferences({ emailDelivery: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="style" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Style & Tone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select
                    value={localPreferences.tone}
                    onValueChange={(value: "professional" | "casual" | "enthusiastic" | "motivational") =>
                      updatePreferences({ tone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="motivational">Motivational</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">
                    {localPreferences.tone === "professional" && "Formal, business-like communication"}
                    {localPreferences.tone === "casual" && "Friendly, conversational style"}
                    {localPreferences.tone === "enthusiastic" && "Upbeat, energetic language"}
                    {localPreferences.tone === "motivational" && "Inspiring, encouraging tone"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Length</Label>
                  <Select
                    value={localPreferences.length}
                    onValueChange={(value: "brief" | "detailed" | "comprehensive") =>
                      updatePreferences({ length: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brief">Brief</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">
                    {localPreferences.length === "brief" && "Concise, key points only"}
                    {localPreferences.length === "detailed" && "Moderate detail with explanations"}
                    {localPreferences.length === "comprehensive" && "In-depth analysis and context"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="focus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Focus Areas</CardTitle>
                <p className="text-sm text-gray-600">Select the areas you want to prioritize in your daily summary</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {focusAreaOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = localPreferences.focusAreas.includes(option.id)

                    return (
                      <div
                        key={option.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => toggleFocusArea(option.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${option.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{option.label}</span>
                              <Checkbox checked={isSelected} onChange={() => toggleFocusArea(option.id)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6">
                  <Label className="text-sm font-medium">Selected Focus Areas:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {localPreferences.focusAreas.map((area) => {
                      const option = focusAreaOptions.find((opt) => opt.id === area)
                      if (!option) return null

                      return (
                        <Badge key={area} variant="secondary" className="flex items-center gap-1">
                          {option.label}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-600"
                            onClick={() => toggleFocusArea(area)}
                          />
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
