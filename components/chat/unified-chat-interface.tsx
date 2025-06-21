"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Search, MessageCircle, Hash, Plus, Settings, Bell, BellOff, Archive, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface UnifiedChatInterfaceProps {
  onSelectChat: (chatId: string, chatType: "direct" | "group") => void
  selectedChatId?: string
  selectedChatType?: "direct" | "group"
  className?: string
}

interface ChatItem {
  id: string
  type: "direct" | "group"
  name: string
  lastMessage: string
  timestamp: string
  unread: number
  avatar?: string
  isOnline?: boolean
  isGroup?: boolean
  communityId?: string
  participants?: number
  isMuted?: boolean
  isPinned?: boolean
  isArchived?: boolean
}

export function UnifiedChatInterface({
  onSelectChat,
  selectedChatId,
  selectedChatType,
  className,
}: UnifiedChatInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "groups">("all")
  const [showArchived, setShowArchived] = useState(false)
  const [chats, setChats] = useState<ChatItem[]>([])

  useEffect(() => {
    // Mock chat data combining direct messages and group chats
    const mockChats: ChatItem[] = [
      // Direct Messages
      {
        id: "dm-1",
        type: "direct",
        name: "Sarah Chen",
        lastMessage: "Thanks for the great discussion today!",
        timestamp: "2 min ago",
        unread: 2,
        avatar: "/placeholder.svg?height=40&width=40",
        isOnline: true,
        isPinned: true,
      },
      {
        id: "dm-2",
        type: "direct",
        name: "Alex Rodriguez",
        lastMessage: "Let's schedule that coffee meeting",
        timestamp: "3 hours ago",
        unread: 1,
        avatar: "/placeholder.svg?height=40&width=40",
        isOnline: true,
      },
      {
        id: "dm-3",
        type: "direct",
        name: "Lisa Wang",
        lastMessage: "The presentation slides look great",
        timestamp: "1 day ago",
        unread: 0,
        avatar: "/placeholder.svg?height=40&width=40",
        isOnline: false,
      },
      // Group Chats
      {
        id: "group-1",
        type: "group",
        name: "Tech Innovators",
        lastMessage: "Mike: The event was amazing, thanks everyone!",
        timestamp: "1 hour ago",
        unread: 3,
        avatar: "/placeholder.svg?height=40&width=40",
        isGroup: true,
        communityId: "tech-innovators",
        participants: 1247,
        isPinned: true,
      },
      {
        id: "group-2",
        type: "group",
        name: "Creative Writers",
        lastMessage: "Emma: New writing prompt is up!",
        timestamp: "5 hours ago",
        unread: 0,
        avatar: "/placeholder.svg?height=40&width=40",
        isGroup: true,
        communityId: "creative-writers",
        participants: 892,
      },
      {
        id: "group-3",
        type: "group",
        name: "Startup Founders",
        lastMessage: "David: Looking for feedback on my pitch deck",
        timestamp: "2 days ago",
        unread: 5,
        avatar: "/placeholder.svg?height=40&width=40",
        isGroup: true,
        communityId: "startup-founders",
        participants: 456,
        isMuted: true,
      },
      {
        id: "group-4",
        type: "group",
        name: "AI Enthusiasts",
        lastMessage: "Rachel: Check out this new research paper",
        timestamp: "3 days ago",
        unread: 0,
        avatar: "/placeholder.svg?height=40&width=40",
        isGroup: true,
        communityId: "ai-enthusiasts",
        participants: 234,
        isArchived: true,
      },
    ]

    setChats(mockChats)
  }, [])

  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || chat.type === activeTab.slice(0, -1) // Remove 's' from 'groups'
    const matchesArchived = showArchived ? chat.isArchived : !chat.isArchived
    return matchesSearch && matchesTab && matchesArchived
  })

  const pinnedChats = filteredChats.filter((chat) => chat.isPinned)
  const regularChats = filteredChats.filter((chat) => !chat.isPinned)

  const totalUnread = chats.reduce((sum, chat) => sum + (chat.isMuted ? 0 : chat.unread), 0)

  const handleChatSelect = (chat: ChatItem) => {
    onSelectChat(chat.id, chat.type)
  }

  const toggleMute = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, isMuted: !chat.isMuted } : chat)))
  }

  const togglePin = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat)))
  }

  const toggleArchive = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, isArchived: !chat.isArchived } : chat)))
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-violet-600" />
            Messages
            {totalUnread > 0 && <Badge className="bg-violet-700 text-white rounded-full text-xs">{totalUnread}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className={cn("text-gray-600", showArchived && "text-violet-600 bg-violet-50")}
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200 focus:border-violet-300 focus:ring-violet-200"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-50">
            <TabsTrigger value="all" className="text-sm">
              All ({chats.filter((c) => !c.isArchived).length})
            </TabsTrigger>
            <TabsTrigger value="direct" className="text-sm">
              <MessageCircle className="h-4 w-4 mr-1" />
              Direct ({chats.filter((c) => c.type === "direct" && !c.isArchived).length})
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-sm">
              <Hash className="h-4 w-4 mr-1" />
              Groups ({chats.filter((c) => c.type === "group" && !c.isArchived).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-1">
            {/* Pinned Chats */}
            {pinnedChats.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <Star className="h-3 w-3" />
                  Pinned
                </div>
                {pinnedChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isSelected={selectedChatId === chat.id && selectedChatType === chat.type}
                    onSelect={() => handleChatSelect(chat)}
                    onToggleMute={(e) => toggleMute(chat.id, e)}
                    onTogglePin={(e) => togglePin(chat.id, e)}
                    onToggleArchive={(e) => toggleArchive(chat.id, e)}
                  />
                ))}
                {regularChats.length > 0 && <Separator className="my-2" />}
              </>
            )}

            {/* Regular Chats */}
            {regularChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isSelected={selectedChatId === chat.id && selectedChatType === chat.type}
                onSelect={() => handleChatSelect(chat)}
                onToggleMute={(e) => toggleMute(chat.id, e)}
                onTogglePin={(e) => togglePin(chat.id, e)}
                onToggleArchive={(e) => toggleArchive(chat.id, e)}
              />
            ))}

            {filteredChats.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">
                  {searchQuery
                    ? "No conversations found"
                    : showArchived
                      ? "No archived conversations"
                      : "No conversations yet"}
                </p>
                {!searchQuery && !showArchived && (
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Start a conversation
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface ChatItemProps {
  chat: ChatItem
  isSelected: boolean
  onSelect: () => void
  onToggleMute: (e: React.MouseEvent) => void
  onTogglePin: (e: React.MouseEvent) => void
  onToggleArchive: (e: React.MouseEvent) => void
}

function ChatItem({ chat, isSelected, onSelect, onToggleMute, onTogglePin, onToggleArchive }: ChatItemProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group p-3 cursor-pointer hover:bg-violet-50 transition-colors rounded-lg border border-transparent",
        isSelected && "bg-violet-50 border-violet-200",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={chat.avatar || "/placeholder.svg"} />
            <AvatarFallback>{chat.name[0]}</AvatarFallback>
          </Avatar>
          {chat.type === "direct" && chat.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
          {chat.type === "group" && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-violet-600 rounded-full border-2 border-white flex items-center justify-center">
              <Hash className="h-2 w-2 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate text-gray-900">{chat.name}</h4>
              {chat.isPinned && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
              {chat.isMuted && <BellOff className="h-3 w-3 text-gray-400" />}
              {chat.type === "group" && (
                <Badge variant="secondary" className="text-xs border-gray-200 text-gray-600">
                  {chat.participants}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">{chat.timestamp}</span>
              {chat.unread > 0 && !chat.isMuted && (
                <Badge className="bg-violet-700 text-white rounded-full text-xs min-w-[18px] h-[18px] flex items-center justify-center">
                  {chat.unread > 99 ? "99+" : chat.unread}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 truncate flex-1">{chat.lastMessage}</p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onTogglePin}
                className="h-6 w-6 p-0 text-gray-400 hover:text-yellow-500"
              >
                <Star className={cn("h-3 w-3", chat.isPinned && "fill-current text-yellow-500")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMute}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                {chat.isMuted ? <BellOff className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleArchive}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <Archive className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
