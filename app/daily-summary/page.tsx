"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DailySummaryWidget } from "@/components/daily-summary/daily-summary-widget"
import { Star, Calendar, TrendingUp, Settings, Download, Share, Archive, Filter } from "lucide-react"

export default function DailySummaryPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("today")
  const [viewMode, setViewMode] = useState("detailed")

  const summaryHistory = [
    {
      date: "2024-01-15",
      title: "Productive Monday - Great Community Engagement!",
      highlights: 3,
      achievements: 1,
      readStatus: "read",
    },
    {
      date: "2024-01-14",
      title: "Weekend Wrap-up - Event Success!",
      highlights: 5,
      achievements: 2,
      readStatus: "unread",
    },
    {
      date: "2024-01-13",
      title: "Friday Focus - Network Growth",
      highlights: 2,
      achievements: 0,
      readStatus: "read",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Daily Summary</h1>
                <p className="text-gray-600">AI-powered insights into your community activity</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-auto grid-cols-4">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "compact" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("compact")}
              >
                Compact
              </Button>
              <Button
                variant={viewMode === "detailed" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("detailed")}
              >
                Detailed
              </Button>
            </div>
          </div>

          <TabsContent value="today" className="space-y-6">
            <DailySummaryWidget userId="current-user" compact={viewMode === "compact"} className="w-full" />
          </TabsContent>

          <TabsContent value="week" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Weekly Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Weekly summaries coming soon!</p>
                  <p className="text-sm text-gray-500">
                    Get comprehensive weekly insights into your community engagement patterns.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Monthly Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Monthly summaries coming soon!</p>
                  <p className="text-sm text-gray-500">
                    Discover long-term trends and achievements in your community journey.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-purple-600" />
                    Summary History
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summaryHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Star className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                            <span>{item.highlights} highlights</span>
                            {item.achievements > 0 && <span>{item.achievements} achievements</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={item.readStatus === "read" ? "secondary" : "default"} className="text-xs">
                          {item.readStatus}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
