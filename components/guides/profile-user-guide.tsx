"use client"

import React from "react"

import { useState } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Edit3, Save, LogOut, CheckCircle, ArrowRight, Info } from "lucide-react"

const steps = [
  {
    title: "Access Your Profile",
    description: "Click on your profile avatar in the top-right corner of the navigation bar",
    icon: User,
    details: [
      "Look for your profile picture or initials in the navigation bar",
      "Click on the avatar to open the dropdown menu",
      "Select 'View Profile' from the dropdown options",
    ],
  },
  {
    title: "View Profile Information",
    description: "Your profile page displays all your account information",
    icon: Info,
    details: [
      "See your profile picture, name, and email",
      "View your community statistics and activity",
      "Check your recent activity and achievements",
    ],
  },
  {
    title: "Edit Your Profile",
    description: "Update your personal information and preferences",
    icon: Edit3,
    details: [
      "Click the 'Edit Profile' button on your profile page",
      "Update your full name, username, bio, location, and website",
      "Upload a new profile picture by clicking the camera icon",
    ],
  },
  {
    title: "Save Your Changes",
    description: "Confirm and save your profile updates",
    icon: Save,
    details: [
      "Review your changes before saving",
      "Click 'Save Changes' to update your profile",
      "You'll see a confirmation message when changes are saved",
    ],
  },
  {
    title: "Sign Out Safely",
    description: "Log out of your account securely",
    icon: LogOut,
    details: [
      "Click on your profile avatar in the navigation",
      "Select 'Sign Out' from the dropdown menu",
      "Confirm the sign out action when prompted",
      "You'll be redirected to the home page",
    ],
  },
]

export function ProfileUserGuide() {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AnimatedCard variant="glass" className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Management Guide</h2>
          <p className="text-gray-600">Learn how to manage your profile and account settings</p>
        </div>

        {/* Step Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {steps.map((step, index) => (
            <AnimatedButton
              key={index}
              variant={currentStep === index ? "gradient" : "glass"}
              size="sm"
              onClick={() => setCurrentStep(index)}
              className="flex items-center space-x-2"
            >
              <step.icon className="h-4 w-4" />
              <span className="hidden sm:inline">Step {index + 1}</span>
            </AnimatedButton>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              {React.createElement(steps[currentStep].icon, {
                className: "h-6 w-6 text-purple-600",
              })}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{steps[currentStep].title}</h3>
              <p className="text-gray-600">{steps[currentStep].description}</p>
            </div>
            <Badge className="bg-purple-100 text-purple-700">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Detailed Instructions:</h4>
            <ul className="space-y-2">
              {steps[currentStep].details.map((detail, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <AnimatedButton
              variant="glass"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </AnimatedButton>

            <AnimatedButton
              variant="gradient"
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </AnimatedButton>
          </div>
        </div>
      </AnimatedCard>

      {/* Quick Tips */}
      <AnimatedCard variant="glass" className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Profile Picture</h4>
            <p className="text-sm text-blue-800">
              Upload a clear, professional photo for better recognition in communities.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Complete Your Bio</h4>
            <p className="text-sm text-green-800">
              A complete bio helps others understand your interests and expertise.
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-900 mb-2">Privacy Settings</h4>
            <p className="text-sm text-purple-800">
              Visit the Settings page to control who can see your profile information.
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-medium text-orange-900 mb-2">Stay Active</h4>
            <p className="text-sm text-orange-800">
              Regular activity helps you build connections and earn community badges.
            </p>
          </div>
        </div>
      </AnimatedCard>
    </div>
  )
}
