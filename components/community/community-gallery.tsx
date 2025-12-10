"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InViewTransition } from "@/components/ui/content-transitions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/loading-indicators"
import { ButtonPulse, HoverScale } from "@/components/ui/micro-interactions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Download, Eye, Film, Filter, Flag, Grid3x3, Heart, ImageIcon, List, MessageCircle, Play, Plus, Search, Share2, SortDesc, Upload, X
} from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

interface MediaItem {
  id: string
  type: "image" | "video"
  url: string
  thumbnail?: string
  title: string
  description: string
  uploadedBy: {
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
  user: {
    name: string
    avatar: string
  }
  text: string
  timestamp: string
  likes: number
}

interface CommunityGalleryProps {
  communityId: string
  isAdmin?: boolean
  isMember?: boolean
}

export function CommunityGallery({ communityId, isAdmin = false, isMember = false }: CommunityGalleryProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMediaType, setSelectedMediaType] = useState<"all" | "image" | "video">("all")
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "views">("recent")
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [newComment, setNewComment] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)

  // Mock data for gallery items
  const galleryItems: MediaItem[] = [
    {
      id: "1",
      type: "image",
      url: "/placeholder.svg?height=600&width=800",
      title: "Tech Innovators Hackathon 2023",
      description: "Our community members collaborating during the annual hackathon event.",
      uploadedBy: {
        name: "Sarah Chen",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      uploadDate: "2023-11-15",
      likes: 42,
      comments: 8,
      views: 156,
      tags: ["hackathon", "coding", "teamwork"],
      isLiked: true,
    },
    {
      id: "2",
      type: "image",
      url: "/placeholder.svg?height=600&width=800",
      title: "AI Workshop Presentation",
      description: "Dr. Johnson presenting the latest advancements in machine learning algorithms.",
      uploadedBy: {
        name: "Mike Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      uploadDate: "2023-10-28",
      likes: 36,
      comments: 12,
      views: 203,
      tags: ["AI", "workshop", "education"],
    },
    {
      id: "3",
      type: "video",
      url: "/placeholder.svg?height=600&width=800", // In a real app, this would be a video URL
      thumbnail: "/placeholder.svg?height=400&width=600",
      title: "Interview with Tech Startup Founder",
      description: "An exclusive interview with the founder of a promising local tech startup.",
      uploadedBy: {
        name: "Lisa Wang",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      uploadDate: "2023-11-05",
      likes: 28,
      comments: 6,
      views: 189,
      tags: ["interview", "startup", "entrepreneurship"],
    },
    {
      id: "4",
      type: "image",
      url: "/placeholder.svg?height=600&width=800",
      title: "Networking Mixer Event",
      description: "Community members connecting at our monthly networking event.",
      uploadedBy: {
        name: "Alex Rodriguez",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      uploadDate: "2023-11-10",
      likes: 31,
      comments: 4,
      views: 142,
      tags: ["networking", "community", "social"],
    },
    {
      id: "5",
      type: "video",
      url: "/placeholder.svg?height=600&width=800", // In a real app, this would be a video URL
      thumbnail: "/placeholder.svg?height=400&width=600",
      title: "Web Development Tutorial: React Hooks",
      description: "A step-by-step tutorial on using React Hooks for state management.",
      uploadedBy: {
        name: "Emma Thompson",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      uploadDate: "2023-10-20",
      likes: 54,
      comments: 15,
      views: 312,
      tags: ["tutorial", "react", "webdev"],
    },
    {
      id: "6",
      type: "image",
      url: "/placeholder.svg?height=600&width=800",
      title: "Community Award Ceremony",
      description: "Celebrating our outstanding community contributors at the annual awards.",
      uploadedBy: {
        name: "David Kim",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      uploadDate: "2023-09-30",
      likes: 47,
      comments: 9,
      views: 178,
      tags: ["awards", "celebration", "recognition"],
    },
  ]

  // Mock comments for the selected media
  const comments: Comment[] = [
    {
      id: "1",
      user: {
        name: "Alex Rodriguez",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      text: "This was such an amazing event! Looking forward to the next one.",
      timestamp: "2 days ago",
      likes: 5,
    },
    {
      id: "2",
      user: {
        name: "Emma Thompson",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      text: "Great photo! I can see myself in the background working with the team.",
      timestamp: "1 day ago",
      likes: 3,
    },
    {
      id: "3",
      user: {
        name: "David Kim",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      text: "The hackathon projects this year were incredibly innovative.",
      timestamp: "12 hours ago",
      likes: 2,
    },
  ]

  // Filter gallery items based on search, media type, and sort
  const filteredItems = galleryItems
    .filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesType = selectedMediaType === "all" || item.type === selectedMediaType

      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      } else if (sortBy === "popular") {
        return b.likes - a.likes
      } else {
        // views
        return b.views - a.views
      }
    })

  const handleMediaClick = (media: MediaItem) => {
    setSelectedMedia(media)
    // For videos, we need to reset the video when opened
    if (media.type === "video" && videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }

  const handleCloseMedia = () => {
    setSelectedMedia(null)
    setNewComment("")
  }

  const handleLikeMedia = (mediaId: string) => {
    // In a real app, this would call an API to like/unlike the media
    console.log(`Toggling like for media ${mediaId}`)
  }

  const handleSubmitComment = () => {
    if (newComment.trim() && selectedMedia) {
      setIsSubmittingComment(true)
      // In a real app, this would call an API to submit the comment
      setTimeout(() => {
        console.log(`Submitting comment for media ${selectedMedia.id}: ${newComment}`)
        setNewComment("")
        setIsSubmittingComment(false)
      }, 1000)
    }
  }

  const handleUpload = () => {
    setIsUploading(true)
    // In a real app, this would handle the actual file upload
    setTimeout(() => {
      setIsUploading(false)
      setShowUploadDialog(false)
      // Would add the new media to the gallery
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Gallery Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Community Gallery</h2>
        <div className="flex items-center gap-3">
          {(isAdmin || isMember) && (
            <ButtonPulse pulseColor="rgba(124, 58, 237, 0.3)">
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-violet-700 hover:bg-violet-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
            </ButtonPulse>
          )}
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className={viewMode === "grid" ? "rounded-none bg-violet-700 text-white" : "rounded-none"}
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className={viewMode === "list" ? "rounded-none bg-violet-700 text-white" : "rounded-none"}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search gallery..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200 focus:border-violet-300 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-violet-500"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedMediaType} onValueChange={(value) => setSelectedMediaType(value as any)}>
            <SelectTrigger className="w-[140px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Media Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Media</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[140px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <SortDesc className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Sort By" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Liked</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gallery Content */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4 text-gray-400">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No media found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : `No ${selectedMediaType === "all" ? "" : selectedMediaType} media has been uploaded yet.`}
          </p>
          {(isAdmin || isMember) && (
            <Button
              onClick={() => setShowUploadDialog(true)}
              variant="outline"
              className="mt-6 border-violet-200 hover:border-violet-300 hover:bg-violet-50 dark:border-violet-800 dark:hover:border-violet-700 dark:hover:bg-violet-900/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <InViewTransition key={item.id} effect="fade" delay={index * 50}>
              <HoverScale scale={1.02}>
                <Card
                  className="overflow-hidden border-gray-100 hover:border-violet-200 hover:shadow-md transition-all duration-300 dark:border-gray-700 dark:hover:border-violet-700"
                  onClick={() => handleMediaClick(item)}
                >
                  <div className="relative aspect-video cursor-pointer">
                    <Image
                      src={item.thumbnail || item.url}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-black/50 p-3 backdrop-blur-sm">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="outline"
                        className={`${
                          item.type === "image" ? "bg-blue-500 text-white border-0" : "bg-red-500 text-white border-0"
                        }`}
                      >
                        {item.type === "image" ? (
                          <ImageIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <Film className="h-3 w-3 mr-1" />
                        )}
                        {item.type}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">{item.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={item.uploadedBy.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{item.uploadedBy.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[100px]">{item.uploadedBy.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Heart
                            className={`h-3 w-3 ${item.isLiked ? "fill-red-500 text-red-500" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLikeMedia(item.id)
                            }}
                          />
                          {item.likes}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {item.comments}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {item.views}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverScale>
            </InViewTransition>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => (
            <InViewTransition key={item.id} effect="slide-up" delay={index * 50}>
              <Card
                className="border-gray-100 hover:border-violet-200 hover:shadow-md transition-all duration-300 dark:border-gray-700 dark:hover:border-violet-700"
                onClick={() => handleMediaClick(item)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={item.thumbnail || item.url}
                        alt={item.title}
                        fill
                        className="object-cover rounded-md"
                        sizes="96px"
                      />
                      {item.type === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-black/50 p-1 backdrop-blur-sm">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.title}</h3>
                        <Badge
                          variant="outline"
                          className={`${
                            item.type === "image" ? "bg-blue-500 text-white border-0" : "bg-red-500 text-white border-0"
                          }`}
                        >
                          {item.type === "image" ? (
                            <ImageIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <Film className="h-3 w-3 mr-1" />
                          )}
                          {item.type}
                        </Badge>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-1">{item.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={item.uploadedBy.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{item.uploadedBy.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{item.uploadedBy.name}</span>
                          <span>•</span>
                          <span>{new Date(item.uploadDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Heart
                              className={`h-3 w-3 ${item.isLiked ? "fill-red-500 text-red-500" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLikeMedia(item.id)
                              }}
                            />
                            {item.likes}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {item.comments}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {item.views}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </InViewTransition>
          ))}
        </div>
      )}

      {/* Media Viewer Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && handleCloseMedia()}>
        <DialogContent className="max-w-4xl w-full p-0 max-h-[90vh] overflow-hidden dark:bg-gray-900">
          <div className="flex flex-col md:flex-row h-full">
            {/* Media Display */}
            <div className="md:w-2/3 bg-black flex items-center justify-center relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-black/20 z-10"
                onClick={handleCloseMedia}
              >
                <X className="h-5 w-5" />
              </Button>

              {selectedMedia?.type === "image" ? (
                <div className="relative w-full h-full min-h-[300px]">
                  <Image
                    src={selectedMedia.url || "/placeholder.svg"}
                    alt={selectedMedia.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 66vw"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video">
                  <video
                    ref={videoRef}
                    src={selectedMedia?.url}
                    poster={selectedMedia?.thumbnail}
                    controls
                    className="w-full h-full"
                  />
                </div>
              )}
            </div>

            {/* Media Info and Comments */}
            <div className="md:w-1/3 p-6 flex flex-col h-full max-h-[90vh] md:max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-medium text-gray-900 dark:text-gray-100">
                  {selectedMedia?.title}
                </DialogTitle>
              </DialogHeader>

              <div className="flex items-center justify-between mt-2 mb-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedMedia?.uploadedBy.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{selectedMedia?.uploadedBy.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedMedia?.uploadedBy.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedMedia && new Date(selectedMedia.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    onClick={() => selectedMedia && handleLikeMedia(selectedMedia.id)}
                  >
                    <Heart className={`h-5 w-5 ${selectedMedia?.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">{selectedMedia?.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {selectedMedia?.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {selectedMedia?.likes} likes
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {selectedMedia?.comments} comments
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {selectedMedia?.views} views
                </div>
              </div>

              <Separator className="my-4 bg-gray-200 dark:bg-gray-700" />

              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Comments</h4>

              {/* Comments List */}
              <div className="space-y-4 flex-1 overflow-y-auto mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{comment.user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{comment.timestamp}</p>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-violet-700 dark:hover:text-violet-400 flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {comment.likes}
                        </button>
                        <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-violet-700 dark:hover:text-violet-400">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              {isMember && (
                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-violet-500"
                      />
                      <div className="flex justify-between items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                          <Flag className="h-4 w-4 mr-1" />
                          Report
                        </Button>
                        <ButtonPulse
                          disabled={!newComment.trim() || isSubmittingComment}
                          onClick={handleSubmitComment}
                          pulseColor="rgba(124, 58, 237, 0.3)"
                        >
                          <Button
                            disabled={!newComment.trim() || isSubmittingComment}
                            size="sm"
                            className="bg-violet-700 hover:bg-violet-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700"
                          >
                            {isSubmittingComment ? (
                              <>
                                <Spinner size="xs" className="mr-2 border-white" /> Posting...
                              </>
                            ) : (
                              <>
                                <MessageCircle className="h-4 w-4 mr-2" /> Comment
                              </>
                            )}
                          </Button>
                        </ButtonPulse>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-gray-900 dark:text-gray-100">Upload Media</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Drag and drop files here</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Support for images (JPG, PNG, GIF) and videos (MP4, MOV) up to 50MB
              </p>
              <Button
                variant="outline"
                className="border-violet-200 hover:border-violet-300 hover:bg-violet-50 dark:border-violet-800 dark:hover:border-violet-700 dark:hover:bg-violet-900/20"
              >
                Browse Files
              </Button>
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="privacy"
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
                >
                  Privacy & Sharing
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Enter a title for your media"
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-violet-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <Input
                    id="description"
                    placeholder="Add a description"
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-violet-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tags" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tags (comma separated)
                  </label>
                  <Input
                    id="tags"
                    placeholder="e.g. event, hackathon, coding"
                    className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-violet-500"
                  />
                </div>
              </TabsContent>
              <TabsContent value="privacy" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Who can see this?</label>
                  <Select defaultValue="community">
                    <SelectTrigger className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="community">All community members</SelectItem>
                      <SelectItem value="public">Public (anyone)</SelectItem>
                      <SelectItem value="private">Only me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow comments?</label>
                  <Select defaultValue="yes">
                    <SelectTrigger className="border-gray-200 focus:border-violet-300 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800">
                      <SelectValue placeholder="Select comment setting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes, allow comments</SelectItem>
                      <SelectItem value="no">No, disable comments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
              className="border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
            >
              Cancel
            </Button>
            <ButtonPulse pulseColor="rgba(124, 58, 237, 0.3)">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-violet-700 hover:bg-violet-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700"
              >
                {isUploading ? (
                  <>
                    <Spinner size="sm" className="mr-2 border-white" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" /> Upload
                  </>
                )}
              </Button>
            </ButtonPulse>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
