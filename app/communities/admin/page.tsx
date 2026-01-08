"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FloatingElements } from "@/components/ui/floating-elements"
import { PageTransition } from "@/components/ui/page-transition"
import { Building2, Users, Calendar, MessageSquare, Shield } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

interface Community {
  id: string
  name: string
  description?: string
  logo_url?: string
  location?: string
  member_count?: number
  role: "creator" | "admin"
}

export default function CommunityAdminSelectorPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadCommunities()
  }, [])

  const loadCommunities = async () => {
    try {
      setIsLoading(true)
      
      // Use API endpoint instead of direct Supabase query
      const response = await fetch("/api/communities/admin-list")
      
      if (!response.ok) {
        console.error("Failed to fetch admin communities")
        setIsLoading(false)
        return
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        console.error("Invalid response from admin-list API")
        setIsLoading(false)
        return
      }

      // Transform the data to match the Community interface
      const transformedCommunities: Community[] = result.data.map((community: any) => ({
        id: community.id,
        name: community.name,
        description: community.description || "",
        logo_url: community.logo_url,
        location: community.location,
        member_count: community.member_count || 0,
        role: community.role
      }))

      setCommunities(transformedCommunities)
      setIsLoading(false)
    } catch (error) {
      console.error("Error loading communities:", error)
      setIsLoading(false)
    }
  }

  const handleCommunityClick = (communityId: string) => {
    router.push(`/communities/${communityId}/admin`)
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
          <FloatingElements />
          <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
            <div className="mb-8">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-6 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (communities.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
          <FloatingElements />
          <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Communities Found</h2>
              <p className="text-muted-foreground mb-6">
                You don't have any communities to manage yet.
              </p>
              <Button onClick={() => router.push("/communities")}>
                Explore Communities
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
        <FloatingElements />
        <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Community Management</h1>
            <p className="text-muted-foreground">
              Select a community to manage its settings, members, and content
            </p>
          </div>

          {/* Community Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Card
                key={community.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleCommunityClick(community.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{community.name}</CardTitle>
                      <Badge
                        variant={community.role === "creator" ? "default" : "secondary"}
                        className="mb-2"
                      >
                        {community.role === "creator" ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Creator
                          </>
                        ) : (
                          "Admin"
                        )}
                      </Badge>
                    </div>
                    {community.logo_url && (
                      <img
                        src={community.logo_url}
                        alt={community.name}
                        className="w-16 h-16 rounded-lg object-cover ml-4"
                      />
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {community.description || "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{community.member_count || 0} members</span>
                    </div>
                    {community.location && (
                      <div className="flex items-center text-sm text-muted-foreground line-clamp-1">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span className="truncate">
                          {typeof community.location === "string"
                            ? JSON.parse(community.location).city || community.location
                            : community.location}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button className="w-full mt-4" variant="outline">
                    Manage Community
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Summary */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Communities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{communities.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  As Creator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {communities.filter((c) => c.role === "creator").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {communities.reduce((sum, c) => sum + (c.member_count || 0), 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Create Event
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                View Discussions
              </Button>
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Manage Members
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
