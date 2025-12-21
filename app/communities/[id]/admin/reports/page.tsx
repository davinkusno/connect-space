"use client"

import { Button } from "@/components/ui/button"
import { FloatingElements } from "@/components/ui/floating-elements"
import { PageTransition } from "@/components/ui/page-transition"
import { ReportsManagement } from "@/components/community/reports-management"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function CommunityReportsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [communityId, setCommunityId] = useState<string | null>(null)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setCommunityId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
        <FloatingElements />
        <div className="max-w-7xl mx-auto p-8 relative z-10">
          {/* Back Button */}
          <div className="mb-6">
            <Link href={communityId ? `/communities/${communityId}/admin` : "/communities/admin"}>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Dashboard
              </Button>
            </Link>
          </div>

          {/* Reports Management Component */}
          {communityId && <ReportsManagement communityId={communityId} />}
        </div>
      </div>
    </PageTransition>
  )
}

