"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  Users,
  Calendar,
  Clock,
  Star,
  ChevronRight,
  Mic,
  MicOff,
  VolumeX,
  MapPin,
  Filter,
  Zap,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
  recommendations?: any
  actionType?: string
  quickActions?: Array<{ label: string; action: string; target?: string }>
  calendarEvents?: any[]
  searchResults?: any
}

interface EnhancedChatbotWidgetProps {
  className?: string
  defaultOpen?: boolean
  context?: string
  size?: "compact" | "normal" | "large"
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

function EnhancedChatbotWidgetComponent({
  className,
  defaultOpen = false,
  context = "general",
  size = "normal",
  position = "bottom-right",
}: EnhancedChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userPreferences, setUserPreferences] = useState<any>({})
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [synthesis, setSynthesis] = useState<any>(null)
  const [feedbackMode, setFeedbackMode] = useState<string | null>(null)
  const [excludedRecommendations, setExcludedRecommendations] = useState<string[]>([])
  const [conversationRating, setConversationRating] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Responsive sizing
  const getSizeClasses = () => {
    switch (size) {
      case "compact":
        return "w-80 h-96"
      case "large":
        return "w-[480px] h-[700px]"
      default:
        return "w-96 h-[600px]"
    }
  }

  const getExpandedClasses = () => {
    if (isExpanded) {
      return "w-[90vw] h-[90vh] max-w-6xl max-h-[800px]"
    }
    return getSizeClasses()
  }

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "bottom-6 left-6"
      case "top-right":
        return "top-6 right-6"
      case "top-left":
        return "top-6 left-6"
      default:
        return "bottom-6 right-6"
    }
  }

  // Initialize speech capabilities
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const speechSynthesis = window.speechSynthesis

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.interimResults = false
        recognitionInstance.lang = "en-US"

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputValue(transcript)
          setIsListening(false)
        }

        recognitionInstance.onerror = () => setIsListening(false)
        recognitionInstance.onend = () => setIsListening(false)

        setRecognition(recognitionInstance)
      }

      if (speechSynthesis) {
        setSynthesis(speechSynthesis)
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat()
    }
  }, [isOpen, context])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const initializeChat = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/chatbot/enhanced/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      })

      if (response.ok) {
        const data = await response.json()
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          suggestions: data.suggestions,
          quickActions: data.quickActions,
        }
        setMessages([welcomeMessage])
        speakMessage(data.message)
      }
    } catch (error) {
      console.error("Failed to initialize chat:", error)
      toast.error("Failed to initialize chat assistant")
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/chatbot/enhanced/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          userPreferences,
          context,
          excludedRecommendations,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.extractedPreferences) {
          setUserPreferences((prev) => ({ ...prev, ...data.extractedPreferences }))
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
          suggestions: data.followUpQuestions,
          actionType: data.actionType,
        }

        // Handle different action types
        switch (data.actionType) {
          case "show_recommendations":
            const recommendations = await generateRecommendations()
            assistantMessage.recommendations = recommendations
            break
          case "search_content":
            const searchResults = await searchContent(content, data.searchFilters)
            assistantMessage.searchResults = searchResults
            break
          case "show_calendar":
            const calendarEvents = await getCalendarEvents(data.calendarQuery || content)
            assistantMessage.calendarEvents = calendarEvents
            break
          case "navigate_to":
            if (data.navigationTarget) {
              toast.success(`Navigating to ${data.navigationTarget}`)
              setTimeout(() => router.push(data.navigationTarget!), 1000)
            }
            break
        }

        setMessages((prev) => [...prev, assistantMessage])
        speakMessage(data.response)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble processing that right now. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      toast.error("Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  const generateRecommendations = async () => {
    try {
      const response = await fetch("/api/ai/chatbot/enhanced/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPreferences,
          context,
          excludeIds: excludedRecommendations,
        }),
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error("Failed to generate recommendations:", error)
    }
    return null
  }

  const searchContent = async (query: string, filters?: any) => {
    try {
      const response = await fetch("/api/ai/chatbot/enhanced/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters }),
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error("Failed to search content:", error)
    }
    return null
  }

  const getCalendarEvents = async (query: string) => {
    try {
      const response = await fetch("/api/ai/chatbot/enhanced/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error("Failed to get calendar events:", error)
    }
    return []
  }

  const handleFeedback = async (messageId: string, feedback: "positive" | "negative" | string) => {
    try {
      if (typeof feedback === "string") {
        // Text feedback for refinement
        const lastMessage = messages.find((m) => m.id === messageId)
        if (lastMessage?.recommendations) {
          const response = await fetch("/api/ai/chatbot/enhanced/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              feedback,
              currentPreferences: userPreferences,
              lastRecommendations: lastMessage.recommendations,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setUserPreferences(data.updatedPreferences)

            if (data.newRecommendations) {
              const newRecommendations = await generateRecommendations()
              const refinementMessage: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: data.response,
                timestamp: new Date(),
                recommendations: newRecommendations,
              }
              setMessages((prev) => [...prev, refinementMessage])
            }

            toast.success("Preferences updated!")
          }
        }
      } else {
        // Simple positive/negative feedback
        await fetch("/api/ai/chatbot/enhanced/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId, feedback }),
        })

        toast.success(feedback === "positive" ? "Thanks for the feedback!" : "I'll try to improve")
      }
    } catch (error) {
      console.error("Failed to send feedback:", error)
    }
    setFeedbackMode(null)
  }

  const handleQuickAction = (action: string, target?: string) => {
    switch (action) {
      case "show_calendar":
        sendMessage("Show me my upcoming events")
        break
      case "show_recommendations":
        sendMessage("Give me some recommendations")
        break
      case "navigate_to":
        if (target) {
          router.push(target)
          toast.success(`Navigating to ${target}`)
        }
        break
      default:
        sendMessage(action)
    }
  }

  const excludeRecommendation = (id: string, type: string) => {
    setExcludedRecommendations((prev) => [...prev, id])
    toast.success(`${type} removed from recommendations`)
  }

  const startListening = () => {
    if (recognition) {
      setIsListening(true)
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition) {
      recognition.stop()
      setIsListening(false)
    }
  }

  const speakMessage = (text: string) => {
    if (synthesis && !isSpeaking) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      synthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthesis) {
      synthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const exportConversation = () => {
    const conversation = {
      messages,
      userPreferences,
      context,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chat-conversation-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Conversation exported!")
  }

  const clearConversation = () => {
    setMessages([])
    setUserPreferences({})
    setExcludedRecommendations([])
    initializeChat()
    toast.success("Conversation cleared!")
  }

  // Enhanced recommendation card component
  const RecommendationCard = ({ item, type }: { item: any; type: "community" | "event" | "person" }) => {
    const [isExpanded, setIsExpanded] = useState(false)

    const getIcon = () => {
      switch (type) {
        case "community":
          return Users
        case "event":
          return Calendar
        case "person":
          return User
      }
    }

    const Icon = getIcon()

    return (
      <Card className="mb-3 hover:shadow-md transition-all duration-200 border-gray-200 hover:border-purple-300">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 flex-shrink-0">
              <Icon className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{item.name || item.title}</h4>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-gray-500">{item.relevanceScore}%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-1"
                    onClick={() => excludeRecommendation(item.id, type)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description || item.bio}</p>

              {/* Type-specific information */}
              {type === "event" && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </div>
                  {item.price === 0 ? (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      Free
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      ${item.price}
                    </Badge>
                  )}
                </div>
              )}

              {type === "community" && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {item.memberCount} members
                  </div>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {item.format}
                  </Badge>
                  {item.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                  )}
                </div>
              )}

              {type === "person" && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.location}
                  </div>
                  {item.availability && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {item.availability}
                    </Badge>
                  )}
                </div>
              )}

              {/* Tags */}
              {item.tags && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.tags.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Reasoning */}
              {item.reasoning && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Why this?
                    {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                  </Button>
                  {isExpanded && (
                    <div className="mt-1 p-2 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-700">{item.reasoning}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Enhanced message bubble component
  const MessageBubble = ({ message }: { message: Message }) => (
    <div className={cn("flex gap-3 mb-4 min-w-0", message.role === "user" ? "justify-end" : "justify-start")}>
      {message.role === "assistant" && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-purple-100">
            <Bot className="h-4 w-4 text-purple-600" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("min-w-0 flex-shrink space-y-2", message.role === "user" ? "order-first ml-4 mr-0 max-w-[75%]" : "mr-4 max-w-[75%]")}>
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm break-words overflow-wrap-anywhere",
            message.role === "user" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-900",
          )}
        >
          {message.content}
        </div>

        {/* Quick Actions */}
        {message.quickActions && (
          <div className="flex flex-wrap gap-2">
            {message.quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleQuickAction(action.action, action.target)}
              >
                <Zap className="h-3 w-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {message.suggestions && (
          <div className="flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => sendMessage(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {/* Calendar Events */}
        {message.calendarEvents && message.calendarEvents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Your Upcoming Events</h4>
            {message.calendarEvents.map((event: any, index: number) => (
              <Card key={index} className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{event.title}</h5>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{event.date}</span>
                        <span>{event.time}</span>
                        <span>{event.location}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {event.community}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search Results */}
        {message.searchResults && (
          <div className="space-y-3">
            {message.searchResults.communities?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Communities</h4>
                {message.searchResults.communities.map((community: any, index: number) => (
                  <RecommendationCard key={index} item={community} type="community" />
                ))}
              </div>
            )}

            {message.searchResults.events?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Events</h4>
                {message.searchResults.events.map((event: any, index: number) => (
                  <RecommendationCard key={index} item={event} type="event" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {message.recommendations && (
          <div className="space-y-3">
            {message.recommendations.communities?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">Recommended Communities</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setFeedbackMode(message.id)}
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    Refine
                  </Button>
                </div>
                {message.recommendations.communities.map((community: any, index: number) => (
                  <RecommendationCard key={index} item={community} type="community" />
                ))}
              </div>
            )}

            {message.recommendations.events?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Upcoming Events</h4>
                {message.recommendations.events.map((event: any, index: number) => (
                  <RecommendationCard key={index} item={event} type="event" />
                ))}
              </div>
            )}

            {message.recommendations.people?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">People to Connect With</h4>
                {message.recommendations.people.map((person: any, index: number) => (
                  <RecommendationCard key={index} item={person} type="person" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback Section */}
        {feedbackMode === message.id && (
          <div className="p-3 bg-blue-50 rounded-lg space-y-2">
            <p className="text-xs text-blue-700 font-medium">Help me improve these suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {["Too big", "Too small", "Online only", "In person only", "Too expensive", "Different location"].map(
                (feedback) => (
                  <Button
                    key={feedback}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => handleFeedback(message.id, feedback)}
                  >
                    {feedback}
                  </Button>
                ),
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Or tell me specifically what you'd prefer..."
                className="text-xs"
                rows={2}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleFeedback(message.id, e.currentTarget.value)
                    e.currentTarget.value = ""
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Feedback buttons */}
        {message.role === "assistant" && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleFeedback(message.id, "positive")}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleFeedback(message.id, "negative")}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
            <span className="text-xs text-gray-400">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
      </div>

      {message.role === "user" && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-blue-100">
            <User className="h-4 w-4 text-blue-600" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )

  // Floating button when closed
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed h-14 w-14 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 z-50 transition-all duration-300 hover:scale-110",
          getPositionClasses(),
          className,
        )}
      >
        <MessageCircle className="h-6 w-6 text-white" />
        {messages.length > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {messages.length}
          </div>
        )}
      </Button>
    )
  }

  return (
    <Card
      className={cn(
        "fixed shadow-2xl z-50 flex flex-col transition-all duration-300",
        getPositionClasses(),
        getExpandedClasses(),
        isMinimized && "h-16",
        className,
      )}
    >
      <CardHeader className="pb-2 flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-purple-100">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex flex-col">
              <span>Community Assistant</span>
              <span className="text-xs font-normal text-gray-500 capitalize">{context} mode</span>
            </div>
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          </CardTitle>
          <div className="flex items-center gap-1">
            {isSpeaking && (
              <Button variant="ghost" size="sm" onClick={stopSpeaking} className="h-8 w-8 p-0">
                <VolumeX className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 p-0">
              {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="pl-4 pr-6 py-2 min-w-0">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-3 mb-4">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-purple-100">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator className="flex-shrink-0" />

          <div className="p-4 flex-shrink-0">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage(inputValue)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => sendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {isListening && (
              <div className="mt-2 text-xs text-purple-600 flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Listening...
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

export const EnhancedChatbotWidget = React.memo(EnhancedChatbotWidgetComponent)
