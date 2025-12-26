"use client"

import { usePathname } from "next/navigation"
import { UnifiedNav } from "./unified-nav"
import { MinimalNav } from "./minimal-nav"

export function NavbarWrapper() {
  const pathname = usePathname()
  
  // Hide navbar on auth pages and superadmin pages
  const isAuthPage = pathname?.startsWith("/auth")
  const isSuperAdminPage = pathname?.startsWith("/superadmin")
  
  if (isAuthPage || isSuperAdminPage) {
    return null
  }
  
  // Show minimal navbar (only profile picture) on onboarding page
  if (pathname === "/onboarding") {
    return <MinimalNav />
  }
  
  // Show full navbar on all other pages
  return <UnifiedNav />
}
