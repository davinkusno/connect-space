import { Skeleton } from "@/components/ui/skeleton"
import { FloatingElements } from "@/components/ui/floating-elements"
import { ShoppingBag, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function BadgeManagementLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />

      {/* Navigation */}
      <nav className="glass-effect sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Link href="/superadmin">
                <div className="text-gray-600 hover:text-violet-700 flex items-center gap-2 px-3 py-2 rounded-md">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Admin</span>
                </div>
              </Link>
              <div className="text-2xl font-bold text-gradient flex items-center gap-2">
                <ShoppingBag className="w-8 h-8 text-purple-600" />
                Badge Management
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-10 w-36 rounded-md" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-10 w-64 rounded-md" />
          </div>
          <Skeleton className="h-6 w-96 rounded-md" />
        </div>

        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-[140px] rounded-md" />
              <Skeleton className="h-10 w-[140px] rounded-md" />
            </div>
          </div>

          {/* Tabs */}
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>

        {/* Badge List */}
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    </div>
  )
}