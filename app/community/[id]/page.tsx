"use client";

<<<<<<< Updated upstream
import { use, useState, useEffect, useRef } from "react";
=======
import { use, useState, useEffect } from "react";
>>>>>>> Stashed changes
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Users,
  Calendar,
  MessageCircle,
  Share2,
  Bell,
  UserPlus,
  UserMinus,
  ThumbsUp,
  Reply,
  Send,
  ImageIcon,
  Navigation,
  Hash,
<<<<<<< Updated upstream
  Settings,
  Globe,
  Lock,
  Loader2,
  ArrowLeft,
  Crown,
  Shield,
  Star,
  TrendingUp,
  Clock,
  X,
  Edit,
  Trash2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseBrowser, getClientSession } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

// Dynamic import for Leaflet map
const LeafletMap = dynamic(
  () => import("@/components/ui/interactive-leaflet-map").then(mod => mod.InteractiveLeafletMap),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div> }
);
=======
  Edit,
  Save,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FloatingChat } from "@/components/chat/floating-chat";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";
>>>>>>> Stashed changes

export default function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [community, setCommunity] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<"creator" | "admin" | "moderator" | "member" | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "discussions");
  
  // Tab-specific data
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  // Post creation
  const [newPost, setNewPost] = useState("");
<<<<<<< Updated upstream
=======
  const [activeTab, setActiveTab] = useState("about");
>>>>>>> Stashed changes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});


<<<<<<< Updated upstream
  // Load community data and user role
  useEffect(() => {
    loadCommunityData();
  }, [id]);
=======
  // Check if user is owner/creator of the community
  const [isOwner, setIsOwner] = useState(false);
  
  // Community data state
  const [communityData, setCommunityData] = useState<any>(null);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  // Description edit state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Load community data from database
  useEffect(() => {
    const loadCommunityData = async () => {
      setIsLoadingCommunity(true);
      try {
        const supabase = getSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch community data
        const { data: commData, error: commError } = await supabase
          .from("communities")
          .select("*")
          .eq("id", id)
          .single();

        if (commError || !commData) {
          console.error("Error fetching community:", commError);
          setIsLoadingCommunity(false);
          return;
        }

        // Check ownership
        if (user && commData.creator_id === user.id) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }

        // Get member count
        const { count: memCount } = await supabase
          .from("community_members")
          .select("*", { count: "exact", head: true })
          .eq("community_id", id);
        
        setMemberCount(memCount || 0);

        // Get event count
        const { count: evtCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("community_id", id);
        
        setEventCount(evtCount || 0);

        // Parse location
        let locationData = {
          lat: 0,
          lng: 0,
          address: "",
          city: "",
        };

        if (commData.location) {
          try {
            let parsed: any = null;
            
            if (typeof commData.location === 'string') {
              try {
                parsed = JSON.parse(commData.location);
              } catch (e) {
                locationData.address = commData.location;
                parsed = null;
              }
            } else {
              parsed = commData.location;
            }
            
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              locationData = {
                lat: parsed.lat || 0,
                lng: parsed.lng || 0,
                address: parsed.address || parsed.Address || parsed.full_address || "",
                city: parsed.city || parsed.City || "",
              };
            }
          } catch (e) {
            console.error("Error parsing location:", e);
            if (typeof commData.location === 'string') {
              locationData.address = commData.location;
            }
          }
        }

        // Parse category and tags
        let categoryValue = "General";
        let tagsValue: string[] = [];
        
        if (commData.category) {
          try {
            const parsed = JSON.parse(commData.category);
            if (Array.isArray(parsed) && parsed.length > 0) {
              categoryValue = parsed[0];
              tagsValue = parsed;
            } else {
              categoryValue = commData.category;
              tagsValue = [commData.category];
            }
          } catch (e) {
            categoryValue = commData.category;
            tagsValue = [commData.category];
          }
        }

        // Also check if there's a separate tags field
        if (commData.tags) {
          if (Array.isArray(commData.tags)) {
            tagsValue = commData.tags;
          } else if (typeof commData.tags === 'string') {
            try {
              tagsValue = JSON.parse(commData.tags);
            } catch (e) {
              tagsValue = [commData.tags];
            }
          }
        }

        // Format community data
        const formattedCommunity = {
          id: commData.id,
          name: commData.name || "Community",
          description: commData.description || "",
          members: memCount || 0,
          location: locationData,
          category: categoryValue,
          coverImage: commData.banner_url || "/placeholder.svg?height=300&width=800",
          profileImage: commData.logo_url || "/placeholder.svg?height=120&width=120",
          tags: tagsValue.length > 0 ? tagsValue : ["General"],
          upcomingEvents: evtCount || 0,
          founded: commData.created_at 
            ? new Date(commData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : "Unknown",
          gradient: "gradient-primary",
          rules: [
            "Be respectful and professional",
            "No spam or self-promotion",
            "Stay on topic",
            "Help others and share knowledge",
          ],
          moderators: [], // Can be fetched separately if needed
        };

        setCommunityData(formattedCommunity);
      } catch (error) {
        console.error("Error loading community data:", error);
      } finally {
        setIsLoadingCommunity(false);
      }
    };

    loadCommunityData();
  }, [id]);

  // Use real data or fallback to dummy data while loading
  const community = communityData || {
    id: id,
    name: "Loading...",
    description: "",
    members: 0,
    location: {
      lat: 0,
      lng: 0,
      address: "",
      city: "",
    },
    category: "General",
    coverImage: "/placeholder.svg?height=300&width=800",
    profileImage: "/placeholder.svg?height=120&width=120",
    tags: [],
    upcomingEvents: 0,
    founded: "Unknown",
    gradient: "gradient-primary",
    rules: [],
    moderators: [],
  };
>>>>>>> Stashed changes

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  // Load tab-specific data when tab changes
  useEffect(() => {
    if (community) {
      loadTabData(activeTab);
    }
  }, [activeTab, community]);

  const loadCommunityData = async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabaseBrowser();
      const session = await getClientSession();

      // Fetch community data
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select(`
          *,
          creator:creator_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          categories (
            id,
            name
          )
        `)
        .eq("id", id)
        .single();

      if (communityError) {
        console.error("Error fetching community:", communityError);
        toast.error("Failed to load community");
        router.push("/communities");
        return;
      }

      // Parse location if it's a string
      if (communityData.location && typeof communityData.location === 'string') {
        try {
          communityData.location = JSON.parse(communityData.location);
        } catch {
          // If not JSON, treat as address string
          communityData.location = { address: communityData.location };
        }
      }

      // Set category name from relationship
      if (communityData.categories) {
        communityData.category = (communityData.categories as any).name || communityData.category;
      }

      setCommunity(communityData);

      if (session?.user) {
        setCurrentUser(session.user);

        // Check if user is the creator
        if (communityData.creator_id === session.user.id) {
          setUserRole("creator");
          setIsMember(true);
        } else {
          // Check membership and role
          const { data: membershipData } = await supabase
            .from("community_members")
            .select("role")
            .eq("community_id", id)
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (membershipData) {
            setIsMember(true);
            setUserRole(membershipData.role as any);
          }
        }
      }

      // Get member count
      const { count } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", id);

      setMemberCount((count || 0) + 1); // +1 for creator
    } catch (error) {
      console.error("Error loading community:", error);
      toast.error("Failed to load community");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTabData = async (tab: string) => {
    if (!community) return;
    
    try {
      setIsLoadingTab(true);
      const supabase = getSupabaseBrowser();

      switch (tab) {
        case "discussions":
          // Load discussions from messages table (top-level messages only)
          const { data: messagesData } = await supabase
            .from("messages")
            .select(`
              id,
              content,
              created_at,
              updated_at,
              is_edited,
              sender_id
            `)
            .eq("community_id", id)
            .is("parent_id", null)
            .order("created_at", { ascending: false })
            .limit(20);

          if (messagesData && messagesData.length > 0) {
            // Load user data for each message
            const messagesWithUsers = await Promise.all(
              messagesData.map(async (message) => {
                const { data: userData } = await supabase
                  .from("users")
                  .select("id, username, full_name, avatar_url")
                  .eq("id", message.sender_id)
                  .single();

                // Load replies for each message
                const { data: replies } = await supabase
                  .from("messages")
                  .select(`
                    id,
                    content,
                    created_at,
                    updated_at,
                    is_edited,
                    sender_id
                  `)
                  .eq("parent_id", message.id)
                  .order("created_at", { ascending: true })
                  .limit(5);

                // Load user data for replies
                const repliesWithUsers = await Promise.all(
                  (replies || []).map(async (reply: any) => {
                    const { data: replyUserData } = await supabase
                      .from("users")
                      .select("id, username, full_name, avatar_url")
                      .eq("id", reply.sender_id)
                      .single();

                    return {
                      ...reply,
                      users: replyUserData,
                    };
                  })
                );

                return {
                  ...message,
                  users: userData,
                  replies: repliesWithUsers,
                };
              })
            );

            setDiscussions(messagesWithUsers);
          } else {
            setDiscussions([]);
          }
          break;

        case "events":
          // Load events for this community (both upcoming and recent past events)
          // Show upcoming events first, then recent past events
          const now = new Date().toISOString();
          const { data: upcomingEvents } = await supabase
            .from("events")
            .select("*")
            .eq("community_id", id)
            .gte("start_time", now)
            .order("start_time", { ascending: true })
            .limit(20);
          
          // Also load recent past events (last 30 days) for context
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const { data: recentPastEvents } = await supabase
            .from("events")
            .select("*")
            .eq("community_id", id)
            .gte("start_time", thirtyDaysAgo.toISOString())
            .lt("start_time", now)
            .order("start_time", { ascending: false })
            .limit(5);
          
          // Combine: upcoming first, then recent past
          // Use a Map to ensure unique events by ID (in case of duplicates)
          const eventsMap = new Map();
          
          // Add upcoming events first
          (upcomingEvents || []).forEach((event: any) => {
            if (event?.id) {
              eventsMap.set(String(event.id), event);
            }
          });
          
          // Add recent past events (won't overwrite if duplicate)
          (recentPastEvents || []).forEach((event: any) => {
            if (event?.id && !eventsMap.has(String(event.id))) {
              eventsMap.set(String(event.id), event);
            }
          });
          
          // Convert back to array: upcoming first, then recent past
          const allEvents = Array.from(eventsMap.values());
          
          // Sort: upcoming events first (by start_time ascending), then past events (by start_time descending)
          allEvents.sort((a, b) => {
            const aTime = new Date(a.start_time).getTime();
            const bTime = new Date(b.start_time).getTime();
            const now = Date.now();
            
            const aIsUpcoming = aTime >= now;
            const bIsUpcoming = bTime >= now;
            
            // If both are upcoming or both are past, sort by time
            if (aIsUpcoming === bIsUpcoming) {
              return aIsUpcoming ? aTime - bTime : bTime - aTime;
            }
            
            // Upcoming events come first
            return aIsUpcoming ? -1 : 1;
          });
          
          setEvents(allEvents);
          break;

        case "members":
          // Load members
          const { data: membersData } = await supabase
            .from("community_members")
            .select(`
              user_id,
              role,
              joined_at,
              users (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq("community_id", id)
            .order("joined_at", { ascending: false })
            .limit(20);

          // Add creator as first member
          const creatorMember = {
            user_id: community.creator_id,
            role: "creator",
            joined_at: community.created_at,
            users: community.creator
          };

          setMembers([creatorMember, ...(membersData || [])]);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Error loading tab data:", error);
    } finally {
      setIsLoadingTab(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!currentUser) {
      toast.error("Please log in to join this community");
      router.push("/auth/login");
      return;
    }

    try {
      setIsJoining(true);
      const supabase = getSupabaseBrowser();

      // Ensure user exists in users table before joining
      const { data: existingUser, error: userCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (userCheckError && userCheckError.code !== "PGRST116") {
        throw new Error("Failed to verify user account");
      }

      // If user doesn't exist in users table, create it
      if (!existingUser) {
        const { error: createUserError } = await supabase
          .from("users")
          .insert({
            id: currentUser.id,
            email: currentUser.email || "",
            username: currentUser.user_metadata?.username || currentUser.email?.split("@")[0] || null,
            full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
            avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
          });

        if (createUserError) {
          console.error("Error creating user record:", createUserError);
          // Continue anyway - might be a duplicate key error
        }
      }

      if (isMember) {
        // Leave community
        const { error } = await supabase
          .from("community_members")
          .delete()
          .eq("community_id", id)
          .eq("user_id", currentUser.id);

        if (error) throw error;

        setIsMember(false);
        setUserRole(null);
        setMemberCount(prev => prev - 1);
        toast.success("You've left the community");
        loadTabData(activeTab); // Reload tab data
    } else {
        // Join community (check if private)
        if (community.is_private) {
          // For private communities, try to create join request
          // If table doesn't exist, show message to contact admin
          const { error } = await supabase
            .from("community_join_requests")
            .insert({
              community_id: id,
              user_id: currentUser.id,
              status: "pending"
            });

          if (error) {
            // Table might not exist, show helpful message
            toast.info("This is a private community. Please contact the community admin to request access.");
          } else {
            toast.info("Join request sent! Wait for admin approval.");
          }
        } else {
          // Check if already a member (to avoid duplicate key error)
          const { data: existingMember } = await supabase
            .from("community_members")
            .select("id")
            .eq("community_id", id)
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (existingMember) {
            toast.info("You are already a member of this community");
            setIsMember(true);
            setUserRole("member");
            return;
          }

          // Join directly
          const { error } = await supabase
            .from("community_members")
            .insert({
              community_id: id,
              user_id: currentUser.id,
              role: "member"
            });

          if (error) {
            // Handle specific error codes
            if (error.code === "23503") {
              throw new Error("User account not found. Please try logging out and back in.");
            } else if (error.code === "23505") {
              // Unique constraint violation - already a member
              toast.info("You are already a member of this community");
              setIsMember(true);
              setUserRole("member");
              return;
            }
            throw error;
          }

          setIsMember(true);
          setUserRole("member");
          setMemberCount(prev => prev + 1);
          toast.success("Welcome to the community!");
          loadTabData(activeTab); // Reload tab data
        }
      }
    } catch (error: any) {
      console.error("Error joining/leaving community:", error);
      if (error.code === "23503") {
        toast.error("User account issue. Please try logging out and back in.");
      } else {
        toast.error(error.message || "Failed to update membership");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handlePostDiscussion = async () => {
    if (!newPost.trim() || !isMember || !currentUser) return;

    try {
      setIsSubmitting(true);
      const supabase = getSupabaseBrowser();

      const { error } = await supabase
        .from("messages")
        .insert({
          content: newPost.trim(),
          community_id: id,
          sender_id: currentUser.id,
          parent_id: null,
        });

      if (error) throw error;

      toast.success("Discussion posted!");
      setNewPost("");
      // Reload discussions
      loadTabData("discussions");
    } catch (error: any) {
      console.error("Error posting discussion:", error);
      toast.error(error.message || "Failed to post discussion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !isMember || !currentUser) return;

    try {
      setIsSubmitting(true);
      const supabase = getSupabaseBrowser();

      const { error } = await supabase
        .from("messages")
        .insert({
          content: replyContent.trim(),
          community_id: id,
          sender_id: currentUser.id,
          parent_id: parentId,
        });

      if (error) throw error;

      toast.success("Reply posted!");
      setReplyContent("");
      setReplyingTo(null);
      // Reload discussions
      loadTabData("discussions");
    } catch (error: any) {
      console.error("Error posting reply:", error);
      toast.error(error.message || "Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

<<<<<<< Updated upstream

  const canManage = userRole === "creator" || userRole === "admin";

  if (isLoading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading community...</p>
=======
  const handleEditDescription = () => {
    setEditedDescription(communityData?.description || "");
    setIsEditingDescription(true);
  };

  const handleCancelEditDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
  };

  const handleSaveDescription = async () => {
    if (!communityData?.id) {
      toast.error("Community not found");
      return;
    }

    if (!editedDescription.trim()) {
      toast.error("Description cannot be empty");
      return;
    }

    if (editedDescription.length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    if (editedDescription.length > 1000) {
      toast.error("Description must be less than 1000 characters");
      return;
    }

    setIsSavingDescription(true);
    try {
      const response = await fetch(`/api/communities/${communityData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editedDescription.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to save description";
        toast.error(errorMessage);
        return;
      }

      setCommunityData((prev: any) => prev ? { ...prev, description: editedDescription.trim() } : null);
      setIsEditingDescription(false);
      toast.success("Description updated successfully!");
    } catch (error: any) {
      console.error("Failed to save description:", error);
      toast.error("Failed to save description. Please try again.");
    } finally {
      setIsSavingDescription(false);
    }
  };

  const generateDescription = async () => {
    if (!communityData?.name) {
      toast.error("Please ensure community has a name");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const tagsText = communityData.tags && communityData.tags.length > 0 
        ? communityData.tags.slice(0, 3).join(", ")
        : "General";
      
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "community-description",
          params: {
            name: communityData.name,
            category: communityData.category || "General",
            tags: tagsText,
            locationType: "physical",
            location: `${communityData.location.city || ""}, ${communityData.location.address || ""}`,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to generate description";
        toast.error(errorMessage);
        return;
      }

      if (data && data.description && typeof data.description === 'string') {
        const generatedDescription = data.description;
        setEditedDescription(generatedDescription);
        toast.success("Description generated successfully!");
      } else {
        const tagsText = communityData.tags && communityData.tags.length > 0 
          ? communityData.tags.slice(0, 3).join(", ")
          : "various topics";
        const fallbackDescription = `${communityData.name} is a ${communityData.category || "community"} focused on ${tagsText}. Join us to connect with like-minded individuals, share knowledge, and participate in activities related to our community interests.`;
        setEditedDescription(fallbackDescription);
        toast.success("Description generated (using fallback)");
      }
    } catch (error: any) {
      console.error("Failed to generate description:", error);
      const tagsText = communityData?.tags && communityData.tags.length > 0 
        ? communityData.tags.slice(0, 3).join(", ")
        : "various topics";
      const fallbackDescription = `${communityData?.name || "This community"} is a ${communityData?.category || "community"} focused on ${tagsText}. Join us to connect with like-minded individuals, share knowledge, and participate in activities related to our community interests.`;
      setEditedDescription(fallbackDescription);
      toast.warning("Using fallback description. AI generation encountered an issue.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Show loading state
  if (isLoadingCommunity) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading community...</p>
>>>>>>> Stashed changes
        </div>
      </div>
    );
  }

<<<<<<< Updated upstream
  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Community Not Found</h2>
            <p className="text-gray-600 mb-6">
              The community you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/communities">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Browse Communities
                </Button>
              </Link>
          </CardContent>
        </Card>
            </div>
=======
  // Show error state if community not found
  if (!communityData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Community Not Found</h1>
          <p className="text-gray-600 mb-4">The community you're looking for doesn't exist.</p>
          <Link href="/discover">
            <Button className="bg-violet-700 hover:bg-violet-800 text-white">
              Browse Communities
            </Button>
          </Link>
        </div>
      </div>
>>>>>>> Stashed changes
    );
  }

  return (
<<<<<<< Updated upstream
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Hero Section with Cover Image */}
      <div className="relative h-72 overflow-hidden bg-gradient-to-br from-violet-600 to-blue-600">
        {community.banner_url && (
=======
    <div className="min-h-screen bg-white">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
>>>>>>> Stashed changes
        <Image
            src={community.banner_url}
          alt={community.name}
          fill
          className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Back button */}
        <div className="absolute top-6 left-6">
          <Link href="/communities">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Communities
            </Button>
          </Link>
            </div>

        {/* Community Info */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="flex items-end gap-6">
              <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
                <AvatarImage src={community.logo_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white text-3xl font-bold">
                  {community.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-white">
                    {community.name}
                  </h1>
                  {community.is_private ? (
                    <Lock className="h-6 w-6 text-white/80" />
                  ) : (
                    <Globe className="h-6 w-6 text-white/80" />
                  )}
                </div>
                <div className="flex items-center gap-6 text-white/90 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                    <span>{memberCount.toLocaleString()} members</span>
                </div>
                  {community.location && (community.location.city || community.location.address) && (
                    <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                      <span>{community.location.city || community.location.address?.split(',')[0] || "Location"}</span>
                    </div>
                  )}
                  {community.category && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {community.category}
                </Badge>
                  )}
                  {userRole && (
                    <Badge variant="secondary" className="bg-violet-500/50 text-white border-0">
                      {userRole === "creator" ? (
                        <><Crown className="h-3 w-3 mr-1" /> Creator</>
                      ) : userRole === "admin" ? (
                        <><Shield className="h-3 w-3 mr-1" /> Admin</>
                      ) : userRole === "moderator" ? (
                        <><Star className="h-3 w-3 mr-1" /> Moderator</>
                      ) : (
                        "Member"
                      )}
                    </Badge>
                  )}
              </div>
            </div>
          </div>
      </div>
            </div>
              </div>

      {/* Action Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleJoinCommunity}
                disabled={isJoining || userRole === "creator"}
                className={
                  isMember
                    ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    : "bg-violet-600 hover:bg-violet-700 text-white"
                }
              >
                {isJoining ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isMember ? (
                  <UserMinus className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {userRole === "creator" ? "Your Community" : isMember ? "Leave" : "Join Community"}
                </Button>
              
              <Button 
                variant="outline" 
                className="border-gray-200 hover:bg-gray-50"
                onClick={async () => {
                  const url = window.location.href;
                  try {
                    if (navigator.share) {
                      await navigator.share({
                        title: community.name,
                        text: `Check out ${community.name} on ConnectSpace!`,
                        url: url,
                      });
                      toast.success("Shared successfully!");
                    } else {
                      // Fallback: Copy to clipboard
                      await navigator.clipboard.writeText(url);
                      toast.success("Link copied to clipboard!");
                    }
                  } catch (error: any) {
                    // User cancelled or error occurred
                    if (error.name !== "AbortError") {
                      // Fallback: Copy to clipboard
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success("Link copied to clipboard!");
                      } catch (clipboardError) {
                        toast.error("Failed to share. Please copy the URL manually.");
                      }
                    }
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

<<<<<<< Updated upstream
            {canManage && (
              <Link href={`/community/${id}/manage`}>
                <Button variant="default" className="bg-purple-600 hover:bg-purple-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Community
=======
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Action Buttons */}
            <InViewTransition
              effect="slide-up"
              className="flex items-center gap-4 mb-8"
            >
              {!isOwner && (
                <>
                  <ButtonPulse
                    onClick={handleJoinCommunity}
                    className={
                      isJoined
                        ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                        : "bg-violet-700 hover:bg-violet-800 text-white"
                    }
                    pulseColor={
                      isJoined
                        ? "rgba(229, 231, 235, 0.5)"
                        : "rgba(124, 58, 237, 0.3)"
                    }
                  >
                    <Button
                      size="lg"
                      className={
                        isJoined
                          ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                          : "bg-violet-700 hover:bg-violet-800 text-white"
                      }
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {isJoined ? "Joined" : "Join Community"}
                    </Button>
                  </ButtonPulse>
                  <HoverScale>
                    <Button
                      variant="outline"
                      className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Follow
                    </Button>
                  </HoverScale>
                </>
              )}
              <HoverScale>
                <Button
                  variant="outline"
                  className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                  onClick={() => setShowShareOptions(!showShareOptions)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </HoverScale>
              {!isOwner && (
                <HoverScale>
                  <Button
                    variant="outline"
                    className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    Join Chat
                  </Button>
                </HoverScale>
              )}
            </InViewTransition>

            {/* Share Options Dropdown */}
            <FadeTransition show={showShareOptions} className="mb-4">
              <Card className="p-4 border-gray-100">
                <div className="flex gap-2">
                  {[
                    "Twitter",
                    "Facebook",
                    "LinkedIn",
                    "Email",
                    "Copy Link",
                  ].map((option) => (
                    <Button
                      key={option}
                      variant="outline"
                      size="sm"
                      className="text-sm"
                    >
                      {option}
>>>>>>> Stashed changes
                    </Button>
              </Link>
            )}
                </div>
        </div>
      </div>

<<<<<<< Updated upstream
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1 h-auto">
                <TabsTrigger
                  value="discussions"
                  className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
=======
            {/* Community Tabs */}
            <Tabs
              defaultValue="about"
              className="w-full"
              onValueChange={handleTabChange}
            >
              <TabsList className="grid w-full grid-cols-4 bg-gray-50 border-gray-200">
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
>>>>>>> Stashed changes
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="announcements"
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
                >
                  Announcements
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  Events
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  Members
                </TabsTrigger>
<<<<<<< Updated upstream
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  About
                </TabsTrigger>
              </TabsList>

              {/* Discussions Tab */}
              <TabsContent value="discussions" className="space-y-6 mt-6">
                {/* New Post (only for members) */}
                {isMember && (
                  <Card className="border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Avatar>
                          <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                          <AvatarFallback>
                            {currentUser?.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
=======
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-8 mt-8">
                <SlideTransition show={activeTab === "about"} direction="up">
                  <Card className="border-gray-100">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-medium text-gray-900">
                          About This Community
                        </CardTitle>
                        {isOwner && !isEditingDescription && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditDescription}
                            className="border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Description
                          </Button>
                        )}
                        {isOwner && isEditingDescription && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEditDescription}
                              disabled={isSavingDescription}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveDescription}
                              disabled={isSavingDescription}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {isSavingDescription ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={generateDescription}
                              disabled={isGeneratingDescription}
                              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg"
                            >
                              {isGeneratingDescription ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Generate with AI
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {isEditingDescription ? (
                        <div className="space-y-4">
                          <Textarea
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            placeholder="Enter community description..."
                            className="min-h-[150px] text-base leading-relaxed resize-none"
                            disabled={isSavingDescription}
                          />
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>Character count: {editedDescription.length}</span>
                              <span className={editedDescription.length < 10 || editedDescription.length > 1000 ? "text-red-500" : ""}>
                                {editedDescription.length < 10 
                                  ? "Minimum 10 characters required" 
                                  : editedDescription.length > 1000 
                                  ? "Maximum 1000 characters" 
                                  : `${1000 - editedDescription.length} characters remaining`}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 leading-relaxed">
                          {community.description}
                        </p>
                      )}

                      <div className="py-6">
                        <div>
                          <span className="text-sm text-gray-500">Founded</span>
                          <p className="font-medium text-gray-900">
                            {community.founded}
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-gray-200" />

                      <div>
                        <h4 className="font-medium mb-4 text-gray-900 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-violet-600" />
                          Location
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-gray-800 mb-2">
                            {community.location.address}
                          </p>
                          <HoverScale>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowLocationMap(true)}
                              className="border-gray-200 hover:border-violet-200 hover:bg-violet-50"
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                              View on Map
                            </Button>
                          </HoverScale>
                        </div>
                      </div>

                      <Separator className="bg-gray-200" />

                      <div>
                        <h4 className="font-medium mb-4 text-gray-900">
                          Community Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {community.tags.map((tag, index) => (
                            <HoverScale key={index}>
                              <Badge
                                variant="outline"
                                className="border-gray-200 text-gray-600"
                              >
                                {tag}
                              </Badge>
                            </HoverScale>
                          ))}
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                </SlideTransition>
              </TabsContent>

              {/* Announcements Tab */}
              <TabsContent value="announcements" className="space-y-8 mt-8">
                {/* New Announcement - Only for Admin/Owner */}
                {isOwner && (
                  <SlideTransition
                    show={activeTab === "announcements"}
                    direction="up"
                  >
                    <Card className="border-gray-100">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Avatar>
                            <AvatarImage src="/placeholder.svg?height=40&width=40" />
                            <AvatarFallback>Admin</AvatarFallback>
>>>>>>> Stashed changes
                          </Avatar>
                          <div className="flex-1 space-y-4">
                            <Textarea
                              placeholder="Create an announcement for the community..."
                              value={newPost}
                              onChange={(e) => setNewPost(e.target.value)}
                            className="min-h-[100px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 resize-none"
                            />
<<<<<<< Updated upstream
                            <div className="flex justify-between items-center">
                            <Button variant="outline" size="sm" className="border-gray-200">
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Add Image
                              </Button>
=======
                            <div className="flex justify-end items-center">
                              <ButtonPulse
                                disabled={!newPost.trim() || isSubmitting}
                                onClick={handleSubmitPost}
                                pulseColor="rgba(124, 58, 237, 0.3)"
                              >
>>>>>>> Stashed changes
                                <Button
                                  disabled={!newPost.trim() || isSubmitting}
                              onClick={handlePostDiscussion}
                              className="bg-violet-600 hover:bg-violet-700 text-white"
                                >
                                  {isSubmitting ? (
                                    <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Posting...
                                    </>
                                  ) : (
                                    <>
<<<<<<< Updated upstream
                                  <Send className="h-4 w-4 mr-2" />
                                  Post
=======
                                      <Send className="h-4 w-4 mr-2" /> Post Announcement
>>>>>>> Stashed changes
                                    </>
                                  )}
                                </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                )}

<<<<<<< Updated upstream
                {/* Discussions List */}
                {isLoadingTab ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                  </div>
                ) : discussions.length === 0 ? (
                  <Card className="border-gray-200">
                    <CardContent className="p-12 text-center">
                      <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No discussions yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Be the first to start a conversation in this community!
                      </p>
                      {isMember && (
                        <Button 
                          className="bg-violet-600 hover:bg-violet-700 text-white"
                          onClick={() => {
                            const textarea = document.querySelector('textarea');
                            textarea?.focus();
                          }}
                        >
                          Start a Discussion
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {discussions.map((discussion) => (
                      <Card key={discussion.id} className="border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
=======
                {/* Announcement Posts */}
                <div className="space-y-6">
                  {discussions.map((post, index) => (
                    <InViewTransition
                      key={post.id}
                      effect="fade"
                      delay={index * 100}
                    >
                      <Card className="hover:shadow-md transition-shadow duration-300 border-gray-100 hover:border-violet-200">
                        <CardContent className="p-8">
>>>>>>> Stashed changes
                          <div className="flex gap-4">
                            <Avatar>
                              <AvatarImage src={discussion.users?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                                {(discussion.users?.username || discussion.users?.full_name || "U").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
<<<<<<< Updated upstream
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">
                                  {discussion.users?.full_name || discussion.users?.username || "Anonymous"}
                                </h4>
                                <span className="text-sm text-gray-500">
                                  {new Date(discussion.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
=======
                              <div className="flex items-center gap-3 mb-3">
                                <span className="font-medium text-gray-900">
                                  {post.author}
                                </span>
                                <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                                  Admin
                                </Badge>
                                <span className="text-gray-500 text-sm">
                                  {post.timestamp}
>>>>>>> Stashed changes
                                </span>
                                {discussion.is_edited && (
                                  <Badge variant="outline" className="text-xs">Edited</Badge>
                                )}
                              </div>
<<<<<<< Updated upstream
                              <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                                {discussion.content}
                              </p>
                              
                              {/* Replies Count and Toggle */}
                              {discussion.replies && discussion.replies.length > 0 && (
                                <div className="mb-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-violet-600 mb-3"
                                    onClick={() => setShowReplies(prev => ({
                                      ...prev,
                                      [discussion.id]: !prev[discussion.id]
                                    }))}
                                  >
                                    <Reply className="h-4 w-4 mr-1" />
                                    {showReplies[discussion.id] 
                                      ? `Hide ${discussion.replies.length} ${discussion.replies.length === 1 ? 'reply' : 'replies'}`
                                      : `Show ${discussion.replies.length} ${discussion.replies.length === 1 ? 'reply' : 'replies'}`
                                    }
                                  </Button>
                                  
                                  {/* Replies - Only show when toggled */}
                                  {showReplies[discussion.id] && (
                                    <div className="ml-4 pl-4 border-l-2 border-violet-200 space-y-3 mt-2">
                                      {discussion.replies.map((reply: any) => (
                                        <div key={reply.id} className="flex gap-3 group">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={reply.users?.avatar_url} />
                                            <AvatarFallback className="bg-gray-200 text-xs">
                                              {(reply.users?.username || reply.users?.full_name || "U").charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-sm font-medium text-gray-900">
                                                {reply.users?.full_name || reply.users?.username || "Anonymous"}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {new Date(reply.created_at).toLocaleDateString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "numeric",
                                                  minute: "2-digit",
                                                })}
                                              </span>
                                              {/* Delete button for reply owner */}
                                              {currentUser && reply.sender_id === currentUser.id && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                                                  onClick={async () => {
                                                    if (confirm("Are you sure you want to delete this reply?")) {
                                                      const supabase = getSupabaseBrowser();
                                                      const { error } = await supabase
                                                        .from("messages")
                                                        .delete()
                                                        .eq("id", reply.id);
                                                      
                                                      if (error) {
                                                        toast.error("Failed to delete reply");
                                                      } else {
                                                        toast.success("Reply deleted");
                                                        loadTabData("discussions");
                                                      }
                                                    }
                                                  }}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              )}
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                              {reply.content}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-violet-600"
                                    onClick={() => setReplyingTo(replyingTo === discussion.id ? null : discussion.id)}
                                  >
                                    <Reply className="h-4 w-4 mr-1" />
                                    Reply
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-violet-600"
                                  >
                                    <ThumbsUp className="h-4 w-4 mr-1" />
                                    Like
                                  </Button>
                                </div>
                                {/* Delete button for discussion owner */}
                                {currentUser && discussion.sender_id === currentUser.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={async () => {
                                      if (confirm("Are you sure you want to delete this discussion?")) {
                                        const supabase = getSupabaseBrowser();
                                        const { error } = await supabase
                                          .from("messages")
                                          .delete()
                                          .eq("id", discussion.id);
                                        
                                        if (error) {
                                          toast.error("Failed to delete discussion");
                                        } else {
                                          toast.success("Discussion deleted");
                                          loadTabData("discussions");
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                )}
                              </div>

                              {/* Reply Form */}
                              {replyingTo === discussion.id && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                                      <AvatarFallback>
                                        {currentUser?.email?.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-2">
                                      <Textarea
                                        placeholder="Write a reply..."
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        className="min-h-[80px] border-gray-200 focus:border-violet-300 resize-none"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setReplyingTo(null);
                                            setReplyContent("");
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          disabled={!replyContent.trim() || isSubmitting}
                                          onClick={() => handleReply(discussion.id)}
                                          className="bg-violet-600 hover:bg-violet-700 text-white"
                                        >
                                          {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            "Reply"
                                          )}
                                        </Button>
                              </div>
                                    </div>
                                  </div>
                                </div>
                              )}
=======
                              <h3 className="font-medium text-lg mb-3 text-gray-900">
                                {post.title}
                              </h3>
                              <p className="text-gray-700 leading-relaxed">
                                {post.content}
                              </p>
>>>>>>> Stashed changes
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
                </div>
                )}
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Upcoming Events</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {events.length} events scheduled
                    </p>
                  </div>
                  {canManage && (
                    <Link href={`/events/create?community_id=${id}`}>
                      <Button 
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Create Event
                      </Button>
                    </Link>
                    )}
                  </div>

                {isLoadingTab ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                  </div>
                ) : events.length === 0 ? (
                  <Card className="border-gray-200">
                    <CardContent className="p-12 text-center">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No upcoming events
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {canManage 
                          ? "Create the first event for your community!"
                          : "Check back later for upcoming events."}
                      </p>
                      {canManage && (
                        <Link href={`/events/create?community_id=${id}`}>
                          <Button 
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Create Event
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.map((event) => {
                      // Ensure event has a valid ID
                      if (!event?.id) {
                        console.warn("Event missing ID:", event);
                        return null;
                      }
                      
                      const eventId = String(event.id);
                      const isUpcoming = new Date(event.start_time) >= new Date();
                      const startDate = new Date(event.start_time);
                      const endDate = new Date(event.end_time);
                      
                      return (
                        <Link 
                          key={eventId} 
                          href={`/events/${eventId}`}
                          className="block group"
                        >
                          <Card className="border-gray-200 hover:shadow-xl hover:border-violet-400 transition-all duration-300 cursor-pointer overflow-hidden h-full bg-gradient-to-br from-white to-violet-50/30">
                            {event.image_url && (
                              <div className="relative h-48 w-full overflow-hidden">
                                <Image
                                  src={event.image_url}
                                  alt={event.title || "Event image"}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-3 right-3">
                                  {isUpcoming ? (
                                    <Badge className="bg-violet-600 text-white border-0">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      Upcoming
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-gray-500 text-white border-0">
                                      Past Event
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                                    {event.title}
                                  </h4>
                                  {event.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <div className="p-1.5 rounded-lg bg-violet-100 text-violet-600">
                                      <Clock className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {startDate.toLocaleDateString("en-US", {
                                          weekday: "long",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {startDate.toLocaleTimeString("en-US", {
                                          hour: "numeric",
                                          minute: "2-digit",
                                        })} - {endDate.toLocaleTimeString("en-US", {
                                          hour: "numeric",
                                          minute: "2-digit",
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {event.location && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                                        <MapPin className="h-4 w-4" />
                                      </div>
                                      <span className="flex-1 truncate">{event.location}</span>
                                    </div>
                                  )}
                                  
                                  {event.is_online && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <div className="p-1.5 rounded-lg bg-green-100 text-green-600">
                                        <Globe className="h-4 w-4" />
                                      </div>
                                      <span className="flex-1">Online Event</span>
                                    </div>
                                  )}
                                  
                                  {event.max_attendees && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                                        <Users className="h-4 w-4" />
                                      </div>
                                      <span className="flex-1">Max {event.max_attendees} attendees</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="pt-3 border-t border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                      {isUpcoming ? "Starts" : "Started"} {startDate.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-violet-600 group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </div>
                              </div>
<<<<<<< Updated upstream
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
=======
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </InViewTransition>
                  ))}
                </div>
              </TabsContent>

>>>>>>> Stashed changes

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Members</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {memberCount} total members
                    </p>
                  </div>
                  {isMember && (
                    <div className="w-64">
                      <Input
                        placeholder="Search members..."
                        className="border-gray-200"
                      />
                    </div>
                  )}
                  </div>

                {isLoadingTab ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {members.map((member: any) => (
                      <Card key={member.user_id} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={member.users?.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                                  {(member.users?.username || member.users?.full_name || "U").charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {member.users?.full_name || member.users?.username || "Anonymous"}
                                </h4>
                                  {member.role === "creator" && (
                                    <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs">
                                      <Crown className="h-3 w-3 mr-1" />
                                      Creator
                                    </Badge>
                                  )}
                                  {member.role === "admin" && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Admin
                                    </Badge>
                                  )}
                                  {member.role === "moderator" && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                      <Star className="h-3 w-3 mr-1" />
                                      Moderator
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  Joined {new Date(member.joined_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              </div>
                            </div>
<<<<<<< Updated upstream
                            {isMember && member.user_id !== currentUser?.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                className="border-gray-200"
                                onClick={() => {
                                  router.push(`/messages?user=${member.user_id}`);
                                }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Message
                                </Button>
                            )}
                          </div>
=======
>>>>>>> Stashed changes
                        </CardContent>
                      </Card>
                  ))}
                </div>
                )}
              </TabsContent>
<<<<<<< Updated upstream

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6 mt-6">
                <Card className="border-gray-200">
                    <CardHeader>
                    <CardTitle className="text-xl font-semibold">About This Community</CardTitle>
                    </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {community.description || "No description provided."}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                          <span className="text-sm text-gray-500">Founded</span>
                          <p className="font-medium text-gray-900">
                          {new Date(community.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                          </p>
                        </div>
                        <div>
                        <span className="text-sm text-gray-500">Category</span>
                        <p className="font-medium text-gray-900">
                          {community.category || "General"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Type</span>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          {community.is_private ? (
                            <>
                              <Lock className="h-4 w-4" />
                              Private
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4" />
                              Public
                            </>
                          )}
                          </p>
                        </div>
                      </div>

                    {/* Location with Map */}
                    {community.location && (community.location.lat && community.location.lng) && (
                      <>
                        <Separator />
                      <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-violet-600" />
                          Location
                        </h4>
                          <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-gray-800 font-medium mb-1">
                                {community.location.address || 
                                 (community.location.city && community.location.country 
                                   ? `${community.location.city}, ${community.location.country}`
                                   : community.location.city || community.location.country || "Location")}
                              </p>
                              {(community.location.lat && community.location.lng) && (
                                <p className="text-sm text-gray-600">
                                  Coordinates: {community.location.lat.toFixed(6)}, {community.location.lng.toFixed(6)}
                                </p>
                              )}
                            </div>
                            {/* Map Display */}
                            <div className="rounded-lg overflow-hidden border border-gray-200">
                              <LeafletMap
                                location={{
                                  lat: community.location.lat,
                                  lng: community.location.lng,
                                  address: community.location.address || "",
                                  city: community.location.city || "",
                                  venue: community.name,
                                }}
                                height="400px"
                                showControls={true}
                                showDirections={true}
                              />
                            </div>
                            {community.location.address && (
                            <Button
                              variant="outline"
                                className="w-full"
                                onClick={() => {
                                  const url = `https://www.google.com/maps/dir/?api=1&destination=${community.location.lat},${community.location.lng}`;
                                  window.open(url, '_blank');
                                }}
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                                Get Directions
                            </Button>
                            )}
                        </div>
                      </div>
                      </>
                    )}
                    </CardContent>
                  </Card>
              </TabsContent>
=======
>>>>>>> Stashed changes
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Stats */}
            <Card className="border-gray-200">
                <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                    Community Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Members
                    </span>
                  <span className="font-semibold text-gray-900">
                    {memberCount.toLocaleString()}
                    </span>
                  </div>
<<<<<<< Updated upstream
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Events
                  </span>
                  <span className="font-semibold text-gray-900">
                    {events.length}
                    </span>
                  </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Founded
                  </span>
                  <span className="font-semibold text-gray-900">
                    {new Date(community.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
=======
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upcoming Events</span>
                    <span className="font-medium text-gray-900">
                      {community.upcomingEvents}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Founded</span>
                    <span className="font-medium text-gray-900">
                      {community.founded}
>>>>>>> Stashed changes
                    </span>
                  </div>
                </CardContent>
              </Card>

            {/* Creator Info */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Created By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={community.creator?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                      {(community.creator?.username || "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {community.creator?.full_name || community.creator?.username || "Anonymous"}
                    </p>
                    <p className="text-sm text-violet-600">Founder</p>
                  </div>
                </div>
              </CardContent>
            </Card>

<<<<<<< Updated upstream
            {/* Quick Actions */}
            {isMember && (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                    className="w-full justify-start border-gray-200"
                    onClick={() => setActiveTab("discussions")}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Discussion
                    </Button>
                  {canManage && (
                    <Link href={`/events/create?community_id=${id}`} className="w-full">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-gray-200"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Create Event
                      </Button>
                    </Link>
                  )}
                    <Button
                      variant="outline"
                    className="w-full justify-start border-gray-200"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Invite Friends
                    </Button>
                </CardContent>
              </Card>
            )}
=======

            {/* Moderators */}
            <InViewTransition effect="slide-left" delay={100}>
              <Card className="border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">
                    Moderators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {community.moderators.map((mod, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={mod.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{mod.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {mod.name}
                        </p>
                        <p className="text-violet-700 text-xs">{mod.role}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </InViewTransition>
>>>>>>> Stashed changes
          </div>
        </div>
      </div>
    </div>
  );
}
