"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge as BadgeComponent } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { InViewTransition } from "@/components/ui/content-transitions";
import {
  HoverScale,
  ButtonPulse,
  AnimatedIcon,
} from "@/components/ui/micro-interactions";
import { Spinner } from "@/components/ui/loading-indicators";
import { FloatingElements } from "@/components/ui/floating-elements";
import {
  Trophy,
  Star,
  Award,
  Target,
  Search,
  Filter,
  SortDesc,
  ShoppingCart,
  Check,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Crown,
  Medal,
  Gift,
  TrendingUp,
  Clock,
  Zap,
  Heart,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface StoreBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  image: string;
  isOwned?: boolean;
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

  // Mock user data
  const userData = {
    points: 2450,
    level: 8,
  };

  // Mock badges data
  const badges: StoreBadge[] = [
    {
      id: "1",
      name: "Tech Guru",
      description:
        "Awarded to members who consistently provide valuable technical insights and help others.",
      icon: <Trophy className="h-5 w-5" />,
      price: 1000,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "2",
      name: "Event Master",
      description: "For those who have attended at least 20 community events.",
      icon: <Star className="h-5 w-5" />,
      price: 500,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "3",
      name: "Community Champion",
      description:
        "Reserved for members who have made exceptional contributions to the community.",
      icon: <Award className="h-5 w-5" />,
      price: 2000,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "4",
      name: "Networking Pro",
      description:
        "For members who excel at connecting people and fostering collaborations.",
      icon: <Target className="h-5 w-5" />,
      price: 750,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "5",
      name: "Founding Member",
      description:
        "Exclusive badge for the first 100 members who joined the platform.",
      icon: <Crown className="h-5 w-5" />,
      price: 3000,
      image: "/placeholder.svg?height=200&width=200",
      isOwned: true,
    },
    {
      id: "6",
      name: "Holiday Special 2023",
      description:
        "Limited edition badge available only during the holiday season.",
      icon: <Gift className="h-5 w-5" />,
      price: 1200,
      image: "/placeholder.svg?height=200&width=200",
      isLimited: true,
      limitedQuantity: 50,
      limitedRemaining: 12,
      expiresAt: "2024-01-01",
    },
    {
      id: "7",
      name: "Rising Star",
      description:
        "For new members who quickly become active and engaged in the community.",
      icon: <TrendingUp className="h-5 w-5" />,
      price: 200,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "8",
      name: "Mentor",
      description: "Awarded to members who actively help and guide newcomers.",
      icon: <Heart className="h-5 w-5" />,
      price: 800,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "9",
      name: "Speed Demon",
      description: "For completing challenges in record time.",
      icon: <Zap className="h-5 w-5" />,
      price: 1500,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "10",
      name: "Early Bird",
      description: "For members who consistently arrive early to events.",
      icon: <Clock className="h-5 w-5" />,
      price: 150,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "11",
      name: "Innovation Leader",
      description:
        "For members who propose and lead innovative community initiatives.",
      icon: <Medal className="h-5 w-5" />,
      price: 2500,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "12",
      name: "Social Butterfly",
      description:
        "For members who actively engage in community discussions and networking.",
      icon: <Sparkles className="h-5 w-5" />,
      price: 600,
      image: "/placeholder.svg?height=200&width=200",
    },
  ];

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

  const confirmPurchase = () => {
    if (!selectedBadge) return;

    setIsPurchasing(true);
    // Simulate purchase process
    setTimeout(() => {
      setIsPurchasing(false);
      setPurchaseSuccess(true);
    }, 1500);
  };

  const handleCloseModal = () => {
    setShowPurchaseDialog(false);
    setPurchaseSuccess(false);
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
        {filteredBadges.length === 0 ? (
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
