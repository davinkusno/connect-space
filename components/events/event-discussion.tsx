"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  CheckCircle,
  Pin,
  Send,
  Loader2,
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    image: string;
    role: "admin" | "organizer";
  };
  timestamp: string;
  isPinned?: boolean;
}

interface EventDiscussionProps {
  eventId: string;
  organizerName: string;
  hasAnnouncement?: boolean;
  isAdmin?: boolean;
  communityId?: string;
}

export function EventDiscussion({
  eventId,
  organizerName,
  hasAnnouncement = true,
  isAdmin = false,
  communityId = "",
}: EventDiscussionProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load announcements from database
  useEffect(() => {
    loadAnnouncements();
    loadCurrentUser();
  }, [eventId, communityId]);

  const loadCurrentUser = async () => {
    try {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, username, full_name, avatar_url")
          .eq("id", user.id)
          .single();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabaseBrowser();
      
      // Fetch announcements from posts table
      // Filter by event_id if available, otherwise by community_id
      let postsQuery = supabase
        .from("posts")
        .select(`
          id,
          title,
          content,
          author_id,
          community_id,
          is_pinned,
          created_at
        `)
        .eq("community_id", communityId);

      // If event_id is available, filter by event_id
      if (eventId) {
        postsQuery = postsQuery.eq("event_id", eventId);
      }

      const { data: postsData, error: postsError } = await postsQuery
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);

      if (postsError) {
        console.error("Error fetching announcements:", postsError);
        setAnnouncements([]);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setAnnouncements([]);
        return;
      }

      // Fetch user data for each post
      const authorIds = [...new Set(postsData.map((post: any) => post.author_id))];
      const { data: authorsData } = await supabase
        .from("users")
        .select("id, username, full_name, avatar_url")
        .in("id", authorIds);

      // Map posts to announcements
      const announcementsWithUsers = postsData.map((post: any) => {
        const author = authorsData?.find((a: any) => a.id === post.author_id);

        // Format timestamp
        const timestamp = new Date(post.created_at);
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timestampStr = "";
        if (diffMins < 1) {
          timestampStr = "Just now";
        } else if (diffMins < 60) {
          timestampStr = `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
        } else if (diffHours < 24) {
          timestampStr = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        } else if (diffDays < 7) {
          timestampStr = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
        } else {
          timestampStr = timestamp.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        return {
          id: post.id,
          title: post.title || "",
          content: post.content || "",
          author: {
            name: author?.full_name || author?.username || "Unknown",
            image: author?.avatar_url || "/placeholder.svg?height=40&width=40",
            role: "organizer",
          },
          timestamp: timestampStr,
          isPinned: post.is_pinned || false,
        };
      });

      setAnnouncements(announcementsWithUsers);
    } catch (error) {
      console.error("Error loading announcements:", error);
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncementTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!newAnnouncementContent.trim()) {
      toast.error("Please enter announcement content");
      return;
    }

    if (!communityId) {
      toast.error("Community ID not found");
      return;
    }

    if (!currentUser) {
      toast.error("Please log in to create announcements");
      return;
    }

    setIsSubmitting(true);
    try {
      // Use API endpoint to ensure community activity is tracked
      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newAnnouncementTitle.trim(),
          content: newAnnouncementContent.trim(),
          community_id: communityId,
          event_id: eventId || null,
          is_pinned: isPinned,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create announcement");
      }

      toast.success("Announcement created successfully!");
      setNewAnnouncementTitle("");
      setNewAnnouncementContent("");
      setIsPinned(false);
      loadAnnouncements(); // Reload announcements
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      toast.error(error.message || "Failed to create announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (announcementId: string, currentPinned: boolean) => {
    if (!isAdmin) return;

    try {
      const supabase = getSupabaseBrowser();
      
      // Toggle pinned status
      const newPinned = !currentPinned;

      const { error } = await supabase
        .from("posts")
        .update({ is_pinned: newPinned })
        .eq("id", announcementId);

      if (error) {
        console.error("Error toggling pin:", error);
        toast.error("Failed to update announcement");
        return;
      }

      toast.success(newPinned ? "Announcement pinned" : "Announcement unpinned");
      loadAnnouncements(); // Reload announcements
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update announcement");
    }
  };

  const getRoleBadge = (role: "admin" | "organizer") => {
    switch (role) {
      case "organizer":
        return (
          <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Organizer
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
    }
  };

  // Sort announcements: pinned first, then by timestamp
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Create Announcement Form - Only for Admin */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-violet-600" />
              Create Announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="announcement-title">Title</Label>
                <Input
                  id="announcement-title"
                  value={newAnnouncementTitle}
                  onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                  placeholder="Enter announcement title..."
                  className="mt-2"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="announcement-content">Content</Label>
                <Textarea
                  id="announcement-content"
                  value={newAnnouncementContent}
                  onChange={(e) => setNewAnnouncementContent(e.target.value)}
                  placeholder="Write your announcement content here..."
                  className="min-h-[120px] mt-2"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pin"
                  checked={isPinned}
                  onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="pin" className="text-sm font-normal cursor-pointer">
                  Pin this announcement
                </Label>
              </div>
              <Button
                onClick={handleCreateAnnouncement}
                disabled={isSubmitting || !newAnnouncementTitle.trim() || !newAnnouncementContent.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Announcement
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-violet-600" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto mb-3" />
              <p className="text-gray-500">Loading announcements...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedAnnouncements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No announcements yet. Check back later for updates!</p>
                </div>
              ) : (
                sortedAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`${
                      announcement.isPinned
                        ? "border-l-4 border-violet-500 pl-4 bg-violet-50/50 rounded-r-lg p-4"
                        : "pb-6 border-b border-gray-200 last:border-b-0 last:pb-0"
                    }`}
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage
                          src={announcement.author.image}
                          alt={announcement.author.name}
                        />
                        <AvatarFallback>
                          {announcement.author.name[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">
                            {announcement.author.name}
                          </span>
                          {getRoleBadge(announcement.author.role)}
                          {announcement.isPinned && (
                            <Badge variant="outline" className="text-xs">
                              <Pin className="h-3 w-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                          <span className="text-sm text-gray-500">
                            {announcement.timestamp}
                          </span>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto h-7 px-2 text-xs"
                              onClick={() => handleTogglePin(announcement.id, announcement.isPinned || false)}
                            >
                              <Pin className={`h-3 w-3 mr-1 ${announcement.isPinned ? "text-violet-600 fill-violet-600" : ""}`} />
                              {announcement.isPinned ? "Unpin" : "Pin"}
                            </Button>
                          )}
                        </div>

                        {announcement.title && (
                          <h4 className="mt-2 text-lg font-semibold text-gray-900">
                            {announcement.title}
                          </h4>
                        )}
                        <p className="mt-2 text-gray-700 whitespace-pre-line">
                          {announcement.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
