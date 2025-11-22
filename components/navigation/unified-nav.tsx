"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Menu,
  Bell,
  Settings,
  User,
  LogOut,
  UserCircle,
  Home,
  Search,
  Calendar,
  Users,
  Trophy,
  ShoppingBag,
  HelpCircle,
  Zap,
  X,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  NotificationModal,
  type Notification,
} from "@/components/notifications/notification-modal";

interface UserType {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
}

const navigationLinks = [
  // { href: "/", label: "Home", icon: Home },
  {
    href: "/communities",
    label: "Communities",
    icon: Search,
    hoverClasses: "hover:bg-blue-50 hover:text-blue-600",
  },
  {
    href: "/events",
    label: "Events",
    icon: Calendar,
    hoverClasses: "hover:bg-green-50 hover:text-green-600",
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    hoverClasses: "hover:bg-yellow-50 hover:text-yellow-600",
  },
  {
    href: "/store",
    label: "Store",
    icon: ShoppingBag,
    hoverClasses: "hover:bg-pink-50 hover:text-pink-600",
  },
  {
    href: "/help-center",
    label: "Help Center",
    icon: HelpCircle,
    hoverClasses: "hover:bg-cyan-50 hover:text-cyan-600",
  },
];

export function UnifiedNav() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Fetch notifications from database
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setNotifications([]);
        return;
      }

      try {
        setIsLoadingNotifications(true);
        const supabase = getSupabaseBrowser();
        
        // Fetch notifications from database
        const { data: notificationsData, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching notifications:", error);
          return;
        }

        // Transform database notifications to UI format
        const transformedNotifications: Notification[] = (notificationsData || []).map((notif: any) => {
          // Map database types to UI types
          let uiType: "message" | "event" | "achievement" | "system" | "community" = "system";
          let title = "";
          let actionUrl = "";

          switch (notif.type) {
            case "new_message":
              uiType = "message";
              title = "New Message";
              if (notif.reference_type === "community" && notif.reference_id) {
                actionUrl = `/community/${notif.reference_id}`;
              }
              break;
            case "event_reminder":
              uiType = "event";
              title = "Event Reminder";
              if (notif.reference_type === "event" && notif.reference_id) {
                actionUrl = `/events/${notif.reference_id}`;
              }
              break;
            case "community_invite":
              uiType = "community";
              title = "Community Invitation";
              if (notif.reference_type === "community" && notif.reference_id) {
                actionUrl = `/community/${notif.reference_id}`;
              }
              break;
            case "community_update":
              uiType = "community";
              title = "Community Update";
              if (notif.reference_type === "community" && notif.reference_id) {
                actionUrl = `/community/${notif.reference_id}`;
              }
              break;
            default:
              uiType = "system";
              title = "Notification";
          }

          // Format timestamp
          const timestamp = formatNotificationTime(notif.created_at);

          return {
            id: notif.id,
            type: uiType,
            title: title,
            content: notif.content,
            timestamp: timestamp,
            isRead: notif.is_read || false,
            actionUrl: actionUrl,
          };
        });

        setNotifications(transformedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription for new notifications
    if (user) {
      const supabase = getSupabaseBrowser();
      const channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Reload notifications when new one is added
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Format notification timestamp
  const formatNotificationTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const visibleLinks = navigationLinks;

  const handleMarkAsRead = async (id: string) => {
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: false })
        .eq("id", id);

      if (error) {
        console.error("Error marking notification as unread:", error);
        return;
      }

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: false }
          : notification
      )
    );
    } catch (error) {
      console.error("Error marking notification as unread:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting notification:", error);
        return;
      }

    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all as read:", error);
        return;
      }

    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!user) return;
    
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("is_read", true);

      if (error) {
        console.error("Error deleting all read notifications:", error);
        return;
      }

    setNotifications((prev) =>
      prev.filter((notification) => !notification.isRead)
    );
    } catch (error) {
      console.error("Error deleting all read notifications:", error);
    }
  };

  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  // Check if current page is superadmin (exclude from unified nav)
  const isSuperadminPage = pathname?.startsWith("/superadmin");

  const handleSignOut = async () => {
    setIsSignOutModalOpen(true);
  };

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    setIsSignOutModalOpen(false);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      router.push("/");

      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Error getting session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      setUser(session?.user || null);
      setIsLoading(false);

      if (event === "SIGNED_OUT") {
        // Clear any cached data
        setUser(null);
        // Redirect to home page, unless on reset password page
        if (pathname !== "/auth/reset-password") {
          router.push("/");
        }
      }

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router, pathname]);

  const handleProfileNavigation = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to view your profile.",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }
    router.push("/profile");
  };

  const handleNavigation = (href: string) => {
    setIsMobileMenuOpen(false);
    router.push(href);
  };

  // Don't render on superadmin pages
  if (isSuperadminPage) {
    return null;
  }

  const getUserDisplayName = () => {
    if (!user) return "User";
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User"
    );
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const isActivePage = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  if (isLoading) {
    return (
      <nav className="glass-effect sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="ml-2 w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="glass-effect sticky top-0 z-50 transition-all duration-300 border-b border-gray-200/20"
      data-testid="unified-nav"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
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

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const isActive = isActivePage(link.href);
              const activeClasses = link.hoverClasses.replace(/hover:/g, "");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    isActive
                      ? `${activeClasses} font-semibold`
                      : "text-gray-600 dark:text-gray-300"
                  } ${link.hoverClasses}`}
                >
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive
                        ? ""
                        : "text-gray-400 dark:text-gray-400 group-hover:text-inherit"
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setNotificationModalOpen(true)}
              >
                <div className="relative">
                  <Bell className="h-7 w-7" />
                  {unreadCount > 0 && (
                    <span className="absolute right-0 top-0 flex h-4 w-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Button>
            )}

            {/* User Authentication */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-purple-200 hover:scale-105 transition-all duration-200 group"
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-purple-100 group-hover:ring-purple-300 transition-all duration-200">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url || ""}
                        alt={getUserDisplayName()}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Hover indicator */}
                    <div className="absolute inset-0 rounded-full bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-72 bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-xl rounded-xl p-2 animate-in slide-in-from-top-2 duration-200"
                  sideOffset={8}
                >
                  {/* User Header */}
                  <DropdownMenuLabel className="font-normal p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/50">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12 ring-2 ring-purple-200">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url || ""}
                          alt={getUserDisplayName()}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600 font-medium">
                            Online
                          </span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="my-2" />

                  {/* Navigation Items */}
                  <div className="space-y-1">
                    <DropdownMenuItem
                      onClick={handleProfileNavigation}
                      className="cursor-pointer p-3 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-700 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                          <UserCircle className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <span className="font-medium">View Profile</span>
                          <p className="text-xs text-gray-500">
                            Manage your account
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard")}
                      className="cursor-pointer p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                          <Home className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium">Dashboard</span>
                          <p className="text-xs text-gray-500">
                            Your activity overview
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => router.push("/settings")}
                      className="cursor-pointer p-3 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-700 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-200">
                          <Settings className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <span className="font-medium">Settings</span>
                          <p className="text-xs text-gray-500">
                            Preferences & privacy
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="my-2" />

                  {/* Sign Out */}
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="cursor-pointer p-3 rounded-lg text-red-600 focus:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                        <LogOut className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <span className="font-medium">
                          {isSigningOut ? "Signing out..." : "Sign Out"}
                        </span>
                        <p className="text-xs text-red-500">End your session</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <AnimatedButton variant="glass" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </AnimatedButton>
                </Link>
                <Link href="/auth/signup">
                  <AnimatedButton variant="gradient" size="sm">
                    <Zap className="w-4 h-4 mr-2" />
                    Get Started
                  </AnimatedButton>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-white">
                  <div className="flex flex-col h-full">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div className="flex items-center space-x-1">
                        <Image
                          src="/logo.png"
                          alt="ConnectSpace Logo"
                          width={24}
                          height={24}
                          className="w-6 h-6"
                        />
                        <span className="text-lg font-bold text-gradient">
                          ConnectSpace
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* User Info (Mobile) */}
                    {user && (
                      <div className="py-4 border-b">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={user.user_metadata?.avatar_url || ""}
                              alt={getUserDisplayName()}
                            />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {getUserDisplayName()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mobile Navigation Links */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {visibleLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = isActivePage(link.href);
                        const activeClasses = link.hoverClasses.replace(
                          /hover:/g,
                          ""
                        );

                        return (
                          <Link
                            key={`mobile-${link.href}`}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                              isActive
                                ? `${activeClasses} font-semibold`
                                : "text-gray-600 dark:text-gray-300"
                            } ${link.hoverClasses}`}
                          >
                            <Icon
                              className={`h-5 w-5 transition-colors ${
                                isActive
                                  ? ""
                                  : "text-gray-400 dark:text-gray-400 group-hover:text-inherit"
                              }`}
                            />
                            <span>{link.label}</span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Mobile User Actions */}
                    {user ? (
                      <div className="border-t pt-4 space-y-1">
                        <button
                          onClick={() => handleNavigation("/profile")}
                          className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-colors duration-200"
                        >
                          <UserCircle className="w-5 h-5" />
                          <span className="font-medium">View Profile</span>
                        </button>
                        <button
                          onClick={() => handleNavigation("/settings")}
                          className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-colors duration-200"
                        >
                          <Settings className="w-5 h-5" />
                          <span className="font-medium">Settings</span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          disabled={isSigningOut}
                          className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors duration-200"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-medium">
                            {isSigningOut ? "Signing out..." : "Sign Out"}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="border-t pt-4 space-y-2">
                        <button
                          onClick={() => handleNavigation("/auth/login")}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                        >
                          <User className="w-4 h-4" />
                          <span className="font-medium">Sign In</span>
                        </button>
                        <button
                          onClick={() => handleNavigation("/auth/signup")}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                        >
                          <Zap className="w-4 h-4" />
                          <span className="font-medium">Get Started</span>
                        </button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAsUnread={handleMarkAsUnread}
        onDelete={handleDelete}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteAllRead={handleDeleteAllRead}
      />

      {/* Sign Out Confirmation Modal */}
      <Dialog open={isSignOutModalOpen} onOpenChange={setIsSignOutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Sign Out
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Are you sure you want to sign out of your account?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url || ""}
                    alt={getUserDisplayName()}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setIsSignOutModalOpen(false)}
              className="w-full sm:w-auto"
              disabled={isSigningOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSignOut}
              disabled={isSigningOut}
              className="w-full sm:w-auto"
            >
              {isSigningOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
