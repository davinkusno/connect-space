"use client"

interface LoadingSkeletonProps {
  className?: string
  count?: number
}

export function LoadingSkeleton({ className = "", count = 1 }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`skeleton rounded-lg ${className}`} style={{ animationDelay: `${index * 0.1}s` }} />
      ))}
    </>
  )
}
