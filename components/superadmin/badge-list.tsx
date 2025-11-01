"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { StoreBadge } from "@/app/superadmin/page"
import { Eye, Edit, Trash2, Check, X, Gift } from "lucide-react"

interface BadgeListProps {
  badges: StoreBadge[]
  onView: (badge: StoreBadge) => void
  onEdit: (badge: StoreBadge) => void
  onDelete: (badge: StoreBadge) => void
}

export function BadgeList({ badges, onView, onEdit, onDelete }: BadgeListProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 rounded-lg">
          <tr>
            <th scope="col" className="px-4 py-3 rounded-tl-lg">
              Badge
            </th>
            <th scope="col" className="px-4 py-3">
              Category
            </th>
            <th scope="col" className="px-4 py-3">
              Price
            </th>
            <th scope="col" className="px-4 py-3">
              Status
            </th>
            <th scope="col" className="px-4 py-3">
              Created
            </th>
            <th scope="col" className="px-4 py-3 rounded-tr-lg text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {badges.map((badge, index) => (
            <tr
              key={badge.id}
              className={`border-b border-gray-200 hover:bg-gray-50 transition-colors animate-fade-in ${
                hoveredRow === badge.id ? "bg-gray-50" : ""
              }`}
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "both",
              }}
              onMouseEnter={() => setHoveredRow(badge.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={badge.image || "/placeholder.svg?height=40&width=40"}
                      alt={badge.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {badge.isLimited && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <Gift className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{badge.name}</div>
                    <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{badge.description}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" className="capitalize">
                  {badge.category}
                </Badge>
              </td>
              <td className="px-4 py-3 font-medium">{badge.price} points</td>
              <td className="px-4 py-3">
                {badge.isActive ? (
                  <Badge className="bg-green-500 text-white border-0">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500 text-white border-0">
                    <X className="w-3 h-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500">{formatDate(badge.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(badge)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="sr-only">View</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(badge)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(badge)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
