"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
  recommendations?: any
  actionType?: string
}

interface ChatbotWidgetProps {
  className?: string
  defaultOpen?: boolean
}

export function ChatbotWidget({ className, defaultOpen = false }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userPreferences, setUserPreferences] = useState<any>({})
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [synthesis, setSynthesis] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initialize speech recognition and synthesis
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

        recognitionInstance.onerror = () => {
          setIsListening(false)
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
        }

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
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const initializeChat = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/chatbot/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const data = await response.json()
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          suggestions: data.suggestions,
        }
        setMessages([welcomeMessage])

        // Speak welcome message
        speakMessage(data.message)
      }
    } catch (error) {
      console.error("Failed to initialize chat:", error)
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
      const response = await fetch("/api/ai/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          userPreferences,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Update user preferences if extracted
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
        if (data.actionType === "show_recommendations") {
          const recommendations = await generateRecommendations()
          assistantMessage.recommendations = recommendations
        } else if (data.actionType === "search_content") {
          const searchResults = await searchContent(content)
          assistantMessage.recommendations = searchResults
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Speak response
        speakMessage(data.response)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble processing that right now. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateRecommendations = async () => {
    try {
      const response = await fetch("/api/ai/chatbot/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPreferences }),
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error("Failed to generate recommendations:", error)
    }
    return null
  }

  const searchContent = async (query: string) => {
    try {
      const response = await fetch("/api/ai/chatbot/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error("Failed to search content:", error)
    }
    return null
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const handleFeedback = async (messageId: string, feedback: "positive" | "negative") => {
    try {
      await fetch("/api/ai/chatbot/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, feedback }),
      })
    } catch (error) {
      console.error("Failed to send feedback:", error)
    }
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

  const RecommendationCard = ({ item, type }: { item: any; type: "community" | "event" | "person" }) => {
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
      <Card className="mb-3 hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 hover:border-purple-300">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Icon className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{item.name || item.title}</h4>
                <div className="flex items-center gap-1 ml-2">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-gray-500">{item.relevanceScore}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description || item.bio}</p>

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
                </div>
              )}

              {item.reasoning && (
                <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-700">{item.reasoning}</p>
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

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

        {message.suggestions && (
          <div className="flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {message.recommendations && (
          <div className="space-y-3 mt-3">
            {message.recommendations.communities?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recommended Communities</h4>
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

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 z-50",
          className,
        )}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    )
  }

  return (
    <Card
      className={cn(
        "fixed bottom-6 right-6 w-96 h-[600px] shadow-xl z-50 flex flex-col",
        isMinimized && "h-16",
        className,
      )}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-purple-100">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
            Community Assistant
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardTitle>
          <div className="flex items-center gap-1">
            {isSpeaking && (
              <Button variant="ghost" size="sm" onClick={stopSpeaking} className="h-8 w-8 p-0">
                <VolumeX className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 p-0">
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
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

              <div className="p-4 border-t flex-shrink-0">
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
