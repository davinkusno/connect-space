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
      // In a real app, this would update the user's points and badge collection
      setTimeout(() => {
        setShowPurchaseDialog(false)
        setPurchaseSuccess(false)
        setSelectedBadge(null)
      }, 2000)
    }, 1500)
  }

  const canAfford = (price: number) => userData.points >= price

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />

      {/* Navigation */}
      <nav className="glass-effect sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="text-2xl font-bold text-gradient flex items-center gap-2">
                <ShoppingCart className="w-8 h-8 text-purple-600" />
                Badge Store
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="glass-effect px-4 py-2 rounded-full">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-700">{userData.points.toLocaleString()} points</span>
                </div>
              </div>
              <div className="glass-effect px-4 py-2 rounded-full">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Trophy className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-700">Level {userData.level}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Badge Store <span className="text-gradient">🏆</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Spend your earned points on exclusive badges that showcase your achievements and contributions to the
            community.
          </p>
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

        {/* Purchase Confirmation Dialog */}
        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogContent className="max-w-md glass-effect">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {purchaseSuccess ? (
                  <>
                    <Check className="h-6 w-6 text-green-500" />
                    Purchase Successful!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-6 w-6 text-purple-600" />
                    Confirm Purchase
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedBadge && (
              <div className="py-6">
                {purchaseSuccess ? (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-10 w-10 text-green-500" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Badge Purchased!</h3>
                    <p className="text-gray-600 mb-4">
                      The <strong>{selectedBadge.name}</strong> badge has been added to your collection.
                    </p>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-700">Points Spent:</span>
                        <span className="font-bold text-green-800">{selectedBadge.price.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-green-700">Remaining Points:</span>
                        <span className="font-bold text-green-800">
                          {(userData.points - selectedBadge.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <Image
                          src={selectedBadge.image || "/placeholder.svg"}
                          alt={selectedBadge.name}
                          width={80}
                          height={80}
                          className="rounded-full"
                        />
                        <div className="absolute -top-1 -right-1">
                          <div
                            className={`w-6 h-6 ${getRarityColor(selectedBadge.rarity)} rounded-full flex items-center justify-center`}
                          >
                            <AnimatedIcon
                              icon={selectedBadge.icon}
                              animationType="pulse"
                              className="text-white text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{selectedBadge.name}</h3>
                        <p className="text-gray-600 text-sm">{selectedBadge.description}</p>
                        <BadgeComponent
                          className={`${getRarityColor(selectedBadge.rarity)} text-white border-0 text-xs capitalize mt-2`}
                        >
                          {selectedBadge.rarity}
                        </BadgeComponent>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Badge Price:</span>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold text-gray-900">{selectedBadge.price.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Your Points:</span>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold text-gray-900">{userData.points.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-gray-600">After Purchase:</span>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold text-gray-900">
                            {(userData.points - selectedBadge.price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedBadge.isLimited && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 text-red-700 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">Limited Edition</span>
                        </div>
                        <p className="text-red-600 text-xs mt-1">
                          Only {selectedBadge.limitedRemaining} remaining. This offer expires on{" "}
                          {selectedBadge.expiresAt && new Date(selectedBadge.expiresAt).toLocaleDateString()}.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!purchaseSuccess && (
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseDialog(false)}
                  disabled={isPurchasing}
                  className="border-gray-200 hover:border-gray-300"
                >
                  Cancel
                </Button>
                <ButtonPulse
                  onClick={confirmPurchase}
                  disabled={isPurchasing || !selectedBadge || !canAfford(selectedBadge.price)}
                  pulseColor="rgba(124, 58, 237, 0.3)"
                >
                  <Button
                    onClick={confirmPurchase}
                    disabled={isPurchasing || !selectedBadge || !canAfford(selectedBadge.price)}
                    className="bg-violet-700 hover:bg-violet-800 text-white"
                  >
                    {isPurchasing ? (
                      <>
                        <Spinner size="sm" className="mr-2 border-white" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Confirm Purchase
                      </>
                    )}
                  </Button>
                </ButtonPulse>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
