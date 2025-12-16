"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Check, RefreshCw, Sparkles, Wand2, X } from "lucide-react"
import React, { useState } from "react"

interface ContentEnhancerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalContent: string
  contentType: "description" | "title" | "rules" | "agenda" | "requirements"
  context?: {
    name?: string
    category?: string
    type?: string
    tone?: string
  }
  onAccept: (enhancedContent: string) => void
}

export function ContentEnhancerDialog({
  open,
  onOpenChange,
  originalContent,
  contentType,
  context = {},
  onAccept,
}: ContentEnhancerDialogProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedContent, setEnhancedContent] = useState("")
  const [error, setError] = useState<string | null>(null)

  const contentTypeLabels = {
    description: "Description",
    title: "Title",
    rules: "Rules",
    agenda: "Agenda",
    requirements: "Requirements",
  }

  const handleEnhance = async () => {
    if (!originalContent.trim()) {
      setError("Please enter some content to enhance")
      return
    }

    setIsEnhancing(true)
    setError(null)

    try {
      // Use generate-content endpoint for title/description generation
      let type = "";
      let params: any = {};
      
      if (contentType === "title") {
        type = context?.name ? "community-description" : "event-description";
        params = {
          name: context?.name || originalContent,
          category: context?.category || "",
        };
      } else if (contentType === "description") {
        type = context?.type === "event" ? "event-description" : "community-description";
        params = {
          name: context?.name || "",
          category: context?.category || "",
          description: originalContent,
        };
      } else {
        // For other types, just return the original content
        setEnhancedContent(originalContent);
        setIsEnhancing(false);
        return;
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
      setEnhancedContent(data.description || originalContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while generating content")
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleAccept = () => {
    onAccept(enhancedContent)
    onOpenChange(false)
  }

  const handleClose = () => {
    setEnhancedContent("")
    setError(null)
    onOpenChange(false)
  }

  // Auto-enhance when dialog opens
  React.useEffect(() => {
    if (open && originalContent.trim() && !enhancedContent && !isEnhancing) {
      handleEnhance()
    }
    // Reset enhanced content when dialog closes
    if (!open) {
      setEnhancedContent("")
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, originalContent])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wand2 className="h-5 w-5 text-purple-600" />
            Enhance {contentTypeLabels[contentType]} with AI
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {isEnhancing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mb-4" />
              <p className="text-gray-600">Enhancing your content with AI...</p>
            </div>
          ) : error ? (
            <div className="py-4">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Original</Label>
                  <div className="mt-1.5 p-3 bg-gray-50 rounded-md text-sm h-[200px] overflow-y-auto border border-gray-200">
                    {originalContent || <span className="text-gray-400">No content</span>}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Enhanced</Label>
                  <div className="mt-1.5 p-3 bg-purple-50 rounded-md text-sm h-[200px] overflow-y-auto border border-purple-200">
                    {enhancedContent || <span className="text-gray-400">No enhanced content yet</span>}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-enhanced">Edit Enhanced Content</Label>
                <Textarea
                  id="edit-enhanced"
                  value={enhancedContent}
                  onChange={(e) => setEnhancedContent(e.target.value)}
                  className="mt-1.5 h-24"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <div className="flex gap-2">
            {enhancedContent && (
              <Button variant="outline" onClick={handleEnhance} disabled={isEnhancing}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isEnhancing && "animate-spin")} />
                Regenerate
              </Button>
            )}
            <Button onClick={handleAccept} disabled={!enhancedContent || isEnhancing}>
              <Check className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
