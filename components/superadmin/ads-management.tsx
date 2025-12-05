"use client";

import { useState, useEffect } from "react";
import { getClientSession } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { AdImageUpload } from "@/components/superadmin/ad-image-upload";

interface Ad {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  community_id?: string;
  placement: "sidebar" | "banner" | "inline";
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface Community {
  id: string;
  name: string;
}

export function AdsManagement() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [communitySearchQuery, setCommunitySearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    community_id: "",
    is_active: true,
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    loadAds();
  }, []);

  // Debounced community search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (communitySearchQuery.trim().length >= 2) {
        loadCommunities(communitySearchQuery);
      } else {
        setCommunities([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [communitySearchQuery]);

  const loadAds = async () => {
    try {
      const session = await getClientSession();
      if (!session?.access_token) {
        toast.error("Please log in");
        return;
      }

      const response = await fetch("/api/ads?active_only=false", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load ads");
      }

      const data = await response.json();
      setAds(data.ads || []);
    } catch (error: any) {
      console.error("Error loading ads:", error);
      toast.error(error.message || "Failed to load ads");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommunities = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setCommunities([]);
      return;
    }

    try {
      // Only fetch communities when user types (search-based)
      const response = await fetch(`/api/communities?page=1&pageSize=50&search=${encodeURIComponent(searchQuery)}`);
        
      if (!response.ok) {
        console.error("Failed to load communities:", response.status, await response.text());
        return;
      }

      const result = await response.json();
      console.log("Communities API response:", result);
        
      // API returns { success: true, data: [...], meta: {...} }
      if (result.success && result.data && Array.isArray(result.data)) {
        const pageCommunities = result.data.map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        setCommunities(pageCommunities);
        console.log(`Successfully loaded ${pageCommunities.length} communities`);
      } else {
        console.warn("Unexpected API response format:", result);
        setCommunities([]);
      }
    } catch (error) {
      console.error("Error loading communities:", error);
      toast.error("Failed to load communities list");
      setCommunities([]);
    }
  };

  const handleOpenDialog = (ad?: Ad) => {
    if (ad) {
      setSelectedAd(ad);
      setFormData({
        title: ad.title,
        description: ad.description || "",
        image_url: ad.image_url,
        link_url: ad.link_url || "",
        community_id: ad.community_id || "",
        is_active: ad.is_active,
        start_date: ad.start_date ? ad.start_date.split("T")[0] : "",
        end_date: ad.end_date ? ad.end_date.split("T")[0] : "",
      });
    } else {
      setSelectedAd(null);
      setFormData({
        title: "",
        description: "",
        image_url: "",
        link_url: "",
        community_id: "",
        is_active: true,
        start_date: "",
        end_date: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAd(null);
    setCommunitySearchQuery("");
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image_url) {
      toast.error("Title and image URL are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await getClientSession();
      if (!session?.access_token) {
        toast.error("Please log in");
        return;
      }

      const url = selectedAd
        ? `/api/ads/${selectedAd.id}`
        : "/api/ads";
      const method = selectedAd ? "PATCH" : "POST";

      // Always use sidebar placement since we removed the field
      const payload = {
        ...formData,
        placement: "sidebar",
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        community_id: formData.community_id || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save ad");
      }

      toast.success(selectedAd ? "Ad updated successfully" : "Ad created successfully");
      handleCloseDialog();
      loadAds();
    } catch (error: any) {
      console.error("Error saving ad:", error);
      toast.error(error.message || "Failed to save ad");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAd) return;

    setIsSubmitting(true);
    try {
      const session = await getClientSession();
      if (!session?.access_token) {
        toast.error("Please log in");
        return;
      }

      const response = await fetch(`/api/ads/${selectedAd.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete ad");
      }

      toast.success("Ad deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedAd(null);
      loadAds();
    } catch (error: any) {
      console.error("Error deleting ad:", error);
      toast.error(error.message || "Failed to delete ad");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ads Management</h2>
          <p className="text-gray-600 mt-1">
            Manage advertisements displayed on community pages
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Ad
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : ads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No ads yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first advertisement to display on community pages.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Ad
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <Card key={ad.id} className="border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                    {ad.image_url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) ? (
                      <video
                        src={ad.image_url}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        playsInline
                      />
                    ) : (
                      <Image
                        src={ad.image_url}
                        alt={ad.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2 flex-wrap justify-end">
                    <Badge
                      variant="secondary"
                      className={ad.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
                    >
                      {ad.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {ad.community_id && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700"
                        title={`Targeted to specific community`}
                      >
                        Targeted
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {ad.title}
                  </h3>
                  {ad.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {ad.description}
                    </p>
                  )}
                  {ad.community_id && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Target:</span>{" "}
                        {communities.find((c) => c.id === ad.community_id)?.name || "Unknown community"}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {ad.view_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {ad.click_count || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(ad)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAd(ad);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAd ? "Edit Ad" : "Create New Ad"}
            </DialogTitle>
            <DialogDescription>
              {selectedAd
                ? "Update the advertisement details"
                : "Create a new advertisement to display on community pages"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold">
                Ad Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter ad title"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the advertisement"
                rows={3}
                className="resize-none"
              />
            </div>

            <AdImageUpload
              onImageUrlChange={(url) =>
                setFormData({ ...formData, image_url: url })
              }
              currentImageUrl={formData.image_url}
            />

            <div>
              <Label htmlFor="link_url" className="text-sm font-semibold">
                Link URL (Optional)
              </Label>
              <Input
                id="link_url"
                value={formData.link_url}
                onChange={(e) =>
                  setFormData({ ...formData, link_url: e.target.value })
                }
                placeholder="https://example.com"
                className="h-10"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL users will be directed to when they click the ad
              </p>
            </div>

            <div>
                <Label htmlFor="community_id">
                  Target Community
                  <span className="text-gray-500 text-xs ml-2 font-normal">
                    (Leave as "All communities" to show on all community pages)
                  </span>
                </Label>
                <Select
                  value={formData.community_id || "all"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, community_id: value === "all" ? "" : value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a community or leave as 'All communities'" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="sticky top-0 z-10 bg-white border-b p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search communities..."
                          value={communitySearchQuery}
                          onChange={(e) => setCommunitySearchQuery(e.target.value)}
                          className="pl-8 h-8 text-sm"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                        {communitySearchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-0.5 h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCommunitySearchQuery("");
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <SelectItem value="all" className="font-semibold">
                        🌐 All communities
                      </SelectItem>
                      {communities.length > 0 ? (
                        communities.map((community) => (
                          <SelectItem key={community.id} value={community.id}>
                            {community.name}
                          </SelectItem>
                        ))
                      ) : (
                        communitySearchQuery.trim().length >= 2 && (
                          <div className="px-2 py-6 text-center text-sm text-gray-500">
                            No communities found
                          </div>
                        )
                      )}
                      {communitySearchQuery.trim().length < 2 && (
                        <div className="px-2 py-6 text-center text-sm text-gray-500">
                          Type at least 2 characters to search communities
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
                {formData.community_id && (
                  <p className="text-xs text-violet-600 mt-1 font-medium">
                    ✓ This ad will only be shown on the selected community's page
                  </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                Active (ad will be displayed)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {selectedAd ? "Updating..." : "Creating..."}
                </>
              ) : (
                selectedAd ? "Update Ad" : "Create Ad"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAd?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

