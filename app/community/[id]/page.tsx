"use client";

import { use, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseBrowser, getClientSession } from "@/lib/supabase/client";

export default function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [community, setCommunity] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<"creator" | "admin" | "moderator" | "member" | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState("discussions");
  
  // Tab-specific data
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  // Post creation
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load community data and user role
  useEffect(() => {
    loadCommunityData();
  }, [id]);

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
            .select("role, status")
            .eq("community_id", id)
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (membershipData) {
            setIsMember(membershipData.status === "active");
            setUserRole(membershipData.role as any);
          }
        }
      }

      // Get member count
      const { count } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", id)
        .eq("status", "active");

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
          // Load discussions (if you have a discussions table)
          // For now, showing placeholder
          setDiscussions([]);
          break;

        case "events":
          // Load events for this community
          const { data: eventsData } = await supabase
            .from("events")
            .select("*")
            .eq("community_id", id)
            .gte("start_time", new Date().toISOString())
            .order("start_time", { ascending: true })
            .limit(10);
          
          setEvents(eventsData || []);
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
            .eq("status", "active")
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
    } else {
        // Join community (check if private)
        if (community.is_private) {
          // Create join request
          const { error } = await supabase
            .from("community_join_requests")
            .insert({
              community_id: id,
              user_id: currentUser.id,
              status: "pending"
            });

          if (error) throw error;
          toast.info("Join request sent! Wait for admin approval.");
        } else {
          // Join directly
          const { error } = await supabase
            .from("community_members")
            .insert({
              community_id: id,
              user_id: currentUser.id,
              role: "member",
              status: "active"
            });

          if (error) throw error;

          setIsMember(true);
          setUserRole("member");
          setMemberCount(prev => prev + 1);
          toast.success("Welcome to the community!");
        }
      }
    } catch (error: any) {
      console.error("Error joining/leaving community:", error);
      toast.error(error.message || "Failed to update membership");
    } finally {
      setIsJoining(false);
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
                  {community.location?.city && (
                    <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                      <span>{community.location.city}</span>
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
              
              {isMember && (
                <>
                  <Button variant="outline" className="border-gray-200">
                  <Bell className="h-4 w-4 mr-2" />
                  Follow
                </Button>
                  <Button variant="outline" className="border-gray-200">
                    <Hash className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </>
              )}
              
              <Button variant="outline" className="border-gray-200">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
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
              <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
                <TabsTrigger
                  value="discussions"
                  className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700"
                >
                  Discussions
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700"
                >
                  Events
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700"
                >
                  Members
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700"
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
                              onClick={() => {
                                // Handle post submission
                                toast.info("Discussion posting coming soon!");
                              }}
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
                      <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No discussions yet
                              </h3>
                      <p className="text-gray-600 mb-6">
                        Be the first to start a conversation in this community!
                      </p>
                      {isMember && (
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                          Start a Discussion
                        </Button>
                      )}
                        </CardContent>
                      </Card>
                ) : (
                  <div className="space-y-4">
                    {discussions.map((post) => (
                      <Card key={post.id} className="border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          {/* Discussion content here */}
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
                    <Link href={`/events/create?community=${id}`}>
                      <Button className="bg-violet-600 hover:bg-violet-700 text-white">
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
                        <Link href={`/events/create?community=${id}`}>
                          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                            <Calendar className="h-4 w-4 mr-2" />
                            Create Event
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`}>
                        <Card className="border-gray-200 hover:shadow-md hover:border-violet-300 transition-all cursor-pointer">
                          <CardContent className="p-6">
                            <div className="flex gap-6">
                              {event.image_url && (
                                <div className="relative h-24 w-32 flex-shrink-0 rounded-lg overflow-hidden">
                              <Image
                                    src={event.image_url}
                                alt={event.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                                {event.title}
                              </h4>
                                <div className="space-y-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                      {new Date(event.start_time).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                </div>
                                  {event.location && (
                                    <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                      <span className="truncate">{event.location}</span>
                                </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      </Link>
                  ))}
                </div>
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
                        </CardContent>
                      </Card>
                  ))}
                </div>
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
                      <div>
                        <span className="text-sm text-gray-500">Location Type</span>
                        <p className="font-medium text-gray-900">
                          {community.location_type || "Physical"}
                          </p>
                        </div>
                      </div>

                    {community.location && (
                      <>
                        <Separator />
                      <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-violet-600" />
                          Location
                        </h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-800">
                              {community.location.address || 
                               `${community.location.city}, ${community.location.country}`}
                            </p>
                        </div>
                      </div>
                      </>
                    )}

                    {community.tags && community.tags.length > 0 && (
                      <>
                        <Separator />
                      <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {community.tags.map((tag: string, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="border-gray-200 text-gray-700"
                              >
                                {tag}
                              </Badge>
                          ))}
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
                    <Link href={`/events/create?community=${id}`}>
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
                      </div>
                    </div>
          </div>
    </div>
  );
}
