"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingElements } from "@/components/ui/floating-elements"
import { PageTransition } from "@/components/ui/page-transition"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import {
    LayoutDashboard, Loader2,
    Plus, Users
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Community {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  location: any
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
      const supabase = getSupabaseBrowser()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not found")
        setIsLoading(false)
        return
      }

      // Get all communities where user is creator
      const { data: createdCommunities, error: createdError } = await supabase
        .from("communities")
        .select("id, name, description, logo_url, banner_url, location")
        .eq("creator_id", user.id)

      // Get all communities where user is admin
      const { data: adminMemberships, error: adminError } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", user.id)
          .eq("role", "admin")
        .eq("status", true) // Only approved admins

      let adminCommunityIds: string[] = []
      if (adminMemberships && !adminError) {
        adminCommunityIds = adminMemberships.map(m => m.community_id)
      }

      const { data: adminCommunities, error: adminCommunitiesError } = adminCommunityIds.length > 0
        ? await supabase
            .from("communities")
            .select("id, name, description, logo_url, banner_url, location")
            .in("id", adminCommunityIds)
        : { data: null, error: null }

      // Combine and deduplicate communities
      const allCommunities: Community[] = []
      const seenIds = new Set<string>()

      // Add created communities
      if (createdCommunities && !createdError) {
        createdCommunities.forEach(comm => {
          if (!seenIds.has(comm.id)) {
            seenIds.add(comm.id)
            allCommunities.push({
              ...comm,
              role: "creator" as const
            })
          }
        })
            }
            
      // Add admin communities
      if (adminCommunities && !adminCommunitiesError) {
        adminCommunities.forEach(comm => {
          if (!seenIds.has(comm.id)) {
            seenIds.add(comm.id)
            allCommunities.push({
              ...comm,
              role: "admin" as const
            })
            }
        })
      }

      // Get member counts for each community
      const communityIds = allCommunities.map(c => c.id)
      if (communityIds.length > 0) {
        const { data: memberCounts } = await supabase
          .from("community_members")
          .select("community_id, status")
          .in("community_id", communityIds)
        
        // Count approved members (status = true or null) for each community
        const counts: Record<string, number> = {}
        memberCounts?.forEach(member => {
          const status = member.status
          if (status === true || status === null) {
            counts[member.community_id] = (counts[member.community_id] || 0) + 1
          }
        })

        allCommunities.forEach(comm => {
          comm.member_count = counts[comm.id] || 0
        })
      }

      setCommunities(allCommunities)
    } catch (error) {
      console.error("Error loading communities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading communities...</p>
                          </div>
                        </div>
      </PageTransition>
    )
  }

  if (communities.length === 0) {
    return (
      <PageTransition>
        <FloatingElements />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Community Admin Dashboard
              </h1>
              <p className="text-gray-600 mb-8">
                You don't have any communities to manage yet.
              </p>
              <Link href="/communities/create">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
        <FloatingElements />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Select Community to Manage
            </h1>
            <p className="text-gray-600">
              Choose a community to access its admin dashboard
            </p>
                    </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Card
                key={community.id}
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-300"
                onClick={() => router.push(`/communities/${community.id}/admin`)}
              >
                <CardHeader className="p-0">
                  <div className="relative h-32 w-full bg-gradient-to-r from-purple-400 to-blue-400">
                    {community.banner_url && (
                      <Image
                        src={community.banner_url}
                        alt={community.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="px-6 pt-4 pb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-12 w-12 border-2 border-white -mt-6">
                        <AvatarImage src={community.logo_url || undefined} />
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {community.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {community.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            community.role === "creator"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          )}>
                            {community.role === "creator" ? "Creator" : "Admin"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {community.description || "No description available"}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{community.member_count || 0} members</span>
                    </div>
                    <Button 
                      variant="ghost"
                      size="sm" 
                      className="text-purple-600 hover:text-purple-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/communities/${community.id}/admin`)
                      }}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>

          <div className="mt-8 text-center">
            <Link href="/communities/create">
              <Button variant="outline" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create New Community
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}
