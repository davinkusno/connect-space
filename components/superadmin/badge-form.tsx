"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Spinner } from "@/components/ui/loading-indicators"
import {
  Trophy,
  Star,
  Award,
  Crown,
  Gift,
  Medal,
  Sparkles,
  Heart,
  Target,
  Flame,
  CalendarIcon,
  Upload,
  Eye,
  Save,
  X,
} from "lucide-react"
import { format } from "date-fns"

export interface StoreBadge {
  id: string
  name: string
  description: string
  icon: string
  category: "achievement" | "cosmetic" | "special" | "seasonal"
  rarity: "common" | "rare" | "epic" | "legendary"
  price: number
  image: string
  isActive: boolean
  isLimited?: boolean
  limitedQuantity?: number
  limitedRemaining?: number
  expiresAt?: string
  createdAt: string
  updatedAt: string
  purchaseCount?: number
  revenue?: number
}

interface BadgeFormProps {
  badge?: StoreBadge
  onSubmit: (badge: Omit<StoreBadge, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
  isLoading?: boolean
}

const iconOptions = [
  { name: "Trophy", component: Trophy },
  { name: "Star", component: Star },
  { name: "Award", component: Award },
  { name: "Crown", component: Crown },
  { name: "Gift", component: Gift },
  { name: "Medal", component: Medal },
  { name: "Sparkles", component: Sparkles },
  { name: "Heart", component: Heart },
  { name: "Target", component: Target },
  { name: "Flame", component: Flame },
]

export function BadgeForm({ badge, onSubmit, onCancel, isLoading = false }: BadgeFormProps) {
  const [formData, setFormData] = useState({
    name: badge?.name || "",
    description: badge?.description || "",
    icon: badge?.icon || "Trophy",
    category: badge?.category || "achievement",
    rarity: badge?.rarity || "common",
    price: badge?.price || 100,
    image: badge?.image || "",
    isActive: badge?.isActive ?? true,
    isLimited: badge?.isLimited || false,
    limitedQuantity: badge?.limitedQuantity || 100,
    limitedRemaining: badge?.limitedRemaining || 100,
    expiresAt: badge?.expiresAt || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Badge name is required"
    } else if (formData.name.length < 3) {
      newErrors.name = "Badge name must be at least 3 characters"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    }

    if (formData.price < 1) {
      newErrors.price = "Price must be at least 1 point"
    }

    if (formData.isLimited) {
      if (formData.limitedQuantity < 1) {
        newErrors.limitedQuantity = "Limited quantity must be at least 1"
      }
      if (formData.limitedRemaining > formData.limitedQuantity) {
        newErrors.limitedRemaining = "Remaining quantity cannot exceed total quantity"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({
        ...formData,
        purchaseCount: badge?.purchaseCount || 0,
        revenue: badge?.revenue || 0,
      })
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "from-gray-400 to-gray-600"
      case "rare":
        return "from-blue-400 to-blue-600"
      case "epic":
        return "from-purple-400 to-purple-600"
      case "legendary":
        return "from-yellow-400 to-yellow-600"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500"
      case "rare":
        return "bg-blue-500"
      case "epic":
        return "bg-purple-500"
      case "legendary":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((option) => option.name === iconName)
    return iconOption ? iconOption.component : Trophy
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Fields */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Badge Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter badge name"
                    className={`mt-1 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-200 ${
                      errors.name ? "border-red-500" : ""
                    }`}
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this badge represents and how to earn it"
                    rows={3}
                    className={`mt-1 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-200 ${
                      errors.description ? "border-red-500" : ""
                    }`}
                  />
                  {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                      Category
                    </Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as "achievement" | "cosmetic" | "special" | "seasonal",
                        })
                      }
                      className="mt-1 w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-purple-500 focus:ring-purple-200"
                    >
                      <option value="achievement">Achievement</option>
                      <option value="cosmetic">Cosmetic</option>
                      <option value="special">Special</option>
                      <option value="seasonal">Seasonal</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="rarity" className="text-sm font-medium text-gray-700">
                      Rarity
                    </Label>
                    <select
                      id="rarity"
                      value={formData.rarity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rarity: e.target.value as "common" | "rare" | "epic" | "legendary",
                        })
                      }
                      className="mt-1 w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-purple-500 focus:ring-purple-200"
                    >
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                    Price (Points) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number.parseInt(e.target.value) || 0 })}
                    placeholder="100"
                    className={`mt-1 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-200 ${
                      errors.price ? "border-red-500" : ""
                    }`}
                  />
                  {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
                </div>
              </div>
            </div>

            {/* Icon Selection */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Icon Selection</h4>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map((option) => {
                  const IconComponent = option.component
                  return (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: option.name })}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.icon === option.name
                          ? "border-purple-500 bg-purple-100 text-purple-700"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      <IconComponent className="h-5 w-5 mx-auto" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Badge Image</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="image" className="text-sm font-medium text-gray-700">
                    Image URL
                  </Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/badge-image.png"
                    className="mt-1 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="bg-white border-gray-300">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <span className="text-sm text-gray-500">or enter URL above</span>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Active Status
                    </Label>
                    <p className="text-sm text-gray-500">Badge is available for purchase</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isLimited" className="text-sm font-medium text-gray-700">
                      Limited Edition
                    </Label>
                    <p className="text-sm text-gray-500">Restrict the number available</p>
                  </div>
                  <Switch
                    id="isLimited"
                    checked={formData.isLimited}
                    onCheckedChange={(checked) => setFormData({ ...formData, isLimited: checked })}
                  />
                </div>

                {formData.isLimited && (
                  <div className="space-y-3 pt-3 border-t border-gray-300">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="limitedQuantity" className="text-sm font-medium text-gray-700">
                          Total Quantity *
                        </Label>
                        <Input
                          id="limitedQuantity"
                          type="number"
                          min="1"
                          value={formData.limitedQuantity}
                          onChange={(e) =>
                            setFormData({ ...formData, limitedQuantity: Number.parseInt(e.target.value) || 0 })
                          }
                          className={`mt-1 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-200 ${
                            errors.limitedQuantity ? "border-red-500" : ""
                          }`}
                        />
                        {errors.limitedQuantity && (
                          <p className="text-sm text-red-600 mt-1">{errors.limitedQuantity}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="limitedRemaining" className="text-sm font-medium text-gray-700">
                          Remaining
                        </Label>
                        <Input
                          id="limitedRemaining"
                          type="number"
                          min="0"
                          max={formData.limitedQuantity}
                          value={formData.limitedRemaining}
                          onChange={(e) =>
                            setFormData({ ...formData, limitedRemaining: Number.parseInt(e.target.value) || 0 })
                          }
                          className={`mt-1 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-200 ${
                            errors.limitedRemaining ? "border-red-500" : ""
                          }`}
                        />
                        {errors.limitedRemaining && (
                          <p className="text-sm text-red-600 mt-1">{errors.limitedRemaining}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Expiration Date (Optional)</Label>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-1 justify-start text-left font-normal bg-white border-gray-300"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.expiresAt ? format(new Date(formData.expiresAt), "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border border-gray-200" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.expiresAt ? new Date(formData.expiresAt) : undefined}
                            onSelect={(date) => {
                              setFormData({ ...formData, expiresAt: date ? date.toISOString() : "" })
                              setIsDatePickerOpen(false)
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
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
                {/* Badge Header with Gradient */}
                <div className={`h-20 bg-gradient-to-br ${getRarityColor(formData.rarity)} relative`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {formData.isActive ? (
                      <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-500 text-white text-xs">Inactive</Badge>
                    )}
                    {formData.isLimited && <Badge className="bg-red-500 text-white text-xs">Limited</Badge>}
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge className={`${getRarityBadgeColor(formData.rarity)} text-white text-xs capitalize`}>
                      {formData.rarity}
                    </Badge>
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
                          const IconComponent = getIconComponent(formData.icon)
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                    ) : null}
                    <div className={formData.image ? "hidden" : ""}>
                      {(() => {
                        const IconComponent = getIconComponent(formData.icon)
                        return <IconComponent className="h-6 w-6 text-gray-600" />
                      })()}
                    </div>
                  </div>
                </div>

                {/* Badge Content */}
                <div className="p-4 pt-2">
                  <div className="text-center mb-3">
                    <h5 className="font-bold text-gray-900 text-sm mb-1">{formData.name || "Badge Name"}</h5>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {formData.description || "Badge description will appear here"}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">{formData.price} points</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {formData.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Limited Edition Info */}
                  {formData.isLimited && (
                    <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-xs text-red-700 font-medium mb-1">Limited Edition</div>
                      <div className="flex justify-between text-xs text-red-600">
                        <span>Remaining: {formData.limitedRemaining}</span>
                        <span>Total: {formData.limitedQuantity}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Details */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-gray-900 capitalize">{formData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rarity:</span>
                  <span className="font-medium text-gray-900 capitalize">{formData.rarity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-gray-900">{formData.price} points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-900">{formData.isActive ? "Active" : "Inactive"}</span>
                </div>
                {formData.isLimited && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Limited:</span>
                      <span className="font-medium text-gray-900">
                        {formData.limitedRemaining} / {formData.limitedQuantity}
                      </span>
                    </div>
                    {formData.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span className="font-medium text-gray-900">
                          {format(new Date(formData.expiresAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                    )}
                  </>
                )}
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
  )
}
