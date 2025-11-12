"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/loading-indicators"
import {
  Wand2,
  Copy,
  RefreshCw,
  Sparkles,
  FileText,
  Calendar,
  Users,
  MessageSquare,
  Lightbulb,
  Hash,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AIContentGeneratorProps {
  communityId?: string
  communityType?: string
  onContentGenerated?: (content: any) => void
  className?: string
}

export function AIContentGenerator({
  communityId,
  communityType = "general",
  onContentGenerated,
  className,
}: AIContentGeneratorProps) {
  const [activeTab, setActiveTab] = useState("post")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Form states for different content types
  const [postForm, setPostForm] = useState({
    topic: "",
    tone: "casual",
    targetAudience: "",
    keywords: "",
  })

  const [eventForm, setEventForm] = useState({
    eventType: "workshop",
    topic: "",
    duration: "2 hours",
    format: "online",
    skillLevel: "all",
  })

  const [guidelinesForm, setGuidelinesForm] = useState({
    communityName: "",
    values: "",
    specificRules: "",
  })

  const generateContent = async (type: string) => {
    setIsGenerating(true)
    setError(null)

    try {
      let response

      switch (type) {
        case "post":
          response = await fetch("/api/ai/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "post",
              params: {
                ...postForm,
                communityType,
                keywords: postForm.keywords
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean),
              },
            }),
          })
          break

        case "event":
          response = await fetch("/api/ai/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "event",
              params: eventForm,
            }),
          })
          break

        case "guidelines":
          response = await fetch("/api/ai/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "guidelines",
              params: {
                ...guidelinesForm,
                communityType,
                values: guidelinesForm.values
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
                specificRules: guidelinesForm.specificRules
                  ? guidelinesForm.specificRules
                      .split(",")
                      .map((r) => r.trim())
                      .filter(Boolean)
                  : undefined,
              },
            }),
          })
          break

        case "discussion":
          response = await fetch("/api/ai/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "discussion",
              params: {
                communityType,
                count: 5,
              },
            }),
          })
          break
      }

      if (!response?.ok) {
        throw new Error("Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data)
      onContentGenerated?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const regenerateContent = () => {
    generateContent(activeTab)
  }

  return (
    <Card className={cn("w-full max-w-4xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          AI Content Generator
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by AI
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="post" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="event" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guidelines
            </TabsTrigger>
            <TabsTrigger value="discussion" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Discussions
            </TabsTrigger>
          </TabsList>

          {/* Post Generation */}
          <TabsContent value="post" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="post-topic">Topic</Label>
                  <Input
                    id="post-topic"
                    placeholder="What should the post be about?"
                    value={postForm.topic}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, topic: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="post-tone">Tone</Label>
                  <Select
                    value={postForm.tone}
                    onValueChange={(value) => setPostForm((prev) => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="informative">Informative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="post-audience">Target Audience</Label>
                  <Input
                    id="post-audience"
                    placeholder="Who is this post for?"
                    value={postForm.targetAudience}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, targetAudience: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="post-keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="post-keywords"
                    placeholder="AI, technology, innovation"
                    value={postForm.keywords}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, keywords: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={() => generateContent("post")}
                  disabled={!postForm.topic || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Post
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Content Display */}
              <div className="space-y-4">
                {generatedContent && activeTab === "post" && (
                  <Card className="border-purple-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{generatedContent.title}</CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedContent.content)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={regenerateContent}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Content</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{generatedContent.content}</div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Suggested Tags</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {generatedContent.tags?.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline">
                              <Hash className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Badge variant="secondary">{generatedContent.category}</Badge>
                        <Badge variant="secondary">{generatedContent.tone}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Event Generation */}
          <TabsContent value="event" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="event-type">Event Type</Label>
                  <Select
                    value={eventForm.eventType}
                    onValueChange={(value) => setEventForm((prev) => ({ ...prev, eventType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="meetup">Meetup</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="networking">Networking Event</SelectItem>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="event-topic">Topic</Label>
                  <Input
                    id="event-topic"
                    placeholder="What is the event about?"
                    value={eventForm.topic}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, topic: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event-duration">Duration</Label>
                    <Select
                      value={eventForm.duration}
                      onValueChange={(value) => setEventForm((prev) => ({ ...prev, duration: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1 hour">1 hour</SelectItem>
                        <SelectItem value="2 hours">2 hours</SelectItem>
                        <SelectItem value="half day">Half day</SelectItem>
                        <SelectItem value="full day">Full day</SelectItem>
                        <SelectItem value="2 days">2 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="event-format">Format</Label>
                    <Select
                      value={eventForm.format}
                      onValueChange={(value) => setEventForm((prev) => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">In-person</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="event-skill">Skill Level</Label>
                  <Select
                    value={eventForm.skillLevel}
                    onValueChange={(value) => setEventForm((prev) => ({ ...prev, skillLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="all">All Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => generateContent("event")}
                  disabled={!eventForm.topic || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Generate Event
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Event Display */}
              <div className="space-y-4">
                {generatedContent && activeTab === "event" && (
                  <Card className="border-purple-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{generatedContent.title}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(generatedContent, null, 2))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={regenerateContent}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{generatedContent.description}</div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Agenda</Label>
                        <ul className="mt-1 space-y-1">
                          {generatedContent.agenda?.map((item: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Target Audience</Label>
                        <p className="text-sm text-gray-600 mt-1">{generatedContent.targetAudience}</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Expected Outcomes</Label>
                        <ul className="mt-1 space-y-1">
                          {generatedContent.expectedOutcomes?.map((outcome: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              {outcome}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Guidelines Generation */}
          <TabsContent value="guidelines" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guidelines-name">Community Name</Label>
                  <Input
                    id="guidelines-name"
                    placeholder="Enter community name"
                    value={guidelinesForm.communityName}
                    onChange={(e) => setGuidelinesForm((prev) => ({ ...prev, communityName: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="guidelines-values">Core Values (comma-separated)</Label>
                  <Input
                    id="guidelines-values"
                    placeholder="respect, collaboration, learning"
                    value={guidelinesForm.values}
                    onChange={(e) => setGuidelinesForm((prev) => ({ ...prev, values: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="guidelines-rules">Specific Rules (optional, comma-separated)</Label>
                  <Textarea
                    id="guidelines-rules"
                    placeholder="No spam, be constructive, stay on topic"
                    value={guidelinesForm.specificRules}
                    onChange={(e) => setGuidelinesForm((prev) => ({ ...prev, specificRules: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => generateContent("guidelines")}
                  disabled={!guidelinesForm.communityName || !guidelinesForm.values || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Generate Guidelines
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Guidelines Display */}
              <div className="space-y-4">
                {generatedContent && activeTab === "guidelines" && (
                  <Card className="border-purple-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Community Guidelines</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(generatedContent, null, 2))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={regenerateContent}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Welcome Message</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{generatedContent.welcomeMessage}</div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm font-medium">Community Rules</Label>
                        <div className="mt-2 space-y-3">
                          {generatedContent.rules?.map((rule: any, index: number) => (
                            <div key={index} className="border rounded-lg p-3">
                              <h4 className="font-medium text-sm mb-1">{rule.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                              {rule.examples && rule.examples.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  <span className="font-medium">Examples: </span>
                                  {rule.examples.join(", ")}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm font-medium">Code of Conduct</Label>
                        <ul className="mt-1 space-y-1">
                          {generatedContent.codeOfConduct?.map((item: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Discussion Starters */}
          <TabsContent value="discussion" className="space-y-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-medium">Generate Discussion Starters</h3>
                <p className="text-sm text-gray-600">
                  Create engaging questions to spark conversations in your {communityType} community
                </p>
              </div>

              <Button onClick={() => generateContent("discussion")} disabled={isGenerating} size="lg">
                {isGenerating ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Generate Discussion Questions
                  </>
                )}
              </Button>
            </div>

            {generatedContent && activeTab === "discussion" && (
              <Card className="border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Discussion Starters</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedContent)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={regenerateContent}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generatedContent
                      .split("\n")
                      .filter(Boolean)
                      .map((question: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{question.replace(/^\d+\.\s*/, "")}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
