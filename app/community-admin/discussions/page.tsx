"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Calendar, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Pin, 
  ArrowLeft,
  Filter,
  SortAsc,
  SortDesc,
  X
} from "lucide-react"
import Link from "next/link"
import { CommunityAdminNav } from "@/components/navigation/community-admin-nav"

interface DiscussionTopic {
  id: string
  title: string
  content: string
  eventId: string
  eventTitle: string
  eventDate: string
  eventImage: string
  author: {
    name: string
    avatar: string
  }
  createdAt: string
  isPinned: boolean
  views: number
  likes: number
  replies: number
  tags: string[]
}

export default function CommunityDiscussionsPage() {
  const [discussions, setDiscussions] = useState<DiscussionTopic[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "title" | "event">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterBy, setFilterBy] = useState<"all" | "pinned" | "recent">("all")
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDiscussion, setEditingDiscussion] = useState<DiscussionTopic | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

  // Mock data
  const mockDiscussions: DiscussionTopic[] = [
    {
      id: "1",
      title: "Important: Event Schedule Update",
      content: "Due to technical requirements, we're moving the keynote presentation to 10:30 AM instead of 10:00 AM. All other sessions remain unchanged.",
      eventId: "1",
      eventTitle: "AI in Healthcare Summit 2024",
      eventDate: "2024-03-15",
      eventImage: "/placeholder.svg?height=200&width=300",
      author: {
        name: "HealthTech Admin",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      createdAt: "2024-03-14T10:30:00Z",
      isPinned: true,
      views: 47,
      likes: 12,
      replies: 3,
      tags: ["announcement", "schedule"]
    },
    {
      id: "2",
      title: "Welcome to our AI Workshop Series",
      content: "We're excited to kick off our comprehensive AI workshop series. This will cover machine learning fundamentals, healthcare applications, and hands-on coding sessions.",
      eventId: "2",
      eventTitle: "Machine Learning Workshop",
      eventDate: "2024-03-22",
      eventImage: "/placeholder.svg?height=200&width=300",
      author: {
        name: "HealthTech Admin",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      createdAt: "2024-03-21T14:00:00Z",
      isPinned: false,
      views: 23,
      likes: 8,
      replies: 1,
      tags: ["welcome", "workshop"]
    },
    {
      id: "3",
      title: "Networking Session Guidelines",
      content: "Please review the networking session guidelines before attending. We'll have structured networking activities and breakout rooms for different topics.",
      eventId: "3",
      eventTitle: "Digital Health Conference",
      eventDate: "2024-04-05",
      eventImage: "/placeholder.svg?height=200&width=300",
      author: {
        name: "HealthTech Admin",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      createdAt: "2024-04-03T09:15:00Z",
      isPinned: false,
      views: 31,
      likes: 5,
      replies: 2,
      tags: ["networking", "guidelines"]
    },
    {
      id: "4",
      title: "Pre-Event Preparation Checklist",
      content: "Make sure you have everything ready for tomorrow's event. Check your internet connection, download any required software, and review the agenda.",
      eventId: "1",
      eventTitle: "AI in Healthcare Summit 2024",
      eventDate: "2024-03-15",
      eventImage: "/placeholder.svg?height=200&width=300",
      author: {
        name: "HealthTech Admin",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      createdAt: "2024-03-13T16:45:00Z",
      isPinned: true,
      views: 89,
      likes: 15,
      replies: 7,
      tags: ["preparation", "checklist"]
    },
    {
      id: "5",
      title: "Post-Event Survey and Feedback",
      content: "Thank you for attending our event! Please take a moment to fill out our post-event survey. Your feedback helps us improve future events.",
      eventId: "4",
      eventTitle: "AI Ethics Symposium",
      eventDate: "2024-04-18",
      eventImage: "/placeholder.svg?height=200&width=300",
      author: {
        name: "HealthTech Admin",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      createdAt: "2024-04-19T11:20:00Z",
      isPinned: false,
      views: 67,
      likes: 9,
      replies: 4,
      tags: ["feedback", "survey"]
    }
  ]

  useEffect(() => {
    setDiscussions(mockDiscussions)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleEdit = (discussionId: string) => {
    const discussion = discussions.find(d => d.id === discussionId)
    if (discussion) {
      setEditingDiscussion(discussion)
      setEditTitle(discussion.title)
      setEditContent(discussion.content)
      setIsEditDialogOpen(true)
    }
  }

  const handleSaveEdit = () => {
    if (editingDiscussion) {
      setDiscussions(prev => prev.map(discussion => 
        discussion.id === editingDiscussion.id 
          ? { ...discussion, title: editTitle, content: editContent }
          : discussion
      ))
      setIsEditDialogOpen(false)
      setEditingDiscussion(null)
      setEditTitle("")
      setEditContent("")
    }
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingDiscussion(null)
    setEditTitle("")
    setEditContent("")
  }

  const handleDelete = (discussionId: string) => {
    console.log("Delete discussion:", discussionId)
    // TODO: Implement delete functionality
  }

  const handlePin = (discussionId: string) => {
    setDiscussions(prev => prev.map(discussion => 
      discussion.id === discussionId 
        ? { ...discussion, isPinned: !discussion.isPinned }
        : discussion
    ))
  }

  // Filter and sort discussions
  let filteredDiscussions = discussions

  // Apply search filter
  if (searchTerm) {
    filteredDiscussions = filteredDiscussions.filter(discussion =>
      discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discussion.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discussion.eventTitle.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Apply category filter
  if (filterBy === "pinned") {
    filteredDiscussions = filteredDiscussions.filter(discussion => discussion.isPinned)
  } else if (filterBy === "recent") {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    filteredDiscussions = filteredDiscussions.filter(discussion => 
      new Date(discussion.createdAt) > oneWeekAgo
    )
  }

  // Apply sorting
  filteredDiscussions.sort((a, b) => {
    let aValue: any, bValue: any

    if (sortBy === "date") {
      aValue = new Date(a.createdAt).getTime()
      bValue = new Date(b.createdAt).getTime()
    } else if (sortBy === "title") {
      aValue = a.title.toLowerCase()
      bValue = b.title.toLowerCase()
    } else if (sortBy === "event") {
      aValue = a.eventTitle.toLowerCase()
      bValue = b.eventTitle.toLowerCase()
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Sort pinned posts first
  filteredDiscussions.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return 0
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <CommunityAdminNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/community-admin">
            <Button variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Discussion Topics</h1>
          </div>
          <p className="text-gray-600">
            Manage all discussion topics and announcements across your community events
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search discussions, events, or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter */}
              <Select value={filterBy} onValueChange={(value: "all" | "pinned" | "recent") => setFilterBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  <SelectItem value="pinned">Pinned Only</SelectItem>
                  <SelectItem value="recent">Recent (7 days)</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value: "date" | "title" | "event") => setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="w-12"
              >
                {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Discussions List */}
        <div className="space-y-4">
          {filteredDiscussions.map((discussion) => (
            <Card key={discussion.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Event Image */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <img
                      src={discussion.eventImage}
                      alt={discussion.eventTitle}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {discussion.isPinned && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Pin className="w-3 h-3 mr-1" />
                          Pinned
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Discussion Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
                          {discussion.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {discussion.content}
                        </p>
                        
                        {/* Event Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Event: {discussion.eventTitle}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatEventDate(discussion.eventDate)}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {discussion.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Posted Date */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Posted {formatDate(discussion.createdAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePin(discussion.id)}
                          className={discussion.isPinned ? "text-yellow-600 border-yellow-200 hover:bg-yellow-50" : "text-gray-600 border-gray-200 hover:bg-gray-50"}
                        >
                          <Pin className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(discussion.id)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(discussion.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredDiscussions.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Discussion Topics Found</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? "No discussions match your current search criteria. Try adjusting your search terms."
                  : "You haven't created any discussion topics yet. Start by creating your first announcement or discussion."
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Discussion Dialog */}
        {isEditDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Dialog Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Edit className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Discussion Topic</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Dialog Content */}
              <div className="p-6 space-y-6">
                {/* Event Info (Read-only) */}
                {editingDiscussion && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Event Information</h3>
                    <div className="flex items-center gap-3">
                      <img
                        src={editingDiscussion.eventImage}
                        alt={editingDiscussion.eventTitle}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{editingDiscussion.eventTitle}</p>
                        <p className="text-sm text-gray-600">{formatEventDate(editingDiscussion.eventDate)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editable Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discussion Title *
                    </label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Enter discussion title..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discussion Content *
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Enter discussion content..."
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Dialog Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={!editTitle.trim() || !editContent.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
