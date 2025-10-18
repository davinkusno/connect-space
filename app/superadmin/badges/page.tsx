"use client";

import { useState } from "react";
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
  category: "achievement" | "cosmetic" | "special" | "seasonal";
  rarity: "common" | "rare" | "epic" | "legendary";
  price: number;
  image: string;
  isActive: boolean;
  isLimited?: boolean;
  limitedQuantity?: number;
  limitedRemaining?: number;
  expiresAt?: string;
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

  // Mock badges data
  const [badges, setBadges] = useState<StoreBadge[]>([
    {
      id: "1",
      name: "Tech Guru",
      description:
        "Awarded to members who consistently provide valuable technical insights and help others.",
      icon: "Trophy",
      category: "achievement",
      rarity: "epic",
      price: 1000,
      image: "/placeholder.svg?height=200&width=200",
      isActive: true,
      createdAt: "2023-05-15T10:30:00Z",
      updatedAt: "2023-05-15T10:30:00Z",
    },
    {
      id: "2",
      name: "Event Master",
      description: "For those who have attended at least 20 community events.",
      icon: "Star",
      category: "achievement",
      rarity: "rare",
      price: 500,
      image: "/placeholder.svg?height=200&width=200",
      isActive: true,
      createdAt: "2023-06-20T14:15:00Z",
      updatedAt: "2023-06-20T14:15:00Z",
    },
    {
      id: "3",
      name: "Community Champion",
      description:
        "Reserved for members who have made exceptional contributions to the community.",
      icon: "Award",
      category: "achievement",
      rarity: "legendary",
      price: 2000,
      image: "/placeholder.svg?height=200&width=200",
      isActive: true,
      createdAt: "2023-04-10T09:45:00Z",
      updatedAt: "2023-07-05T11:20:00Z",
    },
    {
      id: "4",
      name: "Holiday Special 2023",
      description:
        "Limited edition badge available only during the holiday season.",
      icon: "Gift",
      category: "seasonal",
      rarity: "epic",
      price: 1200,
      image: "/placeholder.svg?height=200&width=200",
      isActive: true,
      isLimited: true,
      limitedQuantity: 50,
      limitedRemaining: 12,
      expiresAt: "2024-01-01T00:00:00Z",
      createdAt: "2023-11-25T08:30:00Z",
      updatedAt: "2023-11-25T08:30:00Z",
    },
    {
      id: "5",
      name: "Founding Member",
      description:
        "Exclusive badge for the first 100 members who joined the platform.",
      icon: "Crown",
      category: "special",
      rarity: "legendary",
      price: 3000,
      image: "/placeholder.svg?height=200&width=200",
      isActive: false,
      isLimited: true,
      limitedQuantity: 100,
      limitedRemaining: 0,
      createdAt: "2023-01-05T12:00:00Z",
      updatedAt: "2023-03-10T15:45:00Z",
    },
  ]);

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
  const handleCreateBadge = (
    badge: Omit<StoreBadge, "id" | "createdAt" | "updatedAt">
  ) => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newBadge: StoreBadge = {
        ...badge,
        id: `${badges.length + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setBadges([...badges, newBadge]);
      setIsLoading(false);
      setIsCreateDialogOpen(false);
    }, 1000);
  };

  const handleUpdateBadge = (badge: StoreBadge) => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const updatedBadges = badges.map((b) =>
        b.id === badge.id
          ? { ...badge, updatedAt: new Date().toISOString() }
          : b
      );
      setBadges(updatedBadges);
      setIsLoading(false);
      setIsEditDialogOpen(false);
    }, 1000);
  };

  const handleDeleteBadge = () => {
    if (!selectedBadge) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const updatedBadges = badges.filter((b) => b.id !== selectedBadge.id);
      setBadges(updatedBadges);
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setSelectedBadge(null);
    }, 1000);
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
      <nav className="glass-effect sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Link href="/superadmin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-violet-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <div className="text-2xl font-bold text-gradient flex items-center gap-2">
                <ShoppingBag className="w-8 h-8 text-purple-600" />
                Badge Management
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-purple-600 text-white border-0 px-3 py-1">
                Superadmin
              </Badge>
              <AnimatedButton
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-violet-700 hover:bg-violet-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Badge
              </AnimatedButton>
            </div>
          </div>
        </div>
      </nav>

      <PageTransition>
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="h-6 w-6 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Store Badge Management
              </h1>
            </div>
            <p className="text-gray-600">
              Create, edit, and manage badges that users can purchase in the
              store.
            </p>
          </div>

          {/* Filters and Search */}
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
                    <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-md">
                      <Badge
                        className={`
                          ${selectedBadge.rarity === "common" && "bg-gray-500"}
                          ${selectedBadge.rarity === "rare" && "bg-blue-500"}
                          ${selectedBadge.rarity === "epic" && "bg-purple-500"}
                          ${
                            selectedBadge.rarity === "legendary" &&
                            "bg-yellow-500"
                          }
                          text-white border-0 capitalize
                        `}
                      >
                        {selectedBadge.rarity}
                      </Badge>
                    </div>
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
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-2 font-medium capitalize">
                        {selectedBadge.category}
                      </span>
                    </div>
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

                  {selectedBadge.isLimited && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-700 mb-1">
                        Limited Edition Badge
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-red-600">Total Quantity:</span>
                          <span className="ml-2 font-medium">
                            {selectedBadge.limitedQuantity}
                          </span>
                        </div>
                        <div>
                          <span className="text-red-600">Remaining:</span>
                          <span className="ml-2 font-medium">
                            {selectedBadge.limitedRemaining}
                          </span>
                        </div>
                        {selectedBadge.expiresAt && (
                          <div className="col-span-2">
                            <span className="text-red-600">Expires:</span>
                            <span className="ml-2 font-medium">
                              {new Date(
                                selectedBadge.expiresAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
  );
}
