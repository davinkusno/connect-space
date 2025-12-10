"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Activity, AlertTriangle, Calendar, Loader2, MessageSquare, Star, TrendingDown, TrendingUp, Users
} from "lucide-react";
import { useEffect, useState } from "react";

interface UserReputation {
  activity_points: number;
  report_points: number;
  report_count: number;
  posts_created: number;
  events_joined: number;
  communities_joined: number;
  active_days: number;
  last_activity_at: string | null;
  reputation_score: number;
}

interface UserReputationCardProps {
  userId: string;
  className?: string;
  compact?: boolean;
}

export function UserReputationCard({
  userId,
  className,
  compact = false,
}: UserReputationCardProps) {
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReputation = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/user/${userId}/reputation/full`);
        if (response.ok) {
          const data = await response.json();
          setReputation(data);
        } else {
          setReputation(null);
        }
      } catch (error) {
        console.error("Error fetching reputation:", error);
        setReputation(null);
      }
      setIsLoading(false);
    };

    loadReputation();
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

  if (!reputation) {
    return (
      <Card className={cn("border-gray-200", className)}>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">No reputation data available</p>
        </CardContent>
      </Card>
    );
  }

  const getReputationBadge = (score: number) => {
    if (score >= 500) {
      return { label: "Excellent", color: "bg-green-100 text-green-700" };
    } else if (score >= 200) {
      return { label: "Good", color: "bg-blue-100 text-blue-700" };
    } else if (score >= 50) {
      return { label: "Fair", color: "bg-yellow-100 text-yellow-700" };
    } else if (score >= 0) {
      return { label: "New", color: "bg-gray-100 text-gray-700" };
    } else {
      return { label: "Warning", color: "bg-red-100 text-red-700" };
    }
  };

  const reputationBadge = getReputationBadge(reputation.reputation_score);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge className={reputationBadge.color}>
          <Star className="h-3 w-3 mr-1" />
          {reputation.reputation_score} pts
        </Badge>
        {reputation.report_count > 0 && (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {reputation.report_count} reports
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("border-gray-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">User Reputation</CardTitle>
          <Badge className={reputationBadge.color}>
            {reputationBadge.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reputation Score */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Reputation Score</span>
          </div>
          <span
            className={cn(
              "text-2xl font-bold",
              reputation.reputation_score >= 0
                ? "text-green-600"
                : "text-red-600"
            )}
          >
            {reputation.reputation_score > 0 ? "+" : ""}
            {reputation.reputation_score}
          </span>
        </div>

        {/* Activity Points */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                Activity Points
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {reputation.activity_points}
            </p>
          </div>

          {reputation.report_points > 0 && (
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700">
                  Report Points
                </span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                -{reputation.report_points}
              </p>
            </div>
          )}
        </div>

        {/* Activity Breakdown */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Posts Created</span>
            </div>
            <span className="font-semibold text-gray-900">
              {reputation.posts_created}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Events Joined</span>
            </div>
            <span className="font-semibold text-gray-900">
              {reputation.events_joined}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Communities Joined</span>
            </div>
            <span className="font-semibold text-gray-900">
              {reputation.communities_joined}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Active Days</span>
            </div>
            <span className="font-semibold text-gray-900">
              {reputation.active_days}
            </span>
          </div>

          {reputation.report_count > 0 && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-red-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-red-600 font-medium">Reports Received</span>
              </div>
              <span className="font-semibold text-red-600">
                {reputation.report_count}
              </span>
            </div>
          )}
        </div>

        {/* Last Activity */}
        {reputation.last_activity_at && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Last active:{" "}
              {new Date(reputation.last_activity_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

