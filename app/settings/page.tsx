"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Badge } from "@/components/ui/badge"
import { FloatingElements } from "@/components/ui/floating-elements"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/components/ui/page-transition"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import {
    AlertTriangle, Bell, Calendar, Eye, Key, Mail,
    MessageSquare, Shield, Smartphone, Trash2, Users
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    marketing: boolean
    communityUpdates: boolean
    eventReminders: boolean
    messages: boolean
  }
  privacy: {
    profileVisibility: boolean
    showOnlineStatus: boolean
    allowMessages: boolean
    showActivity: boolean
  }
  security: {
    twoFactorEnabled: boolean
    loginAlerts: boolean
  }
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      marketing: false,
      communityUpdates: true,
      eventReminders: true,
      messages: true,
    },
    privacy: {
      profileVisibility: true,
      showOnlineStatus: true,
      allowMessages: true,
      showActivity: true,
    },
    security: {
      twoFactorEnabled: false,
      loginAlerts: true,
    },
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
      } catch (error) {
        console.error("Error getting user:", error)
        toast({
          title: "Error",
          description: "Failed to load user information.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [supabase.auth, router, toast])

  const handleSettingChange = (category: keyof UserSettings, setting: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }))
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Here you would typically save settings to your database
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Settings saved",
        description: "Your preferences have been successfully updated.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // Here you would implement account deletion logic
      toast({
        title: "Account deletion requested",
        description: "Your account deletion request has been submitted.",
      })
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-xl text-gray-600">Manage your account preferences and privacy settings</p>
          </div>

          <div className="space-y-8">
            {/* Notification Settings */}
            <AnimatedCard variant="glass" className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Notification Preferences</h3>
                  <p className="text-gray-600">Choose how you want to be notified about activity</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <Label htmlFor="email-notifications" className="text-sm font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-xs text-gray-500">Receive notifications via email</p>
                    </div>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => handleSettingChange("notifications", "email", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-4 w-4 text-gray-400" />
                    <div>
                      <Label htmlFor="push-notifications" className="text-sm font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-xs text-gray-500">Receive push notifications on your device</p>
                    </div>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => handleSettingChange("notifications", "push", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-gray-400" />
                    <div>
                      <Label htmlFor="community-updates" className="text-sm font-medium">
                        Community Updates
                      </Label>
                      <p className="text-xs text-gray-500">Get notified about community activity</p>
                    </div>
                  </div>
                  <Switch
                    id="community-updates"
                    checked={settings.notifications.communityUpdates}
                    onCheckedChange={(checked) => handleSettingChange("notifications", "communityUpdates", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <Label htmlFor="event-reminders" className="text-sm font-medium">
                        Event Reminders
                      </Label>
                      <p className="text-xs text-gray-500">Reminders for upcoming events</p>
                    </div>
                  </div>
                  <Switch
                    id="event-reminders"
                    checked={settings.notifications.eventReminders}
                    onCheckedChange={(checked) => handleSettingChange("notifications", "eventReminders", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <div>
                      <Label htmlFor="message-notifications" className="text-sm font-medium">
                        Direct Messages
                      </Label>
                      <p className="text-xs text-gray-500">Notifications for new messages</p>
                    </div>
                  </div>
                  <Switch
                    id="message-notifications"
                    checked={settings.notifications.messages}
                    onCheckedChange={(checked) => handleSettingChange("notifications", "messages", checked)}
                  />
                </div>
              </div>
            </AnimatedCard>

            {/* Privacy Settings */}
            <AnimatedCard variant="glass" className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Privacy Controls</h3>
                  <p className="text-gray-600">Control who can see your information and activity</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="profile-visibility" className="text-sm font-medium">
                      Public Profile
                    </Label>
                    <p className="text-xs text-gray-500">Make your profile visible to other users</p>
                  </div>
                  <Switch
                    id="profile-visibility"
                    checked={settings.privacy.profileVisibility}
                    onCheckedChange={(checked) => handleSettingChange("privacy", "profileVisibility", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="online-status" className="text-sm font-medium">
                      Show Online Status
                    </Label>
                    <p className="text-xs text-gray-500">Let others see when you're online</p>
                  </div>
                  <Switch
                    id="online-status"
                    checked={settings.privacy.showOnlineStatus}
                    onCheckedChange={(checked) => handleSettingChange("privacy", "showOnlineStatus", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-messages" className="text-sm font-medium">
                      Allow Direct Messages
                    </Label>
                    <p className="text-xs text-gray-500">Allow other users to send you messages</p>
                  </div>
                  <Switch
                    id="allow-messages"
                    checked={settings.privacy.allowMessages}
                    onCheckedChange={(checked) => handleSettingChange("privacy", "allowMessages", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-activity" className="text-sm font-medium">
                      Show Activity
                    </Label>
                    <p className="text-xs text-gray-500">Display your recent activity to others</p>
                  </div>
                  <Switch
                    id="show-activity"
                    checked={settings.privacy.showActivity}
                    onCheckedChange={(checked) => handleSettingChange("privacy", "showActivity", checked)}
                  />
                </div>
              </div>
            </AnimatedCard>

            {/* Security Settings */}
            <AnimatedCard variant="glass" className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Security & Authentication</h3>
                  <p className="text-gray-600">Manage your account security settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two-factor" className="text-sm font-medium">
                      Two-Factor Authentication
                    </Label>
                    <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {settings.security.twoFactorEnabled && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">Enabled</Badge>
                    )}
                    <Switch
                      id="two-factor"
                      checked={settings.security.twoFactorEnabled}
                      onCheckedChange={(checked) => handleSettingChange("security", "twoFactorEnabled", checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="login-alerts" className="text-sm font-medium">
                      Login Alerts
                    </Label>
                    <p className="text-xs text-gray-500">Get notified of new login attempts</p>
                  </div>
                  <Switch
                    id="login-alerts"
                    checked={settings.security.loginAlerts}
                    onCheckedChange={(checked) => handleSettingChange("security", "loginAlerts", checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <AnimatedButton variant="glass" className="w-full justify-start">
                    <Key className="h-4 w-4 mr-3" />
                    Change Password
                  </AnimatedButton>

                  <AnimatedButton variant="glass" className="w-full justify-start">
                    <Smartphone className="h-4 w-4 mr-3" />
                    Manage Connected Devices
                  </AnimatedButton>
                </div>
              </div>
            </AnimatedCard>

            {/* Save Settings */}
            <div className="flex justify-end">
              <AnimatedButton variant="gradient" onClick={handleSaveSettings} disabled={isSaving} className="px-8">
                {isSaving ? "Saving..." : "Save All Settings"}
              </AnimatedButton>
            </div>

            {/* Danger Zone */}
            <AnimatedCard variant="glass" className="p-6 border-red-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-red-900">Danger Zone</h3>
                  <p className="text-red-600">Irreversible and destructive actions</p>
                </div>
              </div>

              <div className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <AnimatedButton
                      variant="glass"
                      className="w-full justify-start text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      Delete Account
                    </AnimatedButton>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-900">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-red-700">
                        This action cannot be undone. This will permanently delete your account and remove all of your
                        data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </PageTransition>
    </div>
  )
}
