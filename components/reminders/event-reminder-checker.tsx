"use client";

import { useEffect } from "react";

/**
 * EventReminderChecker
 * Checks for events starting today when the app loads and creates notifications
 * Uses localStorage to ensure notification is only created once per event per day
 */
export function EventReminderChecker() {
  useEffect(() => {
    const checkTodayEvents = async () => {
      try {
        // Fetch user's interested events
        const response = await fetch("/api/events/interested");
        
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const events = data.events || [];

        // Get today's date (start and end of day)
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        // Filter events happening today
        const todayEvents = events.filter((event: any) => {
          if (!event.start_time) return false;
          const eventDate = new Date(event.start_time);
          return eventDate >= todayStart && eventDate <= todayEnd;
        });

        if (todayEvents.length === 0) {
          return;
        }

        // Check which events we've already notified about today
        const notifiedToday = localStorage.getItem("notified_events_today");
        const notifiedData = notifiedToday ? JSON.parse(notifiedToday) : { date: "", events: [] };
        
        // If it's a new day, reset the notified events
        const todayDateString = todayStart.toISOString().split("T")[0];
        if (notifiedData.date !== todayDateString) {
          notifiedData.date = todayDateString;
          notifiedData.events = [];
        }

        // Filter out events we've already notified about
        const newEvents = todayEvents.filter(
          (event: any) => !notifiedData.events.includes(event.id)
        );

        if (newEvents.length === 0) {
          return;
        }

        // Create notifications for each new event via API
        for (const event of newEvents) {
          try {
            const eventTime = new Date(event.start_time).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });

            const location = event.is_online ? "Online" : "In-person";
            const community = event.community?.name || "Community";

            const notifResponse = await fetch("/api/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "event_reminder",
                title: `Event Today: ${event.title}`,
                content: `Starting at ${eventTime} • ${location} • ${community}`,
                reference_id: event.id,
                reference_type: "event",
              }),
            });

            if (notifResponse.ok) {
              notifiedData.events.push(event.id);
            }
          } catch (error) {
            console.error("Failed to create notification for event:", event.id);
          }
        }

        // Save notified events to localStorage
        localStorage.setItem("notified_events_today", JSON.stringify(notifiedData));

      } catch (error) {
        console.error("Failed to check event reminders:", error);
      }
    };

    // Small delay to let the app load first
    const timer = setTimeout(checkTodayEvents, 2000);

    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything
  return null;
}


