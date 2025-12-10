"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InViewTransition } from "@/components/ui/content-transitions"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ButtonPulse } from "@/components/ui/micro-interactions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertCircle, Award, CheckCircle, Coins, Crown, Filter, Gift, Heart, Medal, Search, ShoppingCart, Sparkles, Star, Target, Trophy, Zap
} from "lucide-react"
import { useState } from "react"
import { BadgeCard } from "./badge-card"

interface StoreBadge {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: "achievement" | "cosmetic" | "special" | "seasonal"
  price: number
  isOwned: boolean
  previewImage?: string
}

interface BadgeStoreProps {
  userPoints: number
  onPurchase: (badgeId: string, price: number) => void
}

export function BadgeStore({ userPoints, onPurchase }: BadgeStoreProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("price-low")
  const [selectedBadge, setSelectedBadge] = useState<StoreBadge | null>(null)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)

  // Mock store badges data
  const storeBadges: StoreBadge[] = [
    {
      id: "1",
      name: "Golden Star",
      description: "A prestigious golden star badge for exceptional contributors",
      icon: <Star className="h-6 w-6" />,
      category: "achievement",
      price: 1000,
      isOwned: false,
    },
    {
      id: "2",
      name: "Community Crown",
      description: "Show your royal status in the community",
      icon: <Crown className="h-6 w-6" />,
      category: "cosmetic",
      price: 750,
      isOwned: false,
    },
    {
      id: "3",
      name: "Event Champion",
      description: "Celebrate your event participation achievements",
      icon: <Trophy className="h-6 w-6" />,
      category: "achievement",
      price: 500,
      isOwned: true,
    },
    {
      id: "4",
      name: "Helper Badge",
      description: "Recognize your helpful contributions to the community",
      icon: <Heart className="h-6 w-6" />,
      category: "achievement",
      price: 200,
      isOwned: false,
    },
    {
      id: "5",
      name: "Lightning Bolt",
      description: "For the fastest responders and most active members",
      icon: <Zap className="h-6 w-6" />,
      category: "cosmetic",
      price: 400,
      isOwned: false,
    },
    {
      id: "6",
      name: "Winter Special",
      description: "Limited edition winter themed badge",
      icon: <Sparkles className="h-6 w-6" />,
      category: "seasonal",
      price: 600,
      isOwned: false,
    },
    {
      id: "7",
      name: "Mentor Medal",
      description: "For those who guide and support new community members",
      icon: <Medal className="h-6 w-6" />,
      category: "special",
      price: 800,
      isOwned: false,
    },
    {
      id: "8",
      name: "Target Achiever",
      description: "Hit your goals with this motivational badge",
      icon: <Target className="h-6 w-6" />,
      category: "achievement",
      price: 150,
      isOwned: false,
    },
    {
      id: "9",
      name: "Gift Giver",
      description: "Spread joy and kindness in the community",
      icon: <Gift className="h-6 w-6" />,
      category: "special",
      price: 350,
      isOwned: false,
    },
    {
      id: "10",
      name: "Excellence Award",
      description: "The ultimate badge for outstanding community members",
      icon: <Award className="h-6 w-6" />,
      category: "achievement",
      price: 1500,
      isOwned: false,
    },
  ]

  const filteredBadges = storeBadges
    .filter((badge) => {
      const matchesSearch =
        badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = filterCategory === "all" || badge.category === filterCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const handlePurchase = (badge: StoreBadge) => {
    if (badge.isOwned) return
    if (userPoints < badge.price) return

    setSelectedBadge(badge)
    setShowPurchaseDialog(true)
  }

  const confirmPurchase = () => {
    if (selectedBadge) {
      onPurchase(selectedBadge.id, selectedBadge.price)
      setShowPurchaseDialog(false)
      setSelectedBadge(null)
    }
  }

  const categoryCounts = {
    all: storeBadges.length,
    achievement: storeBadges.filter((b) => b.category === "achievement").length,
    cosmetic: storeBadges.filter((b) => b.category === "cosmetic").length,
    special: storeBadges.filter((b) => b.category === "special").length,
    seasonal: storeBadges.filter((b) => b.category === "seasonal").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100">Badge Store</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Spend your earned points to unlock exclusive badges and show off your achievements in the community
        </p>
        <div className="flex items-center justify-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-yellow-600" />
          <span className="font-semibold text-gray-900 dark:text-gray-100">{userPoints.toLocaleString()}</span>
          <span className="text-gray-600 dark:text-gray-400">points available</span>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="border-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search badges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-violet-300 focus:ring-violet-200 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40 border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="cosmetic">Cosmetic</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={filterCategory} onValueChange={setFilterCategory}>
        <TabsList className="grid w-full grid-cols-5 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white data-[state=active]:text-violet-700 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
          >
            All ({categoryCounts.all})
          </TabsTrigger>
          <TabsTrigger
            value="achievement"
            className="data-[state=active]:bg-white data-[state=active]:text-violet-700 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
          >
            Achievement ({categoryCounts.achievement})
          </TabsTrigger>
          <TabsTrigger
            value="cosmetic"
            className="data-[state=active]:bg-white data-[state=active]:text-violet-700 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
          >
            Cosmetic ({categoryCounts.cosmetic})
          </TabsTrigger>
          <TabsTrigger
            value="special"
            className="data-[state=active]:bg-white data-[state=active]:text-violet-700 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
          >
            Special ({categoryCounts.special})
          </TabsTrigger>
          <TabsTrigger
            value="seasonal"
            className="data-[state=active]:bg-white data-[state=active]:text-violet-700 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
          >
            Seasonal ({categoryCounts.seasonal})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filterCategory} className="mt-6">
          {/* Badge Grid */}
          {filteredBadges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBadges.map((badge, index) => (
                <InViewTransition key={badge.id} effect="fade" delay={index * 100}>
                  <BadgeCard badge={badge} userPoints={userPoints} onPurchase={() => handlePurchase(badge)} />
                </InViewTransition>
              ))}
            </div>
          ) : (
            <Card className="border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <ShoppingCart className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No badges found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or filters to find more badges
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Confirm Purchase
            </DialogTitle>
            <DialogDescription>Are you sure you want to purchase this badge?</DialogDescription>
          </DialogHeader>

          {selectedBadge && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="p-3 rounded-full bg-white dark:bg-gray-700 border-2 border-violet-200 dark:border-violet-600">
                  {selectedBadge.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{selectedBadge.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedBadge.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Price:</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{selectedBadge.price}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Your Points:</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{userPoints}</span>
                  </div>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-600 dark:text-gray-400">After Purchase:</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {userPoints - selectedBadge.price}
                    </span>
                  </div>
                </div>
              </div>

              {userPoints < selectedBadge.price && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800 dark:text-red-200">
                    Insufficient points to purchase this badge
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Cancel
            </Button>
            <ButtonPulse
              disabled={!selectedBadge || userPoints < selectedBadge.price}
              onClick={confirmPurchase}
              pulseColor="rgba(124, 58, 237, 0.3)"
            >
              <Button
                disabled={!selectedBadge || userPoints < selectedBadge.price}
                className="bg-violet-700 hover:bg-violet-800 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Purchase Badge
              </Button>
            </ButtonPulse>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
