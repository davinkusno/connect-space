"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Spinner } from "@/components/ui/loading-indicators";
import { Trophy, Upload, Eye, Save, X } from "lucide-react";

export interface StoreBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  purchaseCount?: number;
}

interface BadgeFormProps {
  badge?: StoreBadge;
  onSubmit: (badge: Omit<StoreBadge, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BadgeForm({
  badge,
  onSubmit,
  onCancel,
  isLoading = false,
}: BadgeFormProps) {
  const [formData, setFormData] = useState({
    name: badge?.name || "",
    description: badge?.description || "",
    icon: "Trophy",
    price: badge?.price || 100,
    image: badge?.image || "",
    isActive: badge?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Badge name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Badge name must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (formData.price < 1) {
      newErrors.price = "Price must be at least 1 point";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        purchaseCount: badge?.purchaseCount || 0,
      });
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Fields */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h4>
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Badge Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter badge name"
                    className={`mt-1 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-200 ${
                      errors.name ? "border-red-500" : ""
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium text-gray-700"
                  >
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what this badge represents and how to earn it"
                    rows={4}
                    className={`mt-1 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-200 ${
                      errors.description ? "border-red-500" : ""
                    }`}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="price"
                    className="text-sm font-medium text-gray-700"
                  >
                    Price (Points) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number.parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="100"
                    className={`mt-1 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-200 ${
                      errors.price ? "border-red-500" : ""
                    }`}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600 mt-1">{errors.price}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Badge Image
              </h4>
              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="image"
                    className="text-sm font-medium text-gray-700"
                  >
                    Image URL
                  </Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    placeholder="https://example.com/badge-image.png"
                    className="mt-1 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white border-gray-300"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <span className="text-sm text-gray-500">
                    or enter URL above
                  </span>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Settings
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="isActive"
                    className="text-sm font-medium text-gray-700"
                  >
                    Active Status
                  </Label>
                  <p className="text-sm text-gray-500">
                    Badge is available for purchase
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </h4>

              {/* Badge Preview Card */}
              <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
                {/* Badge Header with Purple Gradient */}
                <div className="h-20 bg-gradient-to-br from-purple-500 to-indigo-600 relative">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-2 right-2">
                    {formData.isActive ? (
                      <Badge className="bg-green-500 text-white text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-500 text-white text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Badge Image */}
                <div className="relative -mt-6 flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                    {formData.image ? (
                      <img
                        src={formData.image || "/placeholder.svg"}
                        alt={formData.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove(
                            "hidden"
                          );
                        }}
                      />
                    ) : null}
                    <div className={formData.image ? "hidden" : ""}>
                      <Trophy className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Badge Content */}
                <div className="p-4 pt-2">
                  <div className="text-center">
                    <h5 className="font-bold text-gray-900 text-base mb-2">
                      {formData.name || "Badge Name"}
                    </h5>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {formData.description ||
                        "Badge description will appear here"}
                    </p>
                    <div className="text-lg font-bold text-purple-600">
                      {formData.price} points
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Details */}
              <div className="mt-4 space-y-3 text-sm bg-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-purple-600">
                    {formData.price} points
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  {formData.isActive ? (
                    <Badge className="bg-green-500 text-white text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500 text-white text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <AnimatedButton
            type="button"
            variant="glass"
            onClick={onCancel}
            disabled={isLoading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </AnimatedButton>
          <AnimatedButton
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          >
            {isLoading ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                {badge ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {badge ? "Update Badge" : "Create Badge"}
              </>
            )}
          </AnimatedButton>
        </div>
      </form>
    </div>
  );
}
