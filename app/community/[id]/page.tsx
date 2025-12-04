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
  MessageCircle,
  Bell,
  UserPlus,
  UserMinus,
  ThumbsUp,
  Reply,
  Send,
  ImageIcon,
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
  Save,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseBrowser, getClientSession } from "@/lib/supabase/client";
// import { FloatingChat } from "@/components/chat/floating-chat"; // Component not found
import {
  FadeTransition,
  SlideTransition,
  InViewTransition,
} from "@/components/ui/content-transitions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ButtonPulse,
  HoverScale,
} from "@/components/ui/micro-interactions";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ReportDialog } from "@/components/community/report-dialog";
import { AdCarousel } from "@/components/community/ad-carousel";

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
  const [creatorData, setCreatorData] = useState<any>(null);
  const [userRole, setUserRole] = useState<"creator" | "admin" | "moderator" | "member" | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<"approved" | "pending" | null>(null); // Track membership status
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "about");
  
  // Tab-specific data
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [upcomingEventsPage, setUpcomingEventsPage] = useState(1);
  const [pastEventsPage, setPastEventsPage] = useState(1);
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

  // Additional UI states
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Load community data from database
  useEffect(() => {
    loadCommunityData();
  }, [id]);

  // Community data is already loaded in community state

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
  }, [activeTab, community, creatorData]);

  // Show pending dialog if status is pending on load
  useEffect(() => {
    if (membershipStatus === "pending") {
      setShowPendingDialog(true);
    }
  }, [membershipStatus]);

  // Ensure creator data is loaded
  useEffect(() => {
    const fetchCreatorIfNeeded = async () => {
      if (community?.creator_id && !creatorData) {
        const supabase = getSupabaseBrowser();
        const { data: creatorInfo, error: creatorError } = await supabase
          .from("users")
          .select("id, username, full_name, avatar_url")
          .eq("id", community.creator_id)
          .single();
        
        if (!creatorError && creatorInfo) {
          setCreatorData(creatorInfo);
        }
      }
    };

    fetchCreatorIfNeeded();
  }, [community?.creator_id, creatorData]);

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
          categories (
            id,
            name
          )
        `)
          .eq("id", id)
          .single();

      console.log("Raw community data:", communityData);

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
      console.log("Community data loaded:", {
        id: communityData.id,
        name: communityData.name,
        created_at: communityData.created_at,
        creator_id: communityData.creator_id
      });
      console.log("Community created_at type:", typeof communityData.created_at);
      console.log("Community created_at value:", communityData.created_at);

      // Always fetch creator data separately
      if (communityData?.creator_id) {
        console.log("Fetching creator with ID:", communityData.creator_id);
        const { data: creatorInfo, error: creatorError } = await supabase
          .from("users")
          .select("id, username, full_name, avatar_url")
          .eq("id", communityData.creator_id)
          .single();
        
        console.log("Creator query result:", { creatorInfo, creatorError });
        
        if (creatorError) {
          console.error("Error fetching creator:", creatorError);
          console.error("Creator ID:", communityData.creator_id);
        } else if (creatorInfo) {
          console.log("Creator data loaded successfully:", creatorInfo);
          console.log("Creator full_name:", creatorInfo.full_name);
          console.log("Creator username:", creatorInfo.username);
          setCreatorData(creatorInfo);
        } else {
          console.warn("No creator data found for creator_id:", communityData.creator_id);
        }
      } else {
        console.warn("No creator_id found in community data");
      }

      if (session?.user) {
        setCurrentUser(session.user);

        // Check if user is the creator
        if (communityData.creator_id === session.user.id) {
          setUserRole("creator");
          setIsMember(true);
          setMembershipStatus("approved");
        } else {
          // Check membership - check ALL memberships (including pending)
          const { data: membershipData } = await supabase
          .from("community_members")
            .select("role, status")
            .eq("community_id", id)
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (membershipData) {
            // User has a row in community_members
            const memberStatus = membershipData.status
            if (memberStatus === false) {
              // Pending approval
              setMembershipStatus("pending");
              setIsMember(false); // Not a member yet, waiting for approval
              setUserRole(null);
            } else {
              // Approved member (status = true or null)
              setIsMember(true);
              setMembershipStatus("approved");
              setUserRole(membershipData.role as any);
            }
          } else {
            // No membership record
            setMembershipStatus(null);
            setIsMember(false);
            setUserRole(null);
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
        case "announcements":
          // Load discussion threads from messages table (top-level messages only)
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
            .limit(50);

          if (messagesData && messagesData.length > 0) {
            // Get all sender IDs to fetch roles in one query
            const senderIds = [...new Set(messagesData.map((m: any) => m.sender_id))];
            
            // Fetch roles for all senders
            const { data: membershipsData } = await supabase
              .from("community_members")
              .select("user_id, role")
              .eq("community_id", id)
              .in("user_id", senderIds);
            
            const roleMap: Record<string, string> = {};
            (membershipsData || []).forEach((m: any) => {
              roleMap[m.user_id] = m.role;
            });

            // Load user data for each message
            const messagesWithUsers = await Promise.all(
              messagesData.map(async (message) => {
                const { data: userData } = await supabase
                  .from("users")
                  .select("id, username, full_name, avatar_url")
                  .eq("id", message.sender_id)
                  .single();

                // Get author role
                const authorRole = roleMap[message.sender_id] || null;
                const isCreator = message.sender_id === community?.creator_id;

                // Load ALL replies for each message (not just 5)
                const { data: replies, count: replyCount } = await supabase
                  .from("messages")
                  .select(`
                    id,
                    content,
                    created_at,
                    updated_at,
                    is_edited,
                    sender_id
                  `, { count: 'exact' })
                  .eq("parent_id", message.id)
                  .order("created_at", { ascending: true });

                // Get reply sender IDs
                const replySenderIds = [...new Set((replies || []).map((r: any) => r.sender_id))];
                
                // Fetch roles for reply senders
                const { data: replyMembershipsData } = replySenderIds.length > 0
                  ? await supabase
                      .from("community_members")
                      .select("user_id, role")
                      .eq("community_id", id)
                      .in("user_id", replySenderIds)
                  : { data: [] };

                const replyRoleMap: Record<string, string> = {};
                (replyMembershipsData || []).forEach((m: any) => {
                  replyRoleMap[m.user_id] = m.role;
                });

                // Load user data for replies
                const repliesWithUsers = await Promise.all(
                  (replies || []).map(async (reply: any) => {
                    const { data: replyUserData } = await supabase
                      .from("users")
                      .select("id, username, full_name, avatar_url")
                      .eq("id", reply.sender_id)
                      .single();

                    const replyAuthorRole = replyRoleMap[reply.sender_id] || null;
                    const replyIsCreator = reply.sender_id === community?.creator_id;

                    return {
                      ...reply,
                      users: replyUserData,
                      authorRole: replyAuthorRole,
                      isCreator: replyIsCreator,
                    };
                  })
                );

                return {
                  ...message,
                  users: userData,
                  replies: repliesWithUsers || [],
                  replyCount: replyCount || repliesWithUsers.length,
                  authorRole: authorRole,
                  isCreator: isCreator,
                };
              })
            );

            setDiscussions(messagesWithUsers);
            } else {
            setDiscussions([]);
          }
          break;

        case "events":
          // Load upcoming and past events separately
          const now = new Date().toISOString();
          
          // Fetch upcoming events
          const { data: upcomingEventsData, error: upcomingError } = await supabase
            .from("events")
            .select("*")
            .eq("community_id", id)
            .gte("start_time", now)
            .order("start_time", { ascending: true });
          
          if (upcomingError) {
            console.error("Error fetching upcoming events:", upcomingError);
            toast.error("Failed to load upcoming events");
          }
          
          // Fetch past events (all past events, not just recent)
          const { data: pastEventsData, error: pastError } = await supabase
            .from("events")
            .select("*")
            .eq("community_id", id)
            .lt("start_time", now)
            .order("start_time", { ascending: false });
          
          if (pastError) {
            console.error("Error fetching past events:", pastError);
            toast.error("Failed to load past events");
          }
          
          setUpcomingEvents(upcomingEventsData || []);
          setPastEvents(pastEventsData || []);
          break;

        case "members":
          // Load ALL members from community_members table - only approved members (status = true or null)
          // This includes admin, member, and moderator roles
          // Creator is also in community_members table with role "admin"
          // Use specific foreign key relationship to avoid ambiguity
          const { data: membersData, error: membersError } = await supabase
            .from("community_members")
            .select(`
              user_id,
              role,
              joined_at,
              status,
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

          if (membersError) {
            console.error("Error fetching members:", membersError);
            setMembers([]);
            break;
          }

          // Filter for approved members (status = true or null, NOT false)
          const approvedMembers = (membersData || []).filter((m: any) => {
            const status = m.status;
            return status === true || status === null || status === undefined;
          });

          console.log("Approved members:", approvedMembers?.length, approvedMembers);
          
          // Map members and ensure creator is treated as admin with Creator badge
          const formattedMembers = approvedMembers.map((member: any) => {
            // If this member is the creator, treat them as admin
            const isCreator = member.user_id === community.creator_id;
            return {
              ...member,
              role: isCreator ? "admin" : member.role,
              isCreator: isCreator,
            };
          });
          
          // Set all members - creator is already in the list with role "admin"
          setMembers(formattedMembers);
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

      if (!supabase) {
        throw new Error("Failed to initialize Supabase client");
      }

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
          // Check if already a member (without selecting status to avoid cache issues)
          const { data: existingMember, error: checkError } = await supabase
            .from("community_members")
            .select("id")
            .eq("community_id", id)
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (checkError) {
            console.error("Error checking existing member:", checkError);
            // Continue anyway - might be a schema issue
          }

          if (existingMember) {
            // If member exists, check status separately to avoid cache issues
            const { data: memberStatus } = await supabase
              .from("community_members")
              .select("status")
              .eq("id", existingMember.id)
              .maybeSingle();

            const statusValue = memberStatus?.status
            if (statusValue === false) {
              toast.info("Your join request is pending approval");
              setIsJoining(false);
              return;
            } else {
              toast.info("You are already a member of this community");
              setIsMember(true);
              setUserRole("member");
              setIsJoining(false);
              return;
            }
          }

          // Join community - use API endpoint to ensure status is set correctly
          const response = await fetch("/api/community-members/join", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              community_id: id,
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            if (result.error?.includes("already") || result.message?.includes("already")) {
              toast.info(result.message || "You already have a pending request or are a member")
              setIsJoining(false)
              return
            }
            throw new Error(result.error || "Failed to join community")
          }

          if (result.member) {
            // Update membership status to pending
            setMembershipStatus("pending")
            setIsMember(false)
            setUserRole(null)
            // Show dialog
            setShowPendingDialog(true)
            loadTabData(activeTab) // Reload tab data
          } else {
            throw new Error("Failed to create join request. Please try again.")
          }
        }
      }
    } catch (error: any) {
      console.error("Error joining/leaving community:", error);
      const errorMessage = error?.message || error?.toString() || "An unknown error occurred";
      console.error("Full error details:", error);
      
      if (error?.code === "23503") {
        toast.error("User account issue. Please try logging out and back in.");
      } else {
        toast.error(errorMessage || "Failed to join community. Please try again.");
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

      toast.success("Thread created!");
      setNewPost("");
      // Reload discussion forum
      loadTabData("announcements");
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
      // Reload discussion forum
      loadTabData("announcements");
    } catch (error: any) {
      console.error("Error posting reply:", error);
      toast.error(error.message || "Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDescription = () => {
    if (!community) return;
    setEditedDescription(community.description || "");
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
      const tags = community.tags || [];
      const tagsText = tags.length > 0 
        ? tags.slice(0, 3).join(", ")
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
        const tagsText = tags.length > 0 
          ? tags.slice(0, 3).join(", ")
          : "various topics";
        const fallbackDescription = `${community.name} is a ${community.category || "community"} focused on ${tagsText}. Join us to connect with like-minded individuals, share knowledge, and participate in activities related to our community interests.`;
        setEditedDescription(fallbackDescription);
        toast.success("Description generated (using fallback)");
      }
    } catch (error: any) {
      console.error("Failed to generate description:", error);
      const tags = community?.tags || [];
      const tagsText = tags.length > 0 
        ? tags.slice(0, 3).join(", ")
        : "various topics";
      const fallbackDescription = `${community?.name || "This community"} is a ${community?.category || "community"} focused on ${tagsText}. Join us to connect with like-minded individuals, share knowledge, and participate in activities related to our community interests.`;
      setEditedDescription(fallbackDescription);
      toast.warning("Using fallback description. AI generation encountered an issue.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const canManage = userRole === "creator" || userRole === "admin";
  const isOwner = userRole === "creator" || (community && currentUser && community.creator_id === currentUser.id);

  // Show loading state
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
              {userRole === "creator" ? (
              <Button
                  disabled
                  className="bg-gray-100 text-gray-900 hover:bg-gray-200 cursor-not-allowed"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Your Community
              </Button>
              ) : membershipStatus === "approved" && isMember ? (
                <div className="px-4 py-2 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Community Joined
            </div>
              ) : membershipStatus === "pending" ? (
                <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Waiting For Approval
              </div>
              ) : (
                <Button
                    onClick={handleJoinCommunity}
                  disabled={isJoining}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Community
                </>
              )}
                </Button>
              )}
              
              {isMember && membershipStatus === "approved" && userRole !== "creator" && (
                  <Button
                  onClick={handleJoinCommunity}
                    variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                  >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Leave
                  </Button>
              )}
              
                    <Button
                      variant="outline"
                className="border-gray-200 hover:bg-gray-50 hover:border-red-200 hover:text-red-600"
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
                </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show waiting message if pending approval */}
        {membershipStatus === "pending" && userRole !== "creator" ? (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-8 text-center">
              <Clock className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting For Approval</h2>
              <p className="text-gray-600 mb-4">
                Your join request has been sent to the community admin. 
                You'll be able to view the community content once your request is approved.
              </p>
              <p className="text-sm text-gray-500">
                We'll notify you when your request is reviewed.
              </p>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Community Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1 h-auto">
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="announcements"
                  className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  Discussion Forum
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
                            {community?.created_at 
                              ? (() => {
                                  try {
                                    const date = new Date(community.created_at);
                                    if (isNaN(date.getTime())) {
                                      console.error("Invalid date:", community.created_at);
                                      return "Unknown";
                                    }
                                    return date.toLocaleDateString("en-US", {
                                      month: "long",
                                      year: "numeric",
                                    });
                                  } catch (e) {
                                    console.error("Date parsing error:", e);
                                    return "Unknown";
                                  }
                                })()
                              : "Unknown"}
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
                          <p className="text-gray-800">
                            {community.location.address}
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-gray-200" />

                      <div>
                        <h4 className="font-medium mb-4 text-gray-900">
                          Community Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {community.tags?.map((tag: string, index: number) => (
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

              {/* Discussion Forum Tab */}
              <TabsContent value="announcements" className="space-y-6 mt-8">
                {/* New Thread - All Members Can Post */}
                {isMember && currentUser && (
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                            {currentUser?.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <Textarea
                            placeholder="Start a new discussion..."
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            className="min-h-[80px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 resize-none text-sm"
                          />
                          <div className="flex justify-end">
                            <Button
                              disabled={!newPost.trim() || isSubmitting}
                              onClick={handlePostDiscussion}
                              size="sm"
                              className="bg-violet-600 hover:bg-violet-700 text-white"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Posting...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" /> Post
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Discussion Threads */}
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
                        {isMember 
                          ? "Start the first discussion thread!" 
                          : "Join the community to participate in discussions."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {discussions.map((thread) => {
                      const isExpanded = showReplies[thread.id] ?? true;
                      const hasReplies = thread.replies && thread.replies.length > 0;
                      const replyCount = thread.replyCount || thread.replies?.length || 0;
                      
                      return (
                        <Card key={thread.id} className="border-gray-200 hover:border-gray-300 transition-colors">
                          <CardContent className="p-0">
                            {/* Main Thread Post */}
                            <div className="p-4 border-b border-gray-100">
                              <div className="flex gap-3">
                                <Avatar className="h-9 w-9 flex-shrink-0">
                                  <AvatarImage src={thread.users?.avatar_url} />
                                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white text-sm">
                                    {(thread.users?.username || thread.users?.full_name || "U").charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="font-semibold text-gray-900 text-sm">
                                      {thread.users?.full_name || thread.users?.username || "Anonymous"}
                                    </span>
                                    {thread.isCreator && (
                                      <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs px-1.5 py-0">
                                        Creator
                                      </Badge>
                                    )}
                                    {!thread.isCreator && thread.authorRole === "admin" && (
                                      <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs px-1.5 py-0">
                                        Admin
                                      </Badge>
                                    )}
                                    {!thread.isCreator && thread.authorRole === "moderator" && (
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0">
                                        Moderator
                                      </Badge>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {new Date(thread.created_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {thread.is_edited && (
                                      <Badge variant="outline" className="text-xs px-1.5 py-0">Edited</Badge>
                                    )}
                                  </div>
                                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm mb-3">
                                    {thread.content}
                                  </p>
                                  <div className="flex items-center gap-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2 text-xs text-gray-600 hover:text-violet-600 hover:bg-violet-50"
                                      onClick={() => {
                                        setReplyingTo(replyingTo === thread.id ? null : thread.id);
                                        setReplyContent("");
                                      }}
                                    >
                                      <Reply className="h-3.5 w-3.5 mr-1.5" />
                                      Reply
                                    </Button>
                                    {hasReplies && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-xs text-gray-600 hover:text-gray-700"
                                        onClick={() => {
                                          setShowReplies({
                                            ...showReplies,
                                            [thread.id]: !isExpanded,
                                          });
                                        }}
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronRight className="h-3.5 w-3.5 mr-1.5 rotate-90" />
                                            Hide {replyCount} {replyCount === 1 ? "reply" : "replies"}
                                          </>
                                        ) : (
                                          <>
                                            <ChevronRight className="h-3.5 w-3.5 mr-1.5" />
                                            Show {replyCount} {replyCount === 1 ? "reply" : "replies"}
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    {isMember && currentUser && thread.sender_id === currentUser.id && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                                        onClick={async () => {
                                          if (confirm("Are you sure you want to delete this thread?")) {
                                            const supabase = getSupabaseBrowser();
                                            const { error } = await supabase
                                              .from("messages")
                                              .delete()
                                              .eq("id", thread.id);
                                            
                                            if (error) {
                                              toast.error("Failed to delete thread");
                                            } else {
                                              toast.success("Thread deleted");
                                              loadTabData("announcements");
                                            }
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                        Delete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Reply Form */}
                            {replyingTo === thread.id && isMember && currentUser && (
                              <div className="p-4 bg-gray-50 border-b border-gray-100">
                                <div className="flex gap-3">
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white text-xs">
                                      {currentUser?.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-2">
                                    <Textarea
                                      placeholder="Write a reply..."
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      className="min-h-[60px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 resize-none text-sm"
                                      autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
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
                                        onClick={() => handleReply(thread.id)}
                                        className="bg-violet-600 hover:bg-violet-700 text-white"
                                      >
                                        {isSubmitting ? (
                                          <>
                                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            Posting...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="h-3.5 w-3.5 mr-1.5" />
                                            Reply
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Replies Section */}
                            {hasReplies && isExpanded && (
                              <div className="bg-gray-50">
                                {thread.replies.map((reply: any) => (
                                  <div key={reply.id} className="p-4 border-b border-gray-100 last:border-b-0">
                                    <div className="flex gap-3 pl-8">
                                      <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarImage src={reply.users?.avatar_url} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                                          {(reply.users?.username || reply.users?.full_name || "U").charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-semibold text-gray-900 text-sm">
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
                                          {reply.is_edited && (
                                            <Badge variant="outline" className="text-xs px-1.5 py-0">Edited</Badge>
                                          )}
                                        </div>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                                          {reply.content}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="space-y-8 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Events</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {upcomingEvents.length} upcoming, {pastEvents.length} past
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
                ) : (
                  <>
                    {/* Upcoming Events Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Upcoming Events</h4>
                          <p className="text-gray-600 text-sm mt-1">
                            {upcomingEvents.length} {upcomingEvents.length === 1 ? 'event' : 'events'} scheduled
                          </p>
                        </div>
                      </div>

                      {upcomingEvents.length === 0 ? (
                  <Card className="border-gray-200">
                          <CardContent className="p-8 text-center">
                            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <h4 className="text-base font-semibold text-gray-900 mb-2">
                        No upcoming events
                            </h4>
                            <p className="text-sm text-gray-600">
                        {canManage 
                          ? "Create the first event for your community!"
                          : "Check back later for upcoming events."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                  <div className="space-y-3">
                            {upcomingEvents
                      .slice(
                                (upcomingEventsPage - 1) * eventsPerPage,
                                upcomingEventsPage * eventsPerPage
                      )
                      .map((event) => {
                      // Ensure event has a valid ID
                      if (!event?.id) {
                        console.warn("Event missing ID:", event);
                        return null;
                      }
                      
                      const eventId = String(event.id);
                      const startDate = new Date(event.start_time);
                      const endDate = new Date(event.end_time);
                      
                      // Format date for display
                      const dayOfMonth = startDate.getDate();
                      const monthShort = startDate.toLocaleDateString("en-US", { month: "short" });
                      const weekday = startDate.toLocaleDateString("en-US", { weekday: "short" });
                      const timeRange = `${startDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })} - ${endDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`;
                      
                      return (
                        <Link 
                          key={eventId} 
                          href={`/events/${eventId}`}
                          className="block group"
                        >
                          <Card className="border-gray-200 hover:shadow-lg hover:border-violet-400 transition-all duration-300 cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {/* Date Display - Prominent on Left */}
                                <div className="flex-shrink-0 w-20 text-center">
                                  <div className="rounded-lg p-3 bg-violet-100 border-2 border-violet-300">
                                    <div className="text-2xl font-bold text-violet-700">
                                      {dayOfMonth}
                                    </div>
                                    <div className="text-xs font-semibold uppercase mt-1 text-violet-600">
                                      {monthShort}
                                    </div>
                                    <div className="text-xs mt-1 text-violet-500">
                                      {weekday}
                                    </div>
                                  </div>
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
                                        <Badge className="bg-violet-600 text-white border-0 text-xs">
                                          Upcoming
                                        </Badge>
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
                      );
                    })}
                  </div>
                          {upcomingEvents.length > eventsPerPage && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                      <PaginationControls
                                currentPage={upcomingEventsPage}
                                totalPages={Math.ceil(upcomingEvents.length / eventsPerPage)}
                                onPageChange={setUpcomingEventsPage}
                        itemsPerPage={eventsPerPage}
                                totalItems={upcomingEvents.length}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Past Events Section */}
                    {pastEvents.length > 0 && (
                      <div className="space-y-4 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Past Events</h4>
                            <p className="text-gray-600 text-sm mt-1">
                              {pastEvents.length} {pastEvents.length === 1 ? 'event' : 'events'} completed
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {pastEvents
                            .slice(
                              (pastEventsPage - 1) * eventsPerPage,
                              pastEventsPage * eventsPerPage
                            )
                            .map((event) => {
                              const eventId = String(event.id);
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
                                  <Card className="border-gray-200 hover:shadow-lg hover:border-gray-400 transition-all duration-300 cursor-pointer opacity-75 hover:opacity-100">
                                    <CardContent className="p-4">
                                      <div className="flex gap-4">
                                        {/* Date Display - Prominent on Left */}
                                        <div className="flex-shrink-0 w-20 text-center">
                                          <div className="rounded-lg p-3 bg-gray-100 border-2 border-gray-300">
                                            <div className="text-2xl font-bold text-gray-700">
                                              {dayOfMonth}
                                            </div>
                                            <div className="text-xs font-semibold uppercase mt-1 text-gray-600">
                                              {monthShort}
                                            </div>
                                            <div className="text-xs mt-1 text-gray-500">
                                              {weekday}
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">{year}</div>
                                        </div>

                                        {/* Event Details */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1 min-w-0">
                                              <h4 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-1">
                                                {event.title}
                                              </h4>
                                              {event.description && (
                                                <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                                                  {event.description}
                                                </p>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              <Badge variant="secondary" className="bg-gray-500 text-white border-0 text-xs">
                                                Past
                                              </Badge>
                                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                                            </div>
                                          </div>

                                          {/* Event Info */}
                                          <div className="space-y-1.5 text-sm">
                                            <div className="flex items-center gap-2 text-gray-700">
                                              <Clock className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                              <span className="font-medium">{timeRange}</span>
                                            </div>
                                            
                                            {event.location && (
                                              <div className="flex items-center gap-2 text-gray-700">
                                                <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                                <span className="truncate">{event.location}</span>
                                              </div>
                                            )}
                                            
                                            <div className="flex items-center gap-3 flex-wrap">
                                              {event.is_online && (
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                  <Globe className="h-3.5 w-3.5 text-gray-500" />
                                                  <span className="text-xs">Online</span>
                                                </div>
                                              )}
                                              {event.max_attendees && (
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                  <Users className="h-3.5 w-3.5 text-gray-500" />
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
                                </div>
                              );
                            })}
                        </div>
                        {pastEvents.length > eventsPerPage && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <PaginationControls
                              currentPage={pastEventsPage}
                              totalPages={Math.ceil(pastEvents.length / eventsPerPage)}
                              onPageChange={setPastEventsPage}
                              itemsPerPage={eventsPerPage}
                              totalItems={pastEvents.length}
                            />
                          </div>
                        )}
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
                                    {member.users?.full_name || member.users?.username || "Unknown"}
                                  </h4>
                                  {member.isCreator && (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                                      <Crown className="h-3 w-3 mr-1" />
                                      Creator
                                    </Badge>
                                  )}
                                  {!member.isCreator && member.role === "admin" && (
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
                                  {/* Member biasa tidak perlu badge */}
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
                        </CardContent>
                      </Card>
                  ))}
                </div>
                {members.length > membersPerPage && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Events
                  </span>
                  <span className="font-semibold text-gray-900">
                    {upcomingEvents.length + pastEvents.length}
                    </span>
                  </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Founded
                  </span>
                  <span className="font-semibold text-gray-900">
                    {community?.created_at 
                      ? (() => {
                          try {
                            const date = new Date(community.created_at);
                            if (isNaN(date.getTime())) {
                              console.error("Invalid date:", community.created_at);
                              return "Unknown";
                            }
                            return date.toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            });
                          } catch (e) {
                            console.error("Date parsing error:", e);
                            return "Unknown";
                          }
                        })()
                      : "Unknown"}
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
                    <AvatarImage src={creatorData?.avatar_url || community.creator?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                      {(creatorData?.username || community.creator?.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                      </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {creatorData?.full_name || creatorData?.username || "Loading..."}
                    </p>
                    <p className="text-sm text-violet-600">Founder</p>
                      </div>
                    </div>
                </CardContent>
              </Card>

            {/* Ad Carousel - Fixed position below Created By */}
            <AdCarousel communityId={id} placement="sidebar" autoRotateInterval={5000} />
          </div>
        </div>
        )}
      </div>

      {/* Dialog for pending approval */}
      <Dialog open={showPendingDialog} onOpenChange={setShowPendingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Waiting For Admin Approval</DialogTitle>
            <DialogDescription>
              Your join request has been sent to the community admin. Please wait for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowPendingDialog(false)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        reportType={reportType}
        reportTargetId={reportTargetId}
        reportTargetName={reportTargetName}
      />
    </div>
  );
}