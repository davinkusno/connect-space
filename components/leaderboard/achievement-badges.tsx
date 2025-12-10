"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Award, Calendar, Crown, Flame, Heart, MessageCircle, Star, Target, Users, Zap } from "lucide-react"

const achievementCategories = [
  {
    title: "Community Engagement",
    description: "Achievements for active participation",
    achievements: [
      {
        name: "First Steps",
        description: "Join your first community",
        icon: Users,
        progress: 100,
        unlocked: true,
        points: 50,
      },
      {
        name: "Social Butterfly",
        description: "Join 10 different communities",
        icon: Heart,
        progress: 80,
        unlocked: false,
        points: 200,
      },
      {
        name: "Community Champion",
        description: "Be active in 25 communities",
        icon: Crown,
        progress: 45,
        unlocked: false,
        points: 500,
      },
    ],
  },
  {
    title: "Content Creation",
    description: "Achievements for creating valuable content",
    achievements: [
      {
        name: "First Post",
        description: "Create your first community post",
        icon: MessageCircle,
        progress: 100,
        unlocked: true,
        points: 25,
      },
      {
        name: "Content Creator",
        description: "Create 50 posts",
        icon: Star,
        progress: 75,
        unlocked: false,
        points: 300,
      },
      {
        name: "Viral Sensation",
        description: "Get 1000 likes on a single post",
        icon: Flame,
        progress: 20,
        unlocked: false,
        points: 1000,
      },
    ],
  },
  {
    title: "Event Participation",
    description: "Achievements for attending and organizing events",
    achievements: [
      {
        name: "Event Attendee",
        description: "Attend your first event",
        icon: Calendar,
        progress: 100,
        unlocked: true,
        points: 75,
      },
      {
        name: "Event Enthusiast",
        description: "Attend 20 events",
        icon: Target,
        progress: 60,
        unlocked: false,
        points: 400,
      },
      {
        name: "Event Master",
        description: "Organize 10 successful events",
        icon: Award,
        progress: 30,
        unlocked: false,
        points: 750,
      },
    ],
  },
]

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Community Engagement":
      return "from-blue-400 to-blue-600"
    case "Content Creation":
      return "from-purple-400 to-purple-600"
    case "Event Participation":
      return "from-yellow-400 to-orange-500"
    default:
      return "from-gray-400 to-gray-600"
  }
}

export function AchievementBadges() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🏅 Achievement Gallery</h2>
        <p className="text-muted-foreground">Unlock badges by participating in community activities</p>
      </div>

      {achievementCategories.map((category, categoryIndex) => (
        <Card key={categoryIndex} className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {category.title}
            </CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.achievements.map((achievement, index) => (
                <Card
                  key={index}
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                    achievement.unlocked
                      ? "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg"
                      : "bg-gray-50 dark:bg-gray-800/50 opacity-75"
                  }`}
                >
                  {/* Achievement Glow */}
                  {achievement.unlocked && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-600 opacity-10`}
                    />
                  )}

                  <CardContent className="p-6 text-center relative">
                    {/* Achievement Icon */}
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-400 to-blue-600 flex items-center justify-center ${
                        achievement.unlocked ? "shadow-lg" : "grayscale opacity-50"
                      }`}
                    >
                      <achievement.icon className="h-8 w-8 text-white" />
                    </div>

                    {/* Achievement Info */}
                    <h3 className="font-bold text-lg mb-2">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>


                    {/* Progress */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <Progress
                        value={achievement.progress}
                        className={`h-2 ${achievement.unlocked ? "" : "opacity-50"}`}
                      />
                    </div>

                    {/* Points */}
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {achievement.points} points
                    </div>

                    {/* Unlocked Status */}
                    {achievement.unlocked && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Zap className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
