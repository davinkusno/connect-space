"use client";

import { Chatbot } from "@/components/ai/chatbot";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingElements } from "@/components/ui/floating-elements";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SmoothReveal } from "@/components/ui/smooth-reveal";
import { StaggerContainer } from "@/components/ui/stagger-container";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Community } from "@/types/community";
import {
    Award, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, Search, Users, X
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// Dynamic import for Leaflet map to avoid SSR issues
const LeafletCommunitiesMap = dynamic(
  () =>
    import("@/components/maps/leaflet-communities-map").then(
      (mod) => mod.LeafletCommunitiesMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[70vh] flex items-center justify-center bg-gray-100 rounded-lg">
        Loading map...
      </div>
    ),
  }
);

export default function DiscoverPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search states (real-time filtering)
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Set to 6 for testing recommendations
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [membershipFilter, setMembershipFilter] = useState<"all" | "joined" | "pending" | "not_joined">("all");
  
  // Membership status tracking
  const [membershipStatus, setMembershipStatus] = useState<Record<string, "joined" | "pending" | "not_joined">>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const categoryScrollRef = useRef<HTMLDivElement>(null);


  // Data will be loaded from database

  const categories = [
    { value: "all", label: "All Categories", icon: "🎯", color: "bg-gray-100" },
    { value: "hobbies & crafts", label: "Hobbies & Crafts", icon: "🎮", color: "bg-purple-100" },
    { value: "sports & fitness", label: "Sports & Fitness", icon: "⚽", color: "bg-blue-100" },
    { value: "career & business", label: "Career & Business", icon: "💼", color: "bg-indigo-100" },
    { value: "tech & innovation", label: "Tech & Innovation", icon: "💻", color: "bg-cyan-100" },
    { value: "arts & culture", label: "Arts & Culture", icon: "🎭", color: "bg-red-100" },
    { value: "social & community", label: "Social & Community", icon: "🤝", color: "bg-green-100" },
    { value: "education & learning", label: "Education & Learning", icon: "📚", color: "bg-yellow-100" },
    { value: "travel & adventure", label: "Travel & Adventure", icon: "✈️", color: "bg-orange-100" },
    { value: "food & drink", label: "Food & Drink", icon: "🍷", color: "bg-amber-100" },
    { value: "entertainment", label: "Entertainment", icon: "🎉", color: "bg-pink-100" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Fetch recommended community IDs if user is logged in
      let recommendedCommunityIds: string[] = [];
      if (user) {
        try {
          console.log("[COMMUNITIES PAGE] Fetching recommendations for user:", user.id);
          const response = await fetch("/api/communities/recommendations");
          if (response.ok) {
            const data = await response.json();
            recommendedCommunityIds = data.recommendedCommunityIds || [];
            console.log("[COMMUNITIES PAGE] Received recommendations:", {
              count: recommendedCommunityIds.length,
              ids: recommendedCommunityIds.slice(0, 5),
              metadata: data.metadata,
            });
            // Log top recommendations with scores
            if (data.recommendations && data.recommendations.length > 0) {
              console.log("[COMMUNITIES PAGE] Top 5 recommendation scores:");
              data.recommendations.slice(0, 5).forEach((rec: any, i: number) => {
                console.log(`  ${i + 1}. ${rec.communityId}: score=${rec.score.toFixed(3)}`);
              });
            }
          } else {
            console.error("[COMMUNITIES PAGE] Recommendations API error:", response.status);
          }
        } catch (error) {
          console.error("[COMMUNITIES PAGE] Error fetching recommendations:", error);
          // Continue with all communities if recommendations fail
        }
      }
      
      // Build query for communities
      let query = supabase
        .from("communities")
        .select(
          `
          id,
          name,
          description,
          category_id,
          categories (
            id,
            name
          ),
          logo_url,
          banner_url,
          member_count,
          created_at,
          location,
          creator_id,
          status
        `)
        .or("status.is.null,status.eq.active");
      
      // If user is logged in and we have recommendations, filter by recommended IDs
      // This ensures only suggested communities are shown
      if (user && recommendedCommunityIds.length > 0) {
        console.log("[COMMUNITIES PAGE] Using recommended IDs filter:", recommendedCommunityIds.length, "communities");
        query = query.in("id", recommendedCommunityIds);
      } else if (user && recommendedCommunityIds.length === 0) {
        // If user is logged in but has no recommendations (new user), show all communities
        console.log("[COMMUNITIES PAGE] WARNING: No recommendations returned, showing all communities");
      } else {
        // If user is not logged in, show all communities
        console.log("[COMMUNITIES PAGE] User not logged in, showing all communities");
      }
      
      // Apply ordering based on whether we have recommendations
      if (user && recommendedCommunityIds.length > 0) {
        // For recommended communities, fetch without ordering (we'll sort by recommendation order)
        const { data: communitiesData, error } = await query;
        
        if (error) {
          console.error("Error fetching communities:", error);
          toast.error("Failed to load communities");
          return;
        }
        
        // Sort communities to match recommendation order
        const sortedCommunities = (communitiesData || []).sort((a: any, b: any) => {
          const aIndex = recommendedCommunityIds.indexOf(a.id);
          const bIndex = recommendedCommunityIds.indexOf(b.id);
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        
        // Process the sorted communities
        await processCommunitiesData(sortedCommunities, user, supabase);
        return;
      } else {
        // For non-recommended or non-logged-in users, order by member count
        const { data: communitiesData, error } = await query
          .order("member_count", { ascending: false });
        
        if (error) {
          console.error("Error fetching communities:", error);
          toast.error("Failed to load communities");
          return;
        }
        
        await processCommunitiesData(communitiesData, user, supabase);
        return;
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load communities");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to process communities data
  const processCommunitiesData = async (
    communitiesData: any[],
    user: any,
    supabase: any
  ) => {
    // Fetch membership status for current user if logged in
    const membershipStatusMap: Record<string, "joined" | "pending" | "not_joined"> = {};
    if (user) {
      const communityIds = (communitiesData || []).map((c: any) => c.id);
      if (communityIds.length > 0) {
        const { data: memberships } = await supabase
          .from("community_members")
          .select("community_id, status")
          .eq("user_id", user.id)
          .in("community_id", communityIds);
        
        // Initialize all as not_joined
        communityIds.forEach((id: string) => {
          membershipStatusMap[id] = "not_joined";
        });
        
        // Check if user is creator
        (communitiesData || []).forEach((comm: any) => {
          if (comm.creator_id === user.id) {
            membershipStatusMap[comm.id] = "joined";
          }
        });
        
        // Update based on memberships
        (memberships || []).forEach((membership: any) => {
          if (membership.status === false) {
            membershipStatusMap[membership.community_id] = "pending";
          } else if (membership.status === true || membership.status === null) {
            membershipStatusMap[membership.community_id] = "joined";
          }
        });
      }
    } else {
      // User not logged in - all communities are not_joined
      (communitiesData || []).forEach((comm: any) => {
        membershipStatusMap[comm.id] = "not_joined";
      });
    }
    
    setMembershipStatus(membershipStatusMap);

    // Transform database data to match Community interface
    const transformedCommunities: Community[] = (communitiesData || []).map(
        (comm) => {
          // Parse location - it could be a string or a JSON object
          // For online communities, location may be null/empty
          let parsedLocation: Community["location"] = undefined;
          if (comm.location) {
            let location: any = {};
            if (typeof comm.location === "string") {
              try {
                location = JSON.parse(comm.location);
              } catch {
                // If not JSON, treat as city name
                location = { city: comm.location };
              }
            } else if (typeof comm.location === "object") {
              location = comm.location;
            }
            
            // Only set location if we have valid coordinates or city
            if (location.lat && location.lng) {
              parsedLocation = {
                lat: location.lat,
                lng: location.lng,
                city: location.city || location.town || location.village || location.municipality || "",
                country: location.country || "",
              };
            } else if (location.city || location.town || location.village || location.municipality) {
              // If we have city but no coordinates, still include it
              parsedLocation = {
                lat: 0,
                lng: 0,
                city: location.city || location.town || location.village || location.municipality || "",
                country: location.country || "",
              };
            }
          }

          // Get category name from the categories relationship
          const categoryName = (comm.categories as any)?.name || "General";

          return {
            id: comm.id,
            name: comm.name,
            description: comm.description || "No description available",
            category: categoryName,
            tags: [], // Tags column doesn't exist in database yet
            memberCount: comm.member_count || 0,
            location: parsedLocation,
            activityLevel: "medium", // Can be calculated based on recent activity
            image:
              comm.banner_url ||
              comm.logo_url ||
              "/placeholder.svg?height=200&width=300",
            upcomingEvents: 0, // Will be updated with actual event count
            memberGrowth: "+0%", // Can be calculated if you track historical data
            gradient: "gradient-primary",
            trending: false, // Can be calculated based on recent growth/activity
            createdAt: comm.created_at,
            lastActivity: comm.created_at, // Can be updated with actual last activity
            engagementScore: 70, // Can be calculated based on various metrics
            isRecommended: false,
            isVerified: false, // Add verification field to database if needed
            isNew:
              new Date(comm.created_at).getTime() >
              Date.now() - 30 * 24 * 60 * 60 * 1000, // Created within last 30 days
            featured: false,
            language: "English",
            privacy: "public",
          };
        }
      );

    // Fetch event counts for each community
    const communityIds = transformedCommunities.map((c) => c.id);
    if (communityIds.length > 0) {
      const { data: eventsData } = await supabase
        .from("events")
        .select("community_id")
        .in("community_id", communityIds)
        .gte("start_time", new Date().toISOString());

      // Count events per community
      const eventCounts: Record<string, number> = {};
      (eventsData || []).forEach((event: any) => {
        eventCounts[event.community_id] =
          (eventCounts[event.community_id] || 0) + 1;
      });

      // Update event counts
      transformedCommunities.forEach((comm) => {
        comm.upcomingEvents = eventCounts[comm.id] || 0;
      });
    }

    setCommunities(transformedCommunities);
  };

  const filteredCommunities = useMemo(() => {
    let filtered = communities;

    // Location filter
    if (locationQuery) {
      const query = locationQuery.toLowerCase();
      filtered = filtered.filter((community) => {
        if (!community.location) return false;
        const city = community.location.city;
        const address = community.location.address;
        return (city && city.toLowerCase().includes(query)) || 
               (address && address.toLowerCase().includes(query));
      });
    }

    // General search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (community) =>
          community.name.toLowerCase().includes(query) ||
          community.description.toLowerCase().includes(query) ||
          community.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          community.category.toLowerCase().includes(query) ||
          (community.location?.city?.toLowerCase().includes(query) ?? false) ||
          (community.location?.address?.toLowerCase().includes(query) ?? false)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (community) =>
          community.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Membership filter
    if (membershipFilter !== "all" && currentUser) {
      filtered = filtered.filter((community) => {
        const status = membershipStatus[community.id] || "not_joined";
        return status === membershipFilter;
      });
    }

    return filtered;
  }, [communities, searchQuery, locationQuery, selectedCategory, membershipFilter, membershipStatus, currentUser]);


  // Pagination logic
  const totalPages = Math.ceil(filteredCommunities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCommunities = filteredCommunities.slice(startIndex, endIndex);

  // Reset to page 1 when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationQuery, selectedCategory, membershipFilter]);

  // Check scroll position on mount and when layout changes
  useEffect(() => {
    const checkScroll = () => {
      if (categoryScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    checkScroll();
    // Check again after a short delay to ensure layout is complete
    const timer = setTimeout(checkScroll, 100);
    
    // Also check on window resize
    window.addEventListener("resize", checkScroll);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, []); // Empty dependency array - only run on mount

  const EnhancedCommunityCard = React.memo(
    ({
      community,
      isListView = false,
    }: {
      community: Community;
      isListView?: boolean;
    }) => {
      // Determine border color based on membership status
      const getBorderColor = () => {
        if (!currentUser) return "border-gray-200";
        const status = membershipStatus[community.id];
        if (status === "joined") return "border-green-500 border-2";
        if (status === "pending") return "border-amber-500 border-2";
        return "border-gray-200";
      };

      return (
        <Card className={cn("bg-white rounded-2xl overflow-hidden group w-full h-full flex flex-col shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1", getBorderColor())}>
          <div className="relative overflow-hidden">
            <Image
              src={community.image}
              alt={community.name}
              width={400}
              height={200}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Membership Status Badge on Image */}
              {currentUser && membershipStatus[community.id] && (
                <>
                  {membershipStatus[community.id] === "joined" && (
                    <Badge className="bg-green-500/90 backdrop-blur-sm text-white border border-green-300 text-xs font-semibold px-2 py-0.5 flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="h-3 w-3" />
                      Joined
                    </Badge>
                  )}
                  {membershipStatus[community.id] === "pending" && (
                    <Badge className="bg-amber-500/90 backdrop-blur-sm text-white border border-amber-300 text-xs font-semibold px-2 py-0.5 flex items-center gap-1 shadow-md">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </>
              )}
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-white">
              <div className="flex items-center gap-1 backdrop-blur-sm bg-black/30 px-2 py-1 rounded-full text-xs">
                <Users className="h-3 w-3" />
                <span>{community.memberCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <CardContent className="p-5 flex flex-col flex-grow">
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg text-gray-800 leading-tight truncate">
                  {community.name}
                </h3>
                {community.isVerified && (
                  <Award className="h-5 w-5 text-blue-500 flex-shrink-0" />
                )}
                {community.isNew && (
                  <Badge variant="secondary" className="text-xs font-semibold">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {community.description}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2" title="Members">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{community.memberCount.toLocaleString()} members</span>
                </div>
                <div
                  className="flex items-center gap-2"
                  title="Upcoming Events"
                >
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{community.upcomingEvents} upcoming events</span>
                </div>
              </div>
            </div>
            <div className="pt-4 mt-auto border-t border-gray-200/80">
              <Link href={`/communities/${community.id}`} className="w-full">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-0.5">
                  View Community
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      );
    }
  );

  return (
    <PageTransition>
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen relative">
        <FloatingElements />

        {/* Hero Search Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg relative z-[100]">
          <div className="relative max-w-7xl mx-auto px-6 py-16">
            <SmoothReveal>
              <div className="text-center mb-8">
                <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  {currentUser ? "Recommended Communities" : "Discover Amazing Communities"}
                </h1>
                <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
                  {currentUser 
                    ? "Communities tailored just for you based on your interests and activity"
                    : "Join thousands of people connecting through shared interests, passions, and goals"}
                </p>
              </div>
            </SmoothReveal>

            {/* Quick Stats */}
            <SmoothReveal delay={200}>
              <div className="grid grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1 text-white">
                    <AnimatedCounter end={filteredCommunities.length} />
                  </div>
                  <div className="text-purple-200 text-sm">
                    Communities Available
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1 text-white">
                    <AnimatedCounter
                      end={filteredCommunities.reduce(
                        (sum, c) => sum + c.memberCount,
                        0
                      )}
                    />
                  </div>
                  <div className="text-purple-200 text-sm">Total Members</div>
                </div>
              </div>
            </SmoothReveal>

            {/* Enhanced Search Bar - Eventbrite Style */}
            <SmoothReveal delay={300}>
              <div className="max-w-4xl mx-auto relative z-[100]">
                <div className="relative flex bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg focus-within:shadow-xl transition-all duration-300">
                  {/* Search Communities Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Search communities"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 py-4 text-lg border-0 rounded-none focus:ring-0 focus:outline-none text-gray-900 placeholder:text-gray-500 h-full"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-px bg-gray-300 my-2"></div>

                  {/* Location Input - Search DB directly */}
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by city or location..."
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      className="pl-10 pr-4 h-full border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                    {locationQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                        onClick={() => setLocationQuery("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Search Button - Search is real-time, button is for visual consistency */}
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-none px-6 py-5 shadow-lg h-full"
                    type="button"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </SmoothReveal>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 mt-8">
          {/* Filter Bar */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-50 -mx-6 px-6">
            <div className="flex items-center justify-between gap-4 py-4 flex-wrap">
              {/* Left: View Selector and Membership Filter */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-shrink-0">
                  <Select
                    value={viewMode}
                    onValueChange={(value: "grid" | "list" | "map") =>
                      setViewMode(value)
                    }
                  >
                    <SelectTrigger className="w-[150px] h-10 border-gray-300 rounded-lg font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid View</SelectItem>
                      <SelectItem value="map">Map View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Membership Filter - Only show if user is logged in */}
                {currentUser && (
                  <div className="flex-shrink-0">
                    <Select
                      value={membershipFilter}
                      onValueChange={(value: "all" | "joined" | "pending" | "not_joined") =>
                        setMembershipFilter(value)
                      }
                    >
                      <SelectTrigger className="w-[160px] h-10 border-gray-300 rounded-lg font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Communities</SelectItem>
                        <SelectItem value="joined">My Communities</SelectItem>
                        <SelectItem value="pending">Pending Requests</SelectItem>
                        <SelectItem value="not_joined">Not Joined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Center: Categories (Horizontal Scroll - Centered) */}
              <div className="flex-1 overflow-hidden min-w-0 relative">
                {/* Left Arrow */}
                {showLeftArrow && (
                  <button
                    onClick={() => {
                      if (categoryScrollRef.current) {
                        categoryScrollRef.current.scrollBy({
                          left: -200,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-1.5 shadow-md transition-all"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                )}

                {/* Right Arrow */}
                {showRightArrow && (
                  <button
                    onClick={() => {
                      if (categoryScrollRef.current) {
                        categoryScrollRef.current.scrollBy({
                          left: 200,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-1.5 shadow-md transition-all"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                )}

                <div
                  ref={categoryScrollRef}
                  className="flex items-center gap-4 overflow-x-auto scrollbar-hide px-6 py-1"
                  onScroll={() => {
                    if (categoryScrollRef.current) {
                      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
                      setShowLeftArrow(scrollLeft > 0);
                      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
                    }
                  }}
                >
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => {
                        // Allow deselecting by clicking the active category again
                        if (selectedCategory === category.value) {
                          setSelectedCategory("all");
                        } else {
                          setSelectedCategory(category.value);
                        }
                      }}
                      className={cn(
                        "text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 px-3 py-1.5 rounded-md",
                        selectedCategory === category.value
                          ? "text-gray-900 underline underline-offset-8 decoration-2 bg-gray-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="py-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-white rounded-2xl overflow-hidden shadow-md">
                    <Skeleton className="w-full h-48" />
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <div className="flex gap-2 mb-4">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-9 w-28" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {viewMode === "grid" && (
                  <>
                    <StaggerContainer
                      delay={50}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                      {paginatedCommunities.map((community) => (
                        <SmoothReveal key={community.id}>
                          <EnhancedCommunityCard community={community} />
                        </SmoothReveal>
                      ))}
                    </StaggerContainer>
                    {totalPages > 1 && (
                      <div className="mt-8">
                        <PaginationControls
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          itemsPerPage={itemsPerPage}
                          totalItems={filteredCommunities.length}
                        />
                      </div>
                    )}
                  </>
                )}

                {viewMode === "map" && (
                  <div className="h-[70vh] rounded-lg overflow-hidden shadow-lg">
                    <LeafletCommunitiesMap communities={filteredCommunities} />
                  </div>
                )}

                {filteredCommunities.length === 0 && !isLoading && (
                  <div className="text-center py-20">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-xl font-semibold">
                      No communities found
                    </h3>
                    <p className="mt-1 text-gray-500">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Chatbot />
    </PageTransition>
  );
}
