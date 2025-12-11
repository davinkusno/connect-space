"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
    AlertTriangle, LogOut, Shield
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserType {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
}

export function SuperAdminNav() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });

      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/superadmin"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="relative h-8 w-8">
                <Image
                  src="/logo.png"
                  alt="ConnectSpace"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ConnectSpace
                </span>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Super Admin
                </Badge>
              </div>
            </Link>

            {/* Right Section - Navigation & User Menu */}
            <div className="flex items-center gap-4">
              {/* User Dropdown */}
              {!isLoading && user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-red-200 hover:scale-105 transition-all duration-200 group"
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-red-100 group-hover:ring-red-300 transition-all duration-200">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url}
                          alt={getUserDisplayName()}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Hover indicator */}
                      <div className="absolute inset-0 rounded-full bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-72 bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-xl rounded-xl p-2 animate-in slide-in-from-top-2 duration-200"
                    sideOffset={8}
                  >
                    {/* User Header */}
                    <DropdownMenuLabel className="font-normal p-3 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-100/50">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 ring-2 ring-red-200">
                          <AvatarImage
                            src={user.user_metadata?.avatar_url}
                            alt={getUserDisplayName()}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold">
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
                            <Shield className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">
                              Super Admin
                            </span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="my-2" />

                    {/* Sign Out */}
                    <DropdownMenuItem
                      onClick={() => setShowLogoutDialog(true)}
                      className="cursor-pointer p-3 rounded-lg text-red-600 focus:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                          <LogOut className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <span className="font-medium">Sign Out</span>
                          <p className="text-xs text-red-500">End your session</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle>Confirm Logout</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to log out? You will need to sign in again
              to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
