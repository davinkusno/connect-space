"use client";

import { SuperAdminNav } from "@/components/navigation/superadmin-nav";
import { AdsManagement } from "@/components/superadmin/ads-management";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    Dialog,
    DialogContent, DialogDescription,
    DialogFooter, DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { FloatingElements } from "@/components/ui/floating-elements";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/loading-indicators";
import { PageTransition } from "@/components/ui/page-transition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Activity, AlertTriangle, Award, Ban, Bell, CalendarDays, CheckCircle2, ChevronLeft,
    ChevronRight, Clock, Crown, Eye, ExternalLink, FileText, Filter, Flame, Gift, Heart, Medal, Megaphone, MessageSquare, RefreshCcw, Search, Shield, Sparkles, Star, Target, Trash2, Trophy, Users, XCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getReportReasonLabel } from "@/lib/utils/report-utils";

// Badge data types
export interface StoreBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  image: string;
  isActive: boolean;
  isLimited?: boolean;
  limitedQuantity?: number;
  limitedRemaining?: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  purchaseCount?: number;
  revenue?: number;
}

// Mock data for community requests with more detailed information
const mockCommunityRequests = [
  {
    id: "req-001",
    name: "Tech Enthusiasts Network",
    description:
      "A community for tech lovers to discuss the latest trends and innovations in technology.",
    category: "Technology",
    requestedBy: {
      id: "user-001",
      name: "Alex Johnson",
      email: "alex@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "pending",
    createdAt: "2025-06-08T14:30:00Z",
    updatedAt: "2025-06-08T14:30:00Z",
    daysWaiting: 3,
  },
  {
    id: "req-002",
    name: "Fitness Fanatics",
    description:
      "A community dedicated to fitness enthusiasts who want to share workout tips and nutrition advice.",
    category: "Health & Fitness",
    requestedBy: {
      id: "user-002",
      name: "Sarah Miller",
      email: "sarah@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "approved",
    createdAt: "2025-06-07T10:15:00Z",
    updatedAt: "2025-06-08T09:20:00Z",
    reviewedBy: {
      id: "admin-001",
      name: "Admin User",
    },
    reviewedAt: "2025-06-08T09:20:00Z",
    comments: "Great community idea with clear purpose and guidelines.",
    daysWaiting: 1,
  },
  {
    id: "req-003",
    name: "Book Club Online",
    description:
      "A virtual book club for literature enthusiasts to discuss books and share recommendations.",
    category: "Books & Literature",
    requestedBy: {
      id: "user-003",
      name: "Michael Brown",
      email: "michael@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "rejected",
    createdAt: "2025-06-06T16:45:00Z",
    updatedAt: "2025-06-07T11:30:00Z",
    reviewedBy: {
      id: "admin-002",
      name: "Admin User",
    },
    reviewedAt: "2025-06-07T11:30:00Z",
    comments:
      "Similar community already exists. Please consider joining 'Literary Circle' instead.",
    daysWaiting: 1,
  },
  {
    id: "req-004",
    name: "Sustainable Living",
    description:
      "A community focused on sustainable living practices, eco-friendly products, and environmental awareness.",
    category: "Environment",
    requestedBy: {
      id: "user-004",
      name: "Emma Wilson",
      email: "emma@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "pending",
    createdAt: "2025-06-05T09:00:00Z",
    updatedAt: "2025-06-05T09:00:00Z",
    daysWaiting: 6,
  },
  {
    id: "req-005",
    name: "Digital Nomads",
    description:
      "A community for remote workers and digital nomads to share travel experiences and work tips.",
    category: "Travel & Work",
    requestedBy: {
      id: "user-005",
      name: "David Lee",
      email: "david@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "pending",
    createdAt: "2025-06-07T20:30:00Z",
    updatedAt: "2025-06-07T20:30:00Z",
    daysWaiting: 4,
  },
  {
    id: "req-006",
    name: "Culinary Explorers",
    description:
      "A community for food enthusiasts to share recipes, cooking techniques, and culinary adventures.",
    category: "Food & Cooking",
    requestedBy: {
      id: "user-006",
      name: "Sophia Garcia",
      email: "sophia@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "approved",
    createdAt: "2025-06-06T12:15:00Z",
    updatedAt: "2025-06-07T14:45:00Z",
    reviewedBy: {
      id: "admin-001",
      name: "Admin User",
    },
    reviewedAt: "2025-06-07T14:45:00Z",
    comments: "Excellent community concept with clear guidelines and purpose.",
    daysWaiting: 1,
  },
  {
    id: "req-007",
    name: "Photography Masters",
    description:
      "A community for photography enthusiasts to share their work, techniques, and equipment recommendations.",
    category: "Photography",
    requestedBy: {
      id: "user-007",
      name: "James Wilson",
      email: "james@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    status: "pending",
    createdAt: "2025-06-08T11:20:00Z",
    updatedAt: "2025-06-08T11:20:00Z",
    daysWaiting: 3,
  },
];

// Mock community data with more detailed information
const mockCommunities = [
  {
    id: "comm-001",
    name: "Tech Innovators Hub",
    description:
      "A vibrant community for tech enthusiasts and innovators to connect, collaborate, and share ideas.",
    category: "Technology",
    status: "active",
    memberCount: 450,
    activityLevel: "high",
    createdAt: "2023-01-15T10:30:00Z",
    lastActivity: "2025-06-11T08:15:00Z",
    location: "Global",
    tags: ["Technology", "Innovation", "Startups", "AI"],
    totalPosts: 1250,
    totalEvents: 45,
    growthRate: 15.2,
    engagementRate: 78.5,
    weeklyActiveUsers: 320,
    monthlyActiveUsers: 420,
    admin: {
      id: "admin-001",
      name: "Alice Johnson",
      email: "alice@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      joinedAt: "2023-01-15T10:30:00Z",
      lastSeen: "2025-06-11T07:30:00Z",
    },
    moderators: [
      {
        id: "mod-001",
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        joinedAt: "2023-02-01T10:30:00Z",
        actionsThisMonth: 45,
      },
      {
        id: "mod-002",
        name: "Jane Smith",
        avatar: "/placeholder.svg?height=32&width=32",
        joinedAt: "2023-03-15T10:30:00Z",
        actionsThisMonth: 32,
      },
    ],
    rules: [
      "Be respectful and professional",
      "No spam or self-promotion without permission",
      "Stay on topic - focus on technology discussions",
      "Help others and share knowledge",
    ],
    guidelines:
      "This community is dedicated to fostering innovation and collaboration in the tech industry.",
    recentActivity: [
      { type: "post", count: 45, period: "this week" },
      { type: "member", count: 12, period: "this week" },
      { type: "event", count: 3, period: "this month" },
    ],
    topContributors: [
      {
        name: "Sarah Tech",
        posts: 23,
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        name: "Mike Code",
        posts: 18,
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        name: "Lisa Dev",
        posts: 15,
        avatar: "/placeholder.svg?height=32&width=32",
      },
    ],
  },
  {
    id: "comm-002",
    name: "Global Writers Circle",
    description:
      "A supportive community for writers of all genres to share their work, receive feedback, and improve their craft.",
    category: "Writing",
    status: "active",
    memberCount: 230,
    activityLevel: "medium",
    createdAt: "2023-03-20T14:15:00Z",
    lastActivity: "2025-06-10T16:30:00Z",
    location: "Global",
    tags: ["Writing", "Literature", "Creative Writing", "Publishing"],
    totalPosts: 890,
    totalEvents: 22,
    rating: 4.6,
    growthRate: 8.7,
    engagementRate: 65.2,
    weeklyActiveUsers: 145,
    monthlyActiveUsers: 210,
    admin: {
      id: "admin-002",
      name: "Bob Williams",
      email: "bob@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      joinedAt: "2023-03-20T14:15:00Z",
      lastSeen: "2025-06-10T15:00:00Z",
    },
    moderators: [
      {
        id: "mod-003",
        name: "Emily Davis",
        avatar: "/placeholder.svg?height=32&width=32",
        joinedAt: "2023-04-01T10:30:00Z",
        actionsThisMonth: 28,
      },
    ],
    rules: [
      "Provide constructive feedback",
      "Respect all writing styles and genres",
      "No plagiarism or copyright infringement",
      "Support fellow writers",
    ],
    guidelines:
      "A safe space for writers to grow and develop their craft through community support.",
    recentActivity: [
      { type: "post", count: 28, period: "this week" },
      { type: "member", count: 8, period: "this week" },
      { type: "event", count: 2, period: "this month" },
    ],
    topContributors: [
      {
        name: "Anna Writer",
        posts: 34,
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        name: "Tom Story",
        posts: 29,
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        name: "Kate Novel",
        posts: 25,
        avatar: "/placeholder.svg?height=32&width=32",
      },
    ],
  },
  {
    id: "comm-003",
    name: "Sustainable Living Collective",
    description:
      "A community dedicated to promoting sustainable living practices and environmental awareness.",
    category: "Environment",
    status: "inactive",
    memberCount: 120,
    activityLevel: "low",
    createdAt: "2023-05-10T09:45:00Z",
    lastActivity: "2025-05-15T12:00:00Z",
    location: "Global",
    tags: ["Sustainability", "Environment", "Green Living", "Climate"],
    totalPosts: 340,
    totalEvents: 8,
    rating: 4.2,
    growthRate: -2.1,
    engagementRate: 25.8,
    weeklyActiveUsers: 15,
    monthlyActiveUsers: 45,
    admin: {
      id: "admin-003",
      name: "Charlie Brown",
      email: "charlie@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      joinedAt: "2023-05-10T09:45:00Z",
      lastSeen: "2025-05-10T10:00:00Z",
    },
    moderators: [],
    rules: [
      "Share evidence-based information",
      "Be respectful of different perspectives",
      "Focus on actionable sustainability tips",
      "No greenwashing or false claims",
    ],
    guidelines:
      "Promoting genuine sustainable practices and environmental consciousness.",
    inactiveReason: "Low engagement and admin unavailability",
    recentActivity: [
      { type: "post", count: 2, period: "this week" },
      { type: "member", count: 0, period: "this week" },
      { type: "event", count: 0, period: "this month" },
    ],
    topContributors: [
      {
        name: "Green Guru",
        posts: 12,
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        name: "Eco Expert",
        posts: 8,
        avatar: "/placeholder.svg?height=32&width=32",
      },
    ],
  },
  {
    id: "comm-004",
    name: "Fitness and Wellness Group",
    description:
      "A community for fitness enthusiasts to share workout tips, nutrition advice, and support each other's wellness journeys.",
    category: "Health & Fitness",
    status: "active",
    memberCount: 320,
    activityLevel: "high",
    createdAt: "2023-07-05T11:20:00Z",
    lastActivity: "2025-06-11T07:45:00Z",
    location: "Global",
    tags: ["Fitness", "Wellness", "Nutrition", "Mental Health"],
    totalPosts: 1100,
    totalEvents: 35,
    rating: 4.7,
    growthRate: 12.8,
    engagementRate: 82.1,
    weeklyActiveUsers: 280,
    monthlyActiveUsers: 305,
    admin: {
      id: "admin-004",
      name: "Diana Davis",
      email: "diana@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      joinedAt: "2023-07-05T11:20:00Z",
      lastSeen: "2025-06-11T06:00:00Z",
    },
    moderators: [
      {
        id: "mod-004",
        name: "Mike Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
        joinedAt: "2023-07-15T10:30:00Z",
        actionsThisMonth: 52,
      },
      {
        id: "mod-005",
        name: "Sarah Wilson",
        avatar: "/placeholder.svg?height=32&width=32",
        joinedAt: "2023-08-01T10:30:00Z",
        actionsThisMonth: 38,
      },
    ],
    rules: [
      "No medical advice - consult professionals",
      "Be supportive and encouraging",
      "Share personal experiences respectfully",
      "No body shaming or negative comments",
    ],
    guidelines:
      "A positive space for health and wellness discussions and mutual support.",
    recentActivity: [
      { type: "post", count: 67, period: "this week" },
      { type: "member", count: 18, period: "this week" },
      { type: "event", count: 4, period: "this month" },
    ],
    topContributors: [
      {
        name: "Fit Coach",
        posts: 45,
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        name: "Wellness Pro",
        posts: 38,
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        name: "Health Hero",
        posts: 32,
        avatar: "/placeholder.svg?height=32&width=32",
      },
    ],
  },
  {
    id: "comm-005",
    name: "Creative Arts Network",
    description:
      "A community for artists, designers, and creative professionals to showcase their work and connect with like-minded individuals.",
    category: "Arts & Culture",
    status: "inactive",
    memberCount: 80,
    activityLevel: "low",
    createdAt: "2023-09-15T08:30:00Z",
    lastActivity: "2025-04-20T14:20:00Z",
    location: "Global",
    tags: ["Art", "Design", "Creativity", "Visual Arts"],
    totalPosts: 180,
    totalEvents: 5,
    rating: 3.9,
    growthRate: -5.2,
    engagementRate: 18.5,
    weeklyActiveUsers: 8,
    monthlyActiveUsers: 25,
    admin: {
      id: "admin-005",
      name: "Eve Taylor",
      email: "eve@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      joinedAt: "2023-09-15T08:30:00Z",
      lastSeen: "2025-04-15T12:00:00Z",
    },
    moderators: [],
    rules: [
      "Original work only",
      "Credit other artists appropriately",
      "Constructive criticism welcome",
      "No commercial promotion without permission",
    ],
    guidelines:
      "Celebrating creativity and artistic expression in all its forms.",
    inactiveReason: "Admin left platform, seeking new leadership",
    recentActivity: [
      { type: "post", count: 1, period: "this week" },
      { type: "member", count: 0, period: "this week" },
      { type: "event", count: 0, period: "this month" },
    ],
    topContributors: [
      {
        name: "Art Master",
        posts: 15,
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        name: "Design Pro",
        posts: 12,
        avatar: "/placeholder.svg?height=32&width=32",
      },
    ],
  },
  {
    id: "comm-006",
    name: "Travel and Adventure Club",
    description:
      "A community for travel enthusiasts to share their travel experiences, tips, and recommendations.",
    category: "Travel",
    status: "active",
    memberCount: 180,
    activityLevel: "medium",
    createdAt: "2023-11-25T12:00:00Z",
    lastActivity: "2025-06-09T19:30:00Z",
    location: "Global",
    tags: ["Travel", "Adventure", "Culture", "Photography"],
    totalPosts: 650,
    totalEvents: 18,
    rating: 4.5,
    growthRate: 10.3,
    engagementRate: 71.2,
    weeklyActiveUsers: 125,
    monthlyActiveUsers: 165,
    admin: {
      id: "admin-006",
      name: "Frank White",
      email: "frank@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      joinedAt: "2023-11-25T12:00:00Z",
      lastSeen: "2025-06-09T18:00:00Z",
    },
    moderators: [
      {
        id: "mod-006",
        name: "Lisa Chen",
        avatar: "/placeholder.svg?height=32&width=32",
        joinedAt: "2023-12-01T10:30:00Z",
        actionsThisMonth: 25,
      },
    ],
    rules: [
      "Share authentic travel experiences",
      "Respect local cultures and customs",
      "No spam or affiliate links without disclosure",
      "Help fellow travelers with advice",
    ],
    guidelines:
      "Inspiring wanderlust and responsible travel through shared experiences.",
    recentActivity: [
      { type: "post", count: 32, period: "this week" },
      { type: "member", count: 6, period: "this week" },
      { type: "event", count: 2, period: "this month" },
    ],
    topContributors: [
      {
        name: "Travel Guru",
        posts: 28,
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        name: "Adventure Seeker",
        posts: 22,
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        name: "Culture Explorer",
        posts: 19,
        avatar: "/placeholder.svg?height=32&width=32",
      },
    ],
  },
];

// Mock data for activity logs
const mockActivityLogs = [
  {
    id: "log-001",
    action: "approved",
    communityName: "Tech Enthusiasts Network",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-22T10:30:00Z",
    details: "Community creation request approved",
  },
  {
    id: "log-002",
    action: "rejected",
    communityName: "Spam Community",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-22T09:15:00Z",
    details: "Community creation request rejected due to policy violation",
  },
  {
    id: "log-003",
    action: "ban",
    communityName: "Gaming Hub",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-21T16:45:00Z",
    details: "Community banned for inappropriate content",
  },
  {
    id: "log-004",
    action: "reactive",
    communityName: "Fitness Community",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-21T14:20:00Z",
    details: "Community reactivated after policy compliance",
  },
  {
    id: "log-005",
    action: "approved",
    communityName: "Book Lovers Club",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-21T11:30:00Z",
    details: "Community creation request approved",
  },
  {
    id: "log-006",
    action: "ban",
    communityName: "Crypto Traders",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-20T18:00:00Z",
    details: "Community banned for suspicious activity",
  },
  {
    id: "log-007",
    action: "approved",
    communityName: "Photography Enthusiasts",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-20T15:30:00Z",
    details: "Community creation request approved",
  },
  {
    id: "log-008",
    action: "rejected",
    communityName: "Duplicate Community",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-20T13:45:00Z",
    details: "Community creation request rejected - duplicate",
  },
  {
    id: "log-009",
    action: "reactive",
    communityName: "Music Lovers",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-19T10:15:00Z",
    details: "Community reactivated after review",
  },
  {
    id: "log-010",
    action: "approved",
    communityName: "Startup Founders",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-19T09:00:00Z",
    details: "Community creation request approved",
  },
  {
    id: "log-011",
    action: "ban",
    communityName: "Meme Lords",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-18T17:30:00Z",
    details: "Community banned for violating content guidelines",
  },
  {
    id: "log-012",
    action: "rejected",
    communityName: "Test Community",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-18T14:00:00Z",
    details: "Community creation request rejected - incomplete information",
  },
];

// Mock data for reported communities
const mockReportedCommunities = [
  {
    id: "rep-001",
    communityId: "comm-015",
    communityName: "Spam Central",
    category: "Technology",
    reportCount: 4,
    lastReportDate: "2025-11-22T08:30:00Z",
    status: "pending",
    reports: [
      {
        reportedBy: "user-045",
        reporterName: "John Doe",
        reason: "Spam",
        description: "Community is full of spam and promotional links",
        reportDate: "2025-11-22T08:30:00Z",
      },
      {
        reportedBy: "user-046",
        reporterName: "Jane Smith",
        reason: "Inappropriate Content",
        description: "Contains offensive material",
        reportDate: "2025-11-21T15:20:00Z",
      },
      {
        reportedBy: "user-048",
        reporterName: "Bob Miller",
        reason: "Spam",
        description: "Too many promotional posts",
        reportDate: "2025-11-20T14:15:00Z",
      },
      {
        reportedBy: "user-049",
        reporterName: "Carol White",
        reason: "Spam",
        description: "Constant advertising",
        reportDate: "2025-11-19T09:30:00Z",
      },
    ],
    communityDetails: {
      memberCount: 150,
      createdAt: "2025-10-15T10:00:00Z",
      lastActivity: "2025-11-22T07:00:00Z",
      admin: {
        name: "Spammer User",
        email: "spammer@example.com",
      },
    },
  },
  {
    id: "rep-002",
    communityId: "comm-016",
    communityName: "Fake News Hub",
    category: "News",
    reportCount: 3,
    lastReportDate: "2025-11-21T18:45:00Z",
    status: "pending",
    reports: [
      {
        reportedBy: "user-047",
        reporterName: "Alice Johnson",
        reason: "Misinformation",
        description: "Spreading false information and conspiracy theories",
        reportDate: "2025-11-21T18:45:00Z",
      },
      {
        reportedBy: "user-050",
        reporterName: "David Lee",
        reason: "Misinformation",
        description: "Fake news articles being shared",
        reportDate: "2025-11-20T16:20:00Z",
      },
      {
        reportedBy: "user-051",
        reporterName: "Emma Wilson",
        reason: "Harassment",
        description: "Users being bullied in comments",
        reportDate: "2025-11-19T11:45:00Z",
      },
    ],
    communityDetails: {
      memberCount: 320,
      createdAt: "2025-09-20T14:30:00Z",
      lastActivity: "2025-11-21T17:00:00Z",
      admin: {
        name: "News Faker",
        email: "fakenews@example.com",
      },
    },
  },
  {
    id: "rep-003",
    communityId: "comm-017",
    communityName: "Scam Alert Group",
    category: "Finance",
    reportCount: 3,
    lastReportDate: "2025-11-20T12:15:00Z",
    status: "pending",
    reports: [
      {
        reportedBy: "user-048",
        reporterName: "Bob Wilson",
        reason: "Scam/Fraud",
        description: "Promoting investment scams and pyramid schemes",
        reportDate: "2025-11-20T12:15:00Z",
      },
      {
        reportedBy: "user-052",
        reporterName: "Frank Johnson",
        reason: "Scam/Fraud",
        description: "Asking for money transfers",
        reportDate: "2025-11-19T14:30:00Z",
      },
      {
        reportedBy: "user-053",
        reporterName: "Grace Chen",
        reason: "Spam",
        description: "Too many promotional messages",
        reportDate: "2025-11-18T10:15:00Z",
      },
    ],
    communityDetails: {
      memberCount: 89,
      createdAt: "2025-11-01T09:00:00Z",
      lastActivity: "2025-11-20T11:00:00Z",
      admin: {
        name: "Scammer Admin",
        email: "scam@example.com",
      },
    },
  },
  {
    id: "rep-004",
    communityId: "comm-018",
    communityName: "Hate Speech Forum",
    category: "Social",
    reportCount: 4,
    lastReportDate: "2025-11-19T16:30:00Z",
    status: "pending",
    reports: [
      {
        reportedBy: "user-049",
        reporterName: "Sarah Brown",
        reason: "Hate Speech",
        description: "Contains discriminatory and hateful content",
        reportDate: "2025-11-19T16:30:00Z",
      },
      {
        reportedBy: "user-054",
        reporterName: "Henry Martinez",
        reason: "Hate Speech",
        description: "Racist comments in posts",
        reportDate: "2025-11-18T13:45:00Z",
      },
      {
        reportedBy: "user-055",
        reporterName: "Ivy Anderson",
        reason: "Harassment",
        description: "Targeting specific users",
        reportDate: "2025-11-17T09:20:00Z",
      },
      {
        reportedBy: "user-056",
        reporterName: "Jack Thompson",
        reason: "Hate Speech",
        description: "Offensive language towards minorities",
        reportDate: "2025-11-16T15:10:00Z",
      },
    ],
    communityDetails: {
      memberCount: 67,
      createdAt: "2025-10-25T11:20:00Z",
      lastActivity: "2025-11-19T15:00:00Z",
      admin: {
        name: "Toxic User",
        email: "toxic@example.com",
      },
    },
  },
  {
    id: "rep-005",
    communityId: "comm-019",
    communityName: "Copyright Violators",
    category: "Entertainment",
    reportCount: 3,
    lastReportDate: "2025-11-18T10:00:00Z",
    status: "pending",
    reports: [
      {
        reportedBy: "user-050",
        reporterName: "Mike Davis",
        reason: "Copyright Violation",
        description: "Sharing pirated content and copyrighted materials",
        reportDate: "2025-11-18T10:00:00Z",
      },
      {
        reportedBy: "user-057",
        reporterName: "Kelly Brown",
        reason: "Copyright Violation",
        description: "Unauthorized music sharing",
        reportDate: "2025-11-17T14:30:00Z",
      },
      {
        reportedBy: "user-058",
        reporterName: "Leo Garcia",
        reason: "Inappropriate Content",
        description: "Adult content being shared",
        reportDate: "2025-11-16T11:15:00Z",
      },
    ],
    communityDetails: {
      memberCount: 234,
      createdAt: "2025-09-10T08:45:00Z",
      lastActivity: "2025-11-18T09:00:00Z",
      admin: {
        name: "Pirate Admin",
        email: "pirate@example.com",
      },
    },
  },
];

export default function SuperadminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("reports");

  // Refs to prevent duplicate API calls
  const reportsFetchedRef = useRef(false);
  const badgesFetchedRef = useRef(false);

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === "/superadmin") {
      setActiveTab("reports");
    } else if (pathname === "/superadmin/ads") {
      setActiveTab("ads");
    }
  }, [pathname]);

  // Fetch reports from API
  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const response = await fetch("/api/admin/reports");
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }
      const data = await response.json();
      
      // Backend already returns grouped data, just transform it for frontend use
      const transformedReports = (data.reports || [])
        .map((group: any) => {
        // Get community name based on report type
        let communityName = "";
        if (group.reported_community?.name) {
          communityName = group.reported_community.name;
        } else if (group.reported_event?.communities?.name) {
          communityName = group.reported_event.communities.name;
        } else if (group.reported_thread?.communities?.name) {
          communityName = group.reported_thread.communities.name;
        } else if (group.reported_reply?.parent?.communities?.name) {
          communityName = group.reported_reply.parent.communities.name;
        }

        // Transform individual reports for display
        const individualReports = (group.reports || []).map((report: any) => ({
          reportedBy: report.reporter_id,
          reporterName: report.reporter?.full_name || "Anonymous",
          reason: report.reason,
          description: report.details || report.description || "", // Backend uses 'details'
          reportDate: report.created_at, // Ensure we use created_at
          reportId: report.id,
          report_type: report.report_type,
        }));

        return {
          id: group.id,
          target_id: group.target_id,
          communityId: group.target_id,
          communityName: group.target_name || "Unknown",
          actualCommunityName: communityName,
          category: group.report_type,
          reportCount: group.report_count || 1,
          lastReportDate: group.created_at,
          status: group.status,
          communityStatus: group.status === "resolved" ? "active" : "active",
          reports: individualReports,
          reporterInfo: {
            name: individualReports[0]?.reporterName || "Anonymous",
            email: "N/A",
            count: group.report_count || 1,
            allReporters: individualReports.map((r: any) => r.reporterName).join(", "),
          },
          // Keep original group data for reference
          _originalReport: group,
        };
      });
      
      setReportedCommunities(transformedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Load reports when tab is active
  useEffect(() => {
    if (activeTab === "reports") {
      // Prevent duplicate fetch in React Strict Mode
      if (reportsFetchedRef.current) return;
      reportsFetchedRef.current = true;

      fetchReports();
      fetchReviewQueueReports();
    }
  }, [activeTab]);

  // Fetch reports review queue (30% threshold)
  const fetchReviewQueueReports = async () => {
    setIsLoadingReviewQueue(true);
    try {
      const response = await fetch("/api/admin/reports-review-queue");
      if (!response.ok) {
        throw new Error("Failed to fetch review queue reports");
      }
      const data = await response.json();
      
      // Backend returns grouped data - use it directly
      setReviewQueueReports(data.reports || []);
    } catch (error) {
      console.error("Error fetching review queue reports:", error);
      toast.error("Failed to load review queue reports");
    } finally {
      setIsLoadingReviewQueue(false);
    }
  };

  // Handle delete report
  const handleDeleteReport = async (reportId: string) => {
    try {
      setProcessingReportId(reportId);
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete report");
      }

      toast.success("Report deleted successfully");
      
      // Refresh reports list
      setReportedCommunities(prev => prev.filter(r => r.id !== reportId));
      setReviewQueueReports(prev => prev.filter(r => r.id !== reportId));
      
      // Close detail dialog if open
      if (selectedReport?.id === reportId) {
        setIsReportDetailOpen(false);
        setSelectedReport(null);
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    } finally {
      setProcessingReportId(null);
    }
  };

  // Ban report handlers
  const handleBanClick = (report: any) => {
    setReportToBan(report);
    setBanReason("");
    setIsBanConfirmOpen(true);
  };

  const handleBanConfirm = async () => {
    if (!reportToBan || !banReason.trim()) {
      toast.error("Please provide a ban reason");
      return;
    }

    setIsProcessingAction(true);
    try {
      // Debug: Log the report structure
      console.log("reportToBan structure:", {
        id: reportToBan.id,
        hasReports: !!reportToBan.reports,
        reportsLength: reportToBan.reports?.length,
        firstReportId: reportToBan.reports?.[0]?.id,
        firstReportReportId: reportToBan.reports?.[0]?.reportId,
        fullReport: reportToBan
      });

      // For grouped reports, use the ID of the first individual report
      // For single reports, use the report ID directly
      let reportId = reportToBan.id;
      
      if (reportToBan.reports && reportToBan.reports.length > 0) {
        // Try to get ID from first report in the array
        const firstReport = reportToBan.reports[0];
        reportId = firstReport.id || firstReport.reportId || reportToBan.id;
      }

      console.log("Using report ID:", reportId);

      if (!reportId) {
        throw new Error("Invalid report ID");
      }

      const response = await fetch(`/api/admin/reports/${reportId}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: banReason.trim() }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to ban content";
        try {
          const errorData = await response.json();
          console.error("Ban API error response:", errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, use status text
          errorMessage = `Failed to ban content: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(result.message || "Content banned successfully");
      
      // Close dialogs
      setIsBanConfirmOpen(false);
      setIsReportDetailOpen(false);
      
      // Refresh reports
      await Promise.all([fetchReports(), fetchReviewQueueReports()]);
      
    } catch (error) {
      console.error("Error banning content:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
    } finally {
      setIsProcessingAction(false);
      setReportToBan(null);
      setBanReason("");
    }
  };

  const handleDismissReport = async (report: any) => {
    setIsProcessingAction(true);
    try {
      const response = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "dismiss",
          resolution: "Report dismissed without action"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to dismiss report");
      }

      toast.success("Report dismissed");
      setIsReportDetailOpen(false);
      
      // Refresh reports
      await Promise.all([fetchReports(), fetchReviewQueueReports()]);
      
    } catch (error) {
      console.error("Error dismissing report:", error);
      toast.error("Failed to dismiss report");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Reports management state
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState<"all" | "community" | "event" | "thread" | "reply" | "member">("all");
  const [reportStatusFilter, setReportStatusFilter] = useState<"all" | "pending" | "resolved">("pending");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReportDetailOpen, setIsReportDetailOpen] = useState(false);
  const [currentReportPage, setCurrentReportPage] = useState(1);
  const [reportItemsPerPage] = useState(5);
  // API state for reports
  const [reportedCommunities, setReportedCommunities] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);
  
  // Ban confirmation state
  const [isBanConfirmOpen, setIsBanConfirmOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [reportToBan, setReportToBan] = useState<any>(null);
  
  // Reports Review Queue state (30% threshold)
  const [reviewQueueReports, setReviewQueueReports] = useState<any[]>([]);
  const [isLoadingReviewQueue, setIsLoadingReviewQueue] = useState(false);
  const [currentReviewQueuePage, setCurrentReviewQueuePage] = useState(1);
  const [reviewQueueItemsPerPage] = useState(5);
  const [reviewQueueTypeFilter, setReviewQueueTypeFilter] = useState<"all" | "community" | "event" | "thread" | "reply">("all");
  const [reviewQueueStatusFilter, setReviewQueueStatusFilter] = useState<"all" | "pending" | "resolved">("pending");

  // Report detail dialog state
  const [reportDetailPage, setReportDetailPage] = useState(1);
  const [reportDetailItemsPerPage] = useState(5);

  // Community management state
  const [communitySearchQuery, setCommunitySearchQuery] = useState("");
  const [communityFilterStatus, setCommunityFilterStatus] = useState("all");
  const [communitySortBy, setCommunitySortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);
  const [isCommunityDetailOpen, setIsCommunityDetailOpen] = useState(false);
  const [communityDetailTab, setCommunityDetailTab] = useState("overview");
  const [isAllCommunitiesDialogOpen, setIsAllCommunitiesDialogOpen] =
    useState(false);

  // Activity logs state
  const [activityFilterStatus, setActivityFilterStatus] = useState("all");
  const [currentActivityPage, setCurrentActivityPage] = useState(1);
  const [activityItemsPerPage] = useState(10);


  // Filter and sort communities
  const filteredCommunities = mockCommunities
    .filter((community) => {
      const matchesSearch =
        communitySearchQuery === "" ||
        community.name
          .toLowerCase()
          .includes(communitySearchQuery.toLowerCase()) ||
        community.description
          .toLowerCase()
          .includes(communitySearchQuery.toLowerCase());

      const matchesStatus =
        communityFilterStatus === "all" ||
        community.status === communityFilterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (communitySortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        case "member-count":
          return b.memberCount - a.memberCount;
        default:
          return 0;
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredCommunities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCommunities = filteredCommunities.slice(startIndex, endIndex);

  // Filter reported communities based on search query, type, and status
  const filteredReportedCommunities = reportedCommunities.filter(
    (report) => {
      const matchesSearch =
        reportSearchQuery === "" ||
        report.communityName
          .toLowerCase()
          .includes(reportSearchQuery.toLowerCase()) ||
        report.category.toLowerCase().includes(reportSearchQuery.toLowerCase());

      const matchesType = 
        reportTypeFilter === "all" || 
        report.category === reportTypeFilter;

      const matchesStatus =
        reportStatusFilter === "all" ||
        report.status === reportStatusFilter;

      return matchesSearch && matchesType && matchesStatus;
    }
  );

  // Sort reported communities by report count (highest first)
  const sortedReportedCommunities = [...filteredReportedCommunities].sort(
    (a, b) => b.reportCount - a.reportCount
  );

  // Pagination for reported communities
  const totalReportPages = Math.ceil(
    sortedReportedCommunities.length / reportItemsPerPage
  );
  const reportStartIndex = (currentReportPage - 1) * reportItemsPerPage;
  const reportEndIndex = reportStartIndex + reportItemsPerPage;
  const paginatedReportedCommunities = sortedReportedCommunities.slice(
    reportStartIndex,
    reportEndIndex
  );


  // Filter and paginate activity logs
  const filteredActivityLogs = mockActivityLogs.filter((log) => {
    if (activityFilterStatus === "all") {
      return true;
    }
    return log.action === activityFilterStatus;
  });

  const totalActivityPages = Math.ceil(
    filteredActivityLogs.length / activityItemsPerPage
  );
  const activityStartIndex = (currentActivityPage - 1) * activityItemsPerPage;
  const activityEndIndex = activityStartIndex + activityItemsPerPage;
  const paginatedActivityLogs = filteredActivityLogs.slice(
    activityStartIndex,
    activityEndIndex
  );

  const handleViewCommunity = (community: any) => {
    setSelectedCommunity(community);
    setIsCommunityDetailOpen(true);
    setCommunityDetailTab("overview");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
            Pending
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Trophy: Trophy,
      Star: Star,
      Award: Award,
      Crown: Crown,
      Gift: Gift,
      Medal: Medal,
      Sparkles: Sparkles,
      Heart: Heart,
      Target: Target,
      Flame: Flame,
    };
    const IconComponent = iconMap[iconName] || Trophy;
    return <IconComponent className="h-6 w-6" />;
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 flex items-center gap-1 w-fit text-xs px-2 py-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 flex items-center gap-1 w-fit text-xs px-2 py-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "ban":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 flex items-center gap-1 w-fit text-xs px-2 py-1">
            <Ban className="h-3 w-3" />
            Baned
          </Badge>
        );
      case "reactive":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 flex items-center gap-1 w-fit text-xs px-2 py-1">
            <RefreshCcw className="h-3 w-3" />
            Reactivated
          </Badge>
        );
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }
  };

  const getCommunityStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
            Pending
          </Badge>
        );
      case "banned":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
            Baned
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0">
            Inactive
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />

      {/* Navigation */}
      <SuperAdminNav />

      <PageTransition>
        <div className="max-w-[95%] mx-auto px-6 py-12 relative z-10">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-purple-600 text-white border-0 px-3 py-1">
                Superadmin
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900">
                System Administration <span className="text-gradient">✨</span>
              </h1>
            </div>
            <p className="text-xl text-gray-600">
              Manage community requests and monitor system activities
            </p>
          </div>

          {/* Main Content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="glass-effect border-0 p-2 rounded-2xl mb-8 h-14 w-fit">
              <TabsTrigger
                value="reports"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 flex items-center justify-center gap-2 h-10 px-6"
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Reports</span>
              </TabsTrigger>
              <TabsTrigger
                value="ads"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 flex items-center justify-center gap-2 h-10 px-6"
              >
                <Megaphone className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Ads Management</span>
              </TabsTrigger>
            </TabsList>

            {/* Reports Tab - Community Reports & Inactive Communities */}
            <TabsContent value="reports" className="space-y-6">
              <div className="flex justify-end items-center">
                <div className="text-sm text-gray-600">
                  Total Reports: {reportedCommunities.length}
                </div>
              </div>

              {/* Reports Review Queue (30% Threshold) */}
              <AnimatedCard variant="glass" className="p-6" disableHoverScale>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Reports Review Queue (30% Threshold)
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                      {reviewQueueReports.filter((report) => {
                        const typeMatch = reviewQueueTypeFilter === "all" || report.report_type === reviewQueueTypeFilter;
                        const statusMatch = reviewQueueStatusFilter === "all" || report.status === reviewQueueStatusFilter;
                        return typeMatch && statusMatch;
                      }).length} Reports
                    </Badge>
                  </h4>
                  
                  {/* Filters - aligned to the right like All Reports */}
                  <div className="flex items-center gap-3">
                    <Select value={reviewQueueTypeFilter} onValueChange={(value: any) => setReviewQueueTypeFilter(value)}>
                      <SelectTrigger className="w-[160px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="thread">Thread</SelectItem>
                        <SelectItem value="reply">Reply</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={reviewQueueStatusFilter} onValueChange={(value: "all" | "pending" | "resolved") => setReviewQueueStatusFilter(value)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoadingReviewQueue ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <>
                    {(() => {
                      // Apply filters
                      const filtered = reviewQueueReports.filter((report) => {
                        const typeMatch = reviewQueueTypeFilter === "all" || report.report_type === reviewQueueTypeFilter;
                        const statusMatch = reviewQueueStatusFilter === "all" || report.status === reviewQueueStatusFilter;
                        return typeMatch && statusMatch;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            No reports match the selected filters.
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[1400px]">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[25%]">
                                    Reported Item
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[12%]">
                                    Type
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[13%]">
                                    Community
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[12%]">
                                    Reports / Threshold
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[13%]">
                                    Last Report
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[25%]">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {filtered
                                  .slice((currentReviewQueuePage - 1) * reviewQueueItemsPerPage, currentReviewQueuePage * reviewQueueItemsPerPage)
                                  .map((report) => (
                              <tr
                                key={report.id}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-4 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {report.target_name || "Unknown"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {report.unique_reporters === 1
                                        ? `Reported by: ${report.reports?.[0]?.reporter?.full_name || "Anonymous"}`
                                        : `${report.unique_reporters} unique reporters`}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      report.report_type === "member"
                                        ? "bg-purple-50 border-purple-200 text-purple-600"
                                        : report.report_type === "event"
                                        ? "bg-blue-50 border-blue-200 text-blue-600"
                                        : report.report_type === "thread"
                                        ? "bg-green-50 border-green-200 text-green-600"
                                        : report.report_type === "reply"
                                        ? "bg-orange-50 border-orange-200 text-orange-600"
                                        : report.report_type === "community"
                                        ? "bg-red-50 border-red-200 text-red-600"
                                        : "bg-gray-50 border-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {report.report_type}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-sm text-gray-700">
                                    {report.community_name || "N/A"}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <Badge className="bg-orange-500 text-white">
                                    {report.unique_reporters} / {report.threshold}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-sm text-gray-700">
                                    {new Date(report.created_at).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex gap-2">
                                    <AnimatedButton
                                      variant="glass"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedReport(report);
                                        setIsReportDetailOpen(true);
                                        setReportDetailPage(1);
                                      }}
                                      className="text-blue-600 hover:text-blue-700 min-w-[120px] px-3"
                                    >
                                      <Eye className="h-4 w-4 mr-1.5" />
                                      View Report
                                    </AnimatedButton>
                                    {report.report_type === "community" && report.community_id && (
                                      <Link href={`/communities/${report.community_id}`} target="_blank">
                                        <AnimatedButton
                                          variant="glass"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700 min-w-[120px] px-3"
                                        >
                                          <ExternalLink className="h-4 w-4 mr-1.5" />
                                          View Item
                                        </AnimatedButton>
                                      </Link>
                                    )}
                                    {report.report_type === "event" && report.reported_event?.id && (
                                      <Link href={`/events/${report.reported_event.id}`} target="_blank">
                                        <AnimatedButton
                                          variant="glass"
                                          size="sm"
                                          className="text-blue-600 hover:text-blue-700 min-w-[120px] px-3"
                                        >
                                          <ExternalLink className="h-4 w-4 mr-1.5" />
                                          View Item
                                        </AnimatedButton>
                                      </Link>
                                    )}
                                    {report.report_type === "thread" && report.reported_thread?.community_id && report.reported_thread?.id && (
                                      <Link href={`/communities/${report.reported_thread.community_id}?tab=discussions&threadId=${report.reported_thread.id}`} target="_blank">
                                        <AnimatedButton
                                          variant="glass"
                                          size="sm"
                                          className="text-green-600 hover:text-green-700 min-w-[120px] px-3"
                                        >
                                          <ExternalLink className="h-4 w-4 mr-1.5" />
                                          View Item
                                        </AnimatedButton>
                                      </Link>
                                    )}
                                    {report.report_type === "reply" && report.reported_reply?.parent?.community_id && report.reported_reply?.id && (
                                      <Link href={`/communities/${report.reported_reply.parent.community_id}?tab=discussions&threadId=${report.reported_reply.parent_id}&replyId=${report.reported_reply.id}`} target="_blank">
                                        <AnimatedButton
                                          variant="glass"
                                          size="sm"
                                          className="text-orange-600 hover:text-orange-700 min-w-[120px] px-3"
                                        >
                                          <ExternalLink className="h-4 w-4 mr-1.5" />
                                          View Item
                                        </AnimatedButton>
                                      </Link>
                                    )}
                                    {report.report_type === "member" && report.reported_user?.id && (
                                      <AnimatedButton
                                        variant="glass"
                                        size="sm"
                                        className="text-purple-600 hover:text-purple-700 min-w-[120px] px-3"
                                        onClick={() => {
                                          toast.info("User profile view not available. User ID: " + report.reported_user.id);
                                        }}
                                      >
                                        <ExternalLink className="h-4 w-4 mr-1.5" />
                                        View Item
                                      </AnimatedButton>
                                    )}
                                    {report.status !== "resolved" && (
                                      <AnimatedButton
                                        variant="glass"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 min-w-[100px] px-3"
                                        onClick={() => handleBanClick(report)}
                                        disabled={isProcessingAction}
                                      >
                                        <Ban className="h-4 w-4 mr-1.5" />
                                        Ban
                                      </AnimatedButton>
                                    )}
                                    <AnimatedButton
                                      variant="glass"
                                      size="sm"
                                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 min-w-[100px] px-3"
                                      onClick={() => handleDeleteReport(report.id)}
                                      disabled={processingReportId === report.id}
                                    >
                                      {processingReportId === report.id ? (
                                        <Spinner size="sm" />
                                      ) : (
                                        <>
                                          <Trash2 className="h-4 w-4 mr-1.5" />
                                          Delete
                                        </>
                                      )}
                                    </AnimatedButton>
                                  </div>
                                </td>
                              </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination for Review Queue */}
                          {filtered.length > reviewQueueItemsPerPage && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                              <div className="text-sm text-gray-600">
                                Showing {(currentReviewQueuePage - 1) * reviewQueueItemsPerPage + 1} to{" "}
                                {Math.min(currentReviewQueuePage * reviewQueueItemsPerPage, filtered.length)}{" "}
                                of {filtered.length} reports
                              </div>
                              <div className="flex items-center gap-2">
                                <AnimatedButton
                                  variant="glass"
                                  size="sm"
                                  onClick={() => setCurrentReviewQueuePage((prev) => Math.max(1, prev - 1))}
                                  disabled={currentReviewQueuePage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </AnimatedButton>
                                <span className="text-sm text-gray-600">
                                  Page {currentReviewQueuePage} of {Math.ceil(filtered.length / reviewQueueItemsPerPage) || 1}
                                </span>
                                <AnimatedButton
                                  variant="glass"
                                  size="sm"
                                  onClick={() => setCurrentReviewQueuePage((prev) => Math.min(Math.ceil(filtered.length / reviewQueueItemsPerPage) || 1, prev + 1))}
                                  disabled={currentReviewQueuePage >= Math.ceil(filtered.length / reviewQueueItemsPerPage)}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </AnimatedButton>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </AnimatedCard>

              {/* Reports Section */}
              <AnimatedCard variant="glass" className="p-6" disableHoverScale>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Ban className="h-5 w-5 text-red-600" />
                    Reports
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      {reportedCommunities.length} Reports
                    </Badge>
                  </h4>
                  <div className="flex items-center gap-3">
                    <Select value={reportTypeFilter} onValueChange={(value: "all" | "community" | "event" | "thread" | "reply" | "member") => setReportTypeFilter(value)}>
                      <SelectTrigger className="w-[160px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="thread">Thread</SelectItem>
                        <SelectItem value="reply">Reply</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={reportStatusFilter} onValueChange={(value: "all" | "pending" | "resolved") => setReportStatusFilter(value)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search reports..."
                        value={reportSearchQuery}
                        onChange={(e) => setReportSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>

                {isLoadingReports ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1400px]">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[30%]">
                            Reported Item
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[12%]">
                            Type
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[10%]">
                            Reports
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[13%]">
                            Last Report
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[35%]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedReportedCommunities.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-8 text-gray-500"
                            >
                              No reports found
                            </td>
                          </tr>
                        ) : (
                        paginatedReportedCommunities.map((report) => (
                          <tr
                            key={report.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {report.communityName}
                                  </div>
                                  {report.actualCommunityName && report.category !== "community" && (
                                    <div className="text-xs text-gray-600 mt-0.5">
                                      Community: {report.actualCommunityName}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    {report.reportCount} {report.reportCount === 1 ? 'reporter' : 'unique reporters'}
                                  </div>
                                </div>
                                {report.communityStatus === "banned" && (
                                  <Badge className="bg-red-500 text-white text-xs">
                                    <Ban className="h-3 w-3 mr-1" />
                                    Baned
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {/* Report Type Badge */}
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  report.category === "member"
                                    ? "bg-purple-50 border-purple-200 text-purple-700"
                                    : report.category === "event"
                                    ? "bg-blue-50 border-blue-200 text-blue-700"
                                    : report.category === "thread"
                                    ? "bg-green-50 border-green-200 text-green-700"
                                    : report.category === "reply"
                                    ? "bg-orange-50 border-orange-200 text-orange-700"
                                    : report.category === "community"
                                    ? "bg-red-50 border-red-200 text-red-700"
                                    : "bg-gray-50 border-gray-200 text-gray-700"
                                }`}
                              >
                                {report.category === "member"
                                  ? "Member"
                                  : report.category === "event"
                                  ? "Event"
                                  : report.category === "thread"
                                  ? "Thread"
                                  : report.category === "reply"
                                  ? "Reply"
                                  : report.category === "community"
                                  ? "Community"
                                  : report.category || "Unknown"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className="bg-red-500 text-white">
                                {report.reportCount} reports
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-700">
                                {new Date(
                                  report.lastReportDate
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <AnimatedButton
                                  variant="glass"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setIsReportDetailOpen(true);
                                    // Reset pagination when opening dialog
                                    setReportDetailPage(1);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 min-w-[160px] px-3"
                                >
                                  <Eye className="h-4 w-4 mr-1.5" />
                                  View Report
                                </AnimatedButton>
                                {report.category === "community" && report.communityId && (
                                  <Link href={`/communities/${report.communityId}`} target="_blank">
                                    <AnimatedButton
                                      variant="glass"
                                      size="sm"
                                      className="text-purple-600 hover:text-purple-700 min-w-[120px] px-3"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1.5" />
                                      View Item
                                    </AnimatedButton>
                                  </Link>
                                )}
                                {report.category === "event" && report._originalReport?.reported_event?.id && (
                                  <Link href={`/events/${report._originalReport.reported_event.id}`} target="_blank">
                                    <AnimatedButton
                                      variant="glass"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-700 min-w-[120px] px-3"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1.5" />
                                      View Item
                                    </AnimatedButton>
                                  </Link>
                                )}
                                {report.category === "thread" && report._originalReport?.reported_thread?.community_id && report._originalReport?.reported_thread?.id && (
                                  <Link href={`/communities/${report._originalReport.reported_thread.community_id}?tab=discussions&threadId=${report._originalReport.reported_thread.id}`} target="_blank">
                                    <AnimatedButton
                                      variant="glass"
                                      size="sm"
                                      className="text-green-600 hover:text-green-700 min-w-[120px] px-3"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1.5" />
                                      View Item
                                    </AnimatedButton>
                                  </Link>
                                )}
                                {report.category === "reply" && report._originalReport?.reported_reply?.parent?.community_id && report._originalReport?.reported_reply?.id && (
                                  <Link href={`/communities/${report._originalReport.reported_reply.parent.community_id}?tab=discussions&threadId=${report._originalReport.reported_reply.parent_id}&replyId=${report._originalReport.reported_reply.id}`} target="_blank">
                                    <AnimatedButton
                                      variant="glass"
                                      size="sm"
                                      className="text-orange-600 hover:text-orange-700 min-w-[120px] px-3"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1.5" />
                                      View Item
                                    </AnimatedButton>
                                  </Link>
                                )}
                                {report.status !== "resolved" && (
                                  <AnimatedButton
                                    variant="glass"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 min-w-[100px] px-3"
                                    onClick={() => handleBanClick(report)}
                                    disabled={isProcessingAction}
                                  >
                                    <Ban className="h-4 w-4 mr-1.5" />
                                    Ban
                                  </AnimatedButton>
                                )}
                                <AnimatedButton
                                  variant="glass"
                                  size="sm"
                                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 min-w-[100px] px-3"
                                  onClick={() => handleDeleteReport(report.id)}
                                  disabled={processingReportId === report.id}
                                >
                                  {processingReportId === report.id ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-1.5" />
                                      Delete
                                    </>
                                  )}
                                </AnimatedButton>
                              </div>
                            </td>
                          </tr>
                        ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination for Reported Communities */}
                {totalReportPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {reportStartIndex + 1} to{" "}
                      {Math.min(
                        reportEndIndex,
                        sortedReportedCommunities.length
                      )}{" "}
                      of {sortedReportedCommunities.length} reports
                    </div>
                    <div className="flex items-center gap-2">
                      <AnimatedButton
                        variant="glass"
                        size="sm"
                        onClick={() =>
                          setCurrentReportPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentReportPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </AnimatedButton>
                      <span className="text-sm text-gray-600">
                        Page {currentReportPage} of {totalReportPages}
                      </span>
                      <AnimatedButton
                        variant="glass"
                        size="sm"
                        onClick={() =>
                          setCurrentReportPage((prev) =>
                            Math.min(totalReportPages, prev + 1)
                          )
                        }
                        disabled={currentReportPage === totalReportPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </AnimatedButton>
                    </div>
                  </div>
                )}
              </AnimatedCard>
            </TabsContent>

            {/* Ads Management Tab */}
            <TabsContent value="ads" className="space-y-6">
              <AdsManagement />
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>

      {/* Enhanced Community Detail Dialog with Fixed Background */}
      <Dialog
        open={isCommunityDetailOpen}
        onOpenChange={setIsCommunityDetailOpen}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] bg-white border border-gray-200 shadow-xl overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div>{selectedCommunity?.name}</div>
                <div className="text-sm font-normal text-gray-600 mt-1">
                  Community Management Dashboard
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedCommunity && (
            <div className="flex flex-col h-[calc(90vh-120px)]">
              {/* Community Header Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      Members
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-800">
                    {selectedCommunity.memberCount}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                      Events
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-purple-800">
                    {selectedCommunity.totalEvents}
                  </div>
                </div>
              </div>

              {/* Overview Content */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                  Community Overview
                </h3>

                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Community Information */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-purple-600" />
                        </div>
                        Community Information
                      </h4>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                            Description
                          </label>
                          <p className="text-sm text-gray-800 leading-relaxed">
                            {selectedCommunity.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                            <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">
                              Category
                            </label>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedCommunity.category}
                            </p>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <label className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 block">
                              Status
                            </label>
                            <div>
                              {getCommunityStatusBadge(
                                selectedCommunity.status
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <CalendarDays className="h-5 w-5 text-gray-400" />
                            <div>
                              <label className="text-xs text-gray-500 block">
                                Created
                              </label>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDateShort(selectedCommunity.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <Activity className="h-5 w-5 text-gray-400" />
                            <div>
                              <label className="text-xs text-gray-500 block">
                                Last Activity
                              </label>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDateShort(
                                  selectedCommunity.lastActivity
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                            Tags
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {selectedCommunity.tags?.map(
                              (tag: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs px-3 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 text-purple-700"
                                >
                                  {tag}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Administration */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        Administration
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                          <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                            <AvatarImage
                              src={
                                selectedCommunity.admin?.avatar ||
                                "/placeholder.svg"
                              }
                            />
                            <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                              {selectedCommunity.admin?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">
                                {selectedCommunity.admin?.name}
                              </span>
                              <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">
                                Admin
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {selectedCommunity.admin?.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog open={isReportDetailOpen} onOpenChange={setIsReportDetailOpen}>
        <DialogContent className="max-w-3xl bg-white border border-gray-200 shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              Report Details
              {selectedReport?.status === "resolved" && (
                <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 flex items-center gap-1 ml-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Resolved
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-gray-600">
                View detailed information about this report
              </div>
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Community Header */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {(() => {
                        // For community reports, prioritize community name from various sources
                        if (selectedReport.report_type === "community" || selectedReport.category === "community") {
                          return selectedReport.reported_community?.name || 
                                 selectedReport.target_data?.name || 
                                 selectedReport.communityName || 
                                 selectedReport.target_name || 
                                 "Unknown Community";
                        }
                        // For other report types, use target name
                        return selectedReport.communityName || 
                               selectedReport.target_name || 
                               selectedReport.reported_community?.name ||
                               selectedReport.target_data?.name ||
                               "Unknown";
                      })()}
                    </h3>
                    {/* Show community context for thread/reply/event */}
                    {((selectedReport.category === "thread" || selectedReport.category === "reply" || selectedReport.category === "event") || 
                      (selectedReport.report_type === "thread" || selectedReport.report_type === "reply" || selectedReport.report_type === "event")) && 
                     (selectedReport.actualCommunityName || selectedReport.community_name) && (
                      <div className="text-sm text-gray-700 mb-2 flex items-center gap-1">
                        <span className="font-medium">Community:</span>
                        <span>{selectedReport.actualCommunityName || selectedReport.community_name}</span>
                      </div>
                    )}
                    {/* Show community name for community reports if not already shown in title */}
                    {(selectedReport.report_type === "community" || selectedReport.category === "community") && 
                     (selectedReport.community_name || selectedReport.actualCommunityName) && 
                     !selectedReport.reported_community?.name && 
                     !selectedReport.target_data?.name && (
                      <div className="text-sm text-gray-700 mb-2 flex items-center gap-1">
                        <span className="font-medium">Community:</span>
                        <span>{selectedReport.community_name || selectedReport.actualCommunityName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-500 text-white">
                        {selectedReport.reportCount || selectedReport.report_count || selectedReport.unique_reporters || 1} Reports
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          (selectedReport.category || selectedReport.report_type) === "community"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : (selectedReport.category || selectedReport.report_type) === "event"
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : (selectedReport.category || selectedReport.report_type) === "thread"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : (selectedReport.category || selectedReport.report_type) === "reply"
                            ? "bg-orange-50 border-orange-200 text-orange-700"
                            : (selectedReport.category || selectedReport.report_type) === "member"
                            ? "bg-purple-50 border-purple-200 text-purple-700"
                            : "bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        {selectedReport.category || selectedReport.report_type || "Unknown"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedReport.reports && selectedReport.reports.length > 1 ? (
                        <>
                          Reported by: {selectedReport.unique_reporters || selectedReport.reportCount || selectedReport.report_count || selectedReport.reports.length} unique reporters
                        </>
                      ) : (
                        <>
                          Reported by: {selectedReport.reporterInfo?.name || selectedReport.reporter?.full_name || "Anonymous"}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Reasons Statistics */}
              {selectedReport.reports && selectedReport.reports.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Report Reasons Breakdown
                </h4>
                {(() => {
                  const reasonCounts = selectedReport.reports.reduce(
                    (acc: any, report: any) => {
                      acc[report.reason] = (acc[report.reason] || 0) + 1;
                      return acc;
                    },
                    {}
                  );

                  const sortedReasons = Object.entries(reasonCounts).sort(
                    ([, a]: any, [, b]: any) => b - a
                  );

                  return (
                    <div className="flex flex-wrap gap-2">
                      {sortedReasons.map(
                        ([reason, count]: any, index: number) => (
                          <div
                            key={reason}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                              index === 0
                                ? "bg-red-100 border-red-300 text-red-800"
                                : "bg-white border-gray-200 text-gray-700"
                            }`}
                          >
                            {index === 0 && (
                              <span className="text-xs font-bold">👑</span>
                            )}
                            <span className="text-sm font-medium">
                              {getReportReasonLabel(reason)}
                            </span>
                            <Badge
                              className={`${
                                index === 0
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-500 text-white"
                              } text-xs px-2 py-0.5`}
                            >
                              {count}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  );
                })()}
              </div>
              )}

              {/* Single Report Details - Show if this is a single report from review queue */}
              {!selectedReport.reports && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Report Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Reason: </span>
                      <span className="text-sm text-gray-900">{getReportReasonLabel(selectedReport.reason)}</span>
                    </div>
                    {selectedReport.details && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Details: </span>
                        <p className="text-sm text-gray-900 mt-1">{selectedReport.details}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-700">Status: </span>
                      <Badge className={selectedReport.status === "pending" ? "bg-yellow-500 text-white" : "bg-green-500 text-white"}>
                        {selectedReport.status}
                      </Badge>
                    </div>
                    {selectedReport.unique_reporters && selectedReport.threshold && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Reports / Threshold: </span>
                        <Badge className="bg-orange-500 text-white">
                          {selectedReport.unique_reporters} / {selectedReport.threshold}
                        </Badge>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-700">Reported: </span>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedReport.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Report List with Pagination */}
              {selectedReport.reports && selectedReport.reports.length > 0 && (
                <>
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      User Reports
                    </h4>
                  </div>

                  {(() => {
                  // All reports - transform if needed for consistency
                  const rawReports = selectedReport.reports || [];
                  const filteredReports = rawReports.map((report: any) => {
                    // Check if already transformed (has reportDate field)
                    if (report.reportDate) {
                      return report;
                    }
                    // Transform raw backend data to expected format
                    return {
                      ...report,
                      reportedBy: report.reporter_id || report.reportedBy,
                      reporterName: report.reporter?.full_name || report.reporterName || "Anonymous",
                      reason: report.reason,
                      description: report.details || report.description || "",
                      reportDate: report.created_at || report.reportDate,
                      reportId: report.id || report.reportId,
                      report_type: report.report_type,
                    };
                  });

                  // Pagination
                  const totalPages = Math.ceil(
                    filteredReports.length / reportDetailItemsPerPage
                  );
                  const startIndex =
                    (reportDetailPage - 1) * reportDetailItemsPerPage;
                  const endIndex = startIndex + reportDetailItemsPerPage;
                  const paginatedReports = filteredReports.slice(
                    startIndex,
                    endIndex
                  );

                  return (
                    <>
                      {/* Report Items */}
                      <div className="space-y-3 mb-4">
                        {paginatedReports.map((report: any, index: number) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex flex-col gap-2">
                                <div className="font-medium text-gray-900">
                                  {report.reporterName}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Report Type Badge */}
                                  {report.report_type && (
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        report.report_type === "member"
                                          ? "bg-purple-50 border-purple-200 text-purple-700"
                                          : report.report_type === "event"
                                          ? "bg-blue-50 border-blue-200 text-blue-700"
                                          : report.report_type === "thread"
                                          ? "bg-green-50 border-green-200 text-green-700"
                                          : report.report_type === "reply"
                                          ? "bg-orange-50 border-orange-200 text-orange-700"
                                          : report.report_type === "community"
                                          ? "bg-red-50 border-red-200 text-red-700"
                                          : "bg-gray-50 border-gray-200 text-gray-700"
                                      }`}
                                    >
                                      {report.report_type === "member"
                                        ? "Member"
                                        : report.report_type === "event"
                                        ? "Event"
                                        : report.report_type === "thread"
                                        ? "Thread"
                                        : report.report_type === "reply"
                                        ? "Reply"
                                        : report.report_type === "community"
                                        ? "Community"
                                        : report.report_type}
                                    </Badge>
                                  )}
                                  {/* Reason Badge */}
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-orange-50 border-orange-300 text-orange-700"
                                  >
                                    {getReportReasonLabel(report.reason)}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {report.reportDate 
                                  ? new Date(report.reportDate).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : "Date not available"}
                              </div>
                            </div>

                            {/* Notes/Description from User */}
                            {report.description && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                                      User Notes
                                    </label>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {report.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Pagination Info and Controls */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Showing {startIndex + 1} to{" "}
                          {Math.min(endIndex, filteredReports.length)} of{" "}
                          {filteredReports.length} reports
                        </div>

                        {totalPages > 1 && (
                          <div className="flex items-center gap-2">
                            <AnimatedButton
                              variant="glass"
                              size="sm"
                              onClick={() =>
                                setReportDetailPage((prev) =>
                                  Math.max(1, prev - 1)
                                )
                              }
                              disabled={reportDetailPage === 1}
                              className="disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </AnimatedButton>

                            <div className="flex items-center gap-1">
                              {Array.from(
                                { length: Math.min(totalPages, 5) },
                                (_, i) => {
                                  // Show first, last, current, and adjacent pages
                                  const pages = [];
                                  if (totalPages <= 5) {
                                    return i + 1;
                                  }

                                  if (i === 0) return 1;
                                  if (i === 4) return totalPages;
                                  if (reportDetailPage <= 3) return i + 1;
                                  if (reportDetailPage >= totalPages - 2)
                                    return totalPages - 4 + i;
                                  return reportDetailPage - 2 + i;
                                }
                              ).map((page, idx, arr) => (
                                <div key={page} className="flex items-center">
                                  {idx > 0 && page !== arr[idx - 1] + 1 && (
                                    <span className="px-2 text-gray-400">
                                      ...
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setReportDetailPage(page)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                      reportDetailPage === page
                                        ? "bg-purple-600 text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </div>
                              ))}
                            </div>

                            <AnimatedButton
                              variant="glass"
                              size="sm"
                              onClick={() =>
                                setReportDetailPage((prev) =>
                                  Math.min(totalPages, prev + 1)
                                )
                              }
                              disabled={reportDetailPage === totalPages}
                              className="disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </AnimatedButton>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2">
            <AnimatedButton
              variant="glass"
              onClick={() => setIsReportDetailOpen(false)}
              disabled={isProcessingAction}
            >
              Close
            </AnimatedButton>
            {selectedReport?.status !== "resolved" && (
              <div className="flex gap-2">
                <AnimatedButton 
                  variant="glass"
                  onClick={() => handleDismissReport(selectedReport)}
                  disabled={isProcessingAction}
                  className="border-gray-300 hover:border-gray-400"
                >
                  {isProcessingAction ? "Processing..." : "Dismiss"}
                </AnimatedButton>
                <AnimatedButton 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleBanClick(selectedReport)}
                  disabled={isProcessingAction}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  {isProcessingAction ? "Processing..." : "Ban"}
                </AnimatedButton>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Confirmation Dialog */}
      <AlertDialog open={isBanConfirmOpen} onOpenChange={setIsBanConfirmOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Ban Action
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="text-gray-700">
                  This action will have the following consequences:
                </div>
              
              {reportToBan && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2 text-sm">
                  {(reportToBan.report_type === "community" || reportToBan.category === "community") && (
                    <>
                      <div className="font-semibold text-yellow-900">Community Ban:</div>
                      <ul className="list-disc list-inside space-y-1 text-yellow-800">
                        <li>Community will be banned (inaccessible)</li>
                        <li>Admin banned from creating new communities permanently</li>
                        <li>All members will be notified</li>
                        <li>Admin will receive detailed notification</li>
                      </ul>
                    </>
                  )}
                  {(reportToBan.report_type === "thread" || reportToBan.category === "thread") && (
                    <>
                      <div className="font-semibold text-yellow-900">Thread Ban:</div>
                      <ul className="list-disc list-inside space-y-1 text-yellow-800">
                        <li>Thread will be permanently deleted</li>
                        <li>Creator banned from posting platform-wide</li>
                        <li>Community admin receives 1 strike (3 strikes = can't create communities)</li>
                        <li>Both creator and admin will be notified</li>
                      </ul>
                    </>
                  )}
                  {(reportToBan.report_type === "event" || reportToBan.category === "event") && (
                    <>
                      <div className="font-semibold text-yellow-900">Event Ban:</div>
                      <ul className="list-disc list-inside space-y-1 text-yellow-800">
                        <li>Event will be permanently deleted</li>
                        <li>Creator banned from posting platform-wide</li>
                        <li>Community admin receives 1 strike (3 strikes = can't create communities)</li>
                        <li>Both creator and admin will be notified</li>
                      </ul>
                    </>
                  )}
                  {(reportToBan.report_type === "reply" || reportToBan.category === "reply") && (
                    <>
                      <div className="font-semibold text-yellow-900">Reply Ban:</div>
                      <ul className="list-disc list-inside space-y-1 text-yellow-800">
                        <li>Reply will be permanently deleted</li>
                        <li>Creator banned from posting platform-wide</li>
                        <li>Community admin receives 1 strike (3 strikes = can't create communities)</li>
                        <li>Both creator and admin will be notified</li>
                      </ul>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Ban Reason (required) *
                </label>
                <Textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Provide a detailed reason for this ban action. This will be sent to affected users."
                  className="min-h-[100px] resize-none"
                  rows={4}
                  disabled={isProcessingAction}
                  autoComplete="off"
                />
              </div>
            </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingAction}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBanConfirm();
              }}
              disabled={isProcessingAction || !banReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingAction ? "Processing..." : "Confirm Ban"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* All Communities Dialog */}
      <Dialog
        open={isAllCommunitiesDialogOpen}
        onOpenChange={setIsAllCommunitiesDialogOpen}
      >
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-600" />
              All Communities
            </DialogTitle>
            <DialogDescription asChild>
              <div>View and manage all communities in the platform</div>
            </DialogDescription>
          </DialogHeader>

          {/* Search and Filter */}
          <div className="flex gap-3 py-4 border-b">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search communities..."
                value={communitySearchQuery}
                onChange={(e) => setCommunitySearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={communityFilterStatus}
              onChange={(e) => setCommunityFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-purple-300 focus:ring-purple-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={communitySortBy}
              onChange={(e) => setCommunitySortBy(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-purple-300 focus:ring-purple-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="members">Most Members</option>
            </select>
          </div>

          {/* Communities List */}
          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {filteredCommunities.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No communities found</p>
              </div>
            ) : (
              [...filteredCommunities]
                .sort((a, b) => b.memberCount - a.memberCount)
                .map((community, index) => (
                  <div
                    key={community.id}
                    className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      {/* Numbering */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          {community.name}
                        </h5>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>
                            {formatNumber(community.memberCount)} members
                          </span>
                          <span>•</span>
                          <span>{community.totalEvents} events</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {community.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCommunity(community);
                            setIsCommunityDetailOpen(true);
                            setIsAllCommunitiesDialogOpen(false);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Pagination */}
          {filteredCommunities.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {filteredCommunities.length} communities
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAllCommunitiesDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
