"use client"

import type React from "react"
import { MapPin, Clock, Users, Tag, Star, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AnimatedButton } from "@/components/ui/animated-button"
import { WishlistButton } from "./wishlist-button"
import type { Event } from "./wishlist-provider"
import Link from "next/link"
import { AnimatedCard } from "@/components/ui/animated-card"

interface WishlistEventCardProps {
  event: Event
  onRemove?: () => void
}

export const WishlistEventCard: React.FC<WishlistEventCardProps> = ({ event, onRemove }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      full: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    }
  }

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price}`
  }

  const isUpcoming = () => {
    const eventDate = new Date(event.date)
    const now = new Date()
    return eventDate >= now
  }

  const dateInfo = formatDate(event.date)

  return (
    <AnimatedCard variant="3d" className="group overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col lg:flex-row">
        {/* Event Image & Date */}
        <div className="relative lg:w-80 h-64 lg:h-auto">
          <img
            src={event.image || "/placeholder.svg?height=300&width=400"}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Overlay Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {event.featured && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            <Badge
              className={`${
                event.price === 0 ? "bg-green-500 text-white" : "bg-blue-500 text-white"
              } border-0 shadow-lg`}
            >
              {formatPrice(event.price)}
            </Badge>
          </div>

          {/* Date Card */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 text-center shadow-lg">
            <div className="text-2xl font-bold text-gray-900">{dateInfo.day}</div>
            <div className="text-sm font-medium text-purple-600 uppercase">{dateInfo.month}</div>
            <div className="text-xs text-gray-500">{dateInfo.weekday}</div>
          </div>

          {/* Wishlist Button */}
          <div className="absolute bottom-4 right-4">
            <WishlistButton
              event={event}
              variant="secondary"
              className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white"
            />
          </div>

          {/* Status Indicator */}
          {!isUpcoming() && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="bg-gray-800 text-white">
                Past Event
              </Badge>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="p-8 lg:flex-1 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                    {event.category}
                  </Badge>
                  {event.communityName && (
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                      {event.communityName}
                    </Badge>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300 mb-2">
                  {event.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{dateInfo.full}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-6 line-clamp-3 leading-relaxed">{event.description}</p>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-3 text-purple-500" />
                <div>
                  <div className="font-medium">{event.time}</div>
                  {event.endTime && <div className="text-sm text-gray-500">Until {event.endTime}</div>}
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-3 text-purple-500" />
                <div className="font-medium">{event.location}</div>
              </div>

              <div className="flex items-center text-gray-600">
                <Users className="w-5 h-5 mr-3 text-purple-500" />
                <div>
                  <div className="font-medium">
                    {event.attendees}/{event.maxAttendees} attendees
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round((event.attendees / event.maxAttendees) * 100)}% full
                  </div>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <Tag className="w-5 h-5 mr-3 text-purple-500" />
                <div className="font-medium">by {event.organizer}</div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {event.tags.slice(0, 4).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </Badge>
              ))}
              {event.tags.length > 4 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                  +{event.tags.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={onRemove}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                Remove from Wishlist
              </AnimatedButton>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/events/${event.id}`}>
                <AnimatedButton
                  variant="gradient"
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Details
                </AnimatedButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AnimatedCard>
  )
}
