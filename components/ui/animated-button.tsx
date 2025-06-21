"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  variant?: "default" | "gradient" | "glass" | "neon"
  children: React.ReactNode
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default:
        "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300",
      gradient:
        "gradient-primary text-white shadow-lg hover:shadow-2xl transform hover:scale-105 hover:rotate-1 transition-all duration-500",
      glass: "glass-effect text-gray-800 hover:bg-white/20 transform hover:scale-105 transition-all duration-300",
      neon: "bg-transparent border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white hover:shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300",
    }

    return (
      <Button
        ref={ref}
        className={cn("ripple-effect relative overflow-hidden", variants[variant], className)}
        {...props}
      >
        {children}
      </Button>
    )
  },
)

AnimatedButton.displayName = "AnimatedButton"
