import { FloatingElements } from "@/components/ui/floating-elements"

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <div className="animate-pulse space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>

          {/* Profile Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2 text-center">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center space-y-1">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-8 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-gray-200"></div>

                  <div className="space-y-4">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-8 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
