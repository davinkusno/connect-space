"use client"

import { cn } from "@/lib/utils"

interface LoaderProps {
  size?: "sm" | "md" | "lg"
  color?: string
  className?: string
}

export function Spinner({ size = "md", color = "currentColor", className }: LoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={cn("animate-spin", sizeClasses[size], className)}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-full h-full">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill={color}
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  )
}

export function PulseLoader({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div
        className={cn("w-2 h-2 rounded-full animate-pulse bg-current")}
        style={{ animationDelay: "0s", color }}
      ></div>
      <div
        className={cn("w-2 h-2 rounded-full animate-pulse bg-current")}
        style={{ animationDelay: "0.2s", color }}
      ></div>
      <div
        className={cn("w-2 h-2 rounded-full animate-pulse bg-current")}
        style={{ animationDelay: "0.4s", color }}
      ></div>
    </div>
  )
}

export function ProgressBar({
  progress,
  className,
  height = "h-2",
  color = "bg-purple-600",
}: {
  progress: number
  className?: string
  height?: string
  color?: string
}) {
  return (
    <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", height, className)}>
      <div
        className={cn("transition-all duration-500 ease-out", color)}
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      ></div>
    </div>
  )
}

export function CircularProgress({
  progress,
  size = 40,
  strokeWidth = 4,
  color = "#7c3aed",
  className,
}: {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative", className)}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
        {Math.round(progress)}%
      </div>
    </div>
  )
}

export function LoadingSkeleton({ className = "", count = 1 }: { className?: string; count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        />
      ))}
    </>
  )
}

export function LoadingDots({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const dotSize = {
    sm: "w-1 h-1",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  }

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {[0, 1, 2].map((dot) => (
        <div
          key={dot}
          className={cn("rounded-full bg-current animate-bounce", dotSize[size])}
          style={{ animationDelay: `${dot * 0.1}s` }}
        />
      ))}
    </div>
  )
}
