import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function EventDetailsLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section Skeleton */}
      <div className="relative h-[40vh] md:h-[50vh] lg:h-[60vh] bg-gray-200 animate-pulse">
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-6 w-24 mb-3" />
            <Skeleton className="h-10 w-3/4 mb-2" />
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Action Buttons Skeleton */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-24" />
            </div>

            {/* Tabs Skeleton */}
            <div className="mb-6">
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Content Skeleton */}
            <div className="space-y-8">
              <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>

              <div>
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>

              <div>
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-[300px] w-full rounded-lg" />
              </div>

              <div>
                <Skeleton className="h-6 w-32 mb-3" />
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Event Summary Card Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-36" />
                      <div className="flex -space-x-2 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-8 w-8 rounded-full border-2 border-white" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-gray-200 my-6" />

                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>

            {/* Sponsors Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-6">
                  <div>
                    <Skeleton className="h-4 w-24 mb-3" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col items-center">
                        <Skeleton className="h-12 w-full mb-2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex flex-col items-center">
                        <Skeleton className="h-12 w-full mb-2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Events Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-16 h-16 rounded-md" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
