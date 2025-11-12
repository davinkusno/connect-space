"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Brain, Users, TrendingUp, Target, Zap, Clock, CheckCircle, AlertCircle, Info } from "lucide-react"

interface RecommendationAnalysisProps {
  analysisData: {
    algorithmPerformance: Array<{
      name: string
      accuracy: number
      coverage: number
      diversity: number
      speed: number
      strengths: string[]
      weaknesses: string[]
      complexity: "Low" | "Medium" | "High"
      implementation: string
    }>
    userEngagement: {
      clickThroughRate: number
      joinRate: number
      satisfactionScore: number
      diversityIndex: number
    }
    systemMetrics: {
      processingTime: number
      memoryUsage: number
      scalability: number
      accuracy: number
    }
  }
}

export function RecommendationAnalysis({ analysisData }: RecommendationAnalysisProps) {
  const algorithmColors = {
    "Collaborative Filtering": "#8B5CF6",
    "Content-Based": "#06B6D4",
    "Popularity-Based": "#F59E0B",
    "Hybrid Approach": "#10B981",
    "Activity-Based": "#EF4444",
    "Location-Based": "#8B5A2B",
  }

  const complexityColors = {
    Low: "#10B981",
    Medium: "#F59E0B",
    High: "#EF4444",
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Click-Through Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(analysisData.userEngagement.clickThroughRate * 100).toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={analysisData.userEngagement.clickThroughRate * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Join Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(analysisData.userEngagement.joinRate * 100).toFixed(1)}%
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={analysisData.userEngagement.joinRate * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analysisData.userEngagement.satisfactionScore.toFixed(1)}/5
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={(analysisData.userEngagement.satisfactionScore / 5) * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing Time</p>
                <p className="text-3xl font-bold text-gray-900">{analysisData.systemMetrics.processingTime}ms</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-3 flex items-center text-sm text-gray-600">
              <Zap className="h-4 w-4 mr-1" />
              Real-time performance
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="algorithms" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="algorithms">Algorithm Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="comparison">Method Comparison</TabsTrigger>
          <TabsTrigger value="implementation">Implementation Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="algorithms" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Algorithm Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Algorithm Performance Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analysisData.algorithmPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#8B5CF6" name="Accuracy" />
                    <Bar dataKey="coverage" fill="#06B6D4" name="Coverage" />
                    <Bar dataKey="diversity" fill="#10B981" name="Diversity" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Algorithm Details */}
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisData.algorithmPerformance.map((algorithm, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{algorithm.name}</h4>
                      <Badge
                        variant="outline"
                        className={`border-2 ${
                          algorithm.complexity === "Low"
                            ? "border-green-200 text-green-700"
                            : algorithm.complexity === "Medium"
                              ? "border-yellow-200 text-yellow-700"
                              : "border-red-200 text-red-700"
                        }`}
                      >
                        {algorithm.complexity} Complexity
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">Accuracy</p>
                        <Progress value={algorithm.accuracy} className="h-2" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Speed</p>
                        <Progress value={algorithm.speed} className="h-2" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Strengths</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {algorithm.strengths.map((strength, i) => (
                              <li key={i}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Weaknesses</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {algorithm.weaknesses.map((weakness, i) => (
                              <li key={i}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Processing Speed</span>
                      <span>{analysisData.systemMetrics.processingTime}ms</span>
                    </div>
                    <Progress
                      value={Math.min(100, (1000 - analysisData.systemMetrics.processingTime) / 10)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Memory Usage</span>
                      <span>{analysisData.systemMetrics.memoryUsage}MB</span>
                    </div>
                    <Progress value={100 - analysisData.systemMetrics.memoryUsage} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Scalability Score</span>
                      <span>{analysisData.systemMetrics.scalability}/100</span>
                    </div>
                    <Progress value={analysisData.systemMetrics.scalability} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Accuracy</span>
                      <span>{analysisData.systemMetrics.accuracy}%</span>
                    </div>
                    <Progress value={analysisData.systemMetrics.accuracy} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Engagement Trends */}
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { month: "Jan", ctr: 12, joinRate: 8, satisfaction: 4.2 },
                      { month: "Feb", ctr: 15, joinRate: 10, satisfaction: 4.3 },
                      { month: "Mar", ctr: 18, joinRate: 12, satisfaction: 4.4 },
                      { month: "Apr", ctr: 22, joinRate: 15, satisfaction: 4.5 },
                      { month: "May", ctr: 25, joinRate: 18, satisfaction: 4.6 },
                      { month: "Jun", ctr: 28, joinRate: 20, satisfaction: 4.7 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="ctr" stroke="#8B5CF6" name="Click-Through Rate %" />
                    <Line type="monotone" dataKey="joinRate" stroke="#06B6D4" name="Join Rate %" />
                    <Line type="monotone" dataKey="satisfaction" stroke="#10B981" name="Satisfaction Score" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Method Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-3 text-left font-semibold">Method</th>
                      <th className="border border-gray-200 p-3 text-center">Accuracy</th>
                      <th className="border border-gray-200 p-3 text-center">Speed</th>
                      <th className="border border-gray-200 p-3 text-center">Scalability</th>
                      <th className="border border-gray-200 p-3 text-center">Cold Start</th>
                      <th className="border border-gray-200 p-3 text-center">Diversity</th>
                      <th className="border border-gray-200 p-3 text-center">Complexity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.algorithmPerformance.map((algorithm, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-3 font-medium">{algorithm.name}</td>
                        <td className="border border-gray-200 p-3 text-center">
                          <div className="flex items-center justify-center">
                            <Progress value={algorithm.accuracy} className="w-16 h-2 mr-2" />
                            <span className="text-sm">{algorithm.accuracy}%</span>
                          </div>
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          <div className="flex items-center justify-center">
                            <Progress value={algorithm.speed} className="w-16 h-2 mr-2" />
                            <span className="text-sm">{algorithm.speed}%</span>
                          </div>
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          <Badge
                            variant={
                              algorithm.coverage > 80
                                ? "default"
                                : algorithm.coverage > 60
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {algorithm.coverage > 80 ? "High" : algorithm.coverage > 60 ? "Medium" : "Low"}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          <Badge
                            variant={
                              algorithm.name.includes("Content") || algorithm.name.includes("Popularity")
                                ? "default"
                                : "destructive"
                            }
                          >
                            {algorithm.name.includes("Content") || algorithm.name.includes("Popularity")
                              ? "Good"
                              : "Poor"}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          <div className="flex items-center justify-center">
                            <Progress value={algorithm.diversity} className="w-16 h-2 mr-2" />
                            <span className="text-sm">{algorithm.diversity}%</span>
                          </div>
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          <Badge
                            variant="outline"
                            className={`${
                              algorithm.complexity === "Low"
                                ? "border-green-200 text-green-700"
                                : algorithm.complexity === "Medium"
                                  ? "border-yellow-200 text-yellow-700"
                                  : "border-red-200 text-red-700"
                            }`}
                          >
                            {algorithm.complexity}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recommendation Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommended Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Hybrid Approach (Recommended)</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Combine multiple algorithms for optimal performance across different user scenarios.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded p-3">
                      <h5 className="font-medium text-gray-900 mb-1">New Users</h5>
                      <p className="text-xs text-gray-600">Content-Based (60%) + Popularity (40%)</p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <h5 className="font-medium text-gray-900 mb-1">Active Users</h5>
                      <p className="text-xs text-gray-600">
                        Collaborative (50%) + Content-Based (30%) + Popularity (20%)
                      </p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <h5 className="font-medium text-gray-900 mb-1">Power Users</h5>
                      <p className="text-xs text-gray-600">Collaborative (70%) + Content-Based (30%)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Benefits
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Handles cold start problem effectively</li>
                      <li>• Provides diverse recommendations</li>
                      <li>• Adapts to user behavior over time</li>
                      <li>• Maintains high accuracy across user types</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      Implementation Notes
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Requires robust data pipeline</li>
                      <li>• Needs A/B testing framework</li>
                      <li>• Monitor algorithm weights dynamically</li>
                      <li>• Implement fallback mechanisms</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Implementation Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Data Collection & Preprocessing</h4>
                      <p className="text-sm text-gray-600">
                        Set up user interaction tracking, community metadata collection, and data cleaning pipelines.
                      </p>
                      <Badge variant="outline" className="mt-1">
                        2-3 weeks
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Content-Based Algorithm</h4>
                      <p className="text-sm text-gray-600">
                        Implement content-based filtering as the foundation. Works well for new users.
                      </p>
                      <Badge variant="outline" className="mt-1">
                        1-2 weeks
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Popularity-Based System</h4>
                      <p className="text-sm text-gray-600">
                        Add trending and popular community recommendations for diversity.
                      </p>
                      <Badge variant="outline" className="mt-1">
                        1 week
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Collaborative Filtering</h4>
                      <p className="text-sm text-gray-600">
                        Implement user-based and item-based collaborative filtering for personalization.
                      </p>
                      <Badge variant="outline" className="mt-1">
                        2-3 weeks
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      5
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Hybrid Integration</h4>
                      <p className="text-sm text-gray-600">
                        Combine algorithms with weighted scoring and implement A/B testing.
                      </p>
                      <Badge variant="outline" className="mt-1">
                        2 weeks
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      6
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Optimization & Monitoring</h4>
                      <p className="text-sm text-gray-600">
                        Performance tuning, real-time monitoring, and continuous improvement.
                      </p>
                      <Badge variant="outline" className="mt-1">
                        Ongoing
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Infrastructure</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Redis for caching recommendations</li>
                      <li>• PostgreSQL for user/community data</li>
                      <li>• Background job processing (Celery/Bull)</li>
                      <li>• Real-time analytics pipeline</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Machine Learning</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Scikit-learn for basic algorithms</li>
                      <li>• TensorFlow/PyTorch for deep learning</li>
                      <li>• Feature engineering pipeline</li>
                      <li>• Model versioning and deployment</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Monitoring</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Click-through rate tracking</li>
                      <li>• A/B testing framework</li>
                      <li>• Performance metrics dashboard</li>
                      <li>• User feedback collection</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Scalability</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Horizontal scaling for computation</li>
                      <li>• CDN for recommendation caching</li>
                      <li>• Load balancing for API endpoints</li>
                      <li>• Database sharding strategy</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
