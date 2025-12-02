"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, RefreshCw, Check, X, ArrowRight, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [enhancementType, setEnhancementType] = useState<string>("improve")
  const [tone, setTone] = useState<string>("professional")
  const [customPrompt, setCustomPrompt] = useState("")
  const [activeTab, setActiveTab] = useState<string>("options")
  const [error, setError] = useState<string | null>(null)

  const enhancementTypes = {
    improve: "General improvement",
    expand: "Expand with more details",
    simplify: "Make more concise",
    professional: "More professional tone",
    friendly: "More friendly and approachable",
    persuasive: "More persuasive and compelling",
    custom: "Custom instructions",
  }

  const tones = {
    professional: "Professional",
    casual: "Casual",
    enthusiastic: "Enthusiastic",
    informative: "Informative",
    persuasive: "Persuasive",
  }

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
        setActiveTab("result");
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
      setActiveTab("result")
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
    setActiveTab("options")
    setError(null)
    onOpenChange(false)
  }

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="options">Enhancement Options</TabsTrigger>
            <TabsTrigger value="result" disabled={!enhancedContent}>
              Result
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto py-4">
            <TabsContent value="options" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="original-content">Original Content</Label>
                  <Textarea id="original-content" value={originalContent} readOnly className="mt-1.5 h-24 bg-gray-50" />
                </div>

                <div>
                  <Label htmlFor="enhancement-type">Enhancement Type</Label>
                  <Select value={enhancementType} onValueChange={setEnhancementType}>
                    <SelectTrigger id="enhancement-type" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(enhancementTypes).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {enhancementType === "custom" && (
                  <div>
                    <Label htmlFor="custom-prompt">Custom Instructions</Label>
                    <Textarea
                      id="custom-prompt"
                      placeholder="Enter specific instructions for the AI..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="mt-1.5 h-24"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger id="tone" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tones).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </TabsContent>

            <TabsContent value="result" className="space-y-6 mt-0">
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
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            {activeTab === "result" && (
              <Button variant="outline" onClick={() => setActiveTab("options")}>
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                Back to Options
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {activeTab === "options" ? (
              <Button onClick={handleEnhance} disabled={isEnhancing || !originalContent.trim()}>
                {isEnhancing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Enhance
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleEnhance} disabled={isEnhancing}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isEnhancing && "animate-spin")} />
                  Regenerate
                </Button>
                <Button onClick={handleAccept}>
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
