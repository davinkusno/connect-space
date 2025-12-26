"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { LogOut, User, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UserType {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
}

export function MinimalNav() {
  const [user, setUser] = useState<UserType | null>(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        // Fetch custom avatar from users table if available
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("avatar_url")
            .eq("id", user.id)
            .single();

          if (userData?.avatar_url) {
            setCustomAvatarUrl(userData.avatar_url);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [supabase]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      router.push("/auth/login");
      router.refresh();
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

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

  const getAvatarUrl = () => {
    return customAvatarUrl || user?.user_metadata?.avatar_url || "";
  };

  if (isLoading) {
    return (
      <nav className="glass-effect sticky top-0 z-50 transition-all duration-300 border-b border-gray-200/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-16">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <nav
      className="glass-effect sticky top-0 z-50 transition-all duration-300 border-b border-gray-200/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-16">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-purple-200 hover:scale-105 transition-all duration-200 group"
              >
                <Avatar className="h-10 w-10 ring-2 ring-purple-100 group-hover:ring-purple-300 transition-all duration-200">
                  <AvatarImage
                    src={getAvatarUrl()}
                    alt={getUserDisplayName()}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-xl rounded-xl p-2 animate-in slide-in-from-top-2 duration-200"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/50">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12 ring-2 ring-purple-200">
                    <AvatarImage
                      src={getAvatarUrl()}
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
                      </div>
                    </div>
                  </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-2" />

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
              </div>

              <DropdownMenuSeparator className="my-2" />

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
                    <p className="text-xs text-gray-500">
                      Sign out of your account
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

