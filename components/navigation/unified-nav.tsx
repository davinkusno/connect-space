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
  MessageSquare,
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
    href: "/discover",
    label: "Discover",
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
    href: "/communities",
    label: "Communities",
    icon: Users,
    hoverClasses: "hover:bg-orange-50 hover:text-orange-600",
  },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageSquare,
    hoverClasses: "hover:bg-indigo-50 hover:text-indigo-600",
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

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "message",
      title: "New Reply",
      content:
        "Sarah Chen replied to your post in Tech Innovators about React best practices",
      timestamp: "2 minutes ago",
      isRead: false,
      community: "Tech Innovators",
      actionUrl: "/community/1",
    },
    {
      id: "2",
      type: "event",
      title: "Event Reminder",
      content:
        "AI & Machine Learning Workshop starts in 1 hour. Don't forget to bring your laptop!",
      timestamp: "1 hour ago",
      isRead: false,
      community: "Tech Innovators",
      actionUrl: "/events/1",
    },
    {
      id: "3",
      type: "achievement",
      title: "Badge Unlocked",
      content:
        "You've earned the 'Community Contributor' badge for your active participation!",
      timestamp: "3 hours ago",
      isRead: true,
      actionUrl: "/achievements",
    },
    {
      id: "4",
      type: "community",
      title: "New Members",
      content:
        "3 new members joined Outdoor Adventures. Welcome them to the community!",
      timestamp: "5 hours ago",
      isRead: true,
      community: "Outdoor Adventures",
      actionUrl: "/community/2",
    },
    {
      id: "5",
      type: "system",
      title: "System Update",
      content:
        "New features have been added to the platform including enhanced search and better notifications",
      timestamp: "1 day ago",
      isRead: true,
      actionUrl: "/updates",
    },
    {
      id: "6",
      type: "message",
      title: "Mention",
      content:
        "You were mentioned in a discussion about React best practices by Alex Johnson",
      timestamp: "2 days ago",
      isRead: false,
      community: "Tech Innovators",
      actionUrl: "/community/1/discussion/123",
    },
    {
      id: "7",
      type: "event",
      title: "Event Created",
      content:
        "New event: Poetry Reading Night has been scheduled for next Friday evening",
      timestamp: "3 days ago",
      isRead: true,
      community: "Creative Writers",
      actionUrl: "/events/3",
    },
    {
      id: "8",
      type: "achievement",
      title: "Milestone Reached",
      content:
        "Congratulations! You've attended 10 community events this month",
      timestamp: "4 days ago",
      isRead: false,
      actionUrl: "/achievements",
    },
    {
      id: "9",
      type: "message",
      title: "Direct Message",
      content:
        "Maria Garcia sent you a direct message about the upcoming hiking trip",
      timestamp: "5 days ago",
      isRead: true,
      community: "Outdoor Adventures",
      actionUrl: "/messages/maria",
    },
    {
      id: "10",
      type: "community",
      title: "Community Update",
      content:
        "Tech Innovators community has reached 1,500 members! Thank you for being part of our growth",
      timestamp: "1 week ago",
      isRead: true,
      community: "Tech Innovators",
      actionUrl: "/community/1",
    },
    {
      id: "11",
      type: "event",
      title: "Event Cancelled",
      content:
        "Unfortunately, the Weekend Coding Bootcamp has been cancelled due to low enrollment",
      timestamp: "1 week ago",
      isRead: false,
      community: "Tech Innovators",
      actionUrl: "/events/cancelled",
    },
    {
      id: "12",
      type: "system",
      title: "Maintenance Notice",
      content:
        "Scheduled maintenance will occur this Sunday from 2-4 AM EST. Some features may be unavailable",
      timestamp: "2 weeks ago",
      isRead: true,
      actionUrl: "/maintenance",
    },
    {
      id: "13",
      type: "achievement",
      title: "First Post",
      content:
        "Welcome to the community! You've made your first post in Creative Writers",
      timestamp: "2 weeks ago",
      isRead: true,
      community: "Creative Writers",
      actionUrl: "/achievements",
    },
    {
      id: "14",
      type: "message",
      title: "Welcome Message",
      content:
        "Welcome to ConnectSpace! We're excited to have you join our growing community",
      timestamp: "3 weeks ago",
      isRead: true,
      actionUrl: "/welcome",
    },
    {
      id: "15",
      type: "community",
      title: "New Community",
      content:
        "You've successfully joined the Creative Writers community. Start exploring and connecting!",
      timestamp: "3 weeks ago",
      isRead: true,
      community: "Creative Writers",
      actionUrl: "/community/3",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const visibleLinks = user
    ? navigationLinks
    : navigationLinks.filter((link) => link.href !== "/messages");

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAsUnread = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: false }
          : notification
      )
    );
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  const handleDeleteAllRead = () => {
    setNotifications((prev) =>
      prev.filter((notification) => !notification.isRead)
    );
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
