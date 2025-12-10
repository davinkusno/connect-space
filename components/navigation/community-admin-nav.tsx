"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    ArrowLeft, Calendar, LayoutDashboard, MessageSquare,
    UserCheck, Users
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function CommunityAdminNav() {
  const pathname = usePathname()
  
  // Extract community ID from pathname
  // Pathname format: /community-admin/[id]/...
  const pathParts = pathname?.split("/") || []
  const communityIdIndex = pathParts.indexOf("community-admin") + 1
  const communityId = communityIdIndex > 0 && pathParts[communityIdIndex] && pathParts[communityIdIndex] !== "create" 
    ? pathParts[communityIdIndex] 
    : null

  // If we're on a community-specific page, use dynamic routes
  // Otherwise, use the old static routes (for backward compatibility during migration)
  const basePath = communityId ? `/community-admin/${communityId}` : "/community-admin"

  const navItems = [
    {
      href: basePath,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: communityId ? `${basePath}/events` : "/community-admin/events",
      label: "Events",
      icon: Calendar,
    },
    {
      href: communityId ? `${basePath}/members` : "/community-admin/members",
      label: "Members",
      icon: Users,
    },
    {
      href: communityId ? `${basePath}/discussions` : "/community-admin/discussions",
      label: "Announcements",
      icon: MessageSquare,
    },
    {
      href: communityId ? `${basePath}/requests` : "/community-admin/requests",
      label: "Join Requests",
      icon: UserCheck,
    },
  ]

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1">
            <Link href={communityId ? `/community-admin/${communityId}` : "/community-admin"}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-gray-700 hover:text-purple-600 hover:bg-purple-50",
                  (pathname === "/community-admin" || (communityId && pathname === `/community-admin/${communityId}`)) && "text-purple-600 bg-purple-50"
                )}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            {navItems.slice(1).map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-gray-700 hover:text-purple-600 hover:bg-purple-50",
                      isActive && "text-purple-600 bg-purple-50"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            {communityId && (
              <Link href="/community-admin">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  Select Community
                </Button>
              </Link>
            )}
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}


