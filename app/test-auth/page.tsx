import { AuthFunctionalityTest } from "@/components/testing/auth-functionality-test"

export default function TestAuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication System Testing</h1>
          <p className="text-gray-600">
            Comprehensive testing suite for navigation bar authentication features and OAuth integration.
          </p>
        </div>
        <AuthFunctionalityTest />
      </div>
    </div>
  )
}
