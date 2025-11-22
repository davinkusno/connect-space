"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveLeafletMap } from "@/components/ui/interactive-leaflet-map";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Heart,
  ExternalLink,
  User2,
  ChevronRight,
  ChevronLeft,
  Ticket,
  BookOpen,
  Award,
  Globe,
  Sparkles,
  Bookmark,
  ArrowLeft,
  Video,
  Copy,
  CheckCheck,
  PenLine,
  Check,
} from "lucide-react";
import { toast } from "sonner";

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

const DUMMY_EVENT: Event = {
  id: "1",
  title: "AI in Healthcare Summit 2024",
  description:
    "Join industry leaders for an insightful exploration of AI's transformative potential in healthcare.",
  longDescription: `Join us for a comprehensive summit exploring the cutting-edge applications of artificial intelligence in healthcare. This full-day event brings together leading researchers, healthcare professionals, and tech innovators to discuss the latest breakthroughs, challenges, and opportunities in AI-powered healthcare solutions.

  The summit will feature keynote presentations from renowned experts, interactive workshops, panel discussions, and networking sessions. Topics will include machine learning applications in diagnostics, AI-powered drug discovery, ethical considerations in healthcare AI, and future trends in digital health.

  This is an unmissable opportunity for healthcare professionals, researchers, data scientists, and entrepreneurs to stay at the forefront of this rapidly evolving field.`,
  date: "2024-03-15",
  time: "09:00",
  endTime: "17:00",
  location: {
    venue: "Virtual Event",
    address: "Online Platform",
    city: "Online",
    lat: 0,
    lng: 0,
    isOnline: true,
    meetingLink: "https://zoom.us/j/123456789?pwd=abc123xyz",
  },
  organizer: {
    name: "HealthTech Innovations",
    image: "/placeholder.svg?height=60&width=60",
    verified: true,
  },
  category: "Technology",
  price: {
    type: "paid",
    amount: 299,
    currency: "USD",
  },
  capacity: 500,
  registered: 347,
  image: "/placeholder.svg?height=600&width=1200",
  images: [
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
  ],
  tags: ["AI", "Healthcare", "Technology", "Innovation", "Networking"],
  website: "https://healthtechinnovations.com",
  relatedEvents: [
    {
      id: "2",
      title: "Machine Learning Workshop",
      date: "2024-03-22",
      image: "/placeholder.svg?height=120&width=160",
      category: "Technology",
      tags: ["AI", "Machine Learning", "Tech", "Workshop"],
      price: 199,
    },
    {
      id: "3",
      title: "Digital Health Conference",
      date: "2024-04-05",
      image: "/placeholder.svg?height=120&width=160",
      category: "Healthcare",
      tags: ["Healthcare", "Technology", "Innovation", "Networking"],
      price: 349,
    },
    {
      id: "4",
      title: "AI Ethics Symposium",
      date: "2024-04-18",
      image: "/placeholder.svg?height=120&width=160",
      category: "Technology",
      tags: ["AI", "Ethics", "Innovation"],
      price: 0,
    },
    {
      id: "5",
      title: "Healthcare Innovation Forum",
      date: "2024-04-25",
      image: "/placeholder.svg?height=120&width=160",
      category: "Healthcare",
      tags: ["Healthcare", "Innovation", "Technology"],
      price: 299,
    },
    {
      id: "6",
      title: "AI Networking Meetup",
      date: "2024-05-02",
      image: "/placeholder.svg?height=120&width=160",
      category: "Technology",
      tags: ["AI", "Networking", "Technology"],
      price: 0,
    },
  ],
  organizerEvents: [
    {
      id: "7",
      title: "Digital Health Transformation Summit",
      date: "2024-04-10",
      image: "/placeholder.svg?height=200&width=350",
      category: "Healthcare",
      price: 249,
      attendees: 432,
    },
    {
      id: "8",
      title: "Medical AI Workshop Series",
      date: "2024-03-28",
      image: "/placeholder.svg?height=200&width=350",
      category: "Technology",
      price: 199,
      attendees: 287,
    },
    {
      id: "9",
      title: "HealthTech Networking Event",
      date: "2024-04-15",
      image: "/placeholder.svg?height=200&width=350",
      category: "Healthcare",
      price: 0,
      attendees: 156,
    },
  ],
};

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params Promise (Next.js 15+)
  const { id } = use(params);

  // Create a copy of DUMMY_EVENT with the correct ID from params
  // TODO: Fetch actual event data from Supabase based on id
  const baseEvent = { ...DUMMY_EVENT, id: id };

  // Customize event data based on ID for demo purposes
  const eventTitles: Record<string, string> = {
    "1": "AI & Machine Learning Summit 2024",
    "2": "Digital Marketing Masterclass",
    "3": "Startup Funding Workshop",
    "4": "Web Development Bootcamp",
    "5": "Blockchain & Cryptocurrency Forum",
    "6": "AI in Healthcare Summit 2024",
  };

  const eventLocations: Record<string, typeof baseEvent.location> = {
    "1": {
      venue: "Moscone Convention Center",
      address: "747 Howard Street",
      city: "San Francisco",
      lat: 37.7749,
      lng: -122.4194,
      isOnline: false,
    },
    "2": {
      venue: "WeWork Pacific Design Center",
      address: "8687 Melrose Ave",
      city: "West Hollywood",
      lat: 34.0839,
      lng: -118.3847,
      isOnline: false,
    },
    "3": {
      venue: "TechHub Boston",
      address: "1 Broadway",
      city: "Cambridge",
      lat: 42.3626,
      lng: -71.0843,
      isOnline: false,
    },
    "4": {
      venue: "General Assembly",
      address: "315 W 36th St",
      city: "New York",
      lat: 40.7549,
      lng: -73.9925,
      isOnline: false,
    },
    "5": {
      venue: "Convention Center",
      address: "800 W Katella Ave",
      city: "Anaheim",
      lat: 33.8031,
      lng: -117.9239,
      isOnline: false,
    },
    "6": {
      venue: "Virtual Event",
      address: "Online Platform",
      city: "Online",
      lat: 0,
      lng: 0,
      isOnline: true,
      meetingLink: "https://zoom.us/j/123456789?pwd=abc123xyz",
    },
  };

  const event = {
    ...baseEvent,
    title: eventTitles[id] || baseEvent.title,
    location: eventLocations[id] || baseEvent.location,
  };

  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [eventData, setEventData] = useState<Event | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [communityCategories, setCommunityCategories] = useState<string[]>([]);
  const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

  // Load event data and posts
  useEffect(() => {
    const loadEventData = async () => {
      try {
        const supabase = getSupabaseBrowser();
        
        // Check if event ID is a dummy event
        if (id.startsWith("dummy-")) {
          // Use dummy event data
          setEventData(event);
          setIsLoadingEvent(false);
          setIsLoadingPosts(false);
          return;
        }

        // Fetch real event data
        const { data: eventRecord, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();

        if (eventError || !eventRecord) {
          console.error("Event not found, using dummy data:", eventError);
          setEventData(event);
          setIsLoadingEvent(false);
          setIsLoadingPosts(false);
          return;
        }

        // Parse location
        let locationData: any = {
          venue: "Location TBD",
          address: "Location TBD",
          city: "",
          lat: 0,
          lng: 0,
          isOnline: eventRecord.is_online || false,
        };

        if (eventRecord.location) {
          try {
            const parsed = typeof eventRecord.location === 'string' 
              ? JSON.parse(eventRecord.location) 
              : eventRecord.location;
            
            if (eventRecord.is_online && parsed.meetingLink) {
              locationData = {
                venue: "Virtual Event",
                address: "Online Platform",
                city: "Online",
                lat: 0,
                lng: 0,
                isOnline: true,
                meetingLink: parsed.meetingLink,
              };
            } else if (parsed.venue || parsed.address) {
              locationData = {
                venue: parsed.venue || parsed.address || "Location TBD",
                address: parsed.address || parsed.venue || "Location TBD",
                city: parsed.city || "",
                lat: parsed.lat || 0,
                lng: parsed.lng || 0,
                isOnline: false,
              };
            }
          } catch (e) {
            console.error("Error parsing location:", e);
          }
        }

        // Get community_id
        const communityIdValue = eventRecord.community_id;
        setCommunityId(communityIdValue);

        // Fetch community data to get category
        const { data: communityData } = await supabase
          .from("communities")
          .select("category, creator_id")
          .eq("id", communityIdValue)
          .single();

        // Parse community category
        let categories: string[] = [];
        if (communityData?.category) {
          try {
            // Try to parse as JSON array
            const parsed = typeof communityData.category === 'string' 
              ? JSON.parse(communityData.category) 
              : communityData.category;
            
            if (Array.isArray(parsed)) {
              categories = parsed;
            } else if (typeof parsed === 'string') {
              categories = [parsed];
            }
          } catch (e) {
            // If not JSON, treat as single string
            if (typeof communityData.category === 'string') {
              categories = [communityData.category];
            }
          }
        }
        setCommunityCategories(categories);

        // Get admin user_id for this community
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if user is admin
          const { data: membership } = await supabase
            .from("community_members")
            .select("user_id")
            .eq("community_id", communityIdValue)
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (membership) {
            setAdminUserId(user.id);
          } else {
            // Check if user is creator
            if (communityData && communityData.creator_id === user.id) {
              setAdminUserId(user.id);
            }
          }
        }

        // Format event data
        const startTime = new Date(eventRecord.start_time);
        const endTime = new Date(eventRecord.end_time);
        
        const formattedEvent: Event = {
          id: eventRecord.id,
          title: eventRecord.title,
          description: eventRecord.description || "",
          longDescription: eventRecord.description || "",
          date: startTime.toISOString().split('T')[0],
          time: startTime.toTimeString().slice(0, 5),
          endTime: endTime.toTimeString().slice(0, 5),
          location: locationData,
          organizer: {
            name: "Community Admin",
            image: "/placeholder.svg?height=60&width=60",
            verified: true,
          },
          category: eventRecord.category || "General",
          price: {
            type: "free",
          },
          capacity: eventRecord.max_attendees || 0,
          registered: 0, // TODO: Fetch from event_attendees
          image: eventRecord.image_url || "/placeholder.svg?height=600&width=1200",
          images: eventRecord.image_url ? [eventRecord.image_url] : [],
          tags: eventRecord.category ? [eventRecord.category] : [],
        };

        setEventData(formattedEvent);
        setIsLoadingEvent(false);

        // Load posts
        await loadPosts(id);
      } catch (error) {
        console.error("Error loading event data:", error);
        setEventData(event);
        setIsLoadingEvent(false);
        setIsLoadingPosts(false);
      }
    };

    loadEventData();
  }, [id]);

  // Load posts for the event
  const loadPosts = async (eventId: string) => {
    try {
      setIsLoadingPosts(true);
      const response = await fetch(`/api/posts?event_id=${eventId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error("Failed to load posts");
        setPosts([]);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Load attendees for the event
  const loadAttendees = async () => {
    try {
      setIsLoadingAttendees(true);
      const supabase = getSupabaseBrowser();
      
      // Check if event ID is a dummy event
      if (id.startsWith("dummy-")) {
        setAttendees([]);
        setIsLoadingAttendees(false);
        return;
      }

      // Fetch attendees with status "going" (which means "Attending")
      const { data: attendeesData, error: attendeesError } = await supabase
        .from("event_attendees")
        .select("id, user_id, registered_at")
        .eq("event_id", id)
        .eq("status", "going")
        .order("registered_at", { ascending: false });

      if (attendeesError) {
        console.error("Error fetching attendees:", attendeesError);
        setAttendees([]);
      } else if (attendeesData && attendeesData.length > 0) {
        // Fetch user details for each attendee
        const userIds = attendeesData.map((a: any) => a.user_id);
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, full_name, avatar_url, email")
          .in("id", userIds);

        if (usersError) {
          console.error("Error fetching users:", usersError);
          setAttendees([]);
        } else {
          // Combine attendees with user data
          const userMap = new Map((usersData || []).map((u: any) => [u.id, u]));
          const transformedAttendees = attendeesData.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            registered_at: item.registered_at,
            user: userMap.get(item.user_id) || null,
          }));
          setAttendees(transformedAttendees);
        }
      } else {
        setAttendees([]);
      }
    } catch (error) {
      console.error("Error loading attendees:", error);
      setAttendees([]);
    } finally {
      setIsLoadingAttendees(false);
    }
  };

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

  // Handle create post
  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      return;
    }

    if (!communityId || !adminUserId) {
      console.error("Missing community_id or admin_user_id");
      return;
    }

    setIsCreatingPost(true);
    try {
      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: postTitle,
          content: postContent,
          community_id: communityId,
          event_id: id,
          is_pinned: isPinned,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Reload posts
        await loadPosts(id);
        // Reset form
        setPostTitle("");
        setPostContent("");
        setIsPinned(false);
        toast.success("Post created successfully!");
      } else {
        const error = await response.json();
        console.error("Failed to create post:", error);
        toast.error(error.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsCreatingPost(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2024-01-01T${timeStr}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopyLink = () => {
    if (displayEvent.location.meetingLink) {
      navigator.clipboard.writeText(displayEvent.location.meetingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleAttendClick = () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      // Redirect to login/register page with return URL
      router.push("/auth/login?redirect=/events/" + displayEvent.id);
      return;
    }

    // Directly set as registered (works for both online and onsite)
    setIsRegistered(true);
    // Optionally scroll to location tab for online events
    if (displayEvent.location.isOnline) {
      const locationTab = document.querySelector('[value="location"]');
      if (locationTab) {
        (locationTab as HTMLElement).click();
      }
    }
  };

  const handleSaveEvent = () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      // Redirect to login/register page with return URL
      router.push("/auth/login?redirect=/events/" + displayEvent.id);
      return;
    }

    // Toggle save state
    // TODO: Implement actual save/bookmark functionality with Supabase
    console.log("Event saved/bookmarked");
  };

  // Use eventData if available, otherwise fallback to event (dummy)
  const displayEvent = eventData || event;
  
  const availableSpots = displayEvent.capacity - displayEvent.registered;
  const registrationPercentage = displayEvent.capacity > 0 
    ? (displayEvent.registered / displayEvent.capacity) * 100 
    : 0;

  // Check if user is admin
  const isAdmin = !!adminUserId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="hover:bg-gray-100 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      {isLoadingEvent ? (
        <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden bg-gray-200 animate-pulse" />
      ) : (
      <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden">
        <img
            src={displayEvent.image || "/placeholder.svg"}
            alt={displayEvent.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Floating Action Buttons */}
          <div className="absolute top-6 right-6 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              onClick={handleSaveEvent}
              disabled={isCheckingAuth}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                  {displayEvent.category}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                {displayEvent.title}
            </h1>

              <div className="flex flex-wrap items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                  <span className="font-medium">{formatDate(displayEvent.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>
                    {formatTime(displayEvent.time)} - {formatTime(displayEvent.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                  <span>{displayEvent.location.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                  <span>{displayEvent.registered} attending</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-50 bg-white shadow-md rounded-2xl overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center p-3 md:p-5 md:pl-8">
            {/* Left: Date & Title */}
            <div className="hidden min-w-0 flex-1 flex-col gap-1 md:flex">
              <time className="text-xs uppercase leading-5 tracking-tight text-gray-500">
                {formatDate(displayEvent.date)} · {formatTime(displayEvent.time)}
              </time>
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {displayEvent.title}
              </h2>
            </div>

            {/* Right: Badges & Actions */}
            <div className="ml-auto flex w-full items-center justify-between gap-2 md:w-auto md:justify-start">
              {isRegistered ? (
                <>
                  {/* "You're going!" Badge */}
                  <div className="flex items-center gap-2 pl-3 sm:flex">
                    <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1.5 text-sm font-medium rounded-full">
                      <Check className="h-3 w-3 mr-1" />
                      <span className="truncate px-0.5">You're going!</span>
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-1 items-center gap-2 sm:flex-initial">
                    <div className="flex w-full min-w-0 items-center gap-2">
                      {/* Edit RSVP Button */}
                      <Button
                        variant="ghost"
                        className="hover:bg-gray-100 text-gray-700 px-6 py-4 rounded-full flex-1 min-w-0 sm:w-auto sm:flex-initial sm:min-w-max"
                        onClick={() => {
                          /* RSVP edit coming soon */
                        }}
                      >
                        <PenLine className="h-5 w-5 mr-2" />
                        <span className="truncate">Edit RSVP</span>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-2 md:flex-row"></div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-1 items-center gap-2 sm:flex-initial">
                    <div className="flex w-full min-w-0 items-center gap-2">
                      {/* Bookmark Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full hover:bg-gray-100"
                        onClick={handleSaveEvent}
                        disabled={isCheckingAuth}
                      >
                        <Bookmark className="h-5 w-5 text-gray-700" />
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
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                setShowAttendeesDialog(true);
                await loadAttendees();
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              View Attendees
            </Button>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
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
                      {displayEvent.longDescription}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-6 mt-6">
              {displayEvent.location.isOnline ? (
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
                            <span>{formatDate(displayEvent.date)}</span>
                          </div>

                          <div className="flex items-center gap-3 text-gray-700">
                            <Video className="h-5 w-5 text-gray-500" />
                            <div>
                              <span className="text-gray-600">
                                Online event
                              </span>
                              <a
                                href={displayEvent.location.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-600 hover:text-blue-700 hover:underline mt-0.5"
                              >
                                {displayEvent.location.meetingLink}
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
                            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 rounded-full shadow-md hover:shadow-lg transition-all"
                            onClick={handleAttendClick}
                          >
                            Attend online
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
                    <CardTitle>Event Location</CardTitle>
                    <CardDescription>
                      {displayEvent.location.venue} • {displayEvent.location.address},{" "}
                      {displayEvent.location.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractiveLeafletMap
                      location={displayEvent.location}
                      height="500px"
                      showControls={true}
                      showDirections={true}
                      zoom={15}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="discussion" className="mt-6">
              <div className="space-y-6">
                {/* Admin Post Form - Only show if user is admin */}
                {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User2 className="h-5 w-5 text-violet-600" />
                        Create Discussion Post
                    </CardTitle>
                    <CardDescription>
                      Share announcements and updates with event attendees
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Post Title
                        </label>
                        <input
                          type="text"
                          placeholder="Enter post title..."
                            value={postTitle}
                            onChange={(e) => setPostTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Post Content
                        </label>
                        <textarea
                          placeholder="Share updates, announcements, or start a discussion..."
                          rows={4}
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                              />
                            <span className="text-sm text-gray-600">
                              Pin this post
                            </span>
                          </label>
                        </div>
                          <Button
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                            onClick={handleCreatePost}
                            disabled={isCreatingPost || !postTitle.trim() || !postContent.trim()}
                          >
                            {isCreatingPost ? "Posting..." : "Post Update"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* Pinned Posts */}
                {posts.filter((post) => post.is_pinned).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Pinned Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                        {posts
                          .filter((post) => post.is_pinned)
                          .map((post) => (
                            <div
                              key={post.id}
                              className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
                            >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={post.author?.avatar_url || "/placeholder.svg"}
                                    />
                                    <AvatarFallback>
                                      {post.author?.full_name
                                        ?.split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                        .toUpperCase() || "A"}
                                    </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">
                                        {post.author?.full_name || "Admin"}
                                </span>
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                  <Award className="h-3 w-3 mr-1" />
                                  Pinned
                                </Badge>
                              </div>
                              <span className="text-xs text-gray-500">
                                      {new Date(post.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                                {post.title}
                        </h3>
                              <p className="text-gray-700 text-sm mb-3 whitespace-pre-line">
                                {post.content}
                              </p>
                        </div>
                          ))}
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* Recent Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-gray-600" />
                      Recent Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPosts ? (
                      <div className="text-center py-8 text-gray-500">
                        Loading posts...
                            </div>
                    ) : posts.filter((post) => !post.is_pinned).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No posts yet. Be the first to post!
                          </div>
                    ) : (
                      <div className="space-y-4">
                        {posts
                          .filter((post) => !post.is_pinned)
                          .map((post) => (
                            <div
                              key={post.id}
                              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={post.author?.avatar_url || "/placeholder.svg"}
                                    />
                                    <AvatarFallback>
                                      {post.author?.full_name
                                        ?.split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                        .toUpperCase() || "A"}
                                    </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-semibold text-sm">
                                      {post.author?.full_name || "Admin"}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                      {new Date(post.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                                {post.title}
                        </h3>
                              <p className="text-gray-700 text-sm mb-3 whitespace-pre-line">
                                {post.content}
                        </p>
                      </div>
                          ))}
                    </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayEvent.images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-video rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Event image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Attendees Dialog */}
      <Dialog open={showAttendeesDialog} onOpenChange={setShowAttendeesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Event Attendees
            </DialogTitle>
            <DialogDescription>
              People who are attending this event
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {isLoadingAttendees ? (
              <div className="text-center py-8 text-gray-500">
                Loading attendees...
              </div>
            ) : attendees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No attendees yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={attendee.user?.avatar_url || "/placeholder.svg"}
                        alt={attendee.user?.full_name || "User"}
                      />
                      <AvatarFallback>
                        {attendee.user?.full_name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {attendee.user?.full_name || "Unknown User"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {attendee.user?.email || ""}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(attendee.registered_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
