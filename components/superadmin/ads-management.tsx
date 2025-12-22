"use client";

import { AdImageUpload } from "@/components/superadmin/ad-image-upload";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getClientSession } from "@/lib/supabase/client";
import {
    Calendar, Edit, ExternalLink, Eye, Filter, Image as ImageIcon, Loader2, Megaphone, Plus, Search, Trash2, TrendingUp, X
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Ad {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  placement: "sidebar" | "banner" | "inline";
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  // New multi-community support
  communities?: Array<{
    id: string;
    name: string;
    logo_url?: string;
  }>;
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
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    community_ids: [] as string[], // Support multiple communities
    placement: "sidebar" as "sidebar" | "banner" | "inline",
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
        // Clear search results but keep selected communities in state for badge display
        setCommunities(prev => {
          // Keep only communities that are currently selected
          const selectedCommunityIds = formData.community_ids;
          return prev.filter(c => selectedCommunityIds.includes(c.id));
        });
        setIsLoadingCommunities(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [communitySearchQuery, formData.community_ids]);

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
      setIsLoadingCommunities(false);
      return;
    }

    try {
      setIsLoadingCommunities(true);
      
      // API uses limit/offset, not page/pageSize
      const limit = 50;
      const offset = 0;
      const response = await fetch(`/api/communities?limit=${limit}&offset=${offset}&search=${encodeURIComponent(searchQuery)}`);
        
      if (!response.ok) {
        console.error("Failed to load communities:", response.status, await response.text());
        return;
      }

      const result = await response.json();
      console.log("Communities API response:", result);
        
      // API returns { communities: [...], total: number }
      if (result.communities && Array.isArray(result.communities)) {
        const pageCommunities = result.communities.map((c: any) => ({
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
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  const handleOpenDialog = (ad?: Ad) => {
    if (ad) {
      setSelectedAd(ad);
      
      // Get community IDs from ad_communities
      const communityIds: string[] = [];
      if ((ad as any).communities && Array.isArray((ad as any).communities)) {
        communityIds.push(...(ad as any).communities.map((c: any) => c.id));
      }
      
      setFormData({
        title: ad.title,
        description: ad.description || "",
        image_url: ad.image_url || "",
        link_url: ad.link_url || "",
        community_ids: communityIds,
        placement: ad.placement,
        is_active: ad.is_active,
        start_date: ad.start_date ? ad.start_date.split("T")[0] : "",
        end_date: ad.end_date ? ad.end_date.split("T")[0] : "",
      });
      
      // Pre-populate communities state for badge display
      const communityList: Array<{ id: string; name: string }> = [];
      if ((ad as any).communities && Array.isArray((ad as any).communities)) {
        communityList.push(...(ad as any).communities.map((c: any) => ({ id: c.id, name: c.name })));
      }
      setCommunities(communityList);
    } else {
      setSelectedAd(null);
      setFormData({
        title: "",
        description: "",
        image_url: "",
        link_url: "",
        community_ids: [],
        placement: "sidebar" as "sidebar" | "banner" | "inline",
        is_active: true,
        start_date: "",
        end_date: "",
      });
      setCommunities([]);
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

    // Validate date range
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate < startDate) {
        toast.error("End date must be after start date");
        return;
      }
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

      const payload = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        // Send community_ids array to backend
        community_ids: formData.community_ids.length > 0 ? formData.community_ids : null,
        // Also send first community as community_id for legacy support
        community_id: formData.community_ids.length > 0 ? formData.community_ids[0] : null,
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
        const errorData = await response.json();
        // Extract error message from API response structure
        const errorMessage = 
          (typeof errorData.error === 'object' && errorData.error?.message) ||
          (typeof errorData.error === 'string' && errorData.error) ||
          errorData.message ||
          "Failed to save ad";
        throw new Error(errorMessage);
      }

      // Get the updated/created ad from the response
      const updatedAd = await response.json();

      toast.success(selectedAd ? "Ad updated successfully" : "Ad created successfully");
      handleCloseDialog();
      
      // Optimistically update the UI with the returned ad data (includes community)
      if (selectedAd) {
        // Update existing ad in the list
        setAds((prevAds) => 
          prevAds.map((ad) => ad.id === selectedAd.id ? updatedAd : ad)
        );
      } else {
        // Add new ad to the beginning of the list
        setAds((prevAds) => [updatedAd, ...prevAds]);
      }
    } catch (error: any) {
      console.error("❌ Error saving ad:", error);
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
        const errorData = await response.json();
        // Extract error message from API response structure
        const errorMessage = 
          (typeof errorData.error === 'object' && errorData.error?.message) ||
          (typeof errorData.error === 'string' && errorData.error) ||
          errorData.message ||
          "Failed to delete ad";
        throw new Error(errorMessage);
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

  // Filter and search ads
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch = 
        !searchQuery ||
        ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        filterStatus === "all" ||
        (filterStatus === "active" && ad.is_active) ||
        (filterStatus === "inactive" && !ad.is_active);
      
      return matchesSearch && matchesStatus;
    });
  }, [ads, searchQuery, filterStatus]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeAds = ads.filter((ad) => ad.is_active).length;
    const totalViews = ads.reduce((sum, ad) => sum + (ad.view_count || 0), 0);
    const totalClicks = ads.reduce((sum, ad) => sum + (ad.click_count || 0), 0);
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00";

    return {
      total: ads.length,
      active: activeAds,
      inactive: ads.length - activeAds,
      totalViews,
      totalClicks,
      ctr,
    };
  }, [ads]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-purple-600" />
            Ads Management
          </h3>
          <p className="text-gray-600 mt-1 text-sm">
            Create and manage advertisements displayed on community pages
          </p>
        </div>
        <AnimatedButton
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Ad
        </AnimatedButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCard variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Ads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Megaphone className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Ads</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Views</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalViews.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Click-Through Rate</p>
              <p className="text-2xl font-bold text-orange-600">{stats.ctr}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ExternalLink className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Filters and Search */}
      <AnimatedCard variant="glass" className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search ads by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(value: "all" | "active" | "inactive") => setFilterStatus(value)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AnimatedCard>

      {isLoading ? (
        <AnimatedCard variant="glass" className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </AnimatedCard>
      ) : filteredAds.length === 0 ? (
        <AnimatedCard variant="glass" className="p-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {ads.length === 0 ? "No ads yet" : "No ads match your filters"}
            </h3>
            <p className="text-gray-600 mb-6">
              {ads.length === 0
                ? "Create your first advertisement to display on community pages."
                : "Try adjusting your search or filter criteria."}
            </p>
            {ads.length === 0 && (
              <AnimatedButton onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Ad
              </AnimatedButton>
            )}
          </div>
        </AnimatedCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map((ad) => {
            // Determine border color based on ad status
            const getBorderColor = () => {
              if (ad.is_active) {
                return "border-green-300 hover:border-green-400";
              }
              return "border-gray-300 hover:border-gray-400";
            };

            return (
            <AnimatedCard key={ad.id} variant="glass" className={`overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full border-2 ${getBorderColor()} bg-white`}>
              {/* Image Section */}
              <div className="relative">
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                  {ad.image_url && ad.image_url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) ? (
                    <video
                      src={ad.image_url}
                      className="w-full h-full object-cover"
                      controls
                      muted
                      playsInline
                    />
                  ) : ad.image_url ? (
                    <Image
                      src={ad.image_url}
                      alt={ad.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <p className="text-gray-400">No image</p>
                    </div>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex gap-2 flex-wrap justify-end">
                  <Badge
                    className={ad.is_active ? "bg-green-500 text-white border-0 shadow-md" : "bg-gray-500 text-white border-0"}
                  >
                    {ad.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {ad.communities && ad.communities.length > 0 && (
                    <Badge
                      className="bg-blue-500 text-white border-0 shadow-md"
                      title={`Targeted to ${ad.communities.length} ${ad.communities.length === 1 ? 'community' : 'communities'}`}
                    >
                      Targeted
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content Section - Fixed structure */}
              <div className="flex flex-col flex-1 p-4">
                {/* Title and Description - Fixed height area */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-2 min-h-[28px]">
                    {ad.title}
                  </h3>
                  <div className="min-h-[40px]">
                    {ad.description ? (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {ad.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        No description
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata Section - Fixed space for target and date */}
                <div className="mb-4">
                  {/* Target Communities - Fixed height with scroll */}
                  <div className="min-h-[56px] max-h-[56px] mb-2">
                    {(ad as any).communities && (ad as any).communities.length > 0 ? (
                      <div className="flex flex-col gap-1 text-xs text-gray-600 bg-blue-50 p-2 rounded-lg h-full">
                        <span className="font-medium flex-shrink-0">Target ({(ad as any).communities.length}):</span>
                        <div className="flex flex-wrap gap-1 overflow-y-auto overflow-x-hidden" style={{ maxHeight: '32px' }}>
                          {(ad as any).communities.map((community: any) => (
                            <span key={community.id} className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 flex-shrink-0 text-[11px] whitespace-nowrap">
                              {community.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 p-2 rounded-lg">
                        <span className="font-medium">🌐 All Communities</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Date Range - Always visible */}
                  <div>
                    {(ad.start_date || ad.end_date) ? (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {ad.start_date && new Date(ad.start_date).toLocaleDateString()}
                          {ad.start_date && ad.end_date && " - "}
                          {ad.end_date && new Date(ad.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>No date range</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Section - Always present */}
                <div className="flex items-center justify-between py-3 border-t border-gray-100 mb-4">
                  <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="font-medium">{ad.view_count || 0}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="font-medium">{ad.click_count || 0}</span>
                    </span>
                    {ad.view_count > 0 && (
                      <span className="text-orange-600 font-medium">
                        {((ad.click_count || 0) / ad.view_count * 100).toFixed(1)}% CTR
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Always at bottom */}
                <div className="flex gap-2 mt-auto">
                  <AnimatedButton
                    variant="glass"
                    size="sm"
                    onClick={() => handleOpenDialog(ad)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </AnimatedButton>
                  <AnimatedButton
                    variant="glass"
                    size="sm"
                    onClick={() => {
                      setSelectedAd(ad);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </AnimatedButton>
                </div>
              </div>
            </AnimatedCard>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-purple-600" />
              {selectedAd ? "Edit Ad" : "Create New Ad"}
            </DialogTitle>
            <DialogDescription>
              {selectedAd
                ? "Update the advertisement details below"
                : "Fill in the details to create a new advertisement for community pages"}
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
                  Target Communities
                  <span className="text-gray-500 text-xs ml-2 font-normal">
                    (Select multiple communities or leave unchecked for all)
                  </span>
                </Label>
                
                {/* Target Selection Mode */}
                <div className="flex gap-4 mb-3 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={formData.community_ids.length === 0}
                      onChange={() => setFormData({ ...formData, community_ids: [] })}
                      className="w-4 h-4 text-violet-600"
                    />
                    <span className="text-sm">🌐 All Communities</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={formData.community_ids.length > 0}
                      onChange={() => {
                        // Switch to specific mode but don't auto-select anything
                        if (formData.community_ids.length === 0) {
                          setFormData({ ...formData, community_ids: [] });
                        }
                      }}
                      className="w-4 h-4 text-violet-600"
                    />
                    <span className="text-sm">🎯 Specific Communities</span>
                  </label>
                </div>

                {/* Community Selection (only show if specific mode) */}
                {formData.community_ids.length > 0 || formData.community_ids.length === 0 ? (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    {/* Search */}
                    <div className="relative mb-3">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search communities..."
                        value={communitySearchQuery}
                        onChange={(e) => setCommunitySearchQuery(e.target.value)}
                        className="pl-8 h-9 text-sm bg-white"
                      />
                      {communitySearchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-0.5 h-7 w-7 p-0"
                          onClick={() => setCommunitySearchQuery("")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Selected Communities Display - Badges with X to remove */}
                    {formData.community_ids.length > 0 && (
                      <div className="mb-3 p-2 bg-violet-50 rounded-md border border-violet-200">
                        <p className="text-xs font-medium text-violet-700 mb-2">
                          Selected ({formData.community_ids.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {formData.community_ids.map((id) => {
                            // Try to find community in search results first
                            let community = communities.find((c) => c.id === id);
                            
                            // If not found in search results, check if editing an ad with community data
                            if (!community && selectedAd) {
                              // Check new format (communities array)
                              if ((selectedAd as any).communities && Array.isArray((selectedAd as any).communities)) {
                                const foundInArray = (selectedAd as any).communities.find((c: any) => c.id === id);
                                if (foundInArray) {
                                  community = {
                                    id: foundInArray.id,
                                    name: foundInArray.name,
                                  };
                                }
                              }
                            }
                            
                            return (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="bg-violet-100 text-violet-700 hover:bg-violet-200 cursor-pointer"
                                onClick={() => {
                                  // Remove from selection
                                  setFormData({
                                    ...formData,
                                    community_ids: formData.community_ids.filter((cid) => cid !== id),
                                  });
                                  // Also remove from communities state so it doesn't reappear in the list
                                  setCommunities(prev => prev.filter(c => c.id !== id));
                                }}
                              >
                                {community?.name || "Loading..."}
                                <X className="ml-1 h-3 w-3" />
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Communities List - Click to Add */}
                    <div className="max-h-[300px] overflow-y-auto border rounded-md bg-white">
                      {isLoadingCommunities ? (
                        <div className="px-2 py-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-violet-600" />
                          <p className="text-sm text-gray-600 font-medium">Loading communities...</p>
                        </div>
                      ) : communities.length > 0 ? (
                        <div>
                          {communities
                            .filter((community) => !formData.community_ids.includes(community.id))
                            .map((community) => (
                              <div
                                key={community.id}
                                onClick={() => {
                                  // Add to array
                                  setFormData({
                                    ...formData,
                                    community_ids: [...formData.community_ids, community.id],
                                  });
                                  // Add to communities state for badge display
                                  setCommunities(prev => {
                                    const exists = prev.find(c => c.id === community.id);
                                    if (exists) return prev;
                                    return [...prev, community];
                                  });
                                }}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <span className="text-sm flex-1">{community.name}</span>
                              </div>
                            ))}
                        </div>
                      ) : communitySearchQuery.trim().length >= 2 ? (
                        <div className="px-2 py-8 text-center">
                          <p className="text-sm text-gray-600 font-medium">No communities found</p>
                          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                        </div>
                      ) : (
                        <div className="px-2 py-8 text-center">
                          <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm text-gray-600 font-medium">Search for communities</p>
                          <p className="text-xs text-gray-400 mt-1">Type at least 2 characters</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {formData.community_ids.length > 0 && (
                  <p className="text-xs text-violet-600 mt-2 font-medium">
                    ✓ This ad will be shown on {formData.community_ids.length} selected{" "}
                    {formData.community_ids.length === 1 ? "community" : "communities"}
                  </p>
                )}
                {formData.community_ids.length === 0 && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    🌐 This ad will be shown on all community pages
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
                  min={formData.start_date || undefined}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
                {formData.start_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Must be on or after start date
                  </p>
                )}
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
            <AnimatedButton
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {selectedAd ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {selectedAd ? "Update Ad" : "Create Ad"}
                </>
              )}
            </AnimatedButton>
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

