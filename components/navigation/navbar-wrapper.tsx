"use client"

import { usePathname } from "next/navigation"
import { UnifiedNav } from "./unified-nav"

export function NavbarWrapper() {
  const pathname = usePathname()
  
  // Hide navbar on auth pages and community admin pages
  const isAuthPage = pathname?.startsWith("/auth")
  const isCommunityAdminPage = pathname?.startsWith("/community-admin")
  
  if (isAuthPage || isCommunityAdminPage) {
    return null
  }
  
  return <UnifiedNav />
} 