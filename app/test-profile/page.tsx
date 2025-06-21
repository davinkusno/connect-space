"use client"

import { ProfileFunctionalityTest } from "@/components/testing/profile-functionality-test"
import { PageTransition } from "@/components/ui/page-transition"
import { FloatingElements } from "@/components/ui/floating-elements"

export default function TestProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />

      <PageTransition>
        <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile Functionality Testing</h1>
            <p className="text-xl text-gray-600">Verify all profile and navigation features are working correctly</p>
          </div>

          <ProfileFunctionalityTest />
        </div>
      </PageTransition>
    </div>
  )
}
