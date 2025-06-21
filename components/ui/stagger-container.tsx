"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function StaggerContainer({ children, className = "", delay = 100 }: StaggerContainerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {isVisible && children}
    </div>
  )
}
