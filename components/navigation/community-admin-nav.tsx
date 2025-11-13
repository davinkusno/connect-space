"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Calendar,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowser, getClientSession } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CommunityAdminNavProps {
  communityProfilePicture?: string;
  communityName?: string;
  currentCommunityId?: string;
  onCommunityChange?: (communityId: string) => void;
}

interface Community {
  id: string;
  name: string;
  logo_url?: string;
}

export function CommunityAdminNav({
  communityProfilePicture = "/placeholder-user.jpg",
  communityName = "Community",
  currentCommunityId,
  onCommunityChange,
}: CommunityAdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(
    currentCommunityId || null
  );

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (
      pathname?.startsWith("/community-admin/events") ||
      pathname === "/community-admin/create"
    ) {
      return "events";
    }
    if (pathname?.startsWith("/community-admin/notifications")) {
      return "notification";
    }
    return "community-profile";
  };

  const activeTab = getActiveTab();

  // Load user's admin communities
  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const session = await getClientSession();
        if (!session?.user) return;

        const supabase = getSupabaseBrowser();
        
        // Get communities where user is creator
        const { data: createdCommunities } = await supabase
          .from("communities")
          .select("id, name, logo_url")
          .eq("creator_id", session.user.id)
          .order("created_at", { ascending: false });

        // Get communities where user is admin
        const { data: adminMemberships } = await supabase
          .from("community_members")
          .select(`
            community_id,
            communities (
              id,
              name,
              logo_url
            )
          `)
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .order("joined_at", { ascending: false });

        const allCommunities: Community[] = [];

        // Add created communities
        if (createdCommunities) {
          allCommunities.push(...createdCommunities);
        }

        // Add admin communities (avoid duplicates)
        if (adminMemberships) {
          adminMemberships.forEach((membership: any) => {
            if (membership.communities && !allCommunities.find(c => c.id === membership.communities.id)) {
              allCommunities.push(membership.communities);
            }
          });
        }

        setCommunities(allCommunities);

        // Set default selected community if not already set
        if (!selectedCommunityId && allCommunities.length > 0) {
          const defaultId = currentCommunityId || allCommunities[0].id;
          setSelectedCommunityId(defaultId);
          if (onCommunityChange) {
            onCommunityChange(defaultId);
          }
        }
      } catch (error) {
        console.error("Error loading communities:", error);
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    loadCommunities();
  }, [currentCommunityId, onCommunityChange, selectedCommunityId]);

  const handleCommunitySelect = (communityId: string) => {
    setSelectedCommunityId(communityId);
    if (onCommunityChange) {
      onCommunityChange(communityId);
    }
    // Update URL with community ID if on community admin pages
    if (pathname?.startsWith("/community-admin")) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("community", communityId);
      router.push(newUrl.pathname + newUrl.search);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        toast.error("Failed to log out. Please try again.");
        return;
      }

      toast.success("Logged out successfully");
      // Redirect to homepage like a user who hasn't signed in
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred while logging out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    {
      id: "community-profile",
      label: "Community Profile",
      icon: Users,
      href: "/community-admin",
    },
    {
      id: "events",
      label: "Events",
      icon: Calendar,
      href: "/community-admin/events",
    },
    {
      id: "notification",
      label: "Notification",
      icon: Bell,
      href: "/community-admin/notifications",
    },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo ConnectSpace */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-1 group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="ConnectSpace Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 w-8 h-8 bg-purple-600/20 rounded-full blur-lg group-hover:bg-purple-700/30 transition-all duration-200"></div>
              </div>
              <span className="text-xl font-bold text-gradient group-hover:scale-105 transition-transform duration-200">
                ConnectSpace
              </span>
            </Link>
          </div>

          {/* Navigation Items - Center */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const href = selectedCommunityId 
                ? `${item.href}${item.href.includes('?') ? '&' : '?'}community=${selectedCommunityId}`
                : item.href;

              return (
                <Link key={item.id} href={href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex items-center space-x-2 transition-all duration-200",
                      isActive
                        ? "text-purple-600 font-bold"
                        : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                    )}
                    onClick={() => {}}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Community Selector & Profile Dropdown */}
          <div className="flex items-center space-x-4">
            {/* Community Selector - Only show if user has multiple communities */}
            {communities.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {communities.find(c => c.id === selectedCommunityId)?.name || "Select Community"}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {communities.map((community) => (
                    <DropdownMenuItem
                      key={community.id}
                      onClick={() => handleCommunitySelect(community.id)}
                      className={cn(
                        "cursor-pointer",
                        selectedCommunityId === community.id && "bg-purple-50"
                      )}
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={community.logo_url || "/placeholder-user.jpg"} />
                          <AvatarFallback className="text-xs">
                            {community.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1">{community.name}</span>
                        {selectedCommunityId === community.id && (
                          <span className="text-purple-600">✓</span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/create-community" className="flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Create New Community</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Community Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 p-2 hover:bg-purple-50"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={communityProfilePicture}
                      alt={communityName}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      {communityName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={communityProfilePicture}
                      alt={communityName}
                    />
                    <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      {communityName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {communityName}
                    </span>
                    <span className="text-xs text-gray-500">
                      Community Admin
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href="/settings"
                    className="flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center space-x-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
