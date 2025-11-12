import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Heart } from "lucide-react"

export default function WishlistLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="w-8 h-8 text-pink-300" />
              <Skeleton className="h-10 w-48" />
            </div>
            <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
          </div>

          {/* Search and Filters Skeleton */}
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <Skeleton className="h-10 w-full max-w-md" />
            <div className="flex flex-wrap gap-2 items-center">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary Skeleton */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="container mx-auto px-4 pb-12">
        <Skeleton className="h-10 w-64 mb-6" />

        {/* Event Card Skeletons */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <Skeleton className="h-48 md:w-1/3" />
                <div className="p-6 md:w-2/3 space-y-4">
                  <div className="flex items-start justify-between mb-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-9 w-32" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
