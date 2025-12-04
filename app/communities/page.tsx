"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  MapPin,
  Star,
  Search,
  ChevronRight,
  Heart,
  Map,
  Calendar,
  X,
  Award,
  CheckCircle2,
  Clock,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SmoothReveal } from "@/components/ui/smooth-reveal";
import { StaggerContainer } from "@/components/ui/stagger-container";
import { getSupabaseBrowser } from "@/lib/supabase/client";
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
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { FloatingElements } from "@/components/ui/floating-elements";
import { PageTransition } from "@/components/ui/page-transition";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { CitySearch } from "@/components/ui/city-search";
import type { City } from "@/lib/api/cities";
import React from "react";
import type { Community } from "@/types/community";

export default function DiscoverPage() {
  const [communities, setCommunities] = useState<Community[]>([]);

  // Search states (real-time filtering)
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [savedCommunities, setSavedCommunities] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [membershipFilter, setMembershipFilter] = useState<"all" | "joined" | "pending" | "not_joined">("all");
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Membership status tracking
  const [membershipStatus, setMembershipStatus] = useState<Record<string, "joined" | "pending" | "not_joined">>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get user's current location with callback
  const getUserLocationCommunities = (callback?: (city: string) => void) => {
    if (navigator.geolocation) {
      setGettingLocation(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocoding to get city name
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();

            const cityName = data.city || data.locality || "Current Location";

            // Call callback with city name if provided
            if (callback) {
              callback(cityName);
            } else {
              setLocationQuery(cityName);
            }
          } catch (error) {
            const cityName = "Current Location";

            if (callback) {
              callback(cityName);
            } else {
              setLocationQuery(cityName);
            }
          } finally {
            setGettingLocation(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setGettingLocation(false);
          toast.error(
            "Unable to get your location. Please enable location services or enter a city manually."
          );
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  // Data will be loaded from database

  const categories = [
    { value: "all", label: "All Categories", icon: "🎯", color: "bg-gray-100" },
    { value: "hobbies-crafts", label: "Hobbies & Crafts", icon: "🎮", color: "bg-purple-100" },
    { value: "sports-fitness", label: "Sports & Fitness", icon: "⚽", color: "bg-blue-100" },
    { value: "career-business", label: "Career & Business", icon: "💼", color: "bg-indigo-100" },
    { value: "tech-innovation", label: "Tech & Innovation", icon: "💻", color: "bg-cyan-100" },
    { value: "arts-culture", label: "Arts & Culture", icon: "🎭", color: "bg-red-100" },
    { value: "social-community", label: "Social & Community", icon: "🤝", color: "bg-green-100" },
    { value: "education-learning", label: "Education & Learning", icon: "📚", color: "bg-yellow-100" },
    { value: "travel-adventure", label: "Travel & Adventure", icon: "✈️", color: "bg-orange-100" },
    { value: "food-drink", label: "Food & Drink", icon: "🍷", color: "bg-amber-100" },
    { value: "entertainment", label: "Entertainment", icon: "🎉", color: "bg-pink-100" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = getSupabaseBrowser();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Fetch communities from database with category relationship
      // Fetch all communities (both public and private) - we'll filter by privacy later if needed
      const { data: communitiesData, error } = await supabase
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
          is_private,
          creator_id
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching communities:", error);
        toast.error("Failed to load communities");
        return;
      }
      
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
          let location: any = {};
          if (comm.location) {
            if (typeof comm.location === "string") {
              try {
                location = JSON.parse(comm.location);
              } catch {
                // If not JSON, treat as address string
                location = { address: comm.location };
              }
            } else if (typeof comm.location === "object") {
              location = comm.location;
            }
          }

          // Get category name from relationship or fallback to "General"
          const categoryName = (comm.categories as any)?.name || "General";

          return {
            id: comm.id,
            name: comm.name,
            description: comm.description || "No description available",
            category: categoryName,
            tags: [], // Tags column doesn't exist in database yet
            memberCount: comm.member_count || 0,
            averageRating: 4.5, // Default rating (can be calculated from reviews if you have them)
            location: {
              lat: location.lat || 0,
              lng: location.lng || 0,
              city:
                location.city ||
                location.town ||
                location.village ||
                location.municipality ||
                "",
              country: location.country || "",
              address:
                location.address ||
                location.display_name ||
                (typeof comm.location === "string" ? comm.location : "") ||
                "",
            },
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
            privacy: comm.is_private ? "private" : "public",
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
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load communities");
    }
  };

  const filteredCommunities = useMemo(() => {
    let filtered = communities;

    // Location filter
    if (locationQuery) {
      filtered = filtered.filter((community) => {
        const city = community.location.city;
        return city && city.toLowerCase().includes(locationQuery.toLowerCase());
      });
    }

    // General search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (community) =>
          community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          community.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          community.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          community.category.toLowerCase().includes(searchQuery.toLowerCase())
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

  const toggleSaveCommunity = useCallback((communityId: string) => {
    setSavedCommunities((prev) =>
      prev.includes(communityId)
        ? prev.filter((id) => id !== communityId)
        : [...prev, communityId]
    );
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(filteredCommunities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCommunities = filteredCommunities.slice(startIndex, endIndex);

  // Reset to page 1 when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationQuery, selectedCategory, membershipFilter]);

  const EnhancedCommunityCard = React.memo(
    ({
      community,
      isListView = false,
    }: {
      community: Community;
      isListView?: boolean;
    }) => {
      const isSaved = savedCommunities.includes(community.id);

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
              <Button
                size="icon"
                className={`rounded-full backdrop-blur-sm bg-white/30 hover:bg-white/50 text-white hover:text-red-500 transition-colors h-9 w-9 ${
                  isSaved ? "text-red-500" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  toggleSaveCommunity(community.id);
                }}
              >
                <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
              </Button>
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
              <Link href={`/community/${community.id}`} className="w-full">
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
                  Discover Amazing Communities
                </h1>
                <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of people connecting through shared interests,
                  passions, and goals
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

                  {/* Location Input with City Search */}
                  <div className="relative w-64 z-[10001]">
                    <CitySearch
                      value={locationQuery}
                      onCitySelect={(city) => {
                        const cityName = city.name + (city.country ? `, ${city.country}` : '');
                        setLocationQuery(cityName);
                        setShowLocationDropdown(false);
                      }}
                      placeholder="Search by city or country..."
                      className="h-full"
                      showCurrentLocation={true}
                      onCurrentLocation={() => {
                        getUserLocationCommunities((cityName) => {
                          setLocationQuery(cityName);
                          setShowLocationDropdown(false);
                        });
                      }}
                    />
                  </div>

                  {/* Search Button */}
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-none px-6 py-5 shadow-lg h-full"
                    onClick={() => {
                      // Trigger search logic here
                      console.log("Search triggered:", {
                        searchQuery,
                        locationQuery,
                      });
                    }}
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
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-center gap-4 overflow-x-auto scrollbar-hide">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={cn(
                        "text-sm font-medium whitespace-nowrap transition-colors",
                        selectedCategory === category.value
                          ? "text-gray-900 underline underline-offset-8 decoration-2"
                          : "text-gray-600 hover:text-gray-900"
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
            {viewMode === "grid" && (
              <>
                <StaggerContainer
                  delay={50}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
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

            {filteredCommunities.length === 0 && (
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
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
