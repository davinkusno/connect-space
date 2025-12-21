"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Shield,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CommunityStats {
  memberCount: number;
  eventCount: number;
  reportCount: number;
  pendingRequests: number;
}

interface RecentEvent {
  id: string;
  title: string;
  start_time: string;
  created_at: string;
}

interface Creator {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface CommunityDetails {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  location: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  is_private: boolean;
  status: string;
  creator: Creator;
  stats: CommunityStats;
  recentEvents: RecentEvent[];
}

interface CommunityDetailDialogProps {
  communityId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CommunityDetailDialog({
  communityId,
  isOpen,
  onClose,
}: CommunityDetailDialogProps) {
  const [community, setCommunity] = useState<CommunityDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && communityId) {
      loadCommunityDetails();
    }
  }, [isOpen, communityId]);

  const loadCommunityDetails = async () => {
    if (!communityId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/communities/${communityId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to load community details");
      }

      const data = await response.json();
      setCommunity(data);
    } catch (error) {
      console.error("Error loading community details:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load community details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Active
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Suspended
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status || "Unknown"}</Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Community Details</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Read-only view for superadmin review
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : community ? (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={community.logo_url || undefined} alt={community.name} />
                <AvatarFallback className="text-2xl">
                  {community.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900">{community.name}</h2>
                  {getStatusBadge(community.status)}
                  {community.is_private && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>

                {community.category && (
                  <Badge variant="secondary" className="mb-2">
                    {community.category}
                  </Badge>
                )}

                <p className="text-gray-700 mt-2">{community.description}</p>

                {community.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <MapPin className="w-4 h-4" />
                    <span>{community.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Members</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {community.stats.memberCount}
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Events</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {community.stats.eventCount}
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Reports</span>
                </div>
                <div className="text-2xl font-bold text-red-900">
                  {community.stats.reportCount}
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">Pending</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {community.stats.pendingRequests}
                </div>
              </div>
            </div>

            {/* Creator Info */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Creator Information</h3>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={community.creator.avatar_url || undefined} />
                  <AvatarFallback>
                    {community.creator.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-gray-900">
                    {community.creator.full_name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3 h-3" />
                    {community.creator.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Events */}
            {community.recentEvents && community.recentEvents.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Recent Events</h3>
                <div className="space-y-2">
                  {community.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(event.start_time)}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Event
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Created</span>
                </div>
                <div>{formatDate(community.created_at)}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Last Updated</span>
                </div>
                <div>{formatDate(community.updated_at)}</div>
              </div>
            </div>

            {/* Warning Note */}
            <div className="border-t pt-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Superadmin Quick Preview</p>
                    <p className="mb-3">
                      This is a quick preview of the community details. For deeper investigation
                      (view discussions, posts, member activity), click the button below to access
                      the full community page.
                    </p>
                    <Link href={`/communities/${community.id}`} target="_blank">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Full Community Page
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>No community data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

