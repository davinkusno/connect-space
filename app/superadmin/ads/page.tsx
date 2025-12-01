"use client";

import { useState, useEffect } from "react";
import { getClientSession } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar,
  Image as ImageIcon,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { SuperAdminNav } from "@/components/navigation/superadmin-nav";
import { AdsManagement } from "@/components/superadmin/ads-management";
import Link from "next/link";

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

export default function AdsManagementPage() {
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
        start_date: ad.start_date
          ? new Date(ad.start_date).toISOString().split("T")[0]
          : "",
        end_date: ad.end_date
          ? new Date(ad.end_date).toISOString().split("T")[0]
          : "",
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
        throw new Error("Failed to delete ad");
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

  const getPlacementColor = (placement: string) => {
    switch (placement) {
      case "sidebar":
        return "bg-blue-100 text-blue-700";
      case "banner":
        return "bg-purple-100 text-purple-700";
      case "inline":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <SuperAdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/superadmin">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-violet-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </Link>
        </div>

        <AdsManagement />
      </div>
    </div>
  );
}

