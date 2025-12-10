"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
    Calendar, Download, Eye, Flag, Heart, Maximize, MessageCircle, Pause, Play, Send, Share2, Volume2,
    VolumeX, X
} from "lucide-react"
import Image from "next/image"
import { useState } from "react"

interface MediaItem {
  id: string
  type: "image" | "video"
  url: string
  thumbnail?: string
  title: string
  description?: string
  author: {
    name: string
    avatar: string
  }
  uploadDate: string
  likes: number
  comments: number
  views: number
  tags: string[]
  isLiked?: boolean
}

interface Comment {
  id: string
  author: {
    name: string
    avatar: string
  }
  content: string
  timestamp: string
  likes: number
  isLiked?: boolean
}

interface MediaViewerProps {
  media: MediaItem
  onClose: () => void
  onLike: (mediaId: string) => void
  onShare: (mediaId: string) => void
}

export function MediaViewer({ media, onClose, onLike, onShare }: MediaViewerProps) {
  const [newComment, setNewComment] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)

  // Mock comments data
  const comments: Comment[] = [
    {
      id: "1",
      author: { name: "Emma Thompson", avatar: "/placeholder.svg?height=32&width=32" },
      content: "Great shot! The lighting is perfect.",
      timestamp: "2 hours ago",
      likes: 5,
      isLiked: true,
    },
    {
      id: "2",
      author: { name: "David Kim", avatar: "/placeholder.svg?height=32&width=32" },
      content: "Thanks for sharing this with the community. Very inspiring!",
      timestamp: "4 hours ago",
      likes: 3,
    },
    {
      id: "3",
      author: { name: "Alex Rodriguez", avatar: "/placeholder.svg?height=32&width=32" },
      content: "Looking forward to the next event like this one.",
      timestamp: "6 hours ago",
      likes: 2,
      isLiked: false,
    },
  ]

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      console.log("Submitting comment:", newComment)
      setNewComment("")
    }
  }

  const handleCommentLike = (commentId: string) => {
    console.log("Liked comment:", commentId)
  }

  const handleDownload = () => {
    console.log("Downloading media:", media.id)
  }

  const handleReport = () => {
    console.log("Reporting media:", media.id)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col lg:flex-row">
        {/* Media Display */}
        <div className="flex-1 relative bg-black flex items-center justify-center min-h-[300px] lg:min-h-[500px]">
          {media.type === "image" ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={media.url || "/placeholder.svg"}
                alt={media.title}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={media.url}
                poster={media.thumbnail}
                className="max-w-full max-h-full"
                controls={false}
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              {/* Video Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 bg-black/50 rounded-lg p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullscreen(true)}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={media.author.avatar || "/placeholder.svg"} />
                <AvatarFallback>{media.author.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{media.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">by {media.author.name}</p>
              </div>
            </div>

            {media.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{media.description}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {media.views} views
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(media.uploadDate).toLocaleDateString()}
              </div>
            </div>

            {/* Tags */}
            {media.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {media.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike(media.id)}
                  className={`${
                    media.isLiked
                      ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      : "text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  }`}
                >
                  <Heart className={`h-4 w-4 mr-1 ${media.isLiked ? "fill-current" : ""}`} />
                  {media.likes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {media.comments}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShare(media.id)}
                  className="text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-gray-600 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReport} className="text-gray-600 hover:text-red-600">
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Comments ({comments.length})</h4>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{comment.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {comment.author.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCommentLike(comment.id)}
                          className={`h-6 px-2 text-xs ${
                            comment.isLiked ? "text-red-600 hover:text-red-700" : "text-gray-500 hover:text-red-600"
                          }`}
                        >
                          <Heart className={`h-3 w-3 mr-1 ${comment.isLiked ? "fill-current" : ""}`} />
                          {comment.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Comment Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback className="text-xs">You</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none border-gray-200 focus:border-violet-300 focus:ring-violet-200 dark:bg-gray-800 dark:border-gray-700"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim()}
                      className="bg-violet-700 hover:bg-violet-800 text-white"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
