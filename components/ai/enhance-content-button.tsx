"use client"

import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { ContentEnhancerDialog } from "./content-enhancer-dialog"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

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
  ...props
}: EnhanceContentButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className={cn("border-violet-200 text-violet-600 hover:bg-violet-50", className)}
        {...props}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Enhance with AI
      </Button>

      <ContentEnhancerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        originalContent={content}
        contentType={contentType}
        context={context}
        onAccept={onEnhanced}
      />
    </>
  )
}
