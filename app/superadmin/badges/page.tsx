"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";
import { FloatingElements } from "@/components/ui/floating-elements";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Spinner } from "@/components/ui/loading-indicators";
import { BadgeForm } from "@/components/superadmin/badge-form";
import { BadgeList } from "@/components/superadmin/badge-list";
import { SuperAdminNav } from "@/components/navigation/superadmin-nav";
import {
  ShieldAlert,
  ArrowLeft,
  Search,
  Plus,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  Info,
} from "lucide-react";
import Link from "next/link";

// Mock badge data types
export interface StoreBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BadgeManagementPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<StoreBadge | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Badges state
  const [badges, setBadges] = useState<StoreBadge[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch badges on mount
  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setIsPageLoading(true);
      setError(null);
      const response = await fetch("/api/badges");
      if (!response.ok) throw new Error("Failed to fetch badges");
      const data = await response.json();
      setBadges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load badges");
      console.error("Error fetching badges:", err);
    } finally {
      setIsPageLoading(false);
    }
  };

  // Filter badges based on search query
  const filteredBadges = badges.filter((badge) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Sort badges
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "price-high":
        return b.price - a.price;
      case "price-low":
        return a.price - b.price;
      default:
        return 0;
    }
  });

  // CRUD operations
  const handleCreateBadge = async (
    badge: Omit<StoreBadge, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badge),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create badge");
      }

      const newBadge = await response.json();
      setBadges([...badges, newBadge]);
      setIsCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create badge");
      console.error("Error creating badge:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBadge = async (badge: Omit<StoreBadge, "id" | "createdAt" | "updatedAt">) => {
    if (!selectedBadge) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/badges/${selectedBadge.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badge),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update badge");
      }

      const updatedBadge = await response.json();
      const updatedBadges = badges.map((b) =>
        b.id === selectedBadge.id ? updatedBadge : b
      );
      setBadges(updatedBadges);
      setIsEditDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update badge");
      console.error("Error updating badge:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBadge = async () => {
    if (!selectedBadge) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/badges/${selectedBadge.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete badge");
      }

      const updatedBadges = badges.filter((b) => b.id !== selectedBadge.id);
      setBadges(updatedBadges);
      setIsDeleteDialogOpen(false);
      setSelectedBadge(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete badge");
      console.error("Error deleting badge:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewBadge = (badge: StoreBadge) => {
    setSelectedBadge(badge);
    setIsViewDialogOpen(true);
  };

  const handleEditBadge = (badge: StoreBadge) => {
    setSelectedBadge(badge);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirmation = (badge: StoreBadge) => {
    setSelectedBadge(badge);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />

      {/* Navigation */}
      <SuperAdminNav />

      <PageTransition>
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/superadmin">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-violet-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin Dashboard
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Store Badge Management
                </h1>
              </div>
              <AnimatedButton
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-violet-700 hover:bg-violet-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Badge
              </AnimatedButton>
            </div>
            <p className="text-gray-600">
              Create, edit, and manage badges that users can purchase in the
              store.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isPageLoading && (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {/* Filters and Search */}
          {!isPageLoading && (
            <>
              <div className="mb-8">
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search badges by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-violet-300 focus:ring-violet-200 glass-effect"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-[140px] glass-effect border-gray-200 focus:border-violet-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                      <option value="price-high">Price (High-Low)</option>
                      <option value="price-low">Price (Low-High)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Badge List */}
              <AnimatedCard variant="glass" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    All Badges
                    <Badge variant="outline" className="ml-2 bg-gray-100">
                      {sortedBadges.length}
                    </Badge>
                  </h2>
                </div>

                {sortedBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4 text-gray-400">
                      <Search className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      No badges found
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchQuery
                        ? `No results for "${searchQuery}"`
                        : "No badges have been created yet."}
                    </p>
                    <AnimatedButton
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-violet-700 hover:bg-violet-800 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Badge
                    </AnimatedButton>
                  </div>
                ) : (
                  <BadgeList
                    badges={sortedBadges}
                    onView={handleViewBadge}
                    onEdit={handleEditBadge}
                    onDelete={handleDeleteConfirmation}
                  />
                )}
              </AnimatedCard>
            </>
          )}
        </div>
      </PageTransition>

      {/* Create Badge Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl glass-effect">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" />
              Create New Badge
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new badge for the store.
            </DialogDescription>
          </DialogHeader>

          <BadgeForm
            onSubmit={handleCreateBadge}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Badge Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl glass-effect">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Edit Badge
            </DialogTitle>
            <DialogDescription>
              Update the details of this badge.
            </DialogDescription>
          </DialogHeader>

          {selectedBadge && (
            <BadgeForm
              badge={selectedBadge}
              onSubmit={handleUpdateBadge}
              onCancel={() => setIsEditDialogOpen(false)}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Badge Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl glass-effect">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-600" />
              Badge Details
            </DialogTitle>
          </DialogHeader>

          {selectedBadge && (
            <div className="py-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 flex justify-center">
                  <div className="relative">
                    <img
                      src={
                        selectedBadge.image ||
                        "/placeholder.svg?height=200&width=200"
                      }
                      alt={selectedBadge.name}
                      className="w-40 h-40 rounded-full object-cover border-4 border-gray-100"
                    />
                  </div>
                </div>

                <div className="w-full md:w-2/3 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedBadge.name}
                    </h3>
                    <Badge
                      className={
                        selectedBadge.isActive ? "bg-green-500" : "bg-gray-500"
                      }
                    >
                      {selectedBadge.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <p className="text-gray-600">{selectedBadge.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <span className="ml-2 font-medium">
                        {selectedBadge.price} points
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Icon:</span>
                      <span className="ml-2 font-medium">
                        {selectedBadge.icon}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedBadge.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsViewDialogOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="default"
                      className="bg-violet-700 hover:bg-violet-800 text-white"
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleEditBadge(selectedBadge);
                      }}
                    >
                      Edit Badge
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="glass-effect">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Badge
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete the badge{" "}
              <strong>{selectedBadge?.name}</strong>? This action cannot be
              undone. Users who have already purchased this badge will keep it,
              but it will no longer be available in the store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBadge}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2 border-white" />
                  Deleting...
                </>
              ) : (
                "Delete Badge"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
