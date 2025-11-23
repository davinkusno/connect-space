"use client";

import { use, useState, useEffect, useRef } from "react";
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
  Bell,
  UserPlus,
  UserMinus,
  Reply,
  Send,
  ImageIcon,
  Navigation,
  Hash,
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
  AlertTriangle,
  MoreVertical,
  Save,
  Sparkles,
  Share2,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseBrowser, getClientSession } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ReportDialog } from "@/components/community/report-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InViewTransition, SlideTransition, FadeTransition } from "@/components/ui/content-transitions";
import { HoverScale, ButtonPulse } from "@/components/ui/micro-interactions";

// Dynamic import for Leaflet map
const LeafletMap = dynamic(
  () => import("@/components/ui/interactive-leaflet-map").then(mod => mod.InteractiveLeafletMap),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div> }
);

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
  const [eventsPage, setEventsPage] = useState(1);
  const eventsPerPage = 6;
  const [membersPage, setMembersPage] = useState(1);
  const membersPerPage = 12;

  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<"community" | "post" | "member" | "event">("community");
  const [reportTargetId, setReportTargetId] = useState<string>("");
  const [reportTargetName, setReportTargetName] = useState<string>("");

  // Join/Leave modal state
  const [joinLeaveModalOpen, setJoinLeaveModalOpen] = useState(false);

  // Post creation
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});

  // Description edit state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Additional state for UI features
  const [isOwner, setIsOwner] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);

  // Load community data and user role
  useEffect(() => {
    loadCommunityData();
  }, [id]);

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
          setIsOwner(true);
          setIsJoined(true);
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
            setIsJoined(true);
            setUserRole(membershipData.role as any);
            setIsOwner(membershipData.role === "admin");
          } else {
            setIsMember(false);
            setIsJoined(false);
          setIsOwner(false);
          }
        }
        }

      // Get member count - only approved members (status = true or null)
      // Creator is already included in community_members table, so no need to add +1
      const { count } = await supabase
          .from("community_members")
          .select("*", { count: "exact", head: true })
        .eq("community_id", id)
        .or("status.is.null,status.eq.true");
        
      setMemberCount(count || 0);
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
          // Load all members (admin, member, moderator) - only approved members
          const { data: allMembersData, error: allMembersError } = await supabase
            .from("community_members")
            .select(`
              user_id,
              role,
              joined_at,
              users!community_members_user_id_fkey (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq("community_id", id)
            .or("status.is.null,status.eq.true")
            .order("joined_at", { ascending: false });

          if (allMembersError) {
            console.error("Error fetching members:", allMembersError);
            toast.error("Failed to load members");
            setMembers([]);
            } else {
            // Map members and ensure creator is treated as admin
            const formattedMembers = (allMembersData || []).map((member: any) => {
              // If this member is the creator, treat them as admin
              const isCreator = member.user_id === community.creator_id;
              return {
                ...member,
                role: isCreator ? "admin" : member.role,
                users: member.users || null,
              };
            });
            setMembers(formattedMembers);
          }
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

  const handleJoinCommunity = () => {
    if (!currentUser) {
      toast.error("Please log in to join this community");
      router.push("/auth/login");
      return;
    }

    if (userRole === "creator") {
      return; // Creator cannot leave their own community
    }

    // Open confirmation modal
    setJoinLeaveModalOpen(true);
  };

  const confirmJoinLeave = async () => {
    if (!currentUser) {
      return;
    }

    try {
      setIsJoining(true);
      setJoinLeaveModalOpen(false);
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

  const handleEditDescription = () => {
    setEditedDescription(community?.description || "");
    setIsEditingDescription(true);
  };

  const handleCancelEditDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
  };

  const handleSaveDescription = async () => {
    if (!community?.id) {
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
      const response = await fetch(`/api/communities/${community.id}`, {
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

      setCommunity((prev: any) => prev ? { ...prev, description: editedDescription.trim() } : null);
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
    if (!community?.name) {
      toast.error("Please ensure community has a name");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const tagsText = community.tags && community.tags.length > 0 
        ? community.tags.slice(0, 3).join(", ")
        : "General";
      
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "community-description",
          params: {
            name: community.name,
            category: community.category || "General",
            tags: tagsText,
            locationType: "physical",
            location: `${community.location?.city || ""}, ${community.location?.address || ""}`,
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
        const tagsText = community.tags && community.tags.length > 0 
          ? community.tags.slice(0, 3).join(", ")
          : "various topics";
        const fallbackDescription = `${community.name} is a ${community.category || "community"} focused on ${tagsText}. Join us to connect with like-minded individuals, share knowledge, and participate in activities related to our community interests.`;
        setEditedDescription(fallbackDescription);
        toast.success("Description generated (using fallback)");
      }
    } catch (error: any) {
      console.error("Failed to generate description:", error);
      const tagsText = community?.tags && community.tags.length > 0 
        ? community.tags.slice(0, 3).join(", ")
        : "various topics";
      const fallbackDescription = `${community?.name || "This community"} is a ${community?.category || "community"} focused on ${tagsText}. Join us to connect with like-minded individuals, share knowledge, and participate in activities related to our community interests.`;
      setEditedDescription(fallbackDescription);
      toast.warning("Using fallback description. AI generation encountered an issue.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const canManage = userRole === "creator" || userRole === "admin";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Hero Section with Cover Image */}
      <div className="relative h-72 overflow-hidden bg-gradient-to-br from-violet-600 to-blue-600">
        {community.banner_url && (
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
              
              {currentUser && (
                    <Button
                      variant="outline"
                  className="border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                  onClick={() => {
                    setReportType("community");
                    setReportTargetId(id);
                    setReportTargetName(community.name);
                    setReportDialogOpen(true);
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report
                    </Button>
              )}
                </div>
          </div>
        </div>
            </div>

      {/* Main Content Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Community Tabs */}
            <Tabs
              defaultValue="about"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-4 bg-gray-50 border-gray-200">
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
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
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
                >
                  Events
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
                >
                  Members
                </TabsTrigger>
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
                          {community.tags.map((tag: string, index: number) => (
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
                {isLoadingTab ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                  </div>
                ) : (
                  <>
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
                          </Avatar>
                          <div className="flex-1 space-y-4">
                            <Textarea
                                  placeholder="Create an announcement for the community..."
                              value={newPost}
                              onChange={(e) => setNewPost(e.target.value)}
                                  className="min-h-[100px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 resize-none"
                            />
                                <div className="flex justify-end items-center">
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
                                        <Send className="h-4 w-4 mr-2" /> Post Announcement
                                    </>
                                  )}
                                </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </SlideTransition>
                )}

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
                          <div className="flex gap-4">
                            <Avatar>
                                  <AvatarImage src={post.users?.avatar_url || "/placeholder.svg?height=40&width=40"} />
                                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                                    {(post.users?.username || post.users?.full_name || post.author || "U").charAt(0)}
                                  </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="font-medium text-gray-900">
                                      {post.users?.full_name || post.users?.username || post.author || "Anonymous"}
                                </span>
                                    <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                                      Admin
                                    </Badge>
                                <span className="text-gray-500 text-sm">
                                      {post.timestamp || (post.created_at ? new Date(post.created_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                      }) : "")}
                                </span>
                              </div>
                              <h3 className="font-medium text-lg mb-3 text-gray-900">
                                    {post.title || post.content?.substring(0, 50) + "..."}
                              </h3>
                                  <p className="text-gray-700 leading-relaxed">
                                {post.content}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </InViewTransition>
                  ))}
                </div>
                  </>
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
                  <>
                  <div className="space-y-3">
                    {events
                      .slice(
                        (eventsPage - 1) * eventsPerPage,
                        eventsPage * eventsPerPage
                      )
                      .map((event) => {
                      // Ensure event has a valid ID
                      if (!event?.id) {
                        console.warn("Event missing ID:", event);
                        return null;
                      }
                      
                      const eventId = String(event.id);
                      const isUpcoming = new Date(event.start_time) >= new Date();
                      const startDate = new Date(event.start_time);
                      const endDate = new Date(event.end_time);
                      
                      // Format date for display
                      const dayOfMonth = startDate.getDate();
                      const monthShort = startDate.toLocaleDateString("en-US", { month: "short" });
                      const weekday = startDate.toLocaleDateString("en-US", { weekday: "short" });
                      const year = startDate.getFullYear();
                      const timeRange = `${startDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })} - ${endDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`;
                      
                      return (
                        <div key={event.id} className="relative group">
                        <Link 
                          href={`/events/${event.id}`}
                          className="block"
                        >
                          <Card className="border-gray-200 hover:shadow-lg hover:border-violet-400 transition-all duration-300 cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {/* Date Display - Prominent on Left */}
                                <div className="flex-shrink-0 w-20 text-center">
                                  <div className={`rounded-lg p-3 ${
                                    isUpcoming 
                                      ? "bg-violet-100 border-2 border-violet-300" 
                                      : "bg-gray-100 border-2 border-gray-300"
                                  }`}>
                                    <div className={`text-2xl font-bold ${
                                      isUpcoming ? "text-violet-700" : "text-gray-700"
                                    }`}>
                                      {dayOfMonth}
                                    </div>
                                    <div className={`text-xs font-semibold uppercase mt-1 ${
                                      isUpcoming ? "text-violet-600" : "text-gray-600"
                                    }`}>
                                      {monthShort}
                                    </div>
                                    <div className={`text-xs mt-1 ${
                                      isUpcoming ? "text-violet-500" : "text-gray-500"
                                    }`}>
                                      {weekday}
                                    </div>
                                  </div>
                                  {!isUpcoming && (
                                    <div className="text-xs text-gray-500 mt-1">{year}</div>
                                  )}
                                </div>

                                {/* Event Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-violet-600 transition-colors line-clamp-1">
                                {event.title}
                              </h4>
                                      {event.description && (
                                        <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                                          {event.description}
                                        </p>
                                      )}
                                </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {isUpcoming ? (
                                        <Badge className="bg-violet-600 text-white border-0 text-xs">
                                          Upcoming
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="bg-gray-500 text-white border-0 text-xs">
                                          Past
                                        </Badge>
                                      )}
                                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                                </div>
                              </div>

                                  {/* Event Info */}
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <Clock className="h-4 w-4 text-violet-600 flex-shrink-0" />
                                      <span className="font-medium">{timeRange}</span>
                                    </div>
                                    
                                    {event.location && (
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                        <span className="truncate">{event.location}</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center gap-3 flex-wrap">
                                      {event.is_online && (
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                          <Globe className="h-3.5 w-3.5 text-green-600" />
                                          <span className="text-xs">Online</span>
                                        </div>
                                      )}
                                      {event.max_attendees && (
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                          <Users className="h-3.5 w-3.5 text-amber-600" />
                                          <span className="text-xs">Max {event.max_attendees}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                        {currentUser && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setReportType("event");
                                    setReportTargetId(event.id);
                                    setReportTargetName(event.title || "Event");
                                    setReportDialogOpen(true);
                                  }}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Report Event
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {events.length > eventsPerPage && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <PaginationControls
                      currentPage={eventsPage}
                      totalPages={Math.ceil(events.length / eventsPerPage)}
                      onPageChange={setEventsPage}
                      itemsPerPage={eventsPerPage}
                      totalItems={events.length}
                    />
                  </div>
                )}
                </>
              )}
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Members</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {memberCount} total members
                    </p>
                    </div>
                  </div>

                {isLoadingTab ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {members
                        .slice(
                          (membersPage - 1) * membersPerPage,
                          membersPage * membersPerPage
                        )
                        .map((member: any) => (
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
                                {isMember && member.user_id !== currentUser?.id && (
                                  <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-9 w-9 p-0"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                          onClick={() => {
                                            setReportType("member");
                                            setReportTargetId(member.user_id);
                                            setReportTargetName(member.users?.full_name || member.users?.username || "Member");
                                            setReportDialogOpen(true);
                                          }}
                                        >
                                          <AlertTriangle className="h-4 w-4 mr-2" />
                                          Report Member
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                            </div>
                        </CardContent>
                      </Card>
                  ))}
                </div>
                    {members.length > membersPerPage && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <PaginationControls
                          currentPage={membersPage}
                          totalPages={Math.ceil(members.length / membersPerPage)}
                          onPageChange={setMembersPage}
                          itemsPerPage={membersPerPage}
                          totalItems={members.length}
                        />
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upcoming Events</span>
                    <span className="font-medium text-gray-900">
                      {community.upcomingEvents || events.filter((e: any) => new Date(e.start_time) >= new Date()).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Founded</span>
                    <span className="font-medium text-gray-900">
                      {community.founded || (community.created_at ? new Date(community.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Unknown")}
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

            {/* Moderators */}
            <InViewTransition effect="slide-left" delay={100}>
              <Card className="border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">
                    Moderators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {community.moderators && community.moderators.length > 0 ? (
                    community.moderators.map((mod: any, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={mod.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{(mod.name || "M")[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                            {mod.name || "Moderator"}
                        </p>
                          <p className="text-violet-700 text-xs">{mod.role || "Moderator"}</p>
                      </div>
                    </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No moderators yet</p>
                  )}
                </CardContent>
              </Card>
            </InViewTransition>
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        reportType={reportType}
        reportTargetId={reportTargetId}
        reportTargetName={reportTargetName}
      />

      {/* Join/Leave Confirmation Modal */}
      <Dialog open={joinLeaveModalOpen} onOpenChange={setJoinLeaveModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isMember ? "Leave Community" : "Join Community"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {isMember
                ? `Are you sure you want to leave "${community?.name}"? You'll need to join again to access member-only features.`
                : `Are you sure you want to join "${community?.name}"? You'll be able to participate in discussions, attend events, and connect with other members.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setJoinLeaveModalOpen(false)}
              disabled={isJoining}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmJoinLeave}
              disabled={isJoining}
              className={
                isMember
                  ? "w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                  : "w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
              }
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isMember ? "Leaving..." : "Joining..."}
                </>
              ) : (
                <>
                  {isMember ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Leave Community
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Community
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

