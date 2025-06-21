"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MessageCircle, Send, Minimize2, X, Users, Hash, Smile, Paperclip, Pin } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingChatProps {
  communityId: string
  communityName: string
  isOpen: boolean
  isMinimized: boolean
  onToggle: () => void
  onMinimize: () => void
  onClose: () => void
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
  type: "text" | "system"
  isPinned?: boolean
}

interface OnlineUser {
  id: string
  name: string
  avatar: string
  status: "online" | "away" | "busy" | "offline"
}

export function FloatingChat({
  communityId,
  communityName,
  isOpen,
  isMinimized,
  onToggle,
  onMinimize,
  onClose,
  onStartDirectMessage,
  className,
}: FloatingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [showMembers, setShowMembers] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Mock data
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
        },
      ]

      const mockMessages: ChatMessage[] = [
        {
          id: "msg-1",
          userId: "user-1",
          userName: "Sarah Chen",
          userAvatar: "/placeholder.svg?height=32&width=32",
          content: "Welcome to the community chat! 🎉",
          timestamp: new Date(Date.now() - 3600000),
          type: "text",
          isPinned: true,
        },
        {
          id: "msg-2",
          userId: "user-2",
          userName: "Mike Johnson",
          userAvatar: "/placeholder.svg?height=32&width=32",
          content: "Great to have everyone here! Looking forward to our discussions.",
          timestamp: new Date(Date.now() - 1800000),
          type: "text",
        },
        {
          id: "msg-3",
          userId: "user-3",
          userName: "Lisa Wang",
          userAvatar: "/placeholder.svg?height=32&width=32",
          content: "Has anyone seen the latest updates on the project?",
          timestamp: new Date(Date.now() - 300000),
          type: "text",
        },
      ]

      setOnlineUsers(mockUsers)
      setMessages(mockMessages)
    }
  }, [isOpen])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: "current-user",
      userName: "You",
      userAvatar: "/placeholder.svg?height=32&width=32",
      content: newMessage,
      timestamp: new Date(),
      type: "text",
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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

  if (!isOpen) return null

  if (isMinimized) {
    return (
      <TooltipProvider>
        <div className={cn("fixed bottom-6 right-6 z-50", className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onToggle}
                className="h-14 w-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Open {communityName} chat</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <Card className="w-96 h-[500px] shadow-2xl border-violet-200 overflow-hidden">
          {/* Chat Header */}
          <CardHeader className="p-4 bg-violet-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Hash className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{communityName}</h3>
                  <p className="text-xs text-violet-100">
                    {onlineUsers.filter((u) => u.status === "online").length} online
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMembers(!showMembers)}
                      className="text-white hover:bg-violet-700 h-8 w-8 p-0"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View members</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onMinimize}
                      className="text-white hover:bg-violet-700 h-8 w-8 p-0"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Minimize</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="text-white hover:bg-violet-700 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close chat</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-[calc(500px-80px)]">
            <div className="flex flex-1 overflow-hidden">
              {/* Messages Area */}
              <div className={cn("flex flex-col", showMembers ? "flex-1" : "w-full")}>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={cn("group", message.isPinned && "bg-violet-50 p-2 rounded-lg")}>
                        {message.isPinned && (
                          <div className="flex items-center gap-1 mb-2 text-xs text-violet-600">
                            <Pin className="h-3 w-3" />
                            Pinned
                          </div>
                        )}

                        {message.type === "system" ? (
                          <div className="text-center text-xs text-gray-500 py-1">{message.content}</div>
                        ) : (
                          <div className="flex space-x-2">
                            <Avatar className="h-6 w-6 mt-1">
                              <AvatarImage src={message.userAvatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">{message.userName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-xs text-gray-900">{message.userName}</span>
                                <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                              </div>
                              <p className="text-sm text-gray-800 leading-relaxed">{message.content}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-600 h-8 w-8 p-0">
                      <Paperclip className="h-3 w-3" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="text-sm border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-600 h-6 w-6 p-0"
                      >
                        <Smile className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700 text-white h-8 w-8 p-0"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Members Sidebar */}
              {showMembers && (
                <div className="w-32 border-l border-gray-100 bg-gray-50">
                  <div className="p-3">
                    <h4 className="text-xs font-medium text-gray-900 mb-3">
                      Online ({onlineUsers.filter((u) => u.status === "online").length})
                    </h4>
                    <div className="space-y-2">
                      {onlineUsers
                        .filter((u) => u.status === "online")
                        .map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 cursor-pointer"
                            onClick={() => onStartDirectMessage?.(user.id, user.name)}
                          >
                            <div className="relative">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                              </Avatar>
                              <div
                                className={cn(
                                  "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white",
                                  getStatusColor(user.status),
                                )}
                              />
                            </div>
                            <span className="text-xs text-gray-900 truncate">{user.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
