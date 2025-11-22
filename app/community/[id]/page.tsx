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

            {canManage && (
              <Link href={`/community/${id}/manage`}>
                <Button variant="default" className="bg-purple-600 hover:bg-purple-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Community
                    </Button>
              </Link>
            )}
                </div>
        </div>
      </div>

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
                >
                  Discussions
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
                          </Avatar>
                          <div className="flex-1 space-y-4">
                            <Textarea
                              placeholder="Share something with the community..."
                              value={newPost}
                              onChange={(e) => setNewPost(e.target.value)}
                            className="min-h-[100px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 resize-none"
                            />
                            <div className="flex justify-between items-center">
                            <Button variant="outline" size="sm" className="border-gray-200">
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Add Image
                              </Button>
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
                                  <Send className="h-4 w-4 mr-2" />
                                  Post
                                    </>
                                  )}
                                </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                )}

                {/* Discussions List */}
                {isLoadingTab ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                  </div>
                ) : discussions.length === 0 ? (
                  <Card className="border-gray-200">
                    <CardContent className="p-12 text-center">
                      <Hash className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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
                          <div className="flex gap-4">
                            <Avatar>
                              <AvatarImage src={discussion.users?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                                {(discussion.users?.username || discussion.users?.full_name || "U").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
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
                                </span>
                                {discussion.is_edited && (
                                  <Badge variant="outline" className="text-xs">Edited</Badge>
                                )}
                              </div>
                              <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                                {discussion.content}
                              </p>
                              
                              {/* Replies Count and Toggle */}
                              {discussion.replies && discussion.replies.length > 0 && (
                                <div className="mb-4">
                                  <div className="flex items-center gap-3 mb-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-600 hover:text-violet-600"
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
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-600 hover:text-violet-600"
                                      onClick={() => setReplyingTo(replyingTo === discussion.id ? null : discussion.id)}
                                    >
                                      <Reply className="h-4 w-4 mr-1" />
                                      Reply
                                    </Button>
                                  </div>
                                  
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
                                              <div className="flex items-center gap-1">
                                                {/* Report button for non-owners */}
                                                {currentUser && reply.sender_id !== currentUser.id && (
                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                      >
                                                        <MoreVertical className="h-3 w-3" />
                                                      </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                      <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        onClick={() => {
                                                          setReportType("post");
                                                          setReportTargetId(reply.id);
                                                          setReportTargetName(reply.content.substring(0, 50) + "...");
                                                          setReportDialogOpen(true);
                                                        }}
                                                      >
                                                        <AlertTriangle className="h-3 w-3 mr-2" />
                                                        Report Reply
                                                      </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                )}
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
                              <div className="flex items-center justify-end">
                                <div className="flex items-center gap-2">
                                  {/* Report button for non-owners */}
                                  {currentUser && discussion.sender_id !== currentUser.id && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-gray-600 hover:text-gray-900"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                          onClick={() => {
                                            setReportType("post");
                                            setReportTargetId(discussion.id);
                                            setReportTargetName(discussion.content.substring(0, 50) + "...");
                                            setReportDialogOpen(true);
                                          }}
                                        >
                                          <AlertTriangle className="h-4 w-4 mr-2" />
                                          Report Post
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
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
                        <div key={eventId} className="relative group">
                        <Link 
                          href={`/events/${eventId}`}
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
                                    setReportTargetId(eventId);
                                    setReportTargetName(event.title);
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Events
                  </span>
                  <span className="font-semibold text-gray-900">
                    {events.length}
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
