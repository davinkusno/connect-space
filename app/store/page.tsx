"use client";

import type React from "react";

import { Badge as BadgeComponent } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InViewTransition } from "@/components/ui/content-transitions";
import {
    Dialog,
    DialogContent, DialogFooter, DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { FloatingElements } from "@/components/ui/floating-elements";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/loading-indicators";
import {
    HoverScale
} from "@/components/ui/micro-interactions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getClientSession } from "@/lib/supabase/client";
import {
    AlertCircle, Award, Check, Crown, Gift, Search, ShoppingCart, SortDesc, Sparkles, Star, Target, Trophy
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface StoreBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  image: string;
  imageUrl?: string;
  category?: string;
  isOwned?: boolean;
  isLimited?: boolean;
  limitedQuantity?: number;
  limitedRemaining?: number;
  expiresAt?: string;
}

interface UserData {
  points: number;
  level: number;
}

export default function StorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("price-low");
  const [selectedBadge, setSelectedBadge] = useState<StoreBadge | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Real data states
  const [badges, setBadges] = useState<StoreBadge[]>([]);
  const [userData, setUserData] = useState<UserData>({ points: 0, level: 1 });
  const [ownedBadgeIds, setOwnedBadgeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Helper function to get category icon
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      achievement: <Trophy className="h-5 w-5" />,
      participation: <Star className="h-5 w-5" />,
      leadership: <Award className="h-5 w-5" />,
      social: <Target className="h-5 w-5" />,
      special: <Crown className="h-5 w-5" />,
      seasonal: <Gift className="h-5 w-5" />,
    };
    return icons[category] || <Award className="h-5 w-5" />;
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get user session
        const session = await getClientSession();

        if (!session || !session.user) {
          console.error("User not authenticated");
          return;
        }

        const user = session.user;
        setUserId(user.id);
        setAuthToken(session.access_token);

        // Fetch badges
        const badgesResponse = await fetch("/api/badges");
        const badgesData = await badgesResponse.json();

        console.log("Badges API Response:", badgesData);

        if (badgesData && Array.isArray(badgesData)) {
          // Transform snake_case to camelCase and add icons
          const transformedBadges = badgesData
            .filter((badge: any) => badge.is_active !== false) // Only show active badges (snake_case from DB)
            .map((badge: any) => ({
              id: badge.id,
              name: badge.name,
              description: badge.description,
              price: badge.price,
              image: badge.image_url || "/placeholder.svg?height=200&width=200",
              imageUrl: badge.image_url,
              category: badge.category || "achievement",
              icon: getCategoryIcon(badge.category || "achievement"),
              isOwned: false, // Will be updated below
            }));

          console.log("Transformed badges:", transformedBadges);
          setBadges(transformedBadges);
        } else {
          console.error("Invalid badges data format:", badgesData);
        }

        // Fetch user points
        const pointsResponse = await fetch("/api/user/points", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const pointsData = await pointsResponse.json();

        if (pointsData.points !== undefined) {
          setUserData({
            points: pointsData.points,
            level: Math.floor(pointsData.points / 500) + 1, // Simple level calculation
          });
        }

        // Fetch owned badges
        const ownedResponse = await fetch(
          `/api/user-badges?userId=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );
        const ownedData = await ownedResponse.json();

        if (ownedData && Array.isArray(ownedData)) {
          const ownedIds = ownedData.map((ub: any) => ub.badge_id); // snake_case from DB
          setOwnedBadgeIds(ownedIds);

          // Update badges with owned status
          setBadges((prevBadges) =>
            prevBadges.map((badge) => ({
              ...badge,
              isOwned: ownedIds.includes(badge.id),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching store data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort badges
  const filteredBadges = badges
    .filter((badge) => {
      const matchesSearch =
        searchQuery === "" ||
        badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredBadges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBadges = filteredBadges.slice(startIndex, endIndex);

  // Reset to page 1 when search or sort changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handlePurchase = (badge: StoreBadge) => {
    setSelectedBadge(badge);
    setShowPurchaseDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedBadge || !userId || !authToken) return;

    // Validate points before purchase
    if (userData.points < selectedBadge.price) {
      setPurchaseError(
        `Insufficient points. You need ${
          selectedBadge.price - userData.points
        } more points.`
      );
      return;
    }

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const response = await fetch(`/api/badges/${selectedBadge.id}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "User already owns this badge") {
          setPurchaseError("You already own this badge!");
        } else if (data.error === "Insufficient points") {
          setPurchaseError(
            `Insufficient points. You have ${data.currentPoints}, but need ${data.requiredPoints}.`
          );
        } else {
          setPurchaseError(data.error || "Failed to purchase badge");
        }
        setIsPurchasing(false);
        return;
      }

      // Update points balance
      if (data.newBalance !== undefined) {
        setUserData((prev) => ({
          ...prev,
          points: data.newBalance,
          level: Math.floor(data.newBalance / 500) + 1,
        }));
      }

      // Mark badge as owned
      setBadges((prevBadges) =>
        prevBadges.map((badge) =>
          badge.id === selectedBadge.id ? { ...badge, isOwned: true } : badge
        )
      );
      setOwnedBadgeIds((prev) => [...prev, selectedBadge.id]);

      setIsPurchasing(false);
      setPurchaseSuccess(true);
    } catch (error) {
      console.error("Purchase error:", error);
      setPurchaseError("An error occurred while processing your purchase");
      setIsPurchasing(false);
    }
  };

  const handleCloseModal = () => {
    setShowPurchaseDialog(false);
    setPurchaseSuccess(false);
    setPurchaseError(null);
    setSelectedBadge(null);
  };

  const canAfford = (price: number) => userData.points >= price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Badge Store <span className="text-gradient">🏆</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Spend your earned points on exclusive badges that showcase your
            achievements and contributions to the community.
          </p>

          {/* User Points and Level Info */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="glass-effect px-6 py-3 rounded-full">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span className="text-gray-700 font-semibold">
                  {userData.points.toLocaleString()} points
                </span>
              </div>
            </div>
            <div className="glass-effect px-6 py-3 rounded-full">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-5 w-5 text-purple-600" />
                <span className="text-gray-700 font-semibold">
                  Level {userData.level}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search badges..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 border-gray-200 focus:border-violet-300 focus:ring-violet-200 glass-effect"
              />
            </div>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full lg:w-[200px] glass-effect border-gray-200 focus:border-violet-300">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="Sort by Points" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-low">Points: Low to High</SelectItem>
                <SelectItem value="price-high">Points: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Badges Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600">Loading badges...</p>
            </div>
          </div>
        ) : filteredBadges.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 text-gray-400">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No badges found
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "No badges match your current filters."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
              {paginatedBadges.map((badge, index) => (
                <InViewTransition
                  key={badge.id}
                  effect="fade"
                  delay={index * 50}
                >
                  <HoverScale scale={1.02}>
                    <Card className="glass-effect border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all duration-300 overflow-hidden group">
                      <div className="relative">
                        <div className="aspect-square p-8 bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
                          <Image
                            src={badge.image || "/placeholder.svg"}
                            alt={badge.name}
                            width={120}
                            height={120}
                            className="rounded-full group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>

                        {/* Owned Badge */}
                        {badge.isOwned && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                              <Check className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                          {badge.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {badge.description}
                        </p>

                        {/* Price Information */}
                        <div className="flex items-center justify-center gap-1.5 mb-4 px-3 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold text-base text-gray-900">
                            {badge.price.toLocaleString()}
                          </span>
                          <span className="text-gray-600 text-xs font-medium">
                            points
                          </span>
                        </div>

                        {/* Purchase Button */}
                        <div className="w-full">
                          {badge.isOwned ? (
                            <div className="w-full">
                              <BadgeComponent className="w-full justify-center bg-green-500 text-white border-0 py-2 text-sm font-medium">
                                <Check className="h-4 w-4 mr-2" />
                                Already Owned
                              </BadgeComponent>
                            </div>
                          ) : (
                            <Button
                              disabled={!canAfford(badge.price)}
                              onClick={() => handlePurchase(badge)}
                              className={`w-full py-2 h-auto font-medium transition-all duration-300 ${
                                canAfford(badge.price)
                                  ? "bg-violet-700 hover:bg-violet-800 text-white hover:shadow-lg hover:shadow-violet-500/25 hover:scale-105"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              {canAfford(badge.price) ? (
                                <>
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Purchase Badge
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Insufficient Points
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </InViewTransition>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="glass-effect"
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 p-0 ${
                          currentPage === page
                            ? "bg-violet-600 hover:bg-violet-700 text-white"
                            : "glass-effect"
                        }`}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="glass-effect"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Purchase Dialog */}
        <Dialog open={showPurchaseDialog} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-sm bg-white dark:bg-gray-800 border-0 shadow-2xl rounded-2xl p-0">
            {purchaseSuccess ? (
              <div className="text-center p-8">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center mb-5 shadow-lg shadow-green-500/30">
                  <Check className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Purchase Successful!
                </DialogTitle>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You've successfully acquired the{" "}
                  <span className="font-semibold text-violet-600 dark:text-violet-400">
                    {selectedBadge?.name}
                  </span>{" "}
                  badge.
                </p>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 my-6 text-left text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Points Spent:
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {selectedBadge?.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Remaining Points:
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {(
                        userData.points - (selectedBadge?.price || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
                <DialogFooter className="mt-8">
                  <Button
                    onClick={handleCloseModal}
                    className="w-full bg-violet-700 hover:bg-violet-800 text-white font-semibold py-3 h-auto"
                  >
                    Awesome!
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <DialogHeader className="p-6 pb-4">
                  <DialogTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    Confirm Purchase
                  </DialogTitle>
                </DialogHeader>

                {selectedBadge && (
                  <div className="px-6 space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <Image
                        src={selectedBadge.image || "/placeholder.svg"}
                        alt={selectedBadge.name}
                        width={60}
                        height={60}
                        className="rounded-full"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {selectedBadge.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {selectedBadge.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Price
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                          {selectedBadge.price.toLocaleString()} points
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Your points
                        </span>
                        <span className="text-gray-800 dark:text-gray-100">
                          {userData.points.toLocaleString()} points
                        </span>
                      </div>
                      <Separator className="my-2 bg-gray-200 dark:bg-gray-700" />
                      <div className="flex justify-between font-bold text-gray-800 dark:text-white">
                        <span>Remaining points</span>
                        <span>
                          {(
                            userData.points - selectedBadge.price
                          ).toLocaleString()}{" "}
                          points
                        </span>
                      </div>
                    </div>

                    {!canAfford(selectedBadge.price) && (
                      <div className="flex items-center gap-2 p-3 bg-red-100/50 dark:bg-red-900/30 border border-red-200 dark:border-red-600/50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                          You don't have enough points for this badge.
                        </span>
                      </div>
                    )}

                    {purchaseError && (
                      <div className="flex items-center gap-2 p-3 bg-red-100/50 dark:bg-red-900/30 border border-red-200 dark:border-red-600/50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                          {purchaseError}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <DialogFooter className="p-6 bg-gray-50 dark:bg-gray-800/50 mt-6 rounded-b-2xl">
                  <Button
                    variant="ghost"
                    onClick={handleCloseModal}
                    disabled={isPurchasing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="w-40 bg-violet-700 hover:bg-violet-800 text-white transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25 hover:scale-105"
                    disabled={
                      isPurchasing ||
                      !selectedBadge ||
                      !canAfford(selectedBadge.price)
                    }
                    onClick={confirmPurchase}
                  >
                    {isPurchasing ? (
                      <Spinner size="sm" />
                    ) : (
                      `Pay ${selectedBadge?.price.toLocaleString()} pts`
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
