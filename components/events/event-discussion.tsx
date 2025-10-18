"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Heart,
  Reply,
  Pin,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  author: {
    name: string;
    image: string;
    role: "admin" | "organizer" | "attendee";
  };
  content: string;
  timestamp: string;
  likes: number;
  replies: Comment[];
  isLiked: boolean;
  isPinned?: boolean;
}

interface EventDiscussionProps {
  eventId: string;
  organizerName: string;
  hasAnnouncement?: boolean;
}

export function EventDiscussion({
  eventId,
  organizerName,
  hasAnnouncement = true,
}: EventDiscussionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Dummy data - replace with actual API call
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: {
        name: organizerName,
        image: "/placeholder.svg?height=40&width=40",
        role: "organizer",
      },
      content:
        "🎉 Welcome everyone! We're excited to have you join us for this event. Here are some important details:\n\n✅ The meeting link will be available 15 minutes before the event starts\n✅ Please keep your microphone muted unless speaking\n✅ Feel free to ask questions in the Q&A section\n\nLooking forward to seeing you all!",
      timestamp: "2 hours ago",
      likes: 24,
      replies: [],
      isLiked: false,
      isPinned: true,
    },
    {
      id: "2",
      author: {
        name: "Sarah Johnson",
        image: "/placeholder.svg?height=40&width=40",
        role: "attendee",
      },
      content:
        "Really looking forward to this event! Will there be a recording available afterwards?",
      timestamp: "1 hour ago",
      likes: 8,
      replies: [
        {
          id: "2-1",
          author: {
            name: organizerName,
            image: "/placeholder.svg?height=40&width=40",
            role: "organizer",
          },
          content:
            "Yes! All attendees will receive a recording link within 24 hours after the event.",
          timestamp: "45 minutes ago",
          likes: 12,
          replies: [],
          isLiked: false,
        },
      ],
      isLiked: false,
    },
    {
      id: "3",
      author: {
        name: "Michael Chen",
        image: "/placeholder.svg?height=40&width=40",
        role: "attendee",
      },
      content:
        "Can't wait! This topic is exactly what I've been looking to learn more about.",
      timestamp: "30 minutes ago",
      likes: 5,
      replies: [],
      isLiked: false,
    },
  ]);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        name: "You",
        image: "/placeholder.svg?height=40&width=40",
        role: "attendee",
      },
      content: newComment,
      timestamp: "Just now",
      likes: 0,
      replies: [],
      isLiked: false,
    };

    setComments([...comments, comment]);
    setNewComment("");
    toast.success("Comment posted!");
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;

    const reply: Comment = {
      id: Date.now().toString(),
      author: {
        name: "You",
        image: "/placeholder.svg?height=40&width=40",
        role: "attendee",
      },
      content: replyContent,
      timestamp: "Just now",
      likes: 0,
      replies: [],
      isLiked: false,
    };

    setComments(
      comments.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...comment.replies, reply],
          };
        }
        return comment;
      })
    );

    setReplyContent("");
    setReplyingTo(null);
    toast.success("Reply posted!");
  };

  const handleLike = (
    commentId: string,
    isReply: boolean = false,
    parentId?: string
  ) => {
    if (isReply && parentId) {
      setComments(
        comments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.map((reply) => {
                if (reply.id === commentId) {
                  return {
                    ...reply,
                    likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                    isLiked: !reply.isLiked,
                  };
                }
                return reply;
              }),
            };
          }
          return comment;
        })
      );
    } else {
      setComments(
        comments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              isLiked: !comment.isLiked,
            };
          }
          return comment;
        })
      );
    }
  };

  const getRoleBadge = (role: "admin" | "organizer" | "attendee") => {
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
      default:
        return null;
    }
  };

  const renderComment = (
    comment: Comment,
    isReply: boolean = false,
    parentId?: string
  ) => (
    <div
      key={comment.id}
      className={`${isReply ? "ml-12 mt-4" : "mt-6"} ${
        comment.isPinned && !isReply ? "border-l-4 border-violet-500 pl-4" : ""
      }`}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={comment.author.image} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">
              {comment.author.name}
            </span>
            {getRoleBadge(comment.author.role)}
            {comment.isPinned && !isReply && (
              <Badge variant="outline" className="text-xs">
                <Pin className="h-3 w-3 mr-1" />
                Pinned
              </Badge>
            )}
            <span className="text-sm text-gray-500">{comment.timestamp}</span>
          </div>

          <p className="mt-2 text-gray-700 whitespace-pre-line">
            {comment.content}
          </p>

          <div className="flex items-center gap-4 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 ${
                comment.isLiked ? "text-red-500" : "text-gray-500"
              }`}
              onClick={() => handleLike(comment.id, isReply, parentId)}
            >
              <Heart
                className={`h-4 w-4 mr-1 ${
                  comment.isLiked ? "fill-red-500" : ""
                }`}
              />
              {comment.likes > 0 && comment.likes}
            </Button>

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-gray-500"
                onClick={() => setReplyingTo(comment.id)}
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={() => handleSubmitReply(comment.id)}
                >
                  Post Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) =>
                renderComment(reply, true, comment.id)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Announcement Banner */}
      {hasAnnouncement && (
        <Card className="border-violet-200 bg-violet-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-violet-600" />
              <CardTitle className="text-lg">Announcement</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Pinned messages from organizers will appear here. Check back
              regularly for important updates about the event.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Discussion Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-violet-600" />
            Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* New Comment Form */}
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts or ask a question..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Post Comment
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="mt-8 space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No comments yet. Be the first to start the discussion!</p>
              </div>
            ) : (
              comments.map((comment) => renderComment(comment))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
