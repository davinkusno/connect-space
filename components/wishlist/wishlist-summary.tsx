"use client"

import type React from "react"
import { Heart, Calendar, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWishlist } from "./wishlist-provider"
import Link from "next/link"
import { AnimatedCard } from "@/components/ui/animated-card"

export const WishlistSummary: React.FC = () => {
  const { wishlist } = useWishlist()

  // Sort events by date (closest first)
  const sortedWishlist = [...wishlist].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // Get only the next 3 upcoming events
  const upcomingEvents = sortedWishlist.slice(0, 3)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  if (wishlist.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-purple-600" />
            Wishlist
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
          <Link href="/events">
            <Button variant="outline" size="sm">
              Discover Events
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <AnimatedCard variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-purple-600 fill-current" />
            My Wishlist
          </div>
          <span className="text-sm font-normal text-muted-foreground">{wishlist.length} events</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <Link href={`/events/${event.id}`} key={event.id} className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent group transition-all duration-200">
                <div className="w-12 h-12 bg-purple-100 rounded-md flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm group-hover:text-purple-600 transition-colors duration-200 truncate">
                    {event.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.date)} • {event.time}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {wishlist.length > 3 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">+{wishlist.length - 3} more events in your wishlist</p>
          </div>
        )}

        <Link href="/wishlist" className="block mt-4">
          <Button variant="outline" className="w-full justify-between" size="sm">
            <span>View all wishlisted events</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </AnimatedCard>
  )
}
