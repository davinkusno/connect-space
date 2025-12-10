"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import {
    ArrowLeft, Calendar,
    Edit, MessageSquare,
    Pin, Search, SortAsc,
    SortDesc, Trash2, X
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface AnnouncementTopic {
  id: string
  title: string
  content: string
  eventId?: string
  eventTitle?: string
  eventDate?: string
  eventImage?: string
  author: {
    name: string
    avatar: string
  }
  createdAt: string
  isPinned: boolean
  views?: number
  likes?: number
  replies?: number
  tags?: string[]
}

export default function CommunityDiscussionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [announcements, setAnnouncements] = useState<AnnouncementTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [communityId, setCommunityId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "title" | "event">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterBy, setFilterBy] = useState<"all" | "pinned" | "recent">("all")
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementTopic | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null)

  // Load announcements from database
  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setCommunityId(resolvedParams.id)
      loadCommunityAndAnnouncements(resolvedParams.id)
    }
    loadParams()
  }, [params])

  const loadCommunityAndAnnouncements = async (id: string) => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseBrowser()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not found")
        setIsLoading(false)
        return
      }

      // Get community by ID from params
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("id, name, creator_id")
        .eq("id", id)
        .single()

      if (communityError || !communityData) {
        console.error("Community not found:", communityError)
        setIsLoading(false)
        return
      }

      // Verify user is admin or creator
      const isCreator = communityData.creator_id === user.id
      const { data: membership } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle()

      if (!isCreator && !membership) {
        console.error("User is not admin or creator")
        setIsLoading(false)
        return
      }

      setCommunityId(id)
      await loadAnnouncements(id)
    } catch (error) {
      console.error("Error loading community:", error)
      setIsLoading(false)
    }
  }

  const loadAnnouncements = async (communityId: string) => {
    try {
      const supabase = getSupabaseBrowser()
      
      // Fetch announcements from posts table
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          content,
          author_id,
          community_id,
          event_id,
          is_pinned,
          created_at
        `)
        .eq("community_id", communityId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })

      if (postsError) {
        console.error("Error fetching announcements:", postsError)
        setAnnouncements([])
        setIsLoading(false)
        return
      }

      if (!postsData || postsData.length === 0) {
        setAnnouncements([])
        setIsLoading(false)
        return
      }

      // Fetch user data and event data for each post
      const authorIds = [...new Set(postsData.map((post: any) => post.author_id))]
      const eventIds = [...new Set(postsData.map((post: any) => post.event_id).filter((id: any) => id))]
      
      const [authorsResult, eventsResult] = await Promise.all([
        supabase
          .from("users")
          .select("id, username, full_name, avatar_url")
          .in("id", authorIds),
        eventIds.length > 0
          ? supabase
              .from("events")
              .select("id, title, start_time, image_url")
              .in("id", eventIds)
          : Promise.resolve({ data: [], error: null })
      ])

      // Map posts to announcements
      const announcementsWithData = postsData.map((post: any) => {
        const author = authorsResult.data?.find((a: any) => a.id === post.author_id)
        const event = eventsResult.data?.find((e: any) => e.id === post.event_id)

        return {
          id: post.id,
          title: post.title || "Untitled",
          content: post.content || "",
          eventId: post.event_id || undefined,
          eventTitle: event?.title || undefined,
          eventDate: event?.start_time ? new Date(event.start_time).toISOString().split('T')[0] : undefined,
          eventImage: event?.image_url || undefined,
          author: {
            name: author?.full_name || author?.username || "Unknown",
            avatar: author?.avatar_url || "/placeholder-user.jpg"
          },
          createdAt: post.created_at,
          isPinned: post.is_pinned || false,
          views: 0,
          likes: 0,
          replies: 0,
          tags: []
        }
      })

      setAnnouncements(announcementsWithData)
    } catch (error) {
      console.error("Error loading announcements:", error)
      setAnnouncements([])
    } finally {
      setIsLoading(false)
    }
  }


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

  const handleEdit = (announcementId: string) => {
    const announcement = announcements.find(d => d.id === announcementId)
    if (announcement) {
      setEditingAnnouncement(announcement)
      setEditTitle(announcement.title)
      setEditContent(announcement.content)
      setIsEditDialogOpen(true)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingAnnouncement || !editTitle.trim() || !editContent.trim()) {
      toast.error("Please fill in both title and content")
      return
    }

    setIsSaving(true)
    try {
      const supabase = getSupabaseBrowser()
      
      const { error } = await supabase
        .from("posts")
        .update({
          title: editTitle.trim(),
          content: editContent.trim()
        })
        .eq("id", editingAnnouncement.id)

      if (error) {
        console.error("Error updating announcement:", error)
        toast.error("Failed to update announcement")
        return
      }

      toast.success("Announcement updated successfully!")
      setIsEditDialogOpen(false)
      setEditingAnnouncement(null)
      setEditTitle("")
      setEditContent("")
      
      // Reload announcements
      if (communityId) {
        await loadAnnouncements(communityId)
      }
    } catch (error) {
      console.error("Error updating announcement:", error)
      toast.error("Failed to update announcement")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingAnnouncement(null)
    setEditTitle("")
    setEditContent("")
  }

  const handleDelete = (announcementId: string) => {
    setAnnouncementToDelete(announcementId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return

    setIsDeleting(true)
    try {
      const supabase = getSupabaseBrowser()
      
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", announcementToDelete)

      if (error) {
        console.error("Error deleting announcement:", error)
        toast.error("Failed to delete announcement")
        return
      }

      toast.success("Announcement deleted successfully!")
      setDeleteDialogOpen(false)
      setAnnouncementToDelete(null)
      
      // Reload announcements
      if (communityId) {
        await loadAnnouncements(communityId)
      }
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast.error("Failed to delete announcement")
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePin = async (announcementId: string) => {
    const announcement = announcements.find(a => a.id === announcementId)
    if (!announcement) return

    const newPinned = !announcement.isPinned

    try {
      const supabase = getSupabaseBrowser()
      
      const { error } = await supabase
        .from("posts")
        .update({ is_pinned: newPinned })
        .eq("id", announcementId)

      if (error) {
        console.error("Error toggling pin:", error)
        toast.error("Failed to update announcement")
        return
      }

      toast.success(newPinned ? "Announcement pinned" : "Announcement unpinned")
      
      // Reload announcements
      if (communityId) {
        await loadAnnouncements(communityId)
      }
    } catch (error) {
      console.error("Error toggling pin:", error)
      toast.error("Failed to update announcement")
    }
  }

  // Filter and sort announcements
  let filteredAnnouncements = announcements

  // Apply search filter
  if (searchTerm) {
    filteredAnnouncements = filteredAnnouncements.filter(announcement =>
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (announcement.eventTitle?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }

  // Apply category filter
  if (filterBy === "pinned") {
    filteredAnnouncements = filteredAnnouncements.filter(announcement => announcement.isPinned)
  } else if (filterBy === "recent") {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    filteredAnnouncements = filteredAnnouncements.filter(announcement => 
      new Date(announcement.createdAt) > oneWeekAgo
    )
  }

  // Apply sorting
  filteredAnnouncements.sort((a, b) => {
    let aValue: any, bValue: any

    if (sortBy === "date") {
      aValue = new Date(a.createdAt).getTime()
      bValue = new Date(b.createdAt).getTime()
    } else if (sortBy === "title") {
      aValue = a.title.toLowerCase()
      bValue = b.title.toLowerCase()
    } else if (sortBy === "event") {
      aValue = (a.eventTitle?.toLowerCase() || "")
      bValue = (b.eventTitle?.toLowerCase() || "")
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Sort pinned posts first
  filteredAnnouncements.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return 0
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href={communityId ? `/communities/${communityId}/admin` : "/communities/admin"}>
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
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          </div>
          <p className="text-gray-600">
            Manage all announcements across your community events
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
                    placeholder="Search announcements, events, or content..."
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

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Event Image */}
                  {announcement.eventImage && announcement.eventTitle && (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <img
                        src={announcement.eventImage}
                        alt={announcement.eventTitle}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {announcement.isPinned && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Announcement Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
                          {announcement.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {announcement.content}
                        </p>
                        
                        {/* Event Info */}
                        {announcement.eventTitle && (
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Event: {announcement.eventTitle}</span>
                            </div>
                            {announcement.eventDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatEventDate(announcement.eventDate)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {announcement.tags && announcement.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {announcement.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Posted Date */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Posted {formatDate(announcement.createdAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePin(announcement.id)}
                          className={announcement.isPinned ? "text-yellow-600 border-yellow-200 hover:bg-yellow-50" : "text-gray-600 border-gray-200 hover:bg-gray-50"}
                        >
                          <Pin className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(announcement.id)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(announcement.id)}
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
        {filteredAnnouncements.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Announcements Found</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? "No announcements match your current search criteria. Try adjusting your search terms."
                  : "You haven't created any announcements yet. Start by creating your first announcement."
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Announcement Dialog */}
        {isEditDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Dialog Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Edit className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Announcement</h2>
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
                {editingAnnouncement && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Event Information</h3>
                    <div className="flex items-center gap-3">
                      <img
                        src={editingAnnouncement.eventImage}
                        alt={editingAnnouncement.eventTitle}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{editingAnnouncement.eventTitle}</p>
                        <p className="text-sm text-gray-600">{formatEventDate(editingAnnouncement.eventDate)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editable Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Announcement Title *
                    </label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Enter announcement title..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Announcement Content *
                    </label>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Enter announcement content..."
                      rows={6}
                      className="w-full"
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
                    disabled={!editTitle.trim() || !editContent.trim() || isSaving}
                    className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Announcement</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this announcement? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setAnnouncementToDelete(null)
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
