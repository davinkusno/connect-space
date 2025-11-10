"use client"

import { usePathname } from "next/navigation"
import { UnifiedNav } from "./unified-nav"

export function NavbarWrapper() {
  const pathname = usePathname()
  
  // Hide navbar on auth pages, community admin pages, and superadmin pages
  const isAuthPage = pathname?.startsWith("/auth")
  const isCommunityAdminPage = pathname?.startsWith("/community-admin")
  const isSuperAdminPage = pathname?.startsWith("/superadmin")
  
  if (isAuthPage || isCommunityAdminPage || isSuperAdminPage) {
    return null
  }
  
  return <UnifiedNav />
}