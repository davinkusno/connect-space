"use client";

import { AttendeesDialog } from "@/components/events/attendees-dialog";
import { EventDiscussion } from "@/components/events/event-discussion";
import { UpdateRsvpDialog } from "@/components/events/update-rsvp-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { InteractiveLeafletMap } from "@/components/ui/interactive-leaflet-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
    ArrowLeft, Award, BookOpen, Calendar, Check, ChevronLeft, ChevronRight, Clock, ExternalLink, Globe, MapPin, Sparkles, User2, Users, Video
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";

interface Event {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  date: string;
  time: string;
  endTime: string;
  location: {
    venue: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
    isOnline?: boolean;
    meetingLink?: string;
  };
  organizer: {
    name: string;
    image: string;
    verified: boolean;
  };
  category: string;
  price: {
    type: "free" | "paid";
    amount?: number;
    currency?: string;
  };
  capacity: number;
  registered: number;
  image: string;
  images: string[];
  tags: string[];
  website?: string;
  link?: string;
  communities?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  relatedEvents: Array<{
    id: string;
    title: string;
    date: string;
    image: string;
    category: string;
    tags: string[];
    price: number;
  }>;
  organizerEvents?: Array<{
    id: string;
    title: string;
    date: string;
    image: string;
    category: string;
    price: number;
    attendees: number;
  }>;
}

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params Promise (Next.js 15+)
  const { id } = use(params);

  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCommunityAdmin = searchParams.get("from") === "admin";
  const communityId = searchParams.get("community_id");
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isUpdateRsvpOpen, setIsUpdateRsvpOpen] = useState(false);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [unsaveEventId, setUnsaveEventId] = useState<string | null>(null);
  const [isUnsaveDialogOpen, setIsUnsaveDialogOpen] = useState(false);
  const [isRemoveInterestDialogOpen, setIsRemoveInterestDialogOpen] = useState(false);

  // Fetch event data from Supabase
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const supabase = getSupabaseBrowser();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Fetch event with community and creator info
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select(`
            *,
            communities (
              id,
              name,
              logo_url,
              creator_id
            )
          `)
          .eq("id", id)
          .single();
        
        if (eventError) {
          console.error("Error fetching event:", eventError);
          setError("Event not found");
          setIsLoading(false);
          return;
        }

        if (!eventData) {
          setError("Event not found");
          setIsLoading(false);
          return;
        }

        // Fetch creator profile separately
        let creatorData: any = null;
        if (eventData.creator_id) {
          const { data: creator, error: creatorError } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .eq("id", eventData.creator_id)
            .single();
          
          if (!creatorError && creator) {
            creatorData = creator;
          }
        }

        // Fetch additional data in parallel
        const [attendeesResult, relatedEventsResult, organizerEventsResult] = await Promise.all([
          // Get registered attendee count
          supabase
            .from("event_attendees")
            .select("id", { count: "exact", head: true })
            .eq("event_id", id)
            .eq("status", "going"),
          
          // Get related events from the same community
          eventData.community_id
            ? supabase
                .from("events")
                .select("id, title, start_time, image_url, category")
                .eq("community_id", eventData.community_id)
                .neq("id", id)
                .gte("start_time", new Date().toISOString())
                .order("start_time", { ascending: true })
                .limit(5)
            : Promise.resolve({ data: [], error: null }),
          
          // Get other events by the same organizer
          supabase
            .from("events")
            .select("id, title, start_time, image_url, category, max_attendees")
            .eq("creator_id", eventData.creator_id)
            .neq("id", id)
            .gte("start_time", new Date().toISOString())
            .order("start_time", { ascending: true })
            .limit(3)
        ]);

        const registeredCount = attendeesResult.count || 0;

        // Check if current user has RSVP'd to this event using API (bypasses RLS)
        if (user) {
          console.log("[Event Detail] Checking RSVP status for user:", user.id, "event:", id);
          
          try {
            const rsvpResponse = await fetch(`/api/events/${id}/rsvp`);
            const rsvpData = await rsvpResponse.json();
            console.log("[Event Detail] RSVP API response:", rsvpData);
            
            if (rsvpData.hasRsvp && (rsvpData.status === "going" || rsvpData.status === "maybe")) {
              console.log("[Event Detail] User has RSVP, setting isRegistered to true");
              setIsRegistered(true);
            } else {
              console.log("[Event Detail] User does not have valid RSVP");
              setIsRegistered(false);
            }
          } catch (rsvpError) {
            console.error("[Event Detail] Error checking RSVP via API:", rsvpError);
            // Fallback to direct query
            const { data: userRsvp, error: rsvpCheckError } = await supabase
            .from("event_attendees")
            .select("id, status")
            .eq("event_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          
            console.log("[Event Detail] Fallback RSVP check:", userRsvp, rsvpCheckError);
            
            if (userRsvp && (userRsvp.status === "going" || userRsvp.status === "maybe")) {
            setIsRegistered(true);
            } else {
              setIsRegistered(false);
            }
          }

          // Check if event is saved
          const { data: savedData, error: savedError } = await supabase
            .from("event_save")
            .select("id")
            .eq("event_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (savedError) {
            console.error("Error checking save status:", savedError);
          } else if (savedData) {
            setIsSaved(true);
          }
        }

        // Check if user is admin/creator of the community
        if (user && eventData.communities) {
          const community = eventData.communities as any;
          
          // Check if user is creator
          if (community.creator_id === user.id) {
            setIsAdmin(true);
          } else {
            // Check if user is admin
            const { data: membership } = await supabase
              .from("community_members")
              .select("role")
              .eq("community_id", community.id)
              .eq("user_id", user.id)
              .eq("role", "admin")
              .maybeSingle();
            
            if (membership) {
              setIsAdmin(true);
            }
          }
        }

        const relatedEvents = (relatedEventsResult.data || []).map((e: any) => ({
          id: e.id,
          title: e.title,
          date: new Date(e.start_time).toISOString().split('T')[0],
          image: e.image_url || "",
          category: e.category || "General",
          tags: e.category ? [e.category] : [],
          price: 0, // Default to free
        }));

        const organizerEvents = (organizerEventsResult.data || []).map((e: any) => ({
          id: e.id,
          title: e.title,
          date: new Date(e.start_time).toISOString().split('T')[0],
          image: e.image_url || "",
          category: e.category || "General",
          price: 0, // Default to free
          attendees: 0, // Could fetch if needed
        }));

        // Parse location - it's stored as a string that might be JSON
        const locationString = eventData.location || "";
        let parsedLocation = {
          venue: "",
          address: locationString || "", // Ensure address is always set if locationString exists
          city: "",
          lat: 0,
          lng: 0,
          isOnline: eventData.is_online || false,
          meetingLink: eventData.is_online ? locationString : undefined,
        };

        // Try to parse location as JSON (it might be nested JSON string)
        if (locationString && !eventData.is_online) {
          try {
            let locationData: any = null;
            
            // Try to parse as JSON - only if it looks like JSON (starts with { or [)
            if (typeof locationString === 'string' && (locationString.trim().startsWith('{') || locationString.trim().startsWith('['))) {
              try {
                locationData = JSON.parse(locationString);
                
                // If it's still a string after parsing, try parsing again (nested JSON)
                if (typeof locationData === 'string' && (locationData.trim().startsWith('{') || locationData.trim().startsWith('['))) {
                  try {
                    locationData = JSON.parse(locationData);
                  } catch (e) {
                    // If second parse fails, treat as plain string
                    locationData = null;
                  }
                }
              } catch (e) {
                // If JSON parse fails, treat as plain string
                locationData = null;
              }
            } else {
              // Not JSON, treat as plain string - it's likely a city name
              parsedLocation.address = locationString;
              parsedLocation.city = locationString;
              locationData = null;
            }

            if (locationData && typeof locationData === 'object') {
              // Extract address and city from parsed JSON
              if (locationData.address) {
                parsedLocation.address = locationData.address;
              } else if (typeof locationData === 'string') {
                parsedLocation.address = locationData;
              }
              
              if (locationData.city) {
                parsedLocation.city = locationData.city;
              }
              
              if (locationData.lat) {
                parsedLocation.lat = parseFloat(locationData.lat);
              }
              
              if (locationData.lng) {
                parsedLocation.lng = parseFloat(locationData.lng);
              }
            } else if (!locationData) {
              // If not JSON, treat as plain address string
              // Ensure address is always set to locationString
              parsedLocation.address = locationString;
              
              // Try to extract city from address (simple parsing)
              const parts = locationString.split(',').map(p => p.trim());
              if (parts.length > 1) {
                // Look for city in the address parts (usually near the end)
                // Common pattern: ..., City, Province, Country
                // Try to find city (usually second to last or third to last)
                if (parts.length >= 2) {
                  // Check if there's a recognizable city name
                  const possibleCity = parts[parts.length - 2] || parts[parts.length - 1];
                  if (possibleCity && !possibleCity.match(/^\d+$/)) { // Not just a number
                    parsedLocation.city = possibleCity;
                  }
                }
              } else {
                parsedLocation.address = locationString;
              }
            }

            // If we have address but no coordinates, try geocoding
            if (parsedLocation.address && (parsedLocation.lat === 0 || parsedLocation.lng === 0)) {
              try {
                const geocodeResponse = await fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(parsedLocation.address)}&limit=1&addressdetails=1`,
                  {
                    headers: {
                      'User-Agent': 'ConnectSpace/1.0' // Required by Nominatim
                    }
                  }
                );
                
                if (geocodeResponse.ok) {
                  const geocodeData = await geocodeResponse.json();
                  if (geocodeData && geocodeData.length > 0) {
                    const result = geocodeData[0];
                    parsedLocation.lat = parseFloat(result.lat);
                    parsedLocation.lng = parseFloat(result.lon);
                    
                    // Update city if geocoding found better info
                    if (result.address && !parsedLocation.city) {
                      const addr = result.address;
                      parsedLocation.city = addr.city || addr.town || addr.village || addr.municipality || "";
                    }
                  }
                }
              } catch (geocodeError) {
                console.warn("Geocoding failed:", geocodeError);
              }
            }
          } catch (error) {
            console.warn("Location parsing failed, using raw string:", error);
            // Always ensure address is set to locationString if parsing fails
            parsedLocation.address = locationString || "";
          }
        } else if (locationString && eventData.is_online) {
          // For online events, location is the meeting link
          parsedLocation.meetingLink = locationString;
          parsedLocation.address = "Online Event";
        } else if (!locationString) {
          // If location is empty, ensure address is empty string (not undefined)
          parsedLocation.address = "";
        }

        // Transform database event to component Event format
        const transformedEvent: Event = {
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          longDescription: eventData.description,
          date: new Date(eventData.start_time).toISOString().split('T')[0],
          time: new Date(eventData.start_time).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          endTime: eventData.end_time 
            ? new Date(eventData.end_time).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
              })
            : undefined,
          location: parsedLocation,
          organizer: {
            name: creatorData?.full_name || creatorData?.username || "Organizer",
            image: creatorData?.avatar_url || "",
            verified: true,
          },
          category: eventData.category || "General",
          price: {
            type: "free",
          },
          capacity: eventData.max_attendees || 100,
          registered: registeredCount,
          image: eventData.image_url || "",
          images: eventData.image_url ? [eventData.image_url] : [],
          tags: eventData.category ? [eventData.category] : [],
          link: eventData.link || undefined,
          communities: eventData.communities as any,
          relatedEvents: relatedEvents,
          organizerEvents: organizerEvents,
        };

        setEvent(transformedEvent);
      } catch (err: any) {
        console.error("Error fetching event:", err);
        setError(err.message || "Failed to load event");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setIsCheckingAuth(false);
    };

    checkAuth();

    // Subscribe to auth changes
    const supabase = getSupabaseBrowser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return ""; // Return empty string if invalid date
    }
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return "";
    
    // If timeStr is already formatted (contains AM/PM or is a formatted time string), return as is
    if (timeStr.includes("AM") || timeStr.includes("PM") || timeStr.match(/^\d{1,2}:\d{2}\s?(AM|PM)?$/i)) {
      return timeStr;
    }
    
    // Try to parse as ISO time string (HH:MM:SS or HH:MM)
    try {
      const date = new Date(`2024-01-01T${timeStr}`);
      if (isNaN(date.getTime())) {
        return ""; // Return empty string if invalid
      }
      return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    } catch {
      return ""; // Return empty string on error
    }
  };

  const handleCopyLink = () => {
    if (event?.location.meetingLink) {
      navigator.clipboard.writeText(event.location.meetingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleInterestedClick = async () => {
    if (!event) return;
    
    // Check if user is logged in
    if (!isLoggedIn) {
      // Redirect to login/register page with return URL
      router.push("/auth/login?redirect=/events/" + event.id);
      return;
    }

    if (isRegistered) {
      // Show confirmation dialog for removing interest
      setIsRemoveInterestDialogOpen(true);
    } else {
      // Add RSVP (POST)
      await performAddInterest();
    }
  };

  const performAddInterest = async () => {
    if (!event) return;

    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to RSVP");
      }

      const data = await response.json();
      console.log("RSVP successful:", data);
      
      // Update state immediately
      setIsRegistered(true);
      
      // Dispatch custom event to refresh home page interested events
      window.dispatchEvent(new CustomEvent("eventInterested"));
      
      // Verify RSVP was saved by re-checking the database
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Wait a moment for database to commit, then verify
        setTimeout(async () => {
          const { data: userRsvp, error: rsvpCheckError } = await supabase
            .from("event_attendees")
            .select("id, status")
            .eq("event_id", event.id)
            .eq("user_id", user.id)
            .maybeSingle(); // Check for any status, not just "going" or "maybe"
          
          if (rsvpCheckError && rsvpCheckError.code !== "PGRST116") {
            console.error("Error verifying RSVP:", rsvpCheckError);
          } else if (userRsvp) {
            console.log("RSVP verified in database:", userRsvp);
            // Only set to true if status is "going" or "maybe"
            if (userRsvp.status === "going" || userRsvp.status === "maybe") {
              setIsRegistered(true);
            }
          } else {
            console.warn("RSVP not found in database after creation");
            // Don't reset the state, keep it as true since the API said it succeeded
          }
        }, 300);
      }
    } catch (error: any) {
      console.error("Error adding interest:", error);
      alert(error.message || "Failed to update RSVP");
    }
  };

  const handleRemoveInterest = async () => {
    if (!event) return;

    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove RSVP");
      }

      // Update state
      setIsRegistered(false);
      setIsRemoveInterestDialogOpen(false);
      console.log("RSVP removed successfully");
      
      // Dispatch custom event to refresh home page interested events
      window.dispatchEvent(new CustomEvent("eventInterested"));
      
      // Refresh the page to update the UI and calendar
      router.refresh();
    } catch (error: any) {
      console.error("Error removing RSVP:", error);
      alert(error.message || "Failed to update RSVP");
    }
  };

  const handleUpdateRsvp = (isGoing: boolean) => {
    setIsRegistered(isGoing);
    // If user selects "Not going", we can optionally do something
    // For now, just update the state
  };

  const handleSaveEvent = async () => {
    if (!event) return;
    
    // Check if user is logged in
    if (!isLoggedIn) {
      router.push("/auth/login?redirect=/events/" + event.id);
      return;
    }

    if (isSaved) {
      // Unsave event directly (no confirmation needed for button click)
      await performUnsaveEvent(event.id);
    } else {
      // Save event
      await performSaveEvent(event.id);
    }
  };

  const performSaveEvent = async (eventId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save event");
      }

      setIsSaved(true);
      
      // Dispatch custom event to notify events page to refresh saved events
      window.dispatchEvent(new CustomEvent('eventSaved', { detail: { eventId } }));
    } catch (error: any) {
      console.error("Error saving event:", error);
      alert(error.message || "Failed to save event");
    } finally {
      setIsSaving(false);
    }
  };

  const performUnsaveEvent = async (eventId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}/save`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unsave event");
      }

      setIsSaved(false);
      
      // Dispatch custom event to notify events page to refresh saved events
      window.dispatchEvent(new CustomEvent('eventUnsaved', { detail: { eventId } }));
    } catch (error: any) {
      console.error("Error unsaving event:", error);
      alert(error.message || "Failed to unsave event");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsaveEvent = async () => {
    if (!unsaveEventId) return;

    await performUnsaveEvent(unsaveEventId);
    setIsUnsaveDialogOpen(false);
    setUnsaveEventId(null);
  };

  // Filter related events based on matching tags
  const relatedEventsByTags = (event?.relatedEvents || [])
    .map((relatedEvent) => {
      const matchingTags = relatedEvent.tags.filter((tag) =>
        event?.tags.includes(tag)
      );
      return {
        ...relatedEvent,
        matchScore: matchingTags.length,
        matchingTags,
      };
    })
    .filter((relatedEvent) => relatedEvent.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? relatedEventsByTags.length - 1 : prev - 1
    );
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) =>
      prev === relatedEventsByTags.length - 1 ? 0 : prev + 1
    );
  };

  const availableSpots = event ? event.capacity - event.registered : 0;
  const registrationPercentage = event ? (event.registered / event.capacity) * 100 : 0;


  // Show loading state
  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The event you're looking for doesn't exist."}</p>
          <Button onClick={() => router.push("/events")}>
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {fromCommunityAdmin ? (
            <Link href={communityId ? `/communities/${communityId}/admin/events` : "/communities/admin"}>
              <Button
                variant="ghost"
                className="hover:bg-gray-100 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Community Admin Events
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-gray-100 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden">
        <img
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                {event.category}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-white/90 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>
                  {formatTime(event.time)}{event.endTime ? ` - ${formatTime(event.endTime)}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{event.location.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{event.registered} interested</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-50 bg-white shadow-md rounded-2xl overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center p-3 md:p-5 md:pl-8">
            {/* Left: Date & Title */}
            <div className="hidden min-w-0 flex-1 flex-col gap-1 md:flex">
              <time className="text-xs uppercase leading-5 tracking-tight text-gray-500">
                {formatDate(event.date) && `${formatDate(event.date)} · `}{formatTime(event.time)}
              </time>
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {event.title}
              </h2>
            </div>

            {/* Right: Badges & Actions */}
            <div className="ml-auto flex w-full items-center justify-between gap-2 md:w-auto md:justify-start">
              {isAdmin ? (
                <>
                  {/* Admin Badge */}
                  <div className="flex items-center gap-2 pl-3 sm:flex">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-1.5 text-sm font-medium rounded-full">
                      <Award className="h-3 w-3 mr-1" />
                      <span className="truncate px-0.5">Event Admin</span>
                    </Badge>
                  </div>
                </>
              ) : isRegistered ? (
                <>
                  {/* "Interested to join" Badge - Left side */}
                  <div className="flex items-center gap-2 pl-3 sm:flex">
                    <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1.5 text-sm font-medium rounded-full">
                      <Check className="h-3 w-3 mr-1" />
                      <span className="truncate px-0.5">Interested to join</span>
                    </Badge>
                  </div>

                  {/* Save Button - Right side (always visible) */}
                  <div className="flex flex-1 items-center gap-2 sm:flex-initial">
                    <div className="flex w-full min-w-0 items-center gap-2">
                      <Button
                        className={isSaved 
                          ? "border-violet-600 text-violet-600 bg-violet-50 hover:bg-violet-100 px-6 py-5 rounded-none flex-1 min-w-0 sm:w-auto sm:flex-initial sm:min-w-max shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          : "bg-violet-600 hover:bg-violet-700 text-white px-6 py-5 rounded-none flex-1 min-w-0 sm:w-auto sm:flex-initial sm:min-w-max shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        }
                        onClick={handleSaveEvent}
                        disabled={isCheckingAuth || isSaving}
                        variant={isSaved ? "outline" : "default"}
                      >
                        <span className="truncate">
                          {isSaving 
                            ? (isSaved ? "Unsaving..." : "Saving...")
                            : isSaved 
                            ? "Saved" 
                            : "Save"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-2 md:flex-row">
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-1 items-center gap-2 sm:flex-initial">
                    <div className="flex w-full min-w-0 items-center gap-2">
                      {/* Save Button - Replaces Interested to join */}
                      <Button
                        className={isSaved 
                          ? "border-violet-600 text-violet-600 bg-violet-50 hover:bg-violet-100 px-6 py-5 rounded-none flex-1 min-w-0 sm:w-auto sm:flex-initial sm:min-w-max shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          : "bg-violet-600 hover:bg-violet-700 text-white px-6 py-5 rounded-none flex-1 min-w-0 sm:w-auto sm:flex-initial sm:min-w-max shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        }
                        onClick={handleSaveEvent}
                        disabled={isCheckingAuth || isSaving}
                        variant={isSaved ? "outline" : "default"}
                      >
                        <span className="truncate">
                          {isSaving 
                            ? (isSaved ? "Unsaving..." : "Saving...")
                            : isSaved 
                            ? "Saved" 
                            : "Save"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Interested to Join Button - Above Tabs */}
          {!isAdmin && (
            <div className="flex items-center">
              <Button
                className={isRegistered 
                  ? "border-violet-600 text-violet-600 bg-violet-50 hover:bg-violet-100 px-6 py-5 rounded-none shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  : "bg-violet-600 hover:bg-violet-700 text-white px-6 py-5 rounded-none shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                }
                onClick={handleInterestedClick}
                disabled={isCheckingAuth}
                variant={isRegistered ? "outline" : "default"}
              >
                <span className="truncate">
                  {isCheckingAuth 
                    ? "Loading..." 
                    : isRegistered 
                    ? "You're interested" 
                    : "Interested to join"}
                </span>
              </Button>
            </div>
          )}

          {/* Content Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="announcement">Announcement</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6 mt-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    About This Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {event.longDescription}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Link */}
              {event.link && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Registration Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                      <Link
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-600 hover:text-violet-700 hover:underline break-all"
                      >
                        {event.link}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Topics & Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="hover:bg-violet-50 cursor-pointer"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Organizer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User2 className="h-5 w-5" />
                    Event Organizer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={event.organizer.image || "/placeholder.svg"}
                      />
                      <AvatarFallback>{event.organizer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {event.organizer.name}
                        </h3>
                        {event.organizer.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4">
                        Event organizer and community member
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                        <Button variant="outline" size="sm">
                          Contact Organizer
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Other Events by Organizer */}
              {event.organizerEvents && event.organizerEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-violet-600" />
                      Other Events by {event.organizer.name}
                    </CardTitle>
                    <CardDescription>
                      Discover more events from this organizer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {event.organizerEvents.map((orgEvent) => (
                        <Link
                          key={orgEvent.id}
                          href={`/events/${orgEvent.id}`}
                          className="group"
                        >
                          <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-violet-300">
                            <div className="relative h-40 overflow-hidden">
                              <img
                                src={orgEvent.image || "/placeholder.svg"}
                                alt={orgEvent.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-3 right-3 flex gap-2">
                                <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm">
                                  {orgEvent.category}
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-violet-600 transition-colors">
                                {orgEvent.title}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(orgEvent.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Users className="h-4 w-4" />
                                  <span>{orgEvent.attendees} interested</span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-violet-700 border-violet-300"
                                >
                                  {orgEvent.price === 0
                                    ? "FREE"
                                    : `$${orgEvent.price}`}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Related Events Carousel */}
              {relatedEventsByTags.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-violet-600" />
                        You Might Also Like
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handlePrevSlide}
                          className="h-8 w-8"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleNextSlide}
                          className="h-8 w-8"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Based on similar tags: {event.tags.slice(0, 3).join(", ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative overflow-hidden">
                      <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{
                          transform: `translateX(-${currentSlide * 100}%)`,
                        }}
                      >
                        {relatedEventsByTags.map((relatedEvent) => (
                          <div
                            key={relatedEvent.id}
                            className="w-full flex-shrink-0"
                          >
                            <Card className="border-0 shadow-none hover:shadow-lg transition-shadow cursor-pointer">
                              <div className="relative h-48 overflow-hidden rounded-lg mb-3">
                                <img
                                  src={relatedEvent.image || "/placeholder.svg"}
                                  alt={relatedEvent.title}
                                  className="w-full h-full object-cover"
                                />
                                {/* Category & Price Badges */}
                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                  <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm">
                                    {relatedEvent.category}
                                  </Badge>
                                  <Badge className="bg-violet-600 text-white">
                                    {relatedEvent.price === 0
                                      ? "Free"
                                      : `$${relatedEvent.price}`}
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h3 className="font-semibold text-lg line-clamp-2">
                                  {relatedEvent.title}
                                </h3>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(relatedEvent.date)}</span>
                                </div>

                                {/* Matching Tags */}
                                <div className="flex flex-wrap gap-2">
                                  {relatedEvent.matchingTags
                                    .slice(0, 3)
                                    .map((tag, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs bg-violet-50 text-violet-600"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                </div>

                                <Button
                                  className="w-full bg-violet-600 hover:bg-violet-700"
                                  asChild
                                >
                                  <a href={`/events/${relatedEvent.id}`}>
                                    View Event
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </a>
                                </Button>
                              </div>
                            </Card>
                          </div>
                        ))}
                      </div>

                      {/* Carousel Indicators */}
                      <div className="flex items-center justify-center gap-2 mt-4">
                        {relatedEventsByTags.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              index === currentSlide
                                ? "w-8 bg-violet-600"
                                : "w-2 bg-gray-300 hover:bg-gray-400"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="location" className="space-y-6 mt-6">
              {event.location.isOnline ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Video className="h-5 w-5 text-purple-600" />
                          Virtual Event
                        </CardTitle>
                        <CardDescription className="mt-2">
                          This is an online event. Join from anywhere!
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isRegistered ? (
                      <>
                        {/* Event Details - Simple and Clean */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-gray-700">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <span>{formatDate(event.date)}</span>
                          </div>

                          <div className="flex items-center gap-3 text-gray-700">
                            <Video className="h-5 w-5 text-gray-500" />
                            <div>
                              <span className="text-gray-600">
                                Online event
                              </span>
                              <a
                                href={event.location.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-600 hover:text-blue-700 hover:underline mt-0.5"
                              >
                                {event.location.meetingLink}
                              </a>
                            </div>
                          </div>
                        </div>

                      </>
                    ) : (
                      <>
                        {/* Not Registered Yet */}
                        <div className="text-center py-12">
                          <div className="inline-flex h-20 w-20 rounded-full bg-violet-100 items-center justify-center mb-4">
                            <Video className="h-10 w-10 text-violet-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Join this online event
                          </h3>
                          <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Click the button below to attend this virtual event
                            and get the meeting link.
                          </p>
                          <Button
                            size="lg"
                            className={isRegistered
                              ? "border-violet-600 text-violet-600 bg-violet-50 hover:bg-violet-100 px-8 py-6 rounded-full shadow-md hover:shadow-lg transition-all"
                              : "bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 rounded-full shadow-md hover:shadow-lg transition-all"
                            }
                            onClick={handleInterestedClick}
                            variant={isRegistered ? "outline" : "default"}
                          >
                            {isRegistered ? "You're interested" : "Interested to join"}
                          </Button>
                        </div>

                        {/* Platform Info */}
                        <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Platform Information
                          </h4>
                          <div className="space-y-2 text-sm text-gray-700">
                            <p className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
                              This event will be hosted on Zoom
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
                              No special software installation required
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
                              Works on desktop, mobile, and tablet
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-violet-600" />
                      Event Location
                    </CardTitle>
                    <CardDescription>
                      {event.location.city || event.location.address || "Location information"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Location Details */}
                    <div className="space-y-2 text-sm">
                      {event.location.address && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-gray-700 min-w-[80px]">Address:</span>
                        <span className="text-gray-600">{event.location.address}</span>
                      </div>
                      )}
                      {event.location.city && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-700 min-w-[80px]">City:</span>
                          <span className="text-gray-600">{event.location.city}</span>
                        </div>
                      )}
                    </div>

                    {/* Map - Only show if we have coordinates */}
                    {event.location.lat !== 0 && event.location.lng !== 0 ? (
                    <InteractiveLeafletMap
                      location={event.location}
                        height="400px"
                      showControls={true}
                      showDirections={true}
                      zoom={15}
                    />
                    ) : (
                      <div className="p-6 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-200">
                        <MapPin className="h-10 w-10 text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium mb-2">Map preview unavailable</p>
                        {(event.location.address || event.location.city) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              const query = event.location.city || event.location.address;
                              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
                              window.open(mapsUrl, "_blank");
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Google Maps
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="announcement" className="mt-6">
              <EventDiscussion
                eventId={event.id}
                organizerName={event.organizer.name}
                hasAnnouncement={true}
                isAdmin={isAdmin}
                communityId={event.communities?.id || ""}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Update RSVP Dialog */}
      <UpdateRsvpDialog
        open={isUpdateRsvpOpen}
        onOpenChange={setIsUpdateRsvpOpen}
        currentStatus={isRegistered}
        onUpdate={handleUpdateRsvp}
      />

      {/* Attendees Dialog */}
      <AttendeesDialog
        open={isAttendeesOpen}
        onOpenChange={setIsAttendeesOpen}
        totalAttendees={event.registered}
        maxAttendees={event.capacity}
        eventTitle={event.title}
      />

      {/* Unsave Confirmation Dialog */}
      <AlertDialog open={isUnsaveDialogOpen} onOpenChange={setIsUnsaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure to unsave?</AlertDialogTitle>
            <AlertDialogDescription>
              This event will be removed from your saved events list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsaveEvent}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSaving ? "Unsaving..." : "Yes, unsave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Interest Confirmation Dialog */}
      <AlertDialog open={isRemoveInterestDialogOpen} onOpenChange={setIsRemoveInterestDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure to remove event from your interest list?</AlertDialogTitle>
            <AlertDialogDescription>
              This event will be removed from your interested events list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveInterest}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
