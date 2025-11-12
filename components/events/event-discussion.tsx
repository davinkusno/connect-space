"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Pin,
} from "lucide-react";

interface Announcement {
  id: string;
  author: {
    name: string;
    image: string;
    role: "admin" | "organizer";
  };
  content: string;
  timestamp: string;
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
  // Dummy data - replace with actual API call
  // Only include announcements from admin/organizer
  const [announcements] = useState<Announcement[]>([
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
      isPinned: true,
    },
    {
      id: "2",
      author: {
        name: organizerName,
        image: "/placeholder.svg?height=40&width=40",
        role: "organizer",
      },
      content:
        "📢 Important Update: Due to technical requirements, we're moving the keynote presentation to 10:30 AM instead of 10:00 AM. All other sessions remain unchanged.",
      timestamp: "1 hour ago",
      isPinned: false,
    },
    {
      id: "3",
      author: {
        name: organizerName,
        image: "/placeholder.svg?height=40&width=40",
        role: "organizer",
      },
      content:
        "💡 Reminder: Please review the networking session guidelines before attending. We'll have structured networking activities and breakout rooms for different topics.",
      timestamp: "30 minutes ago",
      isPinned: false,
    },
  ]);

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
      {/* Announcements Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-violet-600" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Announcements List */}
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
                      </div>

                      <p className="mt-2 text-gray-700 whitespace-pre-line">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
