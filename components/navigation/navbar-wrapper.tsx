"use client"

import { usePathname } from "next/navigation"
import { UnifiedNav } from "./unified-nav"

export function NavbarWrapper() {
  const pathname = usePathname()
  
  // Hide navbar on auth pages
  const isAuthPage = pathname?.startsWith("/auth")
  
  if (isAuthPage) {
    return null
  }
  
  return <UnifiedNav />
} 