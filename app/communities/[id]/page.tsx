"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FloatingElements } from "@/components/ui/floating-elements";
import { PageTransition } from "@/components/ui/page-transition";
import { getClientSession, getSupabaseBrowser } from "@/lib/supabase/client";
import { getMediaTypeCategory } from "@/lib/config/media-upload.config";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  Crown,
  Globe,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Reply,
  Send,
  Settings,
  Shield,
  Star,
  Trash2,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
// import { FloatingChat } from "@/components/chat/floating-chat"; // Component not found
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SlideTransition } from "@/components/ui/content-transitions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HoverScale } from "@/components/ui/micro-interactions";

// Helper function to parse location and get readable string
function getLocationDisplay(location: any): string {
  if (!location) return "";
  try {
    const locData =
      typeof location === "string" ? JSON.parse(location) : location;

    // Handle online events
    if (locData.meetingLink) {
      return locData.meetingLink;
    }
    if (locData.isOnline && locData.meetingLink) {
      return locData.meetingLink;
    }

    // Handle physical events
    return locData.city || locData.venue || locData.address || "";
  } catch {
    return typeof location === "string" ? location : "";
  }
}

// Dynamic import for Leaflet map
const LeafletMap = dynamic(
  () =>
    import("@/components/ui/interactive-leaflet-map").then(
      (mod) => mod.InteractiveLeafletMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    ),
  }
);

import { AdCarousel } from "@/components/community/ad-carousel";
import { ReportDialog } from "@/components/community/report-dialog";
import { MediaUpload } from "@/components/community/media-upload";
import { PaginationControls } from "@/components/ui/pagination-controls";

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
  const [userRole, setUserRole] = useState<
    "creator" | "admin" | "moderator" | "member" | null
  >(null);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<
    "approved" | "pending" | null
  >(null); // Track membership status
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); // Track if user is superadmin
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showJoinConfirmDialog, setShowJoinConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "about"
  );

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
  const [reportType, setReportType] = useState<
    "community" | "post" | "member" | "event" | "thread" | "reply"
  >("community");
  const [reportTargetId, setReportTargetId] = useState<string>("");
  const [reportTargetName, setReportTargetName] = useState<string>("");

  // Join/Leave modal state
  const [joinLeaveModalOpen, setJoinLeaveModalOpen] = useState(false);

  // Post creation
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});

  // Media upload states
  const [threadMediaFile, setThreadMediaFile] = useState<File | null>(null);
  const [replyMediaFiles, setReplyMediaFiles] = useState<
    Record<string, File | null>
  >({});

  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: "thread" | "reply";
  } | null>(null);

  // Additional UI states
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Highlight reported thread/reply
  const [highlightedThreadId, setHighlightedThreadId] = useState<string | null>(null);
  const [highlightedReplyId, setHighlightedReplyId] = useState<string | null>(null);

  // Refs to prevent duplicate API calls
  const communityDataLoadedRef = useRef(false);
  const creatorDataLoadedRef = useRef<string | null>(null);

  // Load community data from database
  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode
    if (communityDataLoadedRef.current) return;
    communityDataLoadedRef.current = true;
    
    loadCommunityData();
  }, [id]);

  // Community data is already loaded in community state

  // Community data is already loaded in community state

  // Handle tab change - update both state and URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Update URL without losing other params (like threadId, replyId)
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.push(`/communities/${id}?${params.toString()}`, { scroll: false });
  };

  // Load tab-specific data when tab changes
  useEffect(() => {
    if (community) {
      loadTabData(activeTab);
    }
  }, [activeTab, community]); // Removed creatorData dependency to prevent duplicate calls

  // Handle threadId and replyId from URL params for reported content
  useEffect(() => {
    const threadId = searchParams.get("threadId");
    const replyId = searchParams.get("replyId");
    
    if (threadId) {
      setHighlightedThreadId(threadId);
      // Ensure replies are expanded for the highlighted thread
      if (threadId) {
        setShowReplies((prev) => ({ ...prev, [threadId]: true }));
      }
    }
    
    if (replyId) {
      setHighlightedReplyId(replyId);
      // If replyId is provided, we need to find its parent thread and expand it
      if (replyId && discussions.length > 0) {
        const parentThread = discussions.find((thread) =>
          thread.replies?.some((reply: any) => reply.id === replyId)
        );
        if (parentThread) {
          setShowReplies((prev) => ({ ...prev, [parentThread.id]: true }));
        }
      }
    }
  }, [searchParams, discussions]);

  // Scroll to highlighted thread/reply when discussions are loaded
  useEffect(() => {
    if (discussions.length > 0 && (highlightedThreadId || highlightedReplyId)) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        if (highlightedReplyId) {
          const replyElement = document.getElementById(`reply-${highlightedReplyId}`);
          if (replyElement) {
            replyElement.scrollIntoView({ behavior: "smooth", block: "center" });
            // Remove highlight after 5 seconds
            setTimeout(() => {
              setHighlightedReplyId(null);
            }, 5000);
          }
        } else if (highlightedThreadId) {
          const threadElement = document.getElementById(`thread-${highlightedThreadId}`);
          if (threadElement) {
            threadElement.scrollIntoView({ behavior: "smooth", block: "center" });
            // Remove highlight after 5 seconds
            setTimeout(() => {
              setHighlightedThreadId(null);
            }, 5000);
          }
        }
      }, 300);
    }
  }, [discussions, highlightedThreadId, highlightedReplyId]);

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
        // Prevent duplicate calls for same creator
        if (creatorDataLoadedRef.current === community.creator_id) return;
        creatorDataLoadedRef.current = community.creator_id;
        
        try {
          const response = await fetch(`/api/user/${community.creator_id}`);
          if (response.ok) {
            const creatorInfo = await response.json();
            setCreatorData(creatorInfo);
          }
        } catch (error) {
          console.error("Error fetching creator:", error);
        }
      }
    };

    fetchCreatorIfNeeded();
  }, [community?.creator_id, creatorData]);

  const loadCommunityData = async () => {
    try {
      setIsLoading(true);
      const session = await getClientSession();

      // Fetch community data from API
      console.log("[CommunityPage] Fetching community data from API for ID:", id);
      const response = await fetch(`/api/communities/${id}`);
      
      if (!response.ok) {
        console.error("[CommunityPage] API error:", response.status);
        toast.error("Failed to load community");
        router.push("/communities");
        return;
      }

      const result = await response.json();
      console.log("[CommunityPage] API response:", result);

      if (!result.success || !result.data) {
        console.error("[CommunityPage] Invalid API response");
        toast.error("Failed to load community");
        router.push("/communities");
        return;
      }

      const communityData = result.data;

      // Parse location if it's a string
      if (communityData.location && typeof communityData.location === "string") {
        try {
          communityData.location = JSON.parse(communityData.location);
        } catch {
          // If not JSON, treat as city name
          communityData.location = { city: communityData.location };
        }
      }

      setCommunity(communityData);
      setMemberCount(communityData.member_count || 0);

      console.log("[CommunityPage] Community data loaded:", {
        id: communityData.id,
        name: communityData.name,
        creator_id: communityData.creator?.id,
        member_count: communityData.member_count,
      });

      // Set creator data from the API response
      if (communityData.creator) {
        console.log("[CommunityPage] Creator data from API:", communityData.creator);
        setCreatorData(communityData.creator);
      }

      if (session?.user) {
        setCurrentUser(session.user);

        // Fetch user type separately (for superadmin check)
        const userResponse = await fetch("/api/user/role");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const isSuperAdminUser = userData?.user_type === "super_admin";
          setIsSuperAdmin(isSuperAdminUser);

          // Check if user is the creator
          if (communityData.creator_id === session.user.id) {
            setUserRole("creator");
            setIsMember(true);
            setMembershipStatus("approved");
          } else if (isSuperAdminUser) {
            // Superadmin has read-only access without being a member
            setIsMember(false);
            setMembershipStatus(null);
            setUserRole(null);
          } else {
            // Check membership from API response
            // The API returns is_member, but we need more details about membership status
            // Fetch membership details from the membership API
            const membershipResponse = await fetch(`/api/communities/membership-status?ids=${id}`);
            if (membershipResponse.ok) {
              const membershipData = await membershipResponse.json();
              const status = membershipData[id];

              if (status === "pending") {
                setMembershipStatus("pending");
                setIsMember(false);
                setUserRole(null);
              } else if (status === "approved") {
                setIsMember(true);
                setMembershipStatus("approved");
                // Set default member role - role can be enhanced in membership-status API later
                setUserRole("member");
              } else {
                setMembershipStatus(null);
                setIsMember(false);
                setUserRole(null);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[CommunityPage] Error loading community:", error);
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
        case "announcements": // Backward compatibility
          // Load discussion threads via API
          try {
            const threadsResponse = await fetch(`/api/messages/threads?community_id=${id}`);
            
            if (!threadsResponse.ok) {
              console.error("Failed to fetch threads:", threadsResponse.status);
              setDiscussions([]);
              break;
            }

            const threadsData = await threadsResponse.json();
            console.log("📨 Threads data from API:", threadsData);

            if (threadsData && Array.isArray(threadsData) && threadsData.length > 0) {
              // Map threads and preserve replies from API
              const discussionsWithReplies = threadsData.map((thread: any) => ({
                ...thread,
                replies: thread.replies || [], // Keep replies from API
                replyCount: thread.replies?.length || 0, // Count actual replies
              }));

              console.log("📋 Threads loaded with replies:", discussionsWithReplies.length);
              setDiscussions(discussionsWithReplies);
            } else {
              setDiscussions([]);
            }
          } catch (error) {
            console.error("Error loading discussions:", error);
            setDiscussions([]);
          }
          break;

        case "events":
          // Load upcoming and past events using API
          try {
            const [upcomingResponse, pastResponse] = await Promise.all([
              fetch(`/api/communities/${id}/events?type=upcoming`),
              fetch(`/api/communities/${id}/events?type=past`)
            ]);

            if (upcomingResponse.ok) {
              const upcomingEventsData = await upcomingResponse.json();
              setUpcomingEvents(upcomingEventsData || []);
            } else {
              console.error("Error fetching upcoming events");
              toast.error("Failed to load upcoming events");
            }

            if (pastResponse.ok) {
              const pastEventsData = await pastResponse.json();
              setPastEvents(pastEventsData || []);
            } else {
              console.error("Error fetching past events");
              toast.error("Failed to load past events");
            }
          } catch (error) {
            console.error("Error loading events:", error);
            toast.error("Failed to load events");
          }
          break;

        case "members":
          // Load ALL members via API - only approved members
          try {
            const response = await fetch(`/api/communities/${id}/members`);
            if (!response.ok) {
              console.error("Error fetching members:", response.status);
              setMembers([]);
              break;
            }

            const data = await response.json();
            
            // API returns { members: [], total, page, pageSize }
            if (!data || !data.members || !Array.isArray(data.members)) {
              console.error("Invalid members data:", data);
              setMembers([]);
              break;
            }

            console.log("Approved members:", data.members.length, data.members);

            // Map members and ensure creator is treated as admin with Creator badge
            const formattedMembers = data.members.map((member: any) => {
              // If this member is the creator, treat them as admin
              const isCreator = member.user_id === community.creator_id;
              return {
                ...member,
              role: isCreator ? "admin" : member.role,
              isCreator: isCreator,
            };
          });

          setMembers(formattedMembers);
          } catch (error) {
            console.error("Error loading members:", error);
            setMembers([]);
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

  const handleJoinClick = () => {
    if (!currentUser) {
      toast.error("Please log in to join this community");
      router.push("/auth/login");
      return;
    }
    // Show confirmation dialog with points info
    setShowJoinConfirmDialog(true);
  };

  const handleJoinCommunity = async () => {
    setShowJoinConfirmDialog(false);

    if (!currentUser) {
      toast.error("Please log in to join this community");
      router.push("/auth/login");
      return;
    }

    try {
      setIsJoining(true);

      // Join community - use API endpoint which handles all the logic
      const response = await fetch("/api/communities/members/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          community_id: id,
        }),
      });

      console.log("Join community raw response:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error("Server returned invalid response");
      }

      console.log("Join community response:", {
        ok: response.ok,
        status: response.status,
        result: result,
      });

      if (!response.ok) {
        const errorMessage =
          result.error?.message ||
          result.error ||
          result.message ||
          "Failed to join community";
        const errorStr =
          typeof errorMessage === "string"
            ? errorMessage
            : JSON.stringify(errorMessage);

        console.error("Join community error:", errorStr);

        // Handle specific error cases with appropriate UI feedback
        if (errorStr.includes("already") || errorStr.includes("pending")) {
          toast.info(errorStr);
          setIsJoining(false);
          return;
        }
        
        throw new Error(errorStr);
      }

      if (result.member) {
        // Update membership status to pending
        setMembershipStatus("pending");
        setIsMember(false);
        setUserRole(null);
        // Show dialog
        setShowPendingDialog(true);
        loadTabData(activeTab); // Reload tab data
      } else {
        throw new Error("Failed to create join request. Please try again.");
      }
    } catch (error: any) {
      console.error("Error joining/leaving community:", error);
      const errorMessage =
        error?.message || error?.toString() || "An unknown error occurred";

      // Don't show error toast if we already handled it above
      if (errorMessage.includes("already") || 
          errorMessage.includes("pending")) {
        // Already handled with specific toast
        return;
      }

      if (error?.code === "23503") {
        toast.error("User account issue. Please try logging out and back in.");
      } else {
        toast.error(
          errorMessage || "Failed to join community. Please try again."
        );
      }
    } finally {
      setIsJoining(false);
    }
  };

  // Cancel pending join request
  const handleCancelRequest = async () => {
    if (!currentUser || !community) {
      toast.error("Unable to cancel request");
      return;
    }

    try {
      setIsCanceling(true);

      const response = await fetch(`/api/communities/${id}/members`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error?.message || result.error || "Failed to cancel request"
        );
      }

      // Update local state
      setMembershipStatus(null);
      setIsMember(false);
      setShowCancelDialog(false);
      setShowPendingDialog(false);
      toast.success("Join request cancelled");
    } catch (error: any) {
      console.error("Error canceling request:", error);
      toast.error(error.message || "Failed to cancel request");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!currentUser) {
      toast.error("Please log in to leave this community");
      return;
    }

    try {
      setIsJoining(true);

      // Call API to leave community
      const response = await fetch(`/api/communities/${id}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to leave community");
      }

      // Update local state
      setIsMember(false);
      setUserRole(null);
      setMembershipStatus(null);
      setMemberCount((prev) => Math.max(0, prev - 1));

      toast.success("You've left the community");
      setShowLeaveDialog(false);

      // Reload tab data
      loadTabData(activeTab);

      // Refresh the page to update UI
      router.refresh();
    } catch (error: any) {
      console.error("Error leaving community:", error);
      toast.error(
        error?.message || "Failed to leave community. Please try again."
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handlePostDiscussion = async () => {
    if (!newPost.trim() || !isMember || !currentUser) return;

    try {
      setIsSubmitting(true);

      let media_url = null;
      let media_type = null;
      let media_size = null;
      let media_mime_type = null;

      // Upload media if present
      if (threadMediaFile) {
        try {
          const formData = new FormData();
          formData.append("file", threadMediaFile);
          formData.append("type", "community");

          const uploadRes = await fetch("/api/storage/upload", {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            media_url = url;
            media_type = getMediaTypeCategory(threadMediaFile.type);
            media_size = threadMediaFile.size;
            media_mime_type = threadMediaFile.type;
          } else {
            const errorData = await uploadRes.json();
            console.error("Upload failed with status:", uploadRes.status);
            console.error(
              "Upload error details:",
              JSON.stringify(errorData, null, 2)
            );

            // Extract error message properly
            const errorMessage =
              typeof errorData.error === "string"
                ? errorData.error
                : errorData.error?.message ||
                  errorData.message ||
                  "Failed to upload media";

            throw new Error(errorMessage);
          }
        } catch (uploadError: any) {
          console.error("Error uploading media:", uploadError);
          const errorMsg = uploadError.message || "Failed to upload media";
          toast.error(`${errorMsg}. Posting without attachment.`);
        }
      }

      const response = await fetch("/api/messages/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        content: newPost.trim(),
        community_id: id,
        media_type,
        media_url,
        media_size,
        media_mime_type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create thread");
      }

      toast.success("Thread created!");
      setNewPost("");
      setThreadMediaFile(null);
      // Reload discussion forum
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
      setIsSubmittingReply(true);

      const response = await fetch("/api/messages/replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        content: replyContent.trim(),
        community_id: id,
        parent_id: parentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post reply");
      }

      toast.success("Reply posted!");
      setReplyContent("");
      setReplyingTo(null);
      // Reload discussion forum
      loadTabData("discussions");
    } catch (error: any) {
      console.error("Error posting reply:", error);
      toast.error(error.message || "Failed to post reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch(`/api/messages/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete message");
      }

      toast.success(
        deleteTarget.type === "thread" ? "Thread deleted!" : "Reply deleted!"
      );
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadTabData("discussions");
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast.error(error.message || "Failed to delete message");
    }
  };

  const canManage = userRole === "creator" || userRole === "admin";
  const isOwner =
    userRole === "creator" ||
    (community && currentUser && community.creator_id === currentUser.id);
  const canInteract = (isMember || userRole === "creator") && !isSuperAdmin; // Superadmins can view but not interact

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
              The community you're looking for doesn't exist or has been
              removed.
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
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
        <FloatingElements />
        {/* Hero Section with Profile Picture as Blurred Background */}
        <div className="relative h-72 overflow-hidden bg-gradient-to-br from-violet-600 to-blue-600 z-10">
        {community.logo_url && (
          <>
            <Image
              src={community.logo_url}
              alt={community.name}
              fill
              className="object-cover blur-2xl scale-110 opacity-40"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/60 to-blue-600/60" />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-6">
          <Link href="/communities">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
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
                </div>
                <div className="flex items-center gap-6 text-white/90 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{memberCount.toLocaleString()} members</span>
                  </div>
                  {community.category && (
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white border-0"
                    >
                      {community.category}
                    </Badge>
                  )}
                  {userRole && (
                    <Badge
                      variant="secondary"
                      className="bg-violet-500/50 text-white border-0"
                    >
                      {userRole === "creator" ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" /> Creator
                        </>
                      ) : userRole === "admin" ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" /> Admin
                        </>
                      ) : userRole === "moderator" ? (
                        <>
                          <Star className="h-3 w-3 mr-1" /> Moderator
                        </>
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
              {userRole === "creator" || userRole === "admin" ? (
                <>
                  <Button
                    disabled
                    className="bg-gray-100 text-gray-900 hover:bg-gray-200 cursor-not-allowed"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {userRole === "creator"
                      ? "Your Community"
                      : "Community Admin"}
                  </Button>
                  {canManage && (
                    <Link href={`/communities/${id}/admin`}>
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </Link>
                  )}
                </>
              ) : membershipStatus === "approved" &&
                isMember ? null : membershipStatus === "pending" ? ( // Just show nothing for joined members - they'll see the Leave button separately
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Pending Approval
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelDialog(true)}
                    className="border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              ) : (
                !isSuperAdmin && (
                  <Button
                    onClick={handleJoinClick}
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
                )
              )}

              {isMember &&
                membershipStatus === "approved" &&
                userRole !== "creator" &&
                userRole !== "admin" && (
                  <Button
                    onClick={() => setShowLeaveDialog(true)}
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Leave
                  </Button>
                )}

              {/* Superadmins and community creators cannot report */}
              {!isSuperAdmin && !isOwner && (
                <Button
                  variant="outline"
                  className="border-red-200 hover:bg-red-50 text-red-600"
                  onClick={() => {
                    setReportType("community");
                    setReportTargetId(community.id);
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content visible to all users - Discussion Forum only for approved members */}
        {(() => {
          const canAccessContent =
            membershipStatus === "approved" ||
            userRole === "creator" ||
            userRole === "admin" ||
            isSuperAdmin;
          const isPending = membershipStatus === "pending";

          return (
            <>
              {/* Subtle pending banner */}
              {isPending && (
                <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                  <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    Your join request is pending approval. You can browse the
                    community while waiting.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Community Tabs */}
                  <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1 h-auto">
                      <TabsTrigger
                        value="about"
                        className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
                      >
                        About
                      </TabsTrigger>
                      <TabsTrigger
                        value="discussions"
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
                      <SlideTransition
                        show={activeTab === "about"}
                        direction="up"
                      >
                        <Card className="border-gray-100">
                          <CardHeader>
                            <CardTitle className="text-xl font-medium text-gray-900">
                              About This Community
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-8">
                            <p className="text-gray-700 leading-relaxed">
                              {community.description ||
                                "No description available."}
                            </p>

                            <div className="py-6">
                              <div>
                                <span className="text-sm text-gray-500">
                                  Founded
                                </span>
                                <p className="font-medium text-gray-900">
                                  {community?.created_at
                                    ? (() => {
                                        try {
                                          const date = new Date(
                                            community.created_at
                                          );
                                          if (isNaN(date.getTime())) {
                                            console.error(
                                              "Invalid date:",
                                              community.created_at
                                            );
                                            return "Unknown";
                                          }
                                          return date.toLocaleDateString(
                                            "en-US",
                                            {
                                              month: "long",
                                              year: "numeric",
                                            }
                                          );
                                        } catch (e) {
                                          console.error(
                                            "Date parsing error:",
                                            e
                                          );
                                          return "Unknown";
                                        }
                                      })()
                                    : "Unknown"}
                                </p>
                              </div>
                            </div>

                            {community.location && (
                              <>
                                <Separator className="bg-gray-200" />

                                <div>
                                  <h4 className="font-medium mb-4 text-gray-900 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-violet-600" />
                                    Location
                                  </h4>
                                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <p className="text-gray-800">
                                      {typeof community.location === "string"
                                        ? community.location
                                        : community.location?.displayName ||
                                          community.location?.fullAddress ||
                                          community.location?.address ||
                                          community.location?.city ||
                                          "Location not specified"}
                                    </p>
                                  </div>
                                </div>
                              </>
                            )}

                            <Separator className="bg-gray-200" />

                            <div>
                              <h4 className="font-medium mb-4 text-gray-900">
                                Community Category
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {community.category ? (
                                  <HoverScale>
                                    <Badge
                                      variant="outline"
                                      className="border-gray-200 text-gray-600"
                                    >
                                      {community.category}
                                    </Badge>
                                  </HoverScale>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    No category assigned
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </SlideTransition>
                    </TabsContent>

                    {/* Discussion Forum Tab */}
                    <TabsContent
                      value="discussions"
                      className="space-y-6 mt-8"
                    >
                      {/* Show join message for non-members and pending users */}
                      {!canAccessContent ? (
                        <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
                          <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MessageCircle className="h-8 w-8 text-violet-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                              Join to View Discussions
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                              {isPending
                                ? "Your membership is pending approval. Once approved, you'll be able to view and participate in community discussions."
                                : "Become a member to see what the community is talking about and join the conversation."}
                            </p>
                            {!isPending && !currentUser && (
                              <Button
                                onClick={handleJoinClick}
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
                            {!isPending && currentUser && !isMember && (
                              <Button
                                onClick={handleJoinClick}
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
                                    Request to Join
                                  </>
                                )}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          {/* New Thread - All Members Can Post */}
                          {isMember && currentUser && (
                            <Card className="border-gray-200 shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={
                                        currentUser?.user_metadata?.avatar_url
                                      }
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                                      {currentUser?.email
                                        ?.charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-3">
                                    <Textarea
                                      placeholder="Start a new discussion..."
                                      value={newPost}
                                      onChange={(e) =>
                                        setNewPost(e.target.value)
                                      }
                                      className="min-h-[80px] border-gray-200 focus:border-violet-300 focus:ring-violet-200 resize-none text-sm"
                                    />

                                    {/* Media Upload */}
                                    <MediaUpload
                                      onMediaSelect={setThreadMediaFile}
                                      currentMedia={threadMediaFile}
                                      disabled={isSubmitting}
                                    />

                                    <div className="flex justify-end">
                                      <Button
                                        disabled={
                                          !newPost.trim() || isSubmitting
                                        }
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
                                            <Send className="h-4 w-4 mr-2" />{" "}
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
                                const isExpanded =
                                  showReplies[thread.id] ?? true;
                                const hasReplies =
                                  thread.replies && thread.replies.length > 0;
                                const replyCount =
                                  thread.replyCount ||
                                  thread.replies?.length ||
                                  0;

                                const isHighlighted = highlightedThreadId === thread.id;
                                
                                return (
                                  <Card
                                    key={thread.id}
                                    id={`thread-${thread.id}`}
                                    className={`border-gray-200 hover:border-gray-300 transition-colors ${
                                      isHighlighted
                                        ? "border-red-500 border-2 shadow-lg bg-red-50/30"
                                        : ""
                                    }`}
                                  >
                                    <CardContent className="p-0">
                                      {/* Main Thread Post */}
                                      <div className="p-4 border-b border-gray-100">
                                        <div className="flex gap-3">
                                          <Avatar className="h-9 w-9 flex-shrink-0">
                                            <AvatarImage
                                              src={thread.users?.avatar_url}
                                            />
                                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white text-sm">
                                              {(
                                                thread.users?.username ||
                                                thread.users?.full_name ||
                                                "U"
                                              )
                                                .charAt(0)
                                                .toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <span className="font-semibold text-gray-900 text-sm">
                                                {thread.users?.full_name ||
                                                  thread.users?.username ||
                                                  "Anonymous"}
                                              </span>
                                              {thread.isCreator && (
                                                <Badge
                                                  variant="secondary"
                                                  className="bg-violet-100 text-violet-700 text-xs px-1.5 py-0"
                                                >
                                                  Creator
                                                </Badge>
                                              )}
                                              {!thread.isCreator &&
                                                thread.authorRole ===
                                                  "admin" && (
                                                  <Badge
                                                    variant="secondary"
                                                    className="bg-violet-100 text-violet-700 text-xs px-1.5 py-0"
                                                  >
                                                    Admin
                                                  </Badge>
                                                )}
                                              {!thread.isCreator &&
                                                thread.authorRole ===
                                                  "moderator" && (
                                                  <Badge
                                                    variant="secondary"
                                                    className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0"
                                                  >
                                                    Moderator
                                                  </Badge>
                                                )}
                                              <span className="text-xs text-gray-500">
                                                {new Date(
                                                  thread.created_at
                                                ).toLocaleDateString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "numeric",
                                                  minute: "2-digit",
                                                })}
                                              </span>
                                            </div>
                                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm mb-3">
                                              {thread.content}
                                            </p>

                                            {/* Display Media if present */}
                                            {thread.media_url && (
                                              <div className="mb-3">
                                                {thread.media_type ===
                                                "image" ? (
                                                  <img
                                                    src={thread.media_url}
                                                    alt="Attachment"
                                                    className="max-w-full max-h-96 rounded-lg object-contain border border-gray-200 cursor-pointer hover:opacity-95 transition-opacity"
                                                    onClick={() =>
                                                      window.open(
                                                        thread.media_url,
                                                        "_blank"
                                                      )
                                                    }
                                                  />
                                                ) : thread.media_type ===
                                                  "video" ? (
                                                  <video
                                                    src={thread.media_url}
                                                    controls
                                                    className="max-w-full max-h-96 rounded-lg border border-gray-200"
                                                  />
                                                ) : null}
                                              </div>
                                            )}

                                            <div className="flex items-center gap-4">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-xs text-gray-600 hover:text-violet-600 hover:bg-violet-50"
                                                onClick={() => {
                                                  setReplyingTo(
                                                    replyingTo === thread.id
                                                      ? null
                                                      : thread.id
                                                  );
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
                                                      Hide {replyCount}{" "}
                                                      {replyCount === 1
                                                        ? "reply"
                                                        : "replies"}
                                                    </>
                                                  ) : (
                                                    <>
                                                      <ChevronRight className="h-3.5 w-3.5 mr-1.5" />
                                                      Show {replyCount}{" "}
                                                      {replyCount === 1
                                                        ? "reply"
                                                        : "replies"}
                                                    </>
                                                  )}
                                                </Button>
                                              )}
                                              {isMember &&
                                                currentUser &&
                                                !isSuperAdmin &&
                                                thread.sender_id !==
                                                  currentUser.id && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                      setReportType("thread");
                                                      setReportTargetId(
                                                        thread.id
                                                      );
                                                      setReportTargetName(
                                                        thread.content?.substring(
                                                          0,
                                                          50
                                                        ) || "Thread"
                                                      );
                                                      setReportDialogOpen(true);
                                                    }}
                                                  >
                                                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                                                    Report
                                                  </Button>
                                                )}
                                              {isMember &&
                                                currentUser &&
                                                (thread.sender_id ===
                                                  currentUser.id ||
                                                  userRole === "admin" ||
                                                  userRole === "moderator" ||
                                                  userRole === "creator") && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                                                    onClick={() => {
                                                      setDeleteTarget({
                                                        id: thread.id,
                                                        type: "thread",
                                                      });
                                                      setDeleteDialogOpen(true);
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
                                      {replyingTo === thread.id &&
                                        isMember &&
                                        currentUser && (
                                          <div className="p-4 bg-gray-50 border-b border-gray-100">
                                            <div className="flex gap-3">
                                              <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarImage
                                                  src={
                                                    currentUser?.user_metadata
                                                      ?.avatar_url
                                                  }
                                                />
                                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white text-xs">
                                                  {currentUser?.email
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex-1 space-y-2">
                                                <Textarea
                                                  placeholder="Write a reply..."
                                                  value={replyContent}
                                                  onChange={(e) =>
                                                    setReplyContent(
                                                      e.target.value
                                                    )
                                                  }
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
                                                    disabled={
                                                      !replyContent.trim() ||
                                                      isSubmitting
                                                    }
                                                    onClick={() =>
                                                      handleReply(thread.id)
                                                    }
                                                    className="bg-violet-600 hover:bg-violet-700 text-white"
                                                  >
                                                    {isSubmittingReply ? (
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
                                          {thread.replies.map((reply: any) => {
                                            const isReplyHighlighted = highlightedReplyId === reply.id;
                                            
                                            return (
                                            <div
                                              key={reply.id}
                                              id={`reply-${reply.id}`}
                                              className={`p-4 border-b border-gray-100 last:border-b-0 ${
                                                isReplyHighlighted
                                                  ? "bg-red-50/50 border-red-300 border-l-4"
                                                  : ""
                                              }`}
                                            >
                                              <div className="flex gap-3 pl-8">
                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                  <AvatarImage
                                                    src={
                                                      reply.users?.avatar_url
                                                    }
                                                  />
                                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                                                    {(
                                                      reply.users?.username ||
                                                      reply.users?.full_name ||
                                                      "U"
                                                    )
                                                      .charAt(0)
                                                      .toUpperCase()}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-900 text-sm">
                                                      {reply.users?.full_name ||
                                                        reply.users?.username ||
                                                        "Anonymous"}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                      {new Date(
                                                        reply.created_at
                                                      ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                          month: "short",
                                                          day: "numeric",
                                                          hour: "numeric",
                                                          minute: "2-digit",
                                                        }
                                                      )}
                                                    </span>
                                                  </div>
                                                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                                                    {reply.content}
                                                  </p>

                                                  {/* Display Media if present */}
                                                  {reply.media_url && (
                                                    <div className="mt-2">
                                                      {reply.media_type ===
                                                      "image" ? (
                                                        <img
                                                          src={reply.media_url}
                                                          alt="Attachment"
                                                          className="max-w-full max-h-64 rounded-lg object-contain border border-gray-200 cursor-pointer hover:opacity-95 transition-opacity"
                                                          onClick={() =>
                                                            window.open(
                                                              reply.media_url,
                                                              "_blank"
                                                            )
                                                          }
                                                        />
                                                      ) : reply.media_type ===
                                                        "video" ? (
                                                        <video
                                                          src={reply.media_url}
                                                          controls
                                                          className="max-w-full max-h-64 rounded-lg border border-gray-200"
                                                        />
                                                      ) : null}
                                                    </div>
                                                  )}

                                                  {isMember &&
                                                    currentUser &&
                                                    !isSuperAdmin &&
                                                    !isOwner &&
                                                    reply.sender_id !==
                                                      currentUser.id && (
                                                      <div className="mt-2">
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-7 px-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
                                                          onClick={() => {
                                                            setReportType(
                                                              "reply"
                                                            );
                                                            setReportTargetId(
                                                              reply.id
                                                            );
                                                            setReportTargetName(
                                                              reply.content?.substring(
                                                                0,
                                                                50
                                                              ) || "Reply"
                                                            );
                                                            setReportDialogOpen(
                                                              true
                                                            );
                                                          }}
                                                        >
                                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                                          Report
                                                        </Button>
                                                      </div>
                                                    )}
                                                  {isMember &&
                                                    currentUser &&
                                                    (reply.sender_id ===
                                                      currentUser.id ||
                                                      userRole === "admin" ||
                                                      userRole === "moderator" ||
                                                      userRole === "creator") && (
                                                      <div className="mt-2">
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                          onClick={() => {
                                                            setDeleteTarget({
                                                              id: reply.id,
                                                              type: "reply",
                                                            });
                                                            setDeleteDialogOpen(
                                                              true
                                                            );
                                                          }}
                                                        >
                                                          <Trash2 className="h-3 w-3 mr-1" />
                                                          Delete
                                                        </Button>
                                                      </div>
                                                    )}
                                                </div>
                                              </div>
                                            </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>

                    {/* Events Tab */}
                    <TabsContent value="events" className="space-y-8 mt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            Events
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {upcomingEvents.length} upcoming,{" "}
                            {pastEvents.length} past
                          </p>
                        </div>
                        {canManage && (
                          <Link href={`/communities/${id}/admin/events`}>
                            <Button
                              variant="outline"
                              className="border-violet-200 text-violet-600 hover:bg-violet-50"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Manage Events
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
                                <h4 className="text-lg font-semibold text-gray-900">
                                  Upcoming Events
                                </h4>
                                <p className="text-gray-600 text-sm mt-1">
                                  {upcomingEvents.length}{" "}
                                  {upcomingEvents.length === 1
                                    ? "event"
                                    : "events"}{" "}
                                  scheduled
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
                                    Check back later for upcoming events.
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
                                        console.warn(
                                          "Event missing ID:",
                                          event
                                        );
                                        return null;
                                      }

                                      const eventId = String(event.id);
                                      const startDate = new Date(
                                        event.start_time
                                      );
                                      const endDate = new Date(event.end_time);

                                      // Format date for display
                                      const dayOfMonth = startDate.getDate();
                                      const monthShort =
                                        startDate.toLocaleDateString("en-US", {
                                          month: "short",
                                        });
                                      const weekday =
                                        startDate.toLocaleDateString("en-US", {
                                          weekday: "short",
                                        });
                                      const year = startDate.getFullYear();
                                      const timeRange = `${startDate.toLocaleTimeString(
                                        "en-US",
                                        {
                                          hour: "numeric",
                                          minute: "2-digit",
                                        }
                                      )} - ${endDate.toLocaleTimeString(
                                        "en-US",
                                        {
                                          hour: "numeric",
                                          minute: "2-digit",
                                        }
                                      )}`;

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
                                                    <div className="text-xs mt-1 font-medium text-violet-600">
                                                      {year}
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
                                                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                                        <Calendar className="h-4 w-4 text-violet-600" />
                                                      </div>
                                                      <span className="font-medium">
                                                        {startDate.toLocaleDateString(
                                                          "en-US",
                                                          {
                                                            weekday: "long",
                                                            month: "long",
                                                            day: "numeric",
                                                            year: "numeric",
                                                          }
                                                        )}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                                        <Clock className="h-4 w-4 text-violet-600" />
                                                      </div>
                                                      <span className="font-medium">
                                                        {timeRange}
                                                      </span>
                                                    </div>

                                                    {event.location && (
                                                      <div className="flex items-center gap-2 text-gray-700">
                                                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                                          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                                                            <MapPin className="h-4 w-4" />
                                                          </div>
                                                        </div>
                                                        <span className="flex-1 truncate">
                                                          {getLocationDisplay(
                                                            event.location
                                                          )}
                                                        </span>
                                                      </div>
                                                    )}

                                                    {event.is_online && (
                                                      <div className="flex items-center gap-2 text-gray-700">
                                                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                                          <div className="p-1.5 rounded-lg bg-green-100 text-green-600">
                                                            <Globe className="h-4 w-4" />
                                                          </div>
                                                        </div>
                                                        <span className="flex-1">
                                                          Online Event
                                                        </span>
                                                      </div>
                                                    )}

                                                    {event.max_attendees && (
                                                      <div className="flex items-center gap-2 text-gray-700">
                                                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                                          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                                                            <Users className="h-4 w-4" />
                                                          </div>
                                                        </div>
                                                        <span className="flex-1">
                                                          Max{" "}
                                                          {event.max_attendees}{" "}
                                                          attendees
                                                        </span>
                                                      </div>
                                                    )}
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
                                      totalPages={Math.ceil(
                                        upcomingEvents.length / eventsPerPage
                                      )}
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
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    Past Events
                                  </h4>
                                  <p className="text-gray-600 text-sm mt-1">
                                    {pastEvents.length}{" "}
                                    {pastEvents.length === 1
                                      ? "event"
                                      : "events"}{" "}
                                    completed
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
                                    const startDate = new Date(
                                      event.start_time
                                    );
                                    const endDate = new Date(event.end_time);

                                    // Format date for display
                                    const dayOfMonth = startDate.getDate();
                                    const monthShort =
                                      startDate.toLocaleDateString("en-US", {
                                        month: "short",
                                      });
                                    const weekday =
                                      startDate.toLocaleDateString("en-US", {
                                        weekday: "short",
                                      });
                                    const year = startDate.getFullYear();
                                    const timeRange = `${startDate.toLocaleTimeString(
                                      "en-US",
                                      {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      }
                                    )} - ${endDate.toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}`;

                                    return (
                                      <div
                                        key={eventId}
                                        className="relative group"
                                      >
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
                                                    <div className="text-xs mt-1 font-medium text-gray-600">
                                                      {year}
                                                    </div>
                                                  </div>
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
                                                      <Badge
                                                        variant="secondary"
                                                        className="bg-gray-500 text-white border-0 text-xs"
                                                      >
                                                        Past
                                                      </Badge>
                                                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                  </div>

                                                  {/* Event Info */}
                                                  <div className="space-y-1.5 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                      <Clock className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                                      <span className="font-medium">
                                                        {timeRange}
                                                      </span>
                                                    </div>

                                                    {event.location && (
                                                      <div className="flex items-center gap-2 text-gray-700">
                                                        <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                                        <span className="truncate">
                                                          {getLocationDisplay(
                                                            event.location
                                                          )}
                                                        </span>
                                                      </div>
                                                    )}

                                                    <div className="flex items-center gap-3 flex-wrap">
                                                      {event.is_online && (
                                                        <div className="flex items-center gap-1.5 text-gray-600">
                                                          <Globe className="h-3.5 w-3.5 text-gray-500" />
                                                          <span className="text-xs">
                                                            Online
                                                          </span>
                                                        </div>
                                                      )}
                                                      {event.max_attendees && (
                                                        <div className="flex items-center gap-1.5 text-gray-600">
                                                          <Users className="h-3.5 w-3.5 text-gray-500" />
                                                          <span className="text-xs">
                                                            Max{" "}
                                                            {
                                                              event.max_attendees
                                                            }
                                                          </span>
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
                                    totalPages={Math.ceil(
                                      pastEvents.length / eventsPerPage
                                    )}
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
                      {(() => {
                        const canAccessMembers =
                          membershipStatus === "approved" ||
                          userRole === "creator" ||
                          userRole === "admin" ||
                          isSuperAdmin;
                        const isPending = membershipStatus === "pending";

                        if (!canAccessMembers) {
                          return (
                            <Card className="border-gray-200">
                              <CardContent className="p-12 text-center">
                                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                  {isPending
                                    ? "Membership Pending"
                                    : "Join to View Members"}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                  {isPending
                                    ? "Your membership request is pending approval. Once approved, you'll be able to view community members."
                                    : "Join this community to view its members and connect with other members."}
                                </p>
                                {!isPending && (
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
                              </CardContent>
                            </Card>
                          );
                        }

                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                  Members
                                </h3>
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
                                      <Card
                                        key={member.user_id}
                                        className="border-gray-200"
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                              <Avatar className="h-12 w-12">
                                                <AvatarImage
                                                  src={member.user?.avatar_url}
                                                />
                                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                                                  {(
                                                    member.user?.username ||
                                                    member.user?.full_name ||
                                                    "U"
                                                  ).charAt(0)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <div className="flex items-center gap-2">
                                                  <h4 className="font-semibold text-gray-900">
                                                    {member.user?.full_name ||
                                                      member.user?.username ||
                                                      "Unknown"}
                                                  </h4>
                                                  {member.isCreator && (
                                                    <Badge
                                                      variant="secondary"
                                                      className="bg-amber-100 text-amber-700 text-xs"
                                                    >
                                                      <Crown className="h-3 w-3 mr-1" />
                                                      Creator
                                                    </Badge>
                                                  )}
                                                  {!member.isCreator &&
                                                    member.role === "admin" && (
                                                      <Badge
                                                        variant="secondary"
                                                        className="bg-blue-100 text-blue-700 text-xs"
                                                      >
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        Admin
                                                      </Badge>
                                                    )}
                                                  {member.role ===
                                                    "moderator" && (
                                                    <Badge
                                                      variant="secondary"
                                                      className="bg-green-100 text-green-700 text-xs"
                                                    >
                                                      <Star className="h-3 w-3 mr-1" />
                                                      Moderator
                                                    </Badge>
                                                  )}
                                                  {/* Member biasa tidak perlu badge */}
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                  Joined{" "}
                                                  {new Date(
                                                    member.joined_at
                                                  ).toLocaleDateString(
                                                    "en-US",
                                                    {
                                                      month: "short",
                                                      year: "numeric",
                                                    }
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                            {currentUser &&
                                              member.user_id !==
                                                currentUser.id &&
                                              !isSuperAdmin &&
                                              !member.isCreator && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                                                  onClick={() => {
                                                    setReportType("member");
                                                    setReportTargetId(
                                                      member.user_id
                                                    );
                                                    setReportTargetName(
                                                      member.user?.full_name ||
                                                        member.user
                                                          ?.username ||
                                                        "Member"
                                                    );
                                                    setReportDialogOpen(true);
                                                  }}
                                                >
                                                  <AlertTriangle className="h-4 w-4 mr-1.5" />
                                                  Report
                                                </Button>
                                              )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                </div>
                                {members.length > membersPerPage && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <PaginationControls
                                      currentPage={membersPage}
                                      totalPages={Math.ceil(
                                        members.length / membersPerPage
                                      )}
                                      onPageChange={setMembersPage}
                                      itemsPerPage={membersPerPage}
                                      totalItems={members.length}
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        );
                      })()}
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
                          {upcomingEvents.length}
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
                                    console.error(
                                      "Invalid date:",
                                      community.created_at
                                    );
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
                      <CardTitle className="text-lg font-semibold">
                        Created By
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={
                              creatorData?.avatar_url ||
                              community.creator?.avatar_url
                            }
                          />
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                            {(
                              creatorData?.username ||
                              community.creator?.username ||
                              "U"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {creatorData?.full_name ||
                              creatorData?.username ||
                              "Loading..."}
                          </p>
                          <p className="text-sm text-violet-600">Founder</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ad Carousel - Fixed position below Created By */}
                  <AdCarousel communityId={id} autoRotateInterval={5000} />
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Join Confirmation Dialog with Points Info */}
      <AlertDialog
        open={showJoinConfirmDialog}
        onOpenChange={setShowJoinConfirmDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-violet-600" />
              Join {community?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Your join request will be sent to the community admin for
                  approval.
                </p>
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                      <Star className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-violet-900">
                        Earn +3 Points!
                      </p>
                      <p className="text-sm text-violet-700">
                        You'll receive 3 points when your join request is
                        approved.
                      </p>
                      <p className="text-xs text-violet-600 mt-1">
                        Max 3 points per day
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleJoinCommunity}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Send Join Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for pending approval */}
      <Dialog open={showPendingDialog} onOpenChange={setShowPendingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Waiting For Admin Approval</DialogTitle>
            <DialogDescription>
              Your join request has been sent to the community admin. Please
              wait for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPendingDialog(false);
                setShowCancelDialog(true);
              }}
              className="text-gray-600"
            >
              Cancel Request
            </Button>
            <Button onClick={() => setShowPendingDialog(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Request Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Join Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your request to join this
              community? You can submit a new request later if you change your
              mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>
              Keep Request
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRequest}
              disabled={isCanceling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Cancel Request"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={reportDialogOpen}
        onClose={() => {
          setReportDialogOpen(false);
          setReportType("community");
          setReportTargetId("");
          setReportTargetName("");
        }}
        reportType={reportType}
        reportTargetId={reportTargetId}
        reportTargetName={reportTargetName}
      />

      {/* Leave Community Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Community?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave {community?.name}? You'll need to
              request to join again if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isJoining}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveCommunity}
              disabled={isJoining}
              className="bg-red-600 hover:bg-red-700"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                "Leave Community"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === "thread" ? "Thread" : "Reply"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this{" "}
              {deleteTarget?.type === "thread"
                ? "thread and all its replies"
                : "reply"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageTransition>
  );
}
