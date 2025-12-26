"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  variant?: "default" | "glass" | "gradient" | "3d"
  children: React.ReactNode
  disableHoverScale?: boolean
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, variant = "default", disableHoverScale = false, children, ...props }, ref) => {
    const variants = {
      default: disableHoverScale
        ? "hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm"
        : "hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm",
      glass: disableHoverScale
        ? "glass-effect hover:bg-white/20 transition-all duration-500"
        : "glass-effect hover:bg-white/20 transform hover:scale-[1.02] transition-all duration-500",
      gradient: disableHoverScale
        ? "gradient-primary text-white hover:shadow-2xl transition-all duration-500"
        : "gradient-primary text-white hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-500",
      "3d": "card-3d hover:shadow-2xl perspective-1000 preserve-3d backface-hidden",
    }

    return (
      <Card ref={ref} className={cn("relative overflow-hidden", variants[variant], className)} {...props}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10">{children}</div>
      </Card>
    )
  },
)

AnimatedCard.displayName = "AnimatedCard"
