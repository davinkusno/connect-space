"use client"

import { usePathname } from "next/navigation"
import { UnifiedNav } from "./unified-nav"

export function NavbarWrapper() {
  const pathname = usePathname()
  
  // Hide navbar on auth pages and superadmin pages
  const isAuthPage = pathname?.startsWith("/auth")
  const isSuperAdminPage = pathname?.startsWith("/superadmin")
  
  if (isAuthPage || isSuperAdminPage) {
    return null
  }
  
  return <UnifiedNav />
}
