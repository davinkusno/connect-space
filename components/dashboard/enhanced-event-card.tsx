"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Clock,
  Calendar,
  Heart,
  Share,
  MoreHorizontal,
  ExternalLink,
  Bell,
  Star,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EventData {
  id: number;
  title: string;
  community: string;
  date: string;
  time: string;
  location: string;
  status: "attending" | "saved" | "not_attending";
  attendees: number;
  capacity: number;
  type: string;
  priority: "high" | "medium" | "low";
  image: string;
  description?: string;
  organizer?: {
    name: string;
    avatar: string;
  };
  tags?: string[];
}

interface EnhancedEventCardProps {
  event: EventData;
  variant?: "compact" | "detailed";
  className?: string;
}

export function EnhancedEventCard({
  event,
  variant = "detailed",
  className,
}: EnhancedEventCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "attending":
        return "bg-green-500 hover:bg-green-600 text-white border-0";
      case "saved":
        return "bg-blue-500 hover:bg-blue-600 text-white border-0";
      case "not_attending":
        return "bg-gray-500 hover:bg-gray-600 text-white border-0";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white border-0";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const attendancePercentage = (event.attendees / event.capacity) * 100;

  if (variant === "compact") {
    return (
      <Link href={`/events/${event.id}`}>
        <Card
          className={cn(
            "border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 group cursor-pointer h-full",
            className
          )}
        >
          <CardContent className="p-0">
            <div className="relative h-24 w-full overflow-hidden rounded-t-lg">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
              <img
                src={event.image || "/placeholder.svg"}
                alt={event.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-1 right-1">
                <Badge
                  variant="outline"
                  className={`text-xs ${getStatusColor(event.status)}`}
                >
                  {event.status === "attending"
                    ? "Interested"
                    : event.status === "saved"
                    ? "Saved"
                    : "Not Interested"}
                </Badge>
              </div>
              <div className="absolute bottom-1 left-1 bg-white/90 backdrop-blur-sm rounded-lg px-1.5 py-0.5 text-xs font-medium text-gray-900">
                {new Date(event.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                • {event.time}
              </div>
            </div>
            <div className="p-2">
              <h3 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {event.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-[80px]">
                    {event.location}
                  </span>
                </span>
                <Badge
                  variant="outline"
                  className="text-xs px-1 py-0 h-4 border-gray-200"
                >
                  {event.community}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card
      className={cn(
        "border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 group h-full overflow-hidden",
        className
      )}
    >
      {/* Event Image Header */}
      <div className="relative h-48 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
        <img
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Header Actions */}
        <div className="absolute top-3 right-3 flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-black/20 text-white hover:bg-black/40"
          >
            <Heart className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-black/20 text-white hover:bg-black/40"
          >
            <Share className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-black/20 text-white hover:bg-black/40"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>

        {/* Priority Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className={`text-xs ${getPriorityColor(
              event.priority
            )} bg-white/90 backdrop-blur-sm`}
          >
            {event.priority} priority
          </Badge>
        </div>

        {/* Date/Time Badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-900">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(event.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <span>•</span>
            <Clock className="h-4 w-4" />
            <span>{event.time}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute bottom-3 right-3">
          <Badge className={getStatusColor(event.status)}>
            {event.status === "attending"
              ? "✓ Interested"
              : event.status === "saved"
              ? "🔖 Saved"
              : "✗ Not Interested"}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Event Title and Type */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
              {event.title}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {event.type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {event.community}
              </Badge>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Location */}
        <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="truncate">{event.location}</span>
        </div>

        {/* Organizer */}
        {event.organizer && (
          <div className="flex items-center space-x-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {event.organizer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">
              Organized by {event.organizer.name}
            </span>
          </div>
        )}

        {/* Attendance Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Attendance</span>
            <span className="text-gray-900 font-medium">
              {event.attendees}/{event.capacity} people
            </span>
          </div>
          <Progress value={attendancePercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{Math.round(attendancePercentage)}% full</span>
            <span>{event.capacity - event.attendees} spots left</span>
          </div>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {event.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs px-2 py-0 h-5"
              >
                {tag}
              </Badge>
            ))}
            {event.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                +{event.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link href={`/events/${event.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="px-3">
            <Bell className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" className="px-3">
            <Star className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
