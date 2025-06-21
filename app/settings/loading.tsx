import { FloatingElements } from "@/components/ui/floating-elements"

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <div className="animate-pulse space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>

          {/* Settings Cards */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>

              <div className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="w-10 h-6 bg-gray-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Save Button */}
          <div className="flex justify-end">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
