"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Search,
  Send,
  Phone,
  Video,
  MoreHorizontal,
  Paperclip,
  Smile,
  ImageIcon,
  Hash,
  MessageCircle,
  Users,
  Clock,
  Plus,
  Settings,
  Bell,
  BellOff,
  Pin,
  Menu,
  X,
  ChevronDown,
  Info,
  Mic,
  MicOff,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChatNotifications } from "@/components/chat/chat-notifications"

interface Conversation {
  id: string
  type: "direct" | "group"
  name: string
  lastMessage: string
  timestamp: string
  unread: number
  avatar: string
  online?: boolean
  isGroup?: boolean
  participants?: number
  isPinned?: boolean
  isMuted?: boolean
  isArchived?: boolean
  lastActivity?: Date
  preview?: string
  status?: "online" | "away" | "busy" | "offline"
}

interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
  isOwn: boolean
  avatar: string
  type?: "text" | "image" | "file" | "system"
  reactions?: { emoji: string; count: number }[]
  isEdited?: boolean
  status?: "sent" | "delivered" | "read"
}

export default function MessagesPage() {
  const [selectedChatId, setSelectedChatId] = useState<string>("dm-1")
  const [selectedChatType, setSelectedChatType] = useState<"direct" | "group">("direct")
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "groups" | "unread">("all")
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  // Enhanced mock conversations with more realistic data
  const conversations: Conversation[] = [
    {
      id: "dm-1",
      type: "direct",
      name: "Sarah Chen",
      lastMessage: "Thanks for the great discussion today! Looking forward to our next meeting.",
      timestamp: "2 min ago",
      unread: 2,
      avatar: "/placeholder.svg?height=40&width=40",
      online: true,
      isPinned: true,
      status: "online",
      lastActivity: new Date(Date.now() - 120000),
      preview: "Thanks for the great discussion today! Looking forward to our next meeting.",
    },
    {
      id: "dm-2",
      type: "direct",
      name: "Alex Rodriguez",
      lastMessage: "Let's schedule that coffee meeting for tomorrow afternoon",
      timestamp: "3 hours ago",
      unread: 1,
      avatar: "/placeholder.svg?height=40&width=40",
      online: true,
      status: "online",
      lastActivity: new Date(Date.now() - 10800000),
      preview: "Let's schedule that coffee meeting for tomorrow afternoon",
    },
    {
      id: "dm-3",
      type: "direct",
      name: "Lisa Wang",
      lastMessage: "The presentation slides look great, just a few minor suggestions",
      timestamp: "1 day ago",
      unread: 0,
      avatar: "/placeholder.svg?height=40&width=40",
      online: false,
      status: "away",
      lastActivity: new Date(Date.now() - 86400000),
      preview: "The presentation slides look great, just a few minor suggestions",
    },
    {
      id: "group-1",
      type: "group",
      name: "Tech Innovators",
      lastMessage: "Mike: The event was amazing, thanks everyone for participating!",
      timestamp: "1 hour ago",
      unread: 3,
      avatar: "/placeholder.svg?height=40&width=40",
      isGroup: true,
      participants: 1247,
      isPinned: true,
      lastActivity: new Date(Date.now() - 3600000),
      preview: "Mike: The event was amazing, thanks everyone for participating!",
    },
    {
      id: "group-2",
      type: "group",
      name: "Creative Writers",
      lastMessage: "Emma: New writing prompt is up! Check it out in the resources channel",
      timestamp: "5 hours ago",
      unread: 0,
      avatar: "/placeholder.svg?height=40&width=40",
      isGroup: true,
      participants: 892,
      lastActivity: new Date(Date.now() - 18000000),
      preview: "Emma: New writing prompt is up! Check it out in the resources channel",
    },
    {
      id: "group-3",
      type: "group",
      name: "Startup Founders",
      lastMessage: "David: Looking for feedback on my pitch deck, would love your thoughts",
      timestamp: "2 days ago",
      unread: 5,
      avatar: "/placeholder.svg?height=40&width=40",
      isGroup: true,
      participants: 456,
      isMuted: true,
      lastActivity: new Date(Date.now() - 172800000),
      preview: "David: Looking for feedback on my pitch deck, would love your thoughts",
    },
  ]

  const messages: Message[] = [
    {
      id: 1,
      sender: "Sarah Chen",
      content: "Hey! How did the presentation go today?",
      timestamp: "10:30 AM",
      isOwn: false,
      avatar: "/placeholder.svg?height=32&width=32",
      status: "read",
    },
    {
      id: 2,
      sender: "You",
      content: "It went really well! The audience was very engaged and asked great questions.",
      timestamp: "10:32 AM",
      isOwn: true,
      avatar: "/placeholder.svg?height=32&width=32",
      status: "read",
    },
    {
      id: 3,
      sender: "Sarah Chen",
      content: "That's fantastic! I'd love to hear more about it. Are you free for coffee this week?",
      timestamp: "10:35 AM",
      isOwn: false,
      avatar: "/placeholder.svg?height=32&width=32",
      status: "read",
    },
    {
      id: 4,
      sender: "You",
      content: "How about Thursday afternoon? I know a great place near the office.",
      timestamp: "10:37 AM",
      isOwn: true,
      avatar: "/placeholder.svg?height=32&width=32",
      status: "read",
    },
    {
      id: 5,
      sender: "Sarah Chen",
      content: "Perfect! Thursday at 3 PM works for me. Thanks for the great discussion today!",
      timestamp: "10:40 AM",
      isOwn: false,
      avatar: "/placeholder.svg?height=32&width=32",
      reactions: [{ emoji: "👍", count: 1 }],
      status: "delivered",
    },
  ]

  useEffect(() => {
    const dmUserId = searchParams.get("dm")
    if (dmUserId) {
      setSelectedChatId(`dm-${dmUserId}`)
      setSelectedChatType("direct")
    }
  }, [searchParams])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "direct" && conv.type === "direct") ||
      (activeTab === "groups" && conv.type === "group") ||
      (activeTab === "unread" && conv.unread > 0)
    return matchesSearch && matchesTab && !conv.isArchived
  })

  const selectedConversation = conversations.find((conv) => conv.id === selectedChatId)
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.isMuted ? 0 : conv.unread), 0)

  const handleChatSelect = (chatId: string, chatType: "direct" | "group") => {
    setSelectedChatId(chatId)
    setSelectedChatType(chatType)
    setShowMobileSidebar(false) // Close mobile sidebar when selecting chat
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage)
      setNewMessage("")
      setIsTyping(false)
    }
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    setIsTyping(value.length > 0)
  }

  const togglePin = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Toggle pin logic here
  }

  const toggleMute = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Toggle mute logic here
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      case "busy":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  const formatTime = (timestamp: string) => {
    // Enhanced time formatting
    const now = new Date()
    const messageTime = new Date(timestamp)
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return messageTime.toLocaleDateString()
    }
  }

  // Conversation List Component
  const ConversationList = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 flex-shrink-0 p-4 border-b border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-violet-600" />
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            {totalUnread > 0 && (
              <Badge className="bg-violet-600 text-white rounded-full text-xs px-2 py-1">{totalUnread}</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-700">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New conversation</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-700">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 border-gray-200 focus:border-violet-300 focus:ring-violet-200 bg-gray-50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 h-9">
            <TabsTrigger value="all" className="text-xs px-2">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs px-2">
              Unread
            </TabsTrigger>
            <TabsTrigger value="direct" className="text-xs px-2">
              Direct
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs px-2">
              Groups
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversations - Independent Scrollable Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm mb-2">{searchQuery ? "No conversations found" : "No conversations yet"}</p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Start a conversation
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleChatSelect(conversation.id, conversation.type)}
                  className={cn(
                    "group relative p-3 cursor-pointer rounded-lg transition-all duration-200 hover:bg-gray-50",
                    selectedChatId === conversation.id && "bg-violet-50 border border-violet-200 shadow-sm",
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-sm font-medium">{conversation.name[0]}</AvatarFallback>
                      </Avatar>

                      {/* Status indicators */}
                      {conversation.type === "direct" && (
                        <div
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                            getStatusColor(conversation.status),
                          )}
                        />
                      )}
                      {conversation.type === "group" && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-violet-600 rounded-full border-2 border-white flex items-center justify-center">
                          <Hash className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h3
                            className={cn(
                              "font-medium truncate text-sm",
                              conversation.unread > 0 ? "text-gray-900" : "text-gray-700",
                            )}
                          >
                            {conversation.name}
                          </h3>
                          {conversation.isPinned && <Pin className="h-3 w-3 text-violet-500 fill-current" />}
                          {conversation.isMuted && <BellOff className="h-3 w-3 text-gray-400" />}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 whitespace-nowrap">{conversation.timestamp}</span>
                          {conversation.unread > 0 && !conversation.isMuted && (
                            <Badge className="bg-violet-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full flex-shrink-0">
                              {conversation.unread > 99 ? "99+" : conversation.unread}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p
                          className={cn(
                            "text-gray-600 truncate flex-1 text-sm leading-tight pr-2",
                            conversation.unread > 0 && "font-medium text-gray-800",
                          )}
                        >
                          {conversation.preview}
                        </p>
                        {conversation.type === "group" && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                            <Users className="h-3 w-3 mr-1" />
                            {conversation.participants}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => togglePin(conversation.id, e)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-violet-600"
                        >
                          <Pin className={cn("h-3 w-3", conversation.isPinned && "fill-current text-violet-600")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{conversation.isPinned ? "Unpin" : "Pin"}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => toggleMute(conversation.id, e)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        >
                          {conversation.isMuted ? <BellOff className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{conversation.isMuted ? "Unmute" : "Mute"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Chat Interface Component
  const ChatInterface = () => (
    <div className="flex flex-col h-full bg-white">
      {selectedConversation ? (
        <>
          {/* Sticky Chat Header */}
          <div className="sticky top-0 z-10 flex-shrink-0 p-4 border-b border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Mobile menu button */}
                <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="md:hidden text-gray-600 hover:text-violet-700">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-80">
                    <ConversationList />
                  </SheetContent>
                </Sheet>

                <div className="relative flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-sm font-medium">{selectedConversation.name[0]}</AvatarFallback>
                  </Avatar>
                  {selectedConversation.type === "direct" && (
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                        getStatusColor(selectedConversation.status),
                      )}
                    />
                  )}
                  {selectedConversation.type === "group" && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-violet-600 rounded-full border-2 border-white flex items-center justify-center">
                      <Hash className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2 truncate">
                    <span className="truncate">{selectedConversation.name}</span>
                    {selectedConversation.type === "group" && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                        <Users className="h-3 w-3 mr-1" />
                        {selectedConversation.participants}
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center space-x-1 truncate">
                    {selectedConversation.type === "group" ? (
                      <>
                        <Hash className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Group chat</span>
                      </>
                    ) : selectedConversation.status === "online" ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                        <span>Online</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Last seen 2 hours ago</span>
                      </>
                    )}
                    {isTyping && selectedConversation.type === "direct" && (
                      <span className="text-violet-600 font-medium flex-shrink-0">• typing...</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-700">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Voice call</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-700">
                      <Video className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Video call</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-700">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Chat info</p>
                  </TooltipContent>
                </Tooltip>

                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-700">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area - Independent Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex space-x-3 group", message.isOwn && "flex-row-reverse space-x-reverse")}
                >
                  {!message.isOwn && (
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      <AvatarImage src={message.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{message.sender[0]}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn("max-w-[75%] space-y-1 min-w-0", message.isOwn && "text-right")}>
                    <div
                      className={cn(
                        "px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 break-words",
                        message.isOwn
                          ? "bg-violet-600 text-white"
                          : "bg-white text-gray-900 border border-gray-200 hover:shadow-md",
                      )}
                    >
                      <p className="text-sm leading-relaxed break-words">{message.content}</p>
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.reactions.map((reaction, index) => (
                            <span
                              key={index}
                              className={cn(
                                "text-xs px-2 py-1 rounded-full cursor-pointer hover:scale-110 transition-transform",
                                message.isOwn ? "bg-white/20" : "bg-gray-100",
                              )}
                            >
                              {reaction.emoji} {reaction.count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      className={cn(
                        "flex items-center space-x-2 text-xs text-gray-500",
                        message.isOwn && "justify-end",
                      )}
                    >
                      <span className="whitespace-nowrap">{message.timestamp}</span>
                      {message.isEdited && <span>• edited</span>}
                      {message.isOwn && (
                        <span
                          className={cn(
                            "flex items-center",
                            message.status === "read" && "text-violet-600",
                            message.status === "delivered" && "text-gray-400",
                            message.status === "sent" && "text-gray-300",
                          )}
                        >
                          ✓✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Sticky Message Input */}
          <div className="sticky bottom-0 flex-shrink-0 p-4 border-t border-gray-100 bg-white shadow-lg">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end space-x-3">
                <div className="flex space-x-1 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-700">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Attach file</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-700">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add image</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex-1 relative min-w-0">
                  <Input
                    placeholder={`Message ${selectedConversation.name}...`}
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className="pr-20 border-gray-200 focus:border-violet-300 focus:ring-violet-200 rounded-full bg-gray-50 min-h-[44px]"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-700 h-8 w-8 p-0">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add emoji</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsRecording(!isRecording)}
                          className={cn(
                            "h-8 w-8 p-0",
                            isRecording ? "text-red-600 hover:text-red-700" : "text-gray-600 hover:text-violet-700",
                          )}
                        >
                          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isRecording ? "Stop recording" : "Voice message"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 h-11 min-w-[44px] flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>Press Enter to send, Shift + Enter for new line</span>
                {isTyping && <span className="text-violet-600">You are typing...</span>}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-xl font-semibold text-violet-700">
                  ConnectSpace
                </Link>
                <Separator orientation="vertical" className="h-6" />
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                  <Link href="/dashboard" className="hover:text-violet-700 transition-colors">
                    Dashboard
                  </Link>
                  <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                  <span className="font-medium text-gray-900">Messages</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <ChatNotifications />
                <Link href="/discover">
                  <Button variant="ghost" className="text-gray-600 hover:text-violet-700">
                    Discover
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content - Side by Side Layout */}
        <div className="max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 h-full">
            {/* Conversation List - Hidden on mobile, shown in sheet */}
            <div className="hidden md:block md:col-span-4 lg:col-span-3 border-r border-gray-200 h-full overflow-hidden">
              <ConversationList />
            </div>

            {/* Chat Interface */}
            <div className="col-span-1 md:col-span-8 lg:col-span-9 h-full overflow-hidden">
              <ChatInterface />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
