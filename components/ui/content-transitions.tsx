"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface FadeTransitionProps {
  show: boolean
  children: React.ReactNode
  className?: string
  duration?: number
}

export function FadeTransition({ show, children, className, duration = 200 }: FadeTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) setShouldRender(true)
    else {
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  return shouldRender ? (
    <div
      className={cn("transition-opacity", className)}
      style={{
        opacity: show ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  ) : null
}

interface SlideTransitionProps {
  show: boolean
  children: React.ReactNode
  className?: string
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  duration?: number
}

export function SlideTransition({
  show,
  children,
  className,
  direction = "up",
  distance = 20,
  duration = 200,
}: SlideTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) setShouldRender(true)
    else {
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  const getTransform = () => {
    if (!show) {
      switch (direction) {
        case "up":
          return `translateY(${distance}px)`
        case "down":
          return `translateY(-${distance}px)`
        case "left":
          return `translateX(${distance}px)`
        case "right":
          return `translateX(-${distance}px)`
      }
    }
    return "translate(0, 0)"
  }

  return shouldRender ? (
    <div
      className={cn("transition-all", className)}
      style={{
        opacity: show ? 1 : 0,
        transform: getTransform(),
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  ) : null
}

interface InViewTransitionProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
  effect?: "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale"
  duration?: number
  delay?: number
}

export function InViewTransition({
  children,
  className,
  threshold = 0.1,
  rootMargin = "0px",
  effect = "fade",
  duration = 500,
  delay = 0,
}: InViewTransitionProps) {
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
      { threshold, rootMargin },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin])

  const getInitialStyles = () => {
    switch (effect) {
      case "fade":
        return { opacity: 0 }
      case "slide-up":
        return { opacity: 0, transform: "translateY(20px)" }
      case "slide-down":
        return { opacity: 0, transform: "translateY(-20px)" }
      case "slide-left":
        return { opacity: 0, transform: "translateX(20px)" }
      case "slide-right":
        return { opacity: 0, transform: "translateX(-20px)" }
      case "scale":
        return { opacity: 0, transform: "scale(0.95)" }
      default:
        return { opacity: 0 }
    }
  }

  const getFinalStyles = () => {
    return { opacity: 1, transform: "translate(0, 0) scale(1)" }
  }

  return (
    <div
      ref={ref}
      className={cn("transition-all", className)}
      style={{
        ...(isVisible ? getFinalStyles() : getInitialStyles()),
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  )
}
