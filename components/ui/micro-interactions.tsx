"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ButtonPulseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  pulseColor?: string
  pulseOnMount?: boolean
}

export function ButtonPulse({
  children,
  className,
  pulseColor = "rgba(124, 58, 237, 0.5)",
  pulseOnMount = false,
  ...props
}: ButtonPulseProps) {
  const [isPulsing, setIsPulsing] = useState(pulseOnMount)

  useEffect(() => {
    if (pulseOnMount) {
      const timer = setTimeout(() => setIsPulsing(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [pulseOnMount])

  return (
    <button
      className={cn("relative overflow-hidden", className)}
      onClick={() => setIsPulsing(true)}
      onAnimationEnd={() => setIsPulsing(false)}
      {...props}
    >
      {isPulsing && (
        <span
          className="absolute inset-0 animate-pulse-once rounded-[inherit]"
          style={{ backgroundColor: pulseColor }}
        />
      )}
      {children}
    </button>
  )
}

interface HoverScaleProps {
  children: React.ReactNode
  className?: string
  scale?: number
}

export function HoverScale({ children, className, scale = 1.03 }: HoverScaleProps) {
  return (
    <div
      className={cn("transition-transform duration-200 ease-out hover:scale-[var(--scale)]", className)}
      style={{ "--scale": scale } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

interface FadeInProps {
  children: React.ReactNode
  className?: string
  duration?: number
  delay?: number
}

export function FadeIn({ children, className, duration = 300, delay = 0 }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={cn("transition-opacity", className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

interface AnimatedIconProps {
  icon: React.ReactNode
  className?: string
  animationType?: "pulse" | "bounce" | "spin" | "wiggle"
}

export function AnimatedIcon({ icon, className, animationType = "pulse" }: AnimatedIconProps) {
  const animationClass = {
    pulse: "animate-subtle-pulse",
    bounce: "animate-subtle-bounce",
    spin: "animate-subtle-spin",
    wiggle: "animate-subtle-wiggle",
  }

  return <div className={cn(animationClass[animationType], className)}>{icon}</div>
}

interface ProgressiveLoadProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function ProgressiveLoad({ children, className, staggerDelay = 100 }: ProgressiveLoadProps) {
  return (
    <div
      className={cn("progressive-load", className)}
      style={{ "--stagger-delay": `${staggerDelay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
