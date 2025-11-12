"use client"

import { useEffect, useState } from "react"

export function FloatingElements() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Floating geometric shapes */}
      <div
        className="absolute top-20 left-10 w-20 h-20 gradient-primary rounded-full floating-animation opacity-20"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute top-40 right-20 w-16 h-16 gradient-secondary rounded-lg floating-animation opacity-20"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-40 left-20 w-24 h-24 gradient-tertiary morphing-blob floating-animation opacity-20"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="absolute bottom-20 right-10 w-18 h-18 gradient-quaternary rounded-full floating-animation opacity-20"
        style={{ animationDelay: "1s" }}
      />

      {/* Additional floating elements */}
      <div
        className="absolute top-1/3 left-1/4 w-12 h-12 gradient-primary rounded-lg floating-animation opacity-15"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute top-2/3 right-1/3 w-14 h-14 gradient-secondary rounded-full floating-animation opacity-15"
        style={{ animationDelay: "5s" }}
      />
    </div>
  )
}
