"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationItem } from "./notification-item";
import {
  Search,
  Bell,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface Notification {
  id: string;
  type: "message" | "event" | "achievement" | "system" | "community";
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  community?: string;
  actionUrl?: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteAllRead: () => void;
}

const NOTIFICATIONS_PER_PAGE = 10;

export function NotificationModal({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onMarkAllAsRead,
  onDeleteAllRead,
}: NotificationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (notification) =>
          notification.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          notification.content
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          notification.community
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (activeFilter) {
      case "unread":
        filtered = filtered.filter((n) => !n.isRead);
        break;
      case "read":
        filtered = filtered.filter((n) => n.isRead);
        break;
      default:
        // "all" - no additional filtering
        break;
    }

    return filtered.sort((a, b) => {
      // Sort by read status (unread first) then by timestamp
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      return 0; // Keep original order for same read status
    });
  }, [notifications, searchQuery, activeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(
    filteredNotifications.length / NOTIFICATIONS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * NOTIFICATIONS_PER_PAGE;
  const endIndex = startIndex + NOTIFICATIONS_PER_PAGE;
  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    endIndex
  );

  // Reset to first page when filters change
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleMarkAsRead = (id: string) => {
    onMarkAsRead(id);
  };

  const handleMarkAsUnread = (id: string) => {
    onMarkAsUnread(id);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead();
  };

  const handleDeleteAllRead = () => {
    onDeleteAllRead();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full h-[85vh] p-0 gap-0 bg-white/95 backdrop-blur-md border border-white/20 flex flex-col">
        {/* Header - Fixed */}
        <DialogHeader className="flex-shrink-0 p-6 border-b border-gray-200 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Notifications
              </DialogTitle>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Bulk Actions */}
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2"
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAllRead}
                className="flex items-center gap-2"
                disabled={notifications.filter((n) => n.isRead).length === 0}
              >
                <Trash2 className="h-4 w-4" />
                Delete Read
              </Button>
            </div>
          )}
        </DialogHeader>

        {/* Filters - Fixed */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <Tabs value={activeFilter} onValueChange={handleFilterChange}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                Unread
              </TabsTrigger>
              <TabsTrigger value="read" className="flex items-center gap-2">
                <CheckCheck className="w-4 h-4" />
                Read
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notifications List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {paginatedNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || activeFilter !== "all"
                  ? "No notifications found"
                  : "No notifications yet"}
              </h3>
              <p className="text-gray-500">
                {searchQuery || activeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "You'll see notifications here when you have them"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedNotifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAsUnread={handleMarkAsUnread}
                  onDelete={handleDelete}
                  style={{ animationDelay: `${index * 50}ms` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination - Fixed */}
        {totalPages > 1 && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredNotifications.length)} of{" "}
                {filteredNotifications.length} notifications
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={
                          currentPage === pageNumber ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        className="h-8 w-8 p-0 text-xs"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
