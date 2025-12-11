"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  Calendar,
  Loader2,
  MessageSquare,
  Star,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface UserPointsSummary {
  total_points: number;
  report_count: number;
  posts_created: number;
  events_joined: number;
  communities_joined: number;
  active_days: number;
  last_activity_at: string | null;
}

interface UserPointsCardProps {
  userId: string;
  className?: string;
  compact?: boolean;
}

export function UserPointsCard({
  userId,
  className,
  compact = false,
}: UserPointsCardProps) {
  const [points, setPoints] = useState<UserPointsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPoints = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/user/${userId}/points`);
        if (response.ok) {
          const data = await response.json();
          setPoints(data);
        } else {
          setPoints(null);
        }
      } catch (error) {
        console.error("Error fetching points:", error);
        setPoints(null);
      }
      setIsLoading(false);
    };

    loadPoints();
  }, [userId]);

  if (isLoading) {
    return (
      <Card className={cn("border-gray-200", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!points) {
    return (
      <Card className={cn("border-gray-200", className)}>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">No points data available</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge className="bg-purple-100 text-purple-700">
          <Star className="h-3 w-3 mr-1" />
          {points.total_points} pts
        </Badge>
        {points.report_count > 0 && (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {points.report_count} reports
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("border-gray-200", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">User Points</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points and Reports - Shown Separately */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                Activity Points
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {points.total_points}
            </p>
          </div>

          <div className={cn(
            "p-3 rounded-lg",
            points.report_count > 0 ? "bg-red-50" : "bg-gray-50"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={cn(
                "h-4 w-4",
                points.report_count > 0 ? "text-red-600" : "text-gray-400"
              )} />
              <span className="text-sm font-medium text-gray-700">
                Reports
              </span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              points.report_count > 0 ? "text-red-600" : "text-gray-400"
            )}>
              {points.report_count}
            </p>
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Posts Created</span>
            </div>
            <span className="font-semibold text-gray-900">
              {points.posts_created}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Events Joined</span>
            </div>
            <span className="font-semibold text-gray-900">
              {points.events_joined}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Communities Joined</span>
            </div>
            <span className="font-semibold text-gray-900">
              {points.communities_joined}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Active Days</span>
            </div>
            <span className="font-semibold text-gray-900">
              {points.active_days}
            </span>
          </div>
        </div>

        {/* Last Activity */}
        {points.last_activity_at && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Last active:{" "}
              {new Date(points.last_activity_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

