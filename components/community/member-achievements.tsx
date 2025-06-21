"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InViewTransition } from "@/components/ui/content-transitions"
import { HoverScale, AnimatedIcon } from "@/components/ui/micro-interactions"
import {
  Trophy,
  Star,
  Award,
  Target,
  Users,
  Calendar,
  MessageCircle,
  Heart,
  TrendingUp,
  Zap,
  Crown,
  Medal,
  Gift,
  Sparkles,
  Lock,
  CheckCircle,
  Clock,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: "participation" | "contribution" | "milestone" | "special"
  rarity: "common" | "rare" | "epic" | "legendary"
  points: number
  unlockedAt?: string
  progress?: {
    current: number
    total: number
  }
  isUnlocked: boolean
  image: string
}

interface MemberStats {
  level: number
  totalPoints: number
  currentLevelXP: number
  nextLevelXP: number
  eventsAttended: number
  postsCreated: number
  likesReceived: number
  communitiesJoined: number
  achievementsUnlocked: number
  totalAchievements: number
}

interface MemberAchievementsProps {
  memberId: string
  isCurrentUser?: boolean
}

export function MemberAchievements({ memberId, isCurrentUser = false }: MemberAchievementsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock member stats
  const memberStats: MemberStats = {
    level: 8,
    totalPoints: 2450,
    currentLevelXP: 450,
    nextLevelXP: 1000,
    eventsAttended: 23,
    postsCreated: 47,
    likesReceived: 189,
    communitiesJoined: 5,
    achievementsUnlocked: 12,
    totalAchievements: 25,
  }

  // Mock achievements data
  const achievements: Achievement[] = [
    {
      id: "1",
      name: "First Steps",
      description: "Welcome to the community! Complete your profile and join your first community.",
      icon: <Star className="h-5 w-5" />,
      category: "milestone",
      rarity: "common",
      points: 50,
      unlockedAt: "2023-10-15",
      isUnlocked: true,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "2",
      name: "Social Butterfly",
      description: "Attend 10 community events and make new connections.",
      icon: <Users className="h-5 w-5" />,
      category: "participation",
      rarity: "rare",
      points: 200,
      unlockedAt: "2023-11-02",
      isUnlocked: true,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "3",
      name: "Content Creator",
      description: "Create 25 posts and share your knowledge with the community.",
      icon: <MessageCircle className="h-5 w-5" />,
      category: "contribution",
      rarity: "rare",
      points: 300,
      unlockedAt: "2023-11-20",
      isUnlocked: true,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "4",
      name: "Community Champion",
      description: "Receive 100 likes on your posts and comments.",
      icon: <Heart className="h-5 w-5" />,
      category: "contribution",
      rarity: "epic",
      points: 500,
      unlockedAt: "2023-12-01",
      isUnlocked: true,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "5",
      name: "Event Master",
      description: "Attend 25 events across different communities.",
      icon: <Calendar className="h-5 w-5" />,
      category: "participation",
      rarity: "epic",
      points: 750,
      progress: {
        current: 23,
        total: 25,
      },
      isUnlocked: false,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "6",
      name: "Rising Star",
      description: "Reach level 10 and establish yourself as an active community member.",
      icon: <TrendingUp className="h-5 w-5" />,
      category: "milestone",
      rarity: "epic",
      points: 1000,
      progress: {
        current: 8,
        total: 10,
      },
      isUnlocked: false,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "7",
      name: "Networking Pro",
      description: "Connect with members from 10 different communities.",
      icon: <Target className="h-5 w-5" />,
      category: "participation",
      rarity: "rare",
      points: 400,
      progress: {
        current: 5,
        total: 10,
      },
      isUnlocked: false,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "8",
      name: "Tech Guru",
      description: "Become a recognized expert in technology discussions.",
      icon: <Trophy className="h-5 w-5" />,
      category: "special",
      rarity: "legendary",
      points: 2000,
      isUnlocked: false,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "9",
      name: "Mentor",
      description: "Help 20 new members get started in the community.",
      icon: <Award className="h-5 w-5" />,
      category: "contribution",
      rarity: "epic",
      points: 800,
      progress: {
        current: 12,
        total: 20,
      },
      isUnlocked: false,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "10",
      name: "Speed Demon",
      description: "Complete community challenges in record time.",
      icon: <Zap className="h-5 w-5" />,
      category: "special",
      rarity: "rare",
      points: 350,
      isUnlocked: false,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "11",
      name: "Founding Member",
      description: "One of the first 100 members to join the platform.",
      icon: <Crown className="h-5 w-5" />,
      category: "special",
      rarity: "legendary",
      points: 1500,
      unlockedAt: "2023-10-01",
      isUnlocked: true,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "12",
      name: "Innovation Leader",
      description: "Propose and lead innovative community initiatives.",
      icon: <Medal className="h-5 w-5" />,
      category: "contribution",
      rarity: "legendary",
      points: 2500,
      isUnlocked: false,
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  const unlockedAchievements = achievements.filter((a) => a.isUnlocked)
  const inProgressAchievements = achievements.filter((a) => !a.isUnlocked && a.progress)
  const lockedAchievements = achievements.filter((a) => !a.isUnlocked && !a.progress)
  const recentAchievements = unlockedAchievements
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3)

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
      case "participation":
        return <Users className="h-4 w-4" />
      case "contribution":
        return <MessageCircle className="h-4 w-4" />
      case "milestone":
        return <Trophy className="h-4 w-4" />
      case "special":
        return <Crown className="h-4 w-4" />
      default:
        return <Award className="h-4 w-4" />
    }
  }

  const levelProgress = (memberStats.currentLevelXP / memberStats.nextLevelXP) * 100

  return (
    <div className="space-y-6">
      {/* Member Level and Progress */}
      <Card className="glass-effect border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 ring-4 ring-purple-200">
                  <AvatarImage src="/placeholder.svg?height=64&width=64" />
                  <AvatarFallback className="bg-gradient-to-r from-purple-400 to-blue-400 text-white text-xl">
                    {isCurrentUser ? "You" : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {memberStats.level}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isCurrentUser ? "Your Progress" : "Member Progress"}
                </h3>
                <p className="text-gray-600">
                  Level {memberStats.level} • {memberStats.totalPoints.toLocaleString()} points
                </p>
              </div>
            </div>
            {isCurrentUser && (
              <Link href="/store">
                <Button className="bg-violet-700 hover:bg-violet-800 text-white">
                  <Gift className="h-4 w-4 mr-2" />
                  Visit Store
                </Button>
              </Link>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress to Level {memberStats.level + 1}</span>
              <span className="font-medium text-gray-900">
                {memberStats.currentLevelXP} / {memberStats.nextLevelXP} XP
              </span>
            </div>
            <Progress value={levelProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-effect border-gray-100">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{memberStats.eventsAttended}</p>
            <p className="text-sm text-gray-600">Events Attended</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-gray-100">
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{memberStats.postsCreated}</p>
            <p className="text-sm text-gray-600">Posts Created</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-gray-100">
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 text-pink-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{memberStats.likesReceived}</p>
            <p className="text-sm text-gray-600">Likes Received</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-gray-100">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {memberStats.achievementsUnlocked}/{memberStats.totalAchievements}
            </p>
            <p className="text-sm text-gray-600">Achievements</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-effect border-0 p-2 rounded-2xl">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="unlocked"
            className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
          >
            Unlocked ({unlockedAchievements.length})
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
          >
            In Progress ({inProgressAchievements.length})
          </TabsTrigger>
          <TabsTrigger
            value="locked"
            className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
          >
            Locked ({lockedAchievements.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Recent Achievements */}
          <Card className="glass-effect border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAchievements.map((achievement, index) => (
                <InViewTransition key={achievement.id} effect="slide-up" delay={index * 100}>
                  <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                    <div className="relative">
                      <Image
                        src={achievement.image || "/placeholder.svg"}
                        alt={achievement.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      <div className="absolute -top-1 -right-1">
                        <div
                          className={`w-5 h-5 ${getRarityColor(achievement.rarity)} rounded-full flex items-center justify-center`}
                        >
                          <AnimatedIcon icon={achievement.icon} animationType="pulse" className="text-white text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={`${getRarityColor(achievement.rarity)} text-white border-0 text-xs capitalize`}
                        >
                          {achievement.rarity}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                          +{achievement.points} points
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {achievement.unlockedAt && new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  </div>
                </InViewTransition>
              ))}
            </CardContent>
          </Card>

          {/* Progress Highlights */}
          <Card className="glass-effect border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Progress Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inProgressAchievements.slice(0, 3).map((achievement, index) => (
                <InViewTransition key={achievement.id} effect="fade" delay={index * 100}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Image
                            src={achievement.image || "/placeholder.svg"}
                            alt={achievement.name}
                            width={32}
                            height={32}
                            className="rounded-full opacity-75"
                          />
                          <div className="absolute inset-0 bg-gray-500/20 rounded-full flex items-center justify-center">
                            <Lock className="h-3 w-3 text-gray-600" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                          <p className="text-xs text-gray-600">
                            {achievement.progress?.current} / {achievement.progress?.total}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getRarityColor(achievement.rarity)} text-white border-0 text-xs capitalize`}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    {achievement.progress && (
                      <Progress
                        value={(achievement.progress.current / achievement.progress.total) * 100}
                        className="h-2"
                      />
                    )}
                  </div>
                </InViewTransition>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unlocked Tab */}
        <TabsContent value="unlocked" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedAchievements.map((achievement, index) => (
              <InViewTransition key={achievement.id} effect="fade" delay={index * 50}>
                <HoverScale scale={1.02}>
                  <Card className="glass-effect border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <Image
                            src={achievement.image || "/placeholder.svg"}
                            alt={achievement.name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                          <div className="absolute -top-1 -right-1">
                            <div
                              className={`w-5 h-5 ${getRarityColor(achievement.rarity)} rounded-full flex items-center justify-center`}
                            >
                              <AnimatedIcon
                                icon={achievement.icon}
                                animationType="pulse"
                                className="text-white text-xs"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                              {getCategoryIcon(achievement.category)}
                              <span className="ml-1 capitalize">{achievement.category}</span>
                            </Badge>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge
                          className={`${getRarityColor(achievement.rarity)} text-white border-0 text-xs capitalize`}
                        >
                          {achievement.rarity}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm">
                          <Sparkles className="h-3 w-3 text-yellow-500" />
                          <span className="font-medium text-gray-900">+{achievement.points}</span>
                        </div>
                      </div>
                      {achievement.unlockedAt && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </HoverScale>
              </InViewTransition>
            ))}
          </div>
        </TabsContent>

        {/* In Progress Tab */}
        <TabsContent value="progress" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressAchievements.map((achievement, index) => (
              <InViewTransition key={achievement.id} effect="slide-up" delay={index * 100}>
                <Card className="glass-effect border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <Image
                          src={achievement.image || "/placeholder.svg"}
                          alt={achievement.name}
                          width={48}
                          height={48}
                          className="rounded-full opacity-75"
                        />
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                            {getCategoryIcon(achievement.category)}
                            <span className="ml-1 capitalize">{achievement.category}</span>
                          </Badge>
                          <Badge className="bg-blue-500 text-white border-0 text-xs">In Progress</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                    {achievement.progress && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-900">
                            {achievement.progress.current} / {achievement.progress.total}
                          </span>
                        </div>
                        <Progress
                          value={(achievement.progress.current / achievement.progress.total) * 100}
                          className="h-2"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge className={`${getRarityColor(achievement.rarity)} text-white border-0 text-xs capitalize`}>
                        {achievement.rarity}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Sparkles className="h-3 w-3 text-yellow-500" />
                        <span className="font-medium text-gray-900">+{achievement.points}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </InViewTransition>
            ))}
          </div>
        </TabsContent>

        {/* Locked Tab */}
        <TabsContent value="locked" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedAchievements.map((achievement, index) => (
              <InViewTransition key={achievement.id} effect="fade" delay={index * 50}>
                <Card className="glass-effect border-gray-100 opacity-75 hover:opacity-90 transition-opacity duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <Image
                          src={achievement.image || "/placeholder.svg"}
                          alt={achievement.name}
                          width={48}
                          height={48}
                          className="rounded-full opacity-50"
                        />
                        <div className="absolute inset-0 bg-gray-500/30 rounded-full flex items-center justify-center">
                          <Lock className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-700">{achievement.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                            {getCategoryIcon(achievement.category)}
                            <span className="ml-1 capitalize">{achievement.category}</span>
                          </Badge>
                          <Lock className="h-3 w-3 text-gray-500" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-gray-400 text-white border-0 text-xs capitalize">{achievement.rarity}</Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Sparkles className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-gray-500">+{achievement.points}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </InViewTransition>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
