"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Users,
  MapPin,
  Star,
  TrendingUp,
  Filter,
  Search,
  Sparkles,
  ChevronRight,
  Heart,
  Grid,
  List,
  Map,
  Calendar,
  X,
  SlidersHorizontal,
  Activity,
  Award,
  Globe,
  Building,
  Zap,
  Target,
  Plus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AnimatedCard } from "@/components/ui/animated-card";
import { SmoothReveal } from "@/components/ui/smooth-reveal";
import { StaggerContainer } from "@/components/ui/stagger-container";
import { SmartSearchBar } from "@/components/ai/smart-search-bar";
import { LeafletCommunitiesMap } from "@/components/maps/leaflet-communities-map";
import { useGeolocation } from "@/hooks/use-geolocation";
import { HoverScale } from "@/components/ui/micro-interactions";
import { SlideTransition } from "@/components/ui/content-transitions";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { EnhancedChatbotWidget } from "@/components/ai/enhanced-chatbot-widget";
import { FloatingElements } from "@/components/ui/floating-elements";
import { PageTransition } from "@/components/ui/page-transition";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import React from "react";
import type { Community } from "@/types/community";

interface FilterState {
  categories: string[];
  memberRange: [number, number];
  ratingRange: [number, number];
  activityLevels: string[];
  locations: string[];
  showTrendingOnly: boolean;
  showRecommendedOnly: boolean;
  showVerifiedOnly: boolean;
  maxDistance: number;
  privacy: string[];
}

const defaultFilters: FilterState = {
  categories: [],
  memberRange: [0, 10000],
  ratingRange: [0, 5],
  activityLevels: [],
  locations: [],
  showTrendingOnly: false,
  showRecommendedOnly: false,
  showVerifiedOnly: false,
  maxDistance: 50,
  privacy: [],
};

interface FilterSidebarProps {
  tempFilters: FilterState;
  handleTempFilterChange: (key: keyof FilterState, value: any) => void;
  allCategories: string[];
  allActivityLevels: string[];
  allLocations: string[];
}

const FilterSidebar = React.memo(
  ({
    tempFilters,
    handleTempFilterChange,
    allCategories,
    allActivityLevels,
    allLocations,
  }: FilterSidebarProps) => (
    <div className="space-y-8 pt-2">
      <Accordion
        type="multiple"
        defaultValue={[
          "category",
          "members",
          "rating",
          "activity",
          "location",
          "privacy",
          "special",
        ]}
        className="w-full"
      >
        {/* Category Filter */}
        <AccordionItem value="category">
          <AccordionTrigger className="text-base font-semibold">
            Category
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {allCategories.map((category) => (
                <div key={category} className="flex items-center space-x-3">
                  <Checkbox
                    id={`cat-${category}`}
                    checked={tempFilters.categories.includes(category)}
                    onCheckedChange={(checked) => {
                      const newCategories = checked
                        ? [...tempFilters.categories, category]
                        : tempFilters.categories.filter((c) => c !== category);
                      handleTempFilterChange("categories", newCategories);
                    }}
                  />
                  <Label
                    htmlFor={`cat-${category}`}
                    className="font-normal text-gray-700 hover:text-purple-600 cursor-pointer"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Member Range Filter */}
        <AccordionItem value="members">
          <AccordionTrigger className="text-base font-semibold">
            Member Count
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="min-members" className="text-sm font-medium">
                  Min:
                </Label>
                <input
                  id="min-members"
                  type="number"
                  min="0"
                  max="10000"
                  value={tempFilters.memberRange[0]}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    handleTempFilterChange("memberRange", [
                      value,
                      tempFilters.memberRange[1],
                    ]);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="max-members" className="text-sm font-medium">
                  Max:
                </Label>
                <input
                  id="max-members"
                  type="number"
                  min="0"
                  max="10000"
                  value={tempFilters.memberRange[1]}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 10000;
                    handleTempFilterChange("memberRange", [
                      tempFilters.memberRange[0],
                      value,
                    ]);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rating Range Filter */}
        <AccordionItem value="rating">
          <AccordionTrigger className="text-base font-semibold">
            Rating
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="min-rating" className="text-sm font-medium">
                  Min:
                </Label>
                <input
                  id="min-rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={tempFilters.ratingRange[0]}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    handleTempFilterChange("ratingRange", [
                      value,
                      tempFilters.ratingRange[1],
                    ]);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">★</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="max-rating" className="text-sm font-medium">
                  Max:
                </Label>
                <input
                  id="max-rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={tempFilters.ratingRange[1]}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 5;
                    handleTempFilterChange("ratingRange", [
                      tempFilters.ratingRange[0],
                      value,
                    ]);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">★</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Activity Level Filter */}
        <AccordionItem value="activity">
          <AccordionTrigger className="text-base font-semibold">
            Activity Level
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {allActivityLevels.map((level) => (
                <div key={level} className="flex items-center space-x-3">
                  <Checkbox
                    id={`level-${level}`}
                    checked={tempFilters.activityLevels.includes(level)}
                    onCheckedChange={(checked) => {
                      const newLevels = checked
                        ? [...tempFilters.activityLevels, level]
                        : tempFilters.activityLevels.filter((l) => l !== level);
                      handleTempFilterChange("activityLevels", newLevels);
                    }}
                  />
                  <Label
                    htmlFor={`level-${level}`}
                    className="font-normal text-gray-700 hover:text-purple-600 cursor-pointer capitalize"
                  >
                    {level}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Location Filter */}
        <AccordionItem value="location">
          <AccordionTrigger className="text-base font-semibold">
            Location
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {allLocations.map((location) => (
                <div key={location} className="flex items-center space-x-3">
                  <Checkbox
                    id={`loc-${location}`}
                    checked={tempFilters.locations.includes(location)}
                    onCheckedChange={(checked) => {
                      const newLocations = checked
                        ? [...tempFilters.locations, location]
                        : tempFilters.locations.filter((l) => l !== location);
                      handleTempFilterChange("locations", newLocations);
                    }}
                  />
                  <Label
                    htmlFor={`loc-${location}`}
                    className="font-normal text-gray-700 hover:text-purple-600 cursor-pointer"
                  >
                    {location}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Privacy Filter */}
        <AccordionItem value="privacy">
          <AccordionTrigger className="text-base font-semibold">
            Privacy
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {["public", "private", "invite-only"].map((privacy) => (
                <div key={privacy} className="flex items-center space-x-3">
                  <Checkbox
                    id={`priv-${privacy}`}
                    checked={tempFilters.privacy.includes(privacy)}
                    onCheckedChange={(checked) => {
                      const newPrivacy = checked
                        ? [...tempFilters.privacy, privacy]
                        : tempFilters.privacy.filter((p) => p !== privacy);
                      handleTempFilterChange("privacy", newPrivacy);
                    }}
                  />
                  <Label
                    htmlFor={`priv-${privacy}`}
                    className="font-normal text-gray-700 hover:text-purple-600 cursor-pointer capitalize"
                  >
                    {privacy}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Special Filters */}
        <AccordionItem value="special">
          <AccordionTrigger className="text-base font-semibold">
            Special Filters
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="trending-filter"
                  className="font-normal text-gray-700"
                >
                  Trending
                </Label>
                <Switch
                  id="trending-filter"
                  checked={tempFilters.showTrendingOnly}
                  onCheckedChange={(checked) =>
                    handleTempFilterChange("showTrendingOnly", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="recommended-filter"
                  className="font-normal text-gray-700"
                >
                  Recommended
                </Label>
                <Switch
                  id="recommended-filter"
                  checked={tempFilters.showRecommendedOnly}
                  onCheckedChange={(checked) =>
                    handleTempFilterChange("showRecommendedOnly", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="verified-filter"
                  className="font-normal text-gray-700"
                >
                  Verified
                </Label>
                <Switch
                  id="verified-filter"
                  checked={tempFilters.showVerifiedOnly}
                  onCheckedChange={(checked) =>
                    handleTempFilterChange("showVerifiedOnly", checked)
                  }
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
);

export default function DiscoverPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("all");
  const [savedCommunities, setSavedCommunities] = useState<string[]>([]);
  const [tempFilters, setTempFilters] = useState<FilterState>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    location: userLocation,
    loading: locationLoading,
    error: locationError,
    getCurrentPosition,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
  });

  // Enhanced mock communities data
  const mockCommunities: Community[] = [
    {
      id: "1",
      name: "Tech Innovators NYC",
      description:
        "Building the future through technology and innovation in New York City. Join us for cutting-edge discussions, networking events, and collaborative projects.",
      category: "Hobbies",
      tags: ["Tech", "Innovation", "Startups", "AI", "Web3", "Networking"],
      memberCount: 1247,
      averageRating: 4.8,
      location: {
        lat: 40.7589,
        lng: -73.9851,
        city: "New York",
        country: "USA",
        address: "123 Tech Street, Manhattan, NY",
      },
      activityLevel: "high",
      image: "/placeholder.svg?height=200&width=300",
      upcomingEvents: 3,
      memberGrowth: "+12%",
      gradient: "gradient-primary",
      trending: true,
      createdAt: "2023-01-15",
      lastActivity: "2024-01-16",
      engagementScore: 92,
      isRecommended: true,
      recommendationScore: 0.95,
      recommendationReason: "Matches your interest in technology and AI",
      recommendationMethod: "content_based",
      isVerified: true,
      isNew: false,
      featured: true,
      language: "English",
      privacy: "public",
    },
    {
      id: "2",
      name: "SF Bay Area Entrepreneurs",
      description:
        "Connect with fellow entrepreneurs and startup founders in the San Francisco Bay Area. Share experiences, find co-founders, and build the next big thing.",
      category: "Education",
      tags: [
        "Startups",
        "Entrepreneurship",
        "Networking",
        "Funding",
        "SaaS",
        "Innovation",
      ],
      memberCount: 2341,
      averageRating: 4.6,
      location: {
        lat: 37.7749,
        lng: -122.4194,
        city: "San Francisco",
        country: "USA",
        address: "456 Startup Ave, San Francisco, CA",
      },
      activityLevel: "high",
      image:
        "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80",
      upcomingEvents: 5,
      memberGrowth: "+25%",
      gradient: "gradient-secondary",
      trending: true,
      createdAt: "2023-03-20",
      lastActivity: "2024-01-15",
      engagementScore: 88,
      isRecommended: true,
      recommendationScore: 0.87,
      recommendationReason: "Similar users also joined this community",
      recommendationMethod: "collaborative_filtering",
      isVerified: true,
      isNew: false,
      featured: true,
      language: "English",
      privacy: "public",
    },
    {
      id: "3",
      name: "Creative Writers Guild",
      description:
        "A supportive space for writers of all levels and genres to grow together. Share your work, get feedback, and improve your craft.",
      category: "Art",
      tags: [
        "Writing",
        "Literature",
        "Creative",
        "Publishing",
        "Poetry",
        "Fiction",
      ],
      memberCount: 634,
      averageRating: 4.7,
      location: {
        lat: 40.7505,
        lng: -73.9934,
        city: "New York",
        country: "USA",
        address: "789 Literary Lane, Brooklyn, NY",
      },
      activityLevel: "medium",
      image:
        "https://images.unsplash.com/photo-1517411032315-54ef2cb483c2?w=800&q=80",
      upcomingEvents: 2,
      memberGrowth: "+15%",
      gradient: "gradient-tertiary",
      trending: false,
      createdAt: "2023-06-10",
      lastActivity: "2024-01-14",
      engagementScore: 75,
      isVerified: false,
      isNew: false,
      featured: false,
      language: "English",
      privacy: "public",
    },
    {
      id: "4",
      name: "LA Fitness Community",
      description:
        "Group workouts and healthy lifestyle discussions for Los Angeles fitness enthusiasts. Transform your health journey with like-minded individuals.",
      category: "Sports",
      tags: [
        "Fitness",
        "Health",
        "Workouts",
        "Nutrition",
        "Wellness",
        "Lifestyle",
      ],
      memberCount: 1156,
      averageRating: 4.5,
      location: {
        lat: 34.0522,
        lng: -118.2437,
        city: "Los Angeles",
        country: "USA",
        address: "101 Fitness Blvd, Los Angeles, CA",
      },
      activityLevel: "high",
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
      upcomingEvents: 7,
      memberGrowth: "+20%",
      gradient: "gradient-quaternary",
      trending: true,
      createdAt: "2023-02-28",
      lastActivity: "2024-01-16",
      engagementScore: 85,
      isVerified: true,
      isNew: false,
      featured: false,
      language: "English",
      privacy: "public",
    },
    {
      id: "5",
      name: "Chicago Food Enthusiasts",
      description:
        "Culinary experiences and food culture exploration in the Windy City. Discover hidden gems, share recipes, and enjoy group dining experiences.",
      category: "Hobbies",
      tags: ["Food", "Culinary", "Restaurants", "Cooking", "Local", "Culture"],
      memberCount: 789,
      averageRating: 4.4,
      location: {
        lat: 41.8781,
        lng: -87.6298,
        city: "Chicago",
        country: "USA",
        address: "654 Culinary Court, Chicago, IL",
      },
      activityLevel: "medium",
      image: "/placeholder.svg?height=200&width=300",
      upcomingEvents: 4,
      memberGrowth: "+5%",
      gradient: "gradient-primary",
      trending: false,
      createdAt: "2023-04-12",
      lastActivity: "2024-01-13",
      engagementScore: 70,
      isVerified: false,
      isNew: false,
      featured: false,
      language: "English",
      privacy: "public",
    },
    {
      id: "6",
      name: "Global Digital Nomads",
      description:
        "Remote workers and digital nomads connecting from around the world. Share travel tips, find co-working spaces, and build a location-independent lifestyle.",
      category: "Hobbies",
      tags: [
        "Remote",
        "Travel",
        "Digital Nomad",
        "Freelance",
        "Location Independent",
        "Community",
      ],
      memberCount: 3421,
      averageRating: 4.9,
      location: {
        lat: 40.7282,
        lng: -74.0776,
        city: "Global",
        country: "Worldwide",
        address: "Online Community",
      },
      activityLevel: "high",
      image: "/placeholder.svg?height=200&width=300",
      upcomingEvents: 8,
      memberGrowth: "+35%",
      gradient: "gradient-secondary",
      trending: true,
      createdAt: "2022-11-05",
      lastActivity: "2024-01-16",
      engagementScore: 95,
      isRecommended: true,
      recommendationScore: 0.82,
      recommendationReason: "Popular among users with similar interests",
      recommendationMethod: "popularity_based",
      isVerified: true,
      isNew: false,
      featured: true,
      language: "English",
      privacy: "public",
    },
    {
      id: "7",
      name: "Austin Music Makers",
      description:
        "Musicians, producers, and music lovers in Austin. Collaborate on projects, share your music, and discover the local music scene.",
      category: "Music",
      tags: [
        "Music",
        "Musicians",
        "Production",
        "Collaboration",
        "Local Scene",
        "Austin",
      ],
      memberCount: 892,
      averageRating: 4.6,
      location: {
        lat: 30.2672,
        lng: -97.7431,
        city: "Austin",
        country: "USA",
        address: "456 Music Row, Austin, TX",
      },
      activityLevel: "medium",
      image: "/placeholder.svg?height=200&width=300",
      upcomingEvents: 3,
      memberGrowth: "+18%",
      gradient: "gradient-tertiary",
      trending: false,
      createdAt: "2023-05-20",
      lastActivity: "2024-01-15",
      engagementScore: 78,
      isVerified: false,
      isNew: true,
      featured: false,
      language: "English",
      privacy: "public",
    },
  ];

  const categories = [
    { value: "all", label: "All Categories", icon: "🎯", color: "bg-gray-100" },
    {
      value: "environmental",
      label: "Environmental",
      icon: "🌱",
      color: "bg-green-100",
    },
    { value: "music", label: "Music", icon: "🎵", color: "bg-pink-100" },
    { value: "sports", label: "Sports", icon: "⚽", color: "bg-blue-100" },
    { value: "hobbies", label: "Hobbies", icon: "🎨", color: "bg-purple-100" },
    {
      value: "education",
      label: "Education",
      icon: "📚",
      color: "bg-yellow-100",
    },
    { value: "art", label: "Art", icon: "🎭", color: "bg-red-100" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCommunities(mockCommunities);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedCommunities = useMemo(() => {
    let result = communities;

    // Always use the confirmed filters state, not tempFilters
    const activeFilters = filters;

    // Apply active tab filtering
    switch (activeTab) {
      case "recommended":
        result = result.filter((c) => c.isRecommended);
        break;
      case "trending":
        result = result.filter((c) => c.trending);
        break;
      case "saved":
        result = result.filter((c) => savedCommunities.includes(c.id));
        break;
    }

    // Apply search query
    if (searchQuery) {
      result = result.filter(
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

    // Apply filters from sidebar
    if (activeFilters.categories.length > 0) {
      result = result.filter((community) =>
        activeFilters.categories.includes(community.category)
      );
    }
    if (activeFilters.activityLevels.length > 0) {
      result = result.filter((community) =>
        activeFilters.activityLevels.includes(community.activityLevel)
      );
    }
    if (activeFilters.locations.length > 0) {
      result = result.filter((community) =>
        activeFilters.locations.includes(community.location.city)
      );
    }
    if (activeFilters.privacy.length > 0) {
      result = result.filter((community) =>
        activeFilters.privacy.includes(community.privacy)
      );
    }
    result = result.filter(
      (community) =>
        community.memberCount >= activeFilters.memberRange[0] &&
        community.memberCount <= activeFilters.memberRange[1]
    );
    result = result.filter(
      (community) =>
        community.averageRating >= activeFilters.ratingRange[0] &&
        community.averageRating <= activeFilters.ratingRange[1]
    );
    if (activeFilters.showTrendingOnly) {
      result = result.filter((community) => community.trending);
    }
    if (activeFilters.showRecommendedOnly) {
      result = result.filter((community) => community.isRecommended);
    }
    if (activeFilters.showVerifiedOnly) {
      result = result.filter((community) => community.isVerified);
    }
    if (userLocation && activeFilters.maxDistance < 50) {
      result = result.filter((community) => {
        if (community.location.city === "Global") return true;
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          community.location.lat,
          community.location.lng
        );
        return distance <= activeFilters.maxDistance;
      });
    }

    // Apply sorting
    return result.sort((a, b) => {
      switch (sortBy) {
        case "trending":
          return (
            (b.trending ? 1 : 0) - (a.trending ? 1 : 0) ||
            b.engagementScore - a.engagementScore
          );
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "popular":
          return b.memberCount - a.memberCount;
        case "rating":
          return b.averageRating - a.averageRating;
        case "relevance":
        default:
          return (b.recommendationScore || 0) - (a.recommendationScore || 0);
      }
    });
  }, [
    communities,
    searchQuery,
    filters,
    sortBy,
    userLocation,
    activeTab,
    savedCommunities,
  ]);

  const allCategories = useMemo(
    () => [...new Set(mockCommunities.map((c) => c.category))],
    [mockCommunities]
  );
  const allLocations = useMemo(
    () => [...new Set(mockCommunities.map((c) => c.location.city))],
    [mockCommunities]
  );
  const allActivityLevels = useMemo(
    () => [...new Set(mockCommunities.map((c) => c.activityLevel))],
    [mockCommunities]
  );

  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearch = (query: string, searchFilters?: any) => {
    setSearchQuery(query);
    // Don't immediately apply search filters - they should be handled separately
    // or only applied when user confirms through the filter panel
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleTempFilterChange = useCallback(
    (key: keyof FilterState, value: any) => {
      setTempFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const applyFilters = useCallback(() => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
  }, [tempFilters]);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
    setSearchQuery("");
  }, []);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.activityLevels.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.privacy.length > 0) count++;
    if (filters.memberRange[0] > 0 || filters.memberRange[1] < 10000) count++;
    if (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 5) count++;
    if (filters.showTrendingOnly) count++;
    if (filters.showRecommendedOnly) count++;
    if (filters.showVerifiedOnly) count++;
    if (filters.maxDistance < 50) count++;
    return count;
  };

  const toggleSaveCommunity = (communityId: string) => {
    setSavedCommunities((prev) =>
      prev.includes(communityId)
        ? prev.filter((id) => id !== communityId)
        : [...prev, communityId]
    );
  };

  const recommendations = filteredAndSortedCommunities.filter(
    (c) => c.isRecommended
  );

  const EnhancedCommunityCard = ({
    community,
    isListView = false,
  }: {
    community: Community;
    isListView?: boolean;
  }) => {
    const isSaved = savedCommunities.includes(community.id);

    return (
      <Card className="bg-white rounded-2xl overflow-hidden group w-full h-full flex flex-col shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
        <div className="relative overflow-hidden">
          <Image
            src={community.image}
            alt={community.name}
            width={400}
            height={200}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute top-4 left-4">
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none shadow-md">
              {community.category}
            </Badge>
          </div>
          <div className="absolute top-4 right-4">
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
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span>{community.averageRating}</span>
            </div>
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
              <div className="flex items-center gap-2" title="Location">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{community.location.city}</span>
              </div>
              <div className="flex items-center gap-2" title="Rating">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span>
                  {community.averageRating} ({community.activityLevel})
                </span>
              </div>
              <div className="flex items-center gap-2" title="Upcoming Events">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{community.upcomingEvents} upcoming events</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {community.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
              {community.tags.length > 3 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{community.tags.length - 3} more
                </Badge>
              )}
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
  };

  const CommunityListItem = ({ community }: { community: Community }) => {
    const isSaved = savedCommunities.includes(community.id);
    return (
      <Card className="w-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg border bg-white/60 backdrop-blur-sm border-gray-200/80 rounded-2xl">
        <div className="flex">
          <div className="relative w-48 h-full flex-shrink-0">
            <Image
              src={community.image}
              alt={community.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col flex-grow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none shadow-md mb-2">
                  {community.category}
                </Badge>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-xl text-gray-800 leading-tight">
                    {community.name}
                  </h3>
                  {community.isVerified && (
                    <Award className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {community.description}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="icon"
                  variant="ghost"
                  className={`rounded-full backdrop-blur-sm bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-red-500 transition-colors h-9 w-9 ${
                    isSaved ? "text-red-500" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSaveCommunity(community.id);
                  }}
                >
                  <Heart
                    className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`}
                  />
                </Button>
                <Link href={`/community/${community.id}`}>
                  <Button variant="outline">
                    View <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-200/80">
              <div className="flex justify-between items-end">
                <div className="flex flex-wrap gap-2">
                  {community.tags.slice(0, 4).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {community.tags.length > 4 && (
                    <Badge variant="outline" className="text-xs font-normal">
                      +{community.tags.length - 4} more
                    </Badge>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{community.memberCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{community.averageRating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const MainContent = () => (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-2">
          Discover Communities
        </h1>
        <p className="text-xl text-gray-600">
          Find your tribe from {communities.length} vibrant communities.
        </p>
      </div>

      {/* Search and View Options */}
      <div className="flex justify-between items-center mb-8 sticky top-24 bg-white/50 backdrop-blur-lg p-4 rounded-xl shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  setTempFilters(filters);
                  setIsFilterOpen(true);
                }}
              >
                <SlidersHorizontal className="h-5 w-5" />
                <span>Filters ({getActiveFiltersCount()})</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[380px] sm:w-[420px] bg-white dark:bg-gray-950 p-0"
            >
              <SheetHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                  <Filter className="h-6 w-6" />
                  <span>Filter Communities</span>
                </SheetTitle>
              </SheetHeader>
              <div className="p-6 h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin">
                <FilterSidebar
                  tempFilters={tempFilters}
                  handleTempFilterChange={handleTempFilterChange}
                  allCategories={allCategories}
                  allActivityLevels={allActivityLevels}
                  allLocations={allLocations}
                />
              </div>
              <SheetFooter className="p-6 pt-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full mr-2"
                >
                  Clear Filters
                </Button>
                <SheetClose asChild>
                  <Button className="w-full" onClick={applyFilters}>
                    Done
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-lg">
            <SmartSearchBar onSearch={handleSearch} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("map")}
            >
              <Map className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Display */}
      {viewMode === "grid" && (
        <StaggerContainer
          delay={50}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredAndSortedCommunities.map((community) => (
            <SmoothReveal key={community.id}>
              <EnhancedCommunityCard community={community} />
            </SmoothReveal>
          ))}
        </StaggerContainer>
      )}

      {viewMode === "list" && (
        <StaggerContainer delay={50} className="space-y-4">
          {filteredAndSortedCommunities.map((community) => (
            <SmoothReveal key={community.id}>
              <CommunityListItem community={community} />
            </SmoothReveal>
          ))}
        </StaggerContainer>
      )}

      {viewMode === "map" && (
        <div className="h-[70vh] rounded-lg overflow-hidden shadow-lg">
          <LeafletCommunitiesMap communities={filteredAndSortedCommunities} />
        </div>
      )}

      {filteredAndSortedCommunities.length === 0 && (
        <div className="text-center py-20">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold">No communities found</h3>
          <p className="mt-1 text-gray-500">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </main>
  );

  if (isLoading) {
    return (
      <PageTransition>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-gray-200"></Card>
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen relative">
        <FloatingElements />
        <div className="container mx-auto relative z-10">
          <MainContent />
        </div>
        <EnhancedChatbotWidget />
      </div>
    </PageTransition>
  );
}
