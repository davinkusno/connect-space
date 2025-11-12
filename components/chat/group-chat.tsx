"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Send,
  Smile,
  Paperclip,
  ImageIcon,
  MoreHorizontal,
  Users,
  MessageCircle,
  Reply,
  Pin,
  Flag,
  UserPlus,
  Settings,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface GroupChatProps {
  communityId: string
  communityName: string
  isMinimized?: boolean
  onMinimize?: () => void
  onMaximize?: () => void
  onStartDirectMessage?: (userId: string, userName: string) => void
  className?: string
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: Date
  type: "text" | "image" | "file" | "system"
  reactions?: { emoji: string; users: string[]; count: number }[]
  replyTo?: string
  isPinned?: boolean
  isEdited?: boolean
}

interface OnlineUser {
  id: string
  name: string
  avatar: string
  status: "online" | "away" | "busy" | "offline"
  lastSeen?: Date
  isTyping?: boolean
}

export function GroupChat({
  communityId,
  communityName,
  isMinimized = false,
  onMinimize,
  onMaximize,
  onStartDirectMessage,
  className,
}: GroupChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isTyping, setIsTyping] = useState<string[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mock current user
  const currentUser = {
    id: "current-user",
    name: "You",
    avatar: "/placeholder.svg?height=32&width=32",
  }

  // Initialize mock data
  useEffect(() => {
    // Mock online users
    const mockUsers: OnlineUser[] = [
      {
        id: "user-1",
        name: "Sarah Chen",
        avatar: "/placeholder.svg?height=32&width=32",
        status: "online",
      },
      {
        id: "user-2",
        name: "Mike Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
        status: "online",
      },
      {
        id: "user-3",
        name: "Lisa Wang",
        avatar: "/placeholder.svg?height=32&width=32",
        status: "away",
        lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
      },
      {
        id: "user-4",
        name: "Alex Rodriguez",
        avatar: "/placeholder.svg?height=32&width=32",
        status: "busy",
      },
      {
        id: "user-5",
        name: "Emma Thompson",
        avatar: "/placeholder.svg?height=32&width=32",
        status: "offline",
        lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
      },
    ]

    // Mock chat messages
    const mockMessages: ChatMessage[] = [
      {
        id: "msg-1",
        userId: "user-1",
        userName: "Sarah Chen",
        userAvatar: "/placeholder.svg?height=32&width=32",
        content: "Hey everyone! Welcome to the Tech Innovators group chat 🚀",
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        type: "text",
        reactions: [
          { emoji: "👋", users: ["user-2", "user-3"], count: 2 },
          { emoji: "🚀", users: ["user-4"], count: 1 },
        ],
        isPinned: true,
      },
      {
        id: "msg-2",
        userId: "user-2",
        userName: "Mike Johnson",
        userAvatar: "/placeholder.svg?height=32&width=32",
        content: "Thanks Sarah! Excited to be here. Looking forward to our upcoming hackathon!",
        timestamp: new Date(Date.now() - 7000000),
        type: "text",
        reactions: [{ emoji: "💯", users: ["user-1", "user-3", "user-4"], count: 3 }],
      },
      {
        id: "msg-3",
        userId: "system",
        userName: "System",
        userAvatar: "",
        content: "Lisa Wang joined the chat",
        timestamp: new Date(Date.now() - 6800000),
        type: "system",
      },
      {
        id: "msg-4",
        userId: "user-3",
        userName: "Lisa Wang",
        userAvatar: "/placeholder.svg?height=32&width=32",
        content: "Hi everyone! Just saw the event announcement. Count me in! 🙋‍♀️",
        timestamp: new Date(Date.now() - 6600000),
        type: "text",
        replyTo: "msg-2",
      },
      {
        id: "msg-5",
        userId: "user-4",
        userName: "Alex Rodriguez",
        userAvatar: "/placeholder.svg?height=32&width=32",
        content:
          "Has anyone worked with the new React 18 features? I'm particularly interested in concurrent rendering.",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        type: "text",
      },
      {
        id: "msg-6",
        userId: "user-5",
        userName: "Emma Thompson",
        userAvatar: "/placeholder.svg?height=32&width=32",
        content:
          "Yes! I've been experimenting with Suspense and it's amazing. Happy to share some examples if anyone's interested.",
        timestamp: new Date(Date.now() - 3400000),
        type: "text",
        replyTo: "msg-5",
      },
      {
        id: "msg-7",
        userId: "user-1",
        userName: "Sarah Chen",
        userAvatar: "/placeholder.svg?height=32&width=32",
        content: "That would be great Emma! Maybe we can do a mini-session during our next meetup?",
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        type: "text",
      },
    ]

    setOnlineUsers(mockUsers)
    setMessages(mockMessages)
    setIsConnected(true)

    // Simulate typing indicators
    const typingInterval = setInterval(() => {
      const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)]
      if (Math.random() > 0.8) {
        setIsTyping((prev) => {
          if (prev.includes(randomUser.name)) return prev
          return [...prev, randomUser.name]
        })
        setTimeout(() => {
          setIsTyping((prev) => prev.filter((name) => name !== randomUser.name))
        }, 3000)
      }
    }, 10000)

    return () => clearInterval(typingInterval)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: newMessage,
      timestamp: new Date(),
      type: "text",
      replyTo: replyingTo || undefined,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
    setReplyingTo(null)

    // Simulate message delivery
    setTimeout(() => {
      // In a real app, this would be handled by the WebSocket connection
      console.log("Message sent to server:", message)
    }, 100)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || []
          const existingReaction = reactions.find((r) => r.emoji === emoji)

          if (existingReaction) {
            if (existingReaction.users.includes(currentUser.id)) {
              // Remove reaction
              existingReaction.users = existingReaction.users.filter((id) => id !== currentUser.id)
              existingReaction.count = existingReaction.users.length
              if (existingReaction.count === 0) {
                return { ...msg, reactions: reactions.filter((r) => r.emoji !== emoji) }
              }
            } else {
              // Add reaction
              existingReaction.users.push(currentUser.id)
              existingReaction.count = existingReaction.users.length
            }
          } else {
            // New reaction
            reactions.push({ emoji, users: [currentUser.id], count: 1 })
          }

          return { ...msg, reactions: [...reactions] }
        }
        return msg
      }),
    )
  }

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId)
    inputRef.current?.focus()
  }

  const handleStartDirectMessage = (userId: string, userName: string) => {
    onStartDirectMessage?.(userId, userName)
  }

  const getStatusColor = (status: OnlineUser["status"]) => {
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const replyingToMessage = replyingTo ? messages.find((m) => m.id === replyingTo) : null

  if (isMinimized) {
    return (
      <Card className={cn("fixed bottom-4 right-4 w-80 shadow-lg border-violet-200", className)}>
        <CardHeader className="p-3 cursor-pointer" onClick={onMaximize}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <MessageCircle className="h-5 w-5 text-violet-600" />
                {isConnected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />}
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{communityName}</CardTitle>
                <p className="text-xs text-gray-500">
                  {onlineUsers.filter((u) => u.status === "online").length} online
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onMaximize?.()
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className={cn("flex flex-col h-[600px] border-violet-200", className)}>
        {/* Chat Header */}
        <CardHeader className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <MessageCircle className="h-6 w-6 text-violet-600" />
                {isConnected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />}
              </div>
              <div>
                <CardTitle className="text-lg font-medium">{communityName} Chat</CardTitle>
                <p className="text-sm text-gray-500">
                  {onlineUsers.filter((u) => u.status === "online").length} online • {onlineUsers.length} members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    className={isMuted ? "text-red-500" : "text-gray-600"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMuted ? "Unmute notifications" : "Mute notifications"}</p>
                </TooltipContent>
              </Tooltip>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-600">
                    <Users className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium">
                      Online Members ({onlineUsers.filter((u) => u.status === "online").length})
                    </h4>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {onlineUsers
                          .sort((a, b) => {
                            const statusOrder = { online: 0, away: 1, busy: 2, offline: 3 }
                            return statusOrder[a.status] - statusOrder[b.status]
                          })
                          .map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div
                                    className={cn(
                                      "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                                      getStatusColor(user.status),
                                    )}
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{user.name}</p>
                                  <p className="text-xs text-gray-500 capitalize">
                                    {user.status === "offline" && user.lastSeen
                                      ? formatLastSeen(user.lastSeen)
                                      : user.status}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartDirectMessage(user.id, user.name)}
                                className="text-violet-600 hover:text-violet-700"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
              {onMinimize && (
                <Button variant="ghost" size="sm" onClick={onMinimize} className="text-gray-600">
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-600">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="end">
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Chat Settings
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" size="sm">
                      <Flag className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={cn("group", message.isPinned && "bg-violet-50 p-3 rounded-lg")}>
                  {message.isPinned && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-violet-600">
                      <Pin className="h-3 w-3" />
                      Pinned message
                    </div>
                  )}

                  {message.type === "system" ? (
                    <div className="text-center text-sm text-gray-500 py-2">{message.content}</div>
                  ) : (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={message.userAvatar || "/placeholder.svg"} />
                        <AvatarFallback>{message.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.userName}</span>
                          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                          {message.isEdited && (
                            <Badge variant="secondary" className="text-xs">
                              edited
                            </Badge>
                          )}
                        </div>

                        {message.replyTo && (
                          <div className="mb-2 p-2 bg-gray-50 rounded border-l-2 border-violet-200">
                            <p className="text-xs text-gray-600">
                              Replying to {messages.find((m) => m.id === message.replyTo)?.userName}
                            </p>
                            <p className="text-sm text-gray-800 truncate">
                              {messages.find((m) => m.id === message.replyTo)?.content}
                            </p>
                          </div>
                        )}

                        <p className="text-sm text-gray-900 leading-relaxed">{message.content}</p>

                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.reactions.map((reaction) => (
                              <button
                                key={reaction.emoji}
                                onClick={() => handleReaction(message.id, reaction.emoji)}
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors",
                                  reaction.users.includes(currentUser.id)
                                    ? "bg-violet-100 border-violet-200 text-violet-700"
                                    : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200",
                                )}
                              >
                                <span>{reaction.emoji}</span>
                                <span>{reaction.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-gray-500">
                                <Smile className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2">
                              <div className="grid grid-cols-6 gap-2">
                                {["👍", "❤️", "😂", "😮", "😢", "😡", "🚀", "🎉", "👏", "🔥", "💯", "✨"].map(
                                  (emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => {
                                        handleReaction(message.id, emoji)
                                      }}
                                      className="p-2 hover:bg-gray-100 rounded text-lg"
                                    >
                                      {emoji}
                                    </button>
                                  ),
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-gray-500"
                            onClick={() => handleReply(message.id)}
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-gray-500"
                            onClick={() => handleStartDirectMessage(message.userId, message.userName)}
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicators */}
              {isTyping.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                  <span>
                    {isTyping.length === 1
                      ? `${isTyping[0]} is typing...`
                      : `${isTyping.slice(0, -1).join(", ")} and ${isTyping[isTyping.length - 1]} are typing...`}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        <div className="border-t border-gray-100 p-4">
          {replyingToMessage && (
            <div className="mb-3 p-2 bg-violet-50 rounded border-l-2 border-violet-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-violet-600">Replying to {replyingToMessage.userName}</p>
                  <p className="text-sm text-gray-800 truncate">{replyingToMessage.content}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="text-gray-500">
                  ✕
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="pr-12 border-gray-200 focus:border-violet-300 focus:ring-violet-200"
              />
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-600"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      "😀",
                      "😃",
                      "😄",
                      "😁",
                      "😆",
                      "😅",
                      "😂",
                      "🤣",
                      "😊",
                      "😇",
                      "🙂",
                      "🙃",
                      "😉",
                      "😌",
                      "😍",
                      "🥰",
                      "😘",
                      "😗",
                      "😙",
                      "😚",
                      "😋",
                      "😛",
                      "😝",
                      "😜",
                      "🤪",
                      "🤨",
                      "🧐",
                      "🤓",
                      "😎",
                      "🤩",
                      "🥳",
                      "😏",
                      "😒",
                      "😞",
                      "😔",
                      "😟",
                      "😕",
                    ].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setNewMessage((prev) => prev + emoji)
                          setShowEmojiPicker(false)
                        }}
                        className="p-2 hover:bg-gray-100 rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-violet-700 hover:bg-violet-800 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  )
}
