"use client"

import type React from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useWishlist, type Event } from "./wishlist-provider"
import { cn } from "@/lib/utils"

interface WishlistButtonProps {
  event: Event
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
  className?: string
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  event,
  variant = "ghost",
  size = "icon",
  showText = false,
  className,
}) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const isWishlisted = isInWishlist(event.id)

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isWishlisted) {
      removeFromWishlist(event.id)
    } else {
      addToWishlist(event)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleToggleWishlist}
            className={cn(
              "group transition-all duration-300",
              isWishlisted ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500",
              className,
            )}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                "transition-all duration-300",
                isWishlisted ? "fill-current" : "fill-transparent group-hover:scale-110",
              )}
            />
            {showText && <span className="ml-2">{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isWishlisted ? "Remove from wishlist" : "Add to wishlist"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
