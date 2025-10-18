"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Users, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CommunityAdminNavProps {
  communityProfilePicture?: string
  communityName?: string
}

export function CommunityAdminNav({ 
  communityProfilePicture = "/placeholder-user.jpg", 
  communityName = "Community" 
}: CommunityAdminNavProps) {
  const pathname = usePathname()
  
  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname?.startsWith("/community-admin/events") || pathname === "/community-admin/create") {
      return "events"
    }
    if (pathname?.startsWith("/community-admin/notifications")) {
      return "notification"
    }
    return "community-profile"
  }
  
  const activeTab = getActiveTab()

  const navItems = [
    {
      id: "community-profile",
      label: "Community Profile",
      icon: Users,
      href: "/community-admin",
    },
    {
      id: "events",
      label: "Events",
      icon: Calendar,
      href: "/community-admin/events",
    },
    {
      id: "notification",
      label: "Notification",
      icon: Bell,
      href: "/community-admin/notifications",
    },
  ]

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo ConnectSpace */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-1 group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="ConnectSpace Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 w-8 h-8 bg-purple-600/20 rounded-full blur-lg group-hover:bg-purple-700/30 transition-all duration-200"></div>
              </div>
              <span className="text-xl font-bold text-gradient group-hover:scale-105 transition-transform duration-200">
                ConnectSpace
              </span>
            </Link>
          </div>

          {/* Navigation Items - Center */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <Link key={item.id} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex items-center space-x-2 transition-all duration-200",
                      isActive 
                        ? "text-purple-600 font-bold" 
                        : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                    )}
                    onClick={() => {}}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Community Profile Dropdown */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2 hover:bg-purple-50">
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={communityProfilePicture} 
                      alt={communityName}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      {communityName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={communityProfilePicture} alt={communityName} />
                    <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      {communityName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{communityName}</span>
                    <span className="text-xs text-gray-500">Community Admin</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
