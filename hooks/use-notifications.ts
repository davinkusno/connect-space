"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

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

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Transform database notification to UI format
function transformNotification(notif: any): Notification {
  // Map database types to UI types
  let uiType: "event" | "achievement" | "system" | "community" | "message" = "system";
  let title = "";
  let actionUrl = "";

  switch (notif.type) {
    case "event_reminder":
    case "new_event":
    case "event_cancelled":
      uiType = "event";
      title = notif.type === "event_reminder" ? "Event Reminder" : 
              notif.type === "new_event" ? "New Event" : "Event Cancelled";
      actionUrl = notif.reference_id ? `/events/${notif.reference_id}` : "";
      break;
    case "new_message":
    case "mention":
      uiType = "message";
      title = notif.type === "mention" ? "You were mentioned" : "New Message";
      break;
    case "community_invite":
    case "community_update":
    case "join_request":
    case "join_approved":
    case "join_rejected":
      uiType = "community";
      title = notif.type === "join_approved" ? "Request Approved" :
              notif.type === "join_rejected" ? "Request Declined" :
              notif.type === "join_request" ? "New Join Request" :
              notif.type === "community_invite" ? "Community Invite" : "Community Update";
      actionUrl = notif.reference_id ? `/communities/${notif.reference_id}` : "";
      break;
    case "new_post":
    case "post_reply":
      uiType = "community";
      title = notif.type === "new_post" ? "New Discussion" : "New Reply";
      break;
    default:
      uiType = "system";
      title = "Notification";
  }

  // Parse content to extract title if present
  const contentParts = notif.content?.split(": ") || [];
  if (contentParts.length > 1) {
    title = contentParts[0];
  }

  // Calculate relative time
  const date = new Date(notif.created_at);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let timestamp: string;
  if (diffMins < 1) timestamp = "Just now";
  else if (diffMins < 60) timestamp = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  else if (diffHours < 24) timestamp = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  else if (diffDays < 7) timestamp = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  else timestamp = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return {
    id: notif.id,
    type: uiType,
    title: title,
    content: contentParts.length > 1 ? contentParts.slice(1).join(": ") : notif.content || "",
    timestamp,
    isRead: notif.is_read || false,
    actionUrl: actionUrl,
  };
}

export function useNotifications(userId: string | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowser();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[useNotifications] Error fetching:", error);
        return;
      }

      const transformed = (data || []).map(transformNotification);
      setNotifications(transformed);
    } catch (error) {
      console.error("[useNotifications] Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, supabase]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[useNotifications] New notification received:", payload);
          const newNotif = transformNotification(payload.new);
          setNotifications((prev) => [newNotif, ...prev]);
          
          // Show browser notification if permission granted
          if (Notification.permission === "granted") {
            new Notification(newNotif.title, {
              body: newNotif.content,
              icon: "/logo.png",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[useNotifications] Notification updated:", payload);
          const updated = transformNotification(payload.new);
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[useNotifications] Notification deleted:", payload);
          setNotifications((prev) =>
            prev.filter((n) => n.id !== (payload.old as any).id)
          );
        }
      )
      .subscribe((status) => {
        console.log("[useNotifications] Subscription status:", status);
      });

    // Request browser notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, fetchNotifications]);

  // Actions
  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  }, [supabase]);

  const markAsUnread = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: false })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  }, [supabase]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    }
  }, [userId, supabase]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select(); // Add select to confirm deletion

    if (error) {
      console.error("Error deleting notification:", error);
      console.error("Error details:", JSON.stringify(error));
      return;
    }

    console.log("Successfully deleted notification:", id, "Data:", data);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  }, [supabase, userId]);

  const deleteAllRead = useCallback(async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .eq("is_read", true);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    }
  }, [userId, supabase]);

  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    refresh,
  };
}

