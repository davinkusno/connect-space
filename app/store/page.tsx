"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge as BadgeComponent } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { InViewTransition } from "@/components/ui/content-transitions"
import { HoverScale, ButtonPulse, AnimatedIcon } from "@/components/ui/micro-interactions"
import { Spinner } from "@/components/ui/loading-indicators"
import { FloatingElements } from "@/components/ui/floating-elements"
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
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface StoreBadge {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: "achievement" | "participation" | "special" | "limited"
  rarity: "common" | "rare" | "epic" | "legendary"
  price: number
  image: string
  isOwned?: boolean
  isLimited?: boolean
  limitedQuantity?: number
  limitedRemaining?: number
  expiresAt?: string
}

export default function StorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedRarity, setSelectedRarity] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("popular")
  const [selectedBadge, setSelectedBadge] = useState<StoreBadge | null>(null)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  // Mock user data
  const userData = {
    points: 2450,
    level: 8,
  }

  // Mock badges data
  const badges: StoreBadge[] = [
    {
      id: "1",
      name: "Tech Guru",
      description: "Awarded to members who consistently provide valuable technical insights and help others.",
      icon: <Trophy className="h-5 w-5" />,
      category: "achievement",
      rarity: "epic",
      price: 1000,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "2",
      name: "Event Master",
      description: "For those who have attended at least 20 community events.",
      icon: <Star className="h-5 w-5" />,
      category: "participation",
      rarity: "rare",
      price: 500,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "3",
      name: "Community Champion",
      description: "Reserved for members who have made exceptional contributions to the community.",
      icon: <Award className="h-5 w-5" />,
      category: "achievement",
      rarity: "legendary",
      price: 2000,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "4",
      name: "Networking Pro",
      description: "For members who excel at connecting people and fostering collaborations.",
      icon: <Target className="h-5 w-5" />,
      category: "achievement",
      rarity: "rare",
      price: 750,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "5",
      name: "Founding Member",
      description: "Exclusive badge for the first 100 members who joined the platform.",
      icon: <Crown className="h-5 w-5" />,
      category: "special",
      rarity: "legendary",
      price: 3000,
      image: "/placeholder.svg?height=200&width=200",
      isOwned: true,
    },
    {
      id: "6",
      name: "Holiday Special 2023",
      description: "Limited edition badge available only during the holiday season.",
      icon: <Gift className="h-5 w-5" />,
      category: "limited",
      rarity: "epic",
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
      description: "For new members who quickly become active and engaged in the community.",
      icon: <TrendingUp className="h-5 w-5" />,
      category: "achievement",
      rarity: "common",
      price: 200,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "8",
      name: "Mentor",
      description: "Awarded to members who actively help and guide newcomers.",
      icon: <Heart className="h-5 w-5" />,
      category: "achievement",
      rarity: "rare",
      price: 800,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "9",
      name: "Speed Demon",
      description: "For completing challenges in record time.",
      icon: <Zap className="h-5 w-5" />,
      category: "participation",
      rarity: "epic",
      price: 1500,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "10",
      name: "Early Bird",
      description: "For members who consistently arrive early to events.",
      icon: <Clock className="h-5 w-5" />,
      category: "participation",
      rarity: "common",
      price: 150,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "11",
      name: "Innovation Leader",
      description: "For members who propose and lead innovative community initiatives.",
      icon: <Medal className="h-5 w-5" />,
      category: "achievement",
      rarity: "legendary",
      price: 2500,
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "12",
      name: "Social Butterfly",
      description: "For members who actively engage in community discussions and networking.",
      icon: <Sparkles className="h-5 w-5" />,
      category: "participation",
      rarity: "rare",
      price: 600,
      image: "/placeholder.svg?height=200&width=200",
    },
  ]

  // Filter and sort badges
  const filteredBadges = badges
    .filter((badge) => {
      const matchesSearch =
        searchQuery === "" ||
        badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === "all" || badge.category === selectedCategory
      const matchesRarity = selectedRarity === "all" || badge.rarity === selectedRarity

      return matchesSearch && matchesCategory && matchesRarity
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price
      if (sortBy === "price-high") return b.price - a.price
      if (sortBy === "rarity") {
        const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 }
        return rarityOrder[b.rarity] - rarityOrder[a.rarity]
      }
      return 0 // popular (default order)
    })

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500"
      case "rare":
        return "bg-blue-500"
      case "epic":
        return "bg-purple-500"
      case "legendary":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "achievement":
        return <Trophy className="h-4 w-4" />
      case "participation":
        return <Star className="h-4 w-4" />
      case "special":
        return <Crown className="h-4 w-4" />
      case "limited":
        return <Gift className="h-4 w-4" />
      default:
        return <Award className="h-4 w-4" />
    }
  }

  const handlePurchase = (badge: StoreBadge) => {
    setSelectedBadge(badge)
    setShowPurchaseDialog(true)
  }

  const confirmPurchase = () => {
    if (!selectedBadge) return

    setIsPurchasing(true)
    // Simulate purchase process
    setTimeout(() => {
      setIsPurchasing(false)
      setPurchaseSuccess(true)
    }, 1500)
  }

  const handleCloseModal = () => {
    setShowPurchaseDialog(false)
    setPurchaseSuccess(false)
    setSelectedBadge(null)
  }

  const canAfford = (price: number) => userData.points >= price

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
            Spend your earned points on exclusive badges that showcase your achievements and contributions to the
            community.
          </p>
          
          {/* User Points and Level Info */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="glass-effect px-6 py-3 rounded-full">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span className="text-gray-700 font-semibold">{userData.points.toLocaleString()} points</span>
              </div>
            </div>
            <div className="glass-effect px-6 py-3 rounded-full">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-5 w-5 text-purple-600" />
                <span className="text-gray-700 font-semibold">Level {userData.level}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search badges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-violet-300 focus:ring-violet-200 glass-effect"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px] glass-effect border-gray-200 focus:border-violet-300">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="participation">Participation</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                  <SelectItem value="limited">Limited Edition</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="w-[140px] glass-effect border-gray-200 focus:border-violet-300">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Rarity" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rarities</SelectItem>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] glass-effect border-gray-200 focus:border-violet-300">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Sort By" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rarity">Rarity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-5 glass-effect border-0 p-2 rounded-2xl">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
              >
                All Badges
              </TabsTrigger>
              <TabsTrigger
                value="achievement"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Achievement
              </TabsTrigger>
              <TabsTrigger
                value="participation"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
              >
                <Star className="h-4 w-4 mr-2" />
                Participation
              </TabsTrigger>
              <TabsTrigger
                value="special"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
              >
                <Crown className="h-4 w-4 mr-2" />
                Special
              </TabsTrigger>
              <TabsTrigger
                value="limited"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
              >
                <Gift className="h-4 w-4 mr-2" />
                Limited
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Badges Grid */}
        {filteredBadges.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 text-gray-400">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No badges found</h3>
            <p className="text-gray-500">
              {searchQuery ? `No results for "${searchQuery}"` : "No badges match your current filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredBadges.map((badge, index) => (
              <InViewTransition key={badge.id} effect="fade" delay={index * 50}>
                <HoverScale scale={1.02}>
                  <Card className="glass-effect border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    <div className="relative">
                      <div className="aspect-square p-8 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        <div className="relative">
                          <Image
                            src={badge.image || "/placeholder.svg"}
                            alt={badge.name}
                            width={120}
                            height={120}
                            className="rounded-full group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute -top-2 -right-2">
                            <div
                              className={`w-6 h-6 ${getRarityColor(badge.rarity)} rounded-full flex items-center justify-center`}
                            >
                              <AnimatedIcon icon={badge.icon} animationType="pulse" className="text-white text-xs" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Limited Edition Banner */}
                      {badge.isLimited && (
                        <div className="absolute top-2 left-2 right-2">
                          <BadgeComponent className="bg-red-500 text-white border-0 text-xs w-full justify-center pulse-glow">
                            Limited Edition
                          </BadgeComponent>
                        </div>
                      )}

                      {/* Owned Badge */}
                      {badge.isOwned && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-green-500 text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute bottom-2 left-2">
                        <BadgeComponent variant="outline" className="bg-white/90 border-gray-200 text-gray-700 text-xs">
                          {getCategoryIcon(badge.category)}
                          <span className="ml-1 capitalize">{badge.category}</span>
                        </BadgeComponent>
                      </div>

                      {/* Rarity Badge */}
                      <div className="absolute bottom-2 right-2">
                        <BadgeComponent
                          className={`${getRarityColor(badge.rarity)} text-white border-0 text-xs capitalize`}
                        >
                          {badge.rarity}
                        </BadgeComponent>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                        {badge.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{badge.description}</p>

                      {/* Limited Edition Info */}
                      {badge.isLimited && (
                        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-red-700 font-medium">
                              {badge.limitedRemaining}/{badge.limitedQuantity} remaining
                            </span>
                            <span className="text-red-600 text-xs">
                              Expires: {badge.expiresAt && new Date(badge.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold text-lg text-gray-900">{badge.price.toLocaleString()}</span>
                          <span className="text-gray-500 text-sm">points</span>
                        </div>

                        {badge.isOwned ? (
                          <BadgeComponent className="bg-green-500 text-white border-0">
                            <Check className="h-3 w-3 mr-1" />
                            Owned
                          </BadgeComponent>
                        ) : (
                          <ButtonPulse
                            disabled={!canAfford(badge.price)}
                            onClick={() => handlePurchase(badge)}
                            pulseColor="rgba(124, 58, 237, 0.3)"
                          >
                            <Button
                              disabled={!canAfford(badge.price)}
                              className={
                                canAfford(badge.price)
                                  ? "bg-violet-700 hover:bg-violet-800 text-white"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }
                            >
                              {canAfford(badge.price) ? (
                                <>
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Purchase
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Insufficient
                                </>
                              )}
                            </Button>
                          </ButtonPulse>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </HoverScale>
              </InViewTransition>
            ))}
          </div>
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
                  <span className="font-semibold text-violet-600 dark:text-violet-400">{selectedBadge?.name}</span>{" "}
                  badge.
                </p>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 my-6 text-left text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Points Spent:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {selectedBadge?.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Remaining Points:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {(userData.points - (selectedBadge?.price || 0)).toLocaleString()}
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
                        <h4 className="font-semibold text-gray-900 dark:text-white">{selectedBadge.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {selectedBadge.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Price</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                          {selectedBadge.price.toLocaleString()} points
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Your points</span>
                        <span className="text-gray-800 dark:text-gray-100">{userData.points.toLocaleString()} points</span>
                      </div>
                      <Separator className="my-2 bg-gray-200 dark:bg-gray-700" />
                      <div className="flex justify-between font-bold text-gray-800 dark:text-white">
                        <span>Remaining points</span>
                        <span>{(userData.points - selectedBadge.price).toLocaleString()} points</span>
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
                  <Button variant="ghost" onClick={handleCloseModal} disabled={isPurchasing}>
                    Cancel
                  </Button>
                  <ButtonPulse
                    disabled={isPurchasing || !selectedBadge || !canAfford(selectedBadge.price)}
                    onClick={confirmPurchase}
                    pulseColor="rgba(124, 58, 237, 0.3)"
                  >
                    <Button
                      className="w-40 bg-violet-700 hover:bg-violet-800 text-white"
                      disabled={isPurchasing || !selectedBadge || !canAfford(selectedBadge.price)}
                    >
                      {isPurchasing ? (
                        <Spinner size="sm" />
                      ) : (
                        `Pay ${selectedBadge?.price.toLocaleString()} pts`
                      )}
                    </Button>
                  </ButtonPulse>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
