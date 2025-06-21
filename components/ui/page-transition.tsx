"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(false)
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div
      className={`transition-all duration-600 ease-out ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-5 scale-98"
      }`}
    >
      {children}
    </div>
  )
}
