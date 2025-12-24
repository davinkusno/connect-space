"use client"

import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface EnhanceContentButtonProps extends ButtonProps {
  content: string
  contentType: "description" | "title" | "rules" | "agenda" | "requirements"
  onEnhanced: (enhancedContent: string) => void
  context?: {
    name?: string
    category?: string
    type?: string
    tone?: string
  }
}

export function EnhanceContentButton({
  content,
  contentType,
  onEnhanced,
  context,
  className,
  disabled,
  ...props
}: EnhanceContentButtonProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)

  const handleEnhance = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to enhance")
      return
    }

    setIsEnhancing(true)

    try {
      // Use generate-content endpoint for title/description generation
      let type = "";
      let params: any = {};
      
      if (contentType === "title") {
        type = context?.name ? "community-description" : "event-description";
        params = {
          name: context?.name || content,
          category: context?.category || "",
        };
      } else if (contentType === "description") {
        type = context?.type === "event" ? "event-description" : "community-description";
        if (context?.type === "event") {
          // For events, use 'title' instead of 'name'
          params = {
            title: context?.name || "",
            category: context?.category || "",
            description: content,
          };
        } else {
          // For communities, use 'name'
          params = {
            name: context?.name || "",
            category: context?.category || "",
            description: content,
          };
        }
      } else {
        toast.error("Enhancement not available for this content type")
        setIsEnhancing(false)
        return
      }

      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          params,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate content")
      }

      const data = await response.json()
      const enhancedContent = data.description || content
      
      // Directly update the input
      onEnhanced(enhancedContent)
      toast.success("Content enhanced successfully!")
    } catch (err) {
      console.error("Enhancement error:", err)
      toast.error(err instanceof Error ? err.message : "Failed to enhance content")
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEnhance}
      disabled={disabled || isEnhancing || !content.trim()}
      className={cn("border-violet-200 text-violet-600 hover:bg-violet-50", className)}
      {...props}
    >
      <Sparkles className={cn("h-4 w-4 mr-2", isEnhancing && "animate-spin")} />
      {isEnhancing ? "Enhancing..." : "Enhance with AI"}
    </Button>
  )
}
