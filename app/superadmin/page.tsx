"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientSession } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTransition } from "@/components/ui/page-transition";
import { FloatingElements } from "@/components/ui/floating-elements";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Spinner } from "@/components/ui/loading-indicators";
import {
  Sparkles,
  Shield,
  Activity,
  Users,
  Clock,
  Bell,
  Settings,
  Filter,
  Download,
  CalendarIcon,
  FileText,
  ShoppingBag,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Zap,
  UserCheck,
  Ban,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RefreshCcw,
  MessageSquare,
  Star,
  Edit,
  Trash2,
  Crown,
  Trophy,
  Award,
  Gift,
  Medal,
  Heart,
  Target,
  Flame,
  MessageCircle,
  CalendarDays,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { SuperAdminNav } from "@/components/navigation/superadmin-nav";
import { AdsManagement } from "@/components/superadmin/ads-management";
import { toast } from "sonner";

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
    action: "suspend",
    communityName: "Gaming Hub",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-21T16:45:00Z",
    details: "Community suspended for inappropriate content",
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
    action: "suspend",
    communityName: "Crypto Traders",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-20T18:00:00Z",
    details: "Community suspended for suspicious activity",
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
    action: "suspend",
    communityName: "Meme Lords",
    performedBy: {
      name: "Super Admin",
      email: "admin@connectspace.com",
    },
    timestamp: "2025-11-18T17:30:00Z",
    details: "Community suspended for violating content guidelines",
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

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === "/superadmin/ads") {
      setActiveTab("ads");
    } else if (pathname === "/superadmin") {
      setActiveTab("reports");
    }
  }, [pathname]);

  // Fetch inactive communities function (defined outside useEffect for reuse)
  const fetchInactiveCommunities = useCallback(async () => {
    setIsLoadingInactive(true);
    try {
      const response = await fetch("/api/superadmin/inactive-communities");
      if (!response.ok) {
        throw new Error("Failed to fetch inactive communities");
      }
      const data = await response.json();
      setInactiveCommunities(data.communities || []);
    } catch (error) {
      console.error("Error fetching inactive communities:", error);
      toast.error("Failed to load inactive communities");
    } finally {
      setIsLoadingInactive(false);
    }
  }, []);

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoadingReports(true);
      try {
        const response = await fetch("/api/superadmin/reports");
        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }
        const data = await response.json();
        setReportedCommunities(data.reports || []);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to load reports");
      } finally {
        setIsLoadingReports(false);
      }
    };

    if (activeTab === "reports") {
      fetchReports();
      fetchInactiveCommunities();
    }
  }, [activeTab, fetchInactiveCommunities]);

  // Reports management state
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReportDetailOpen, setIsReportDetailOpen] = useState(false);
  const [currentReportPage, setCurrentReportPage] = useState(1);
  const [reportItemsPerPage] = useState(5);
  const [inactiveSearchQuery, setInactiveSearchQuery] = useState("");
  const [currentInactivePage, setCurrentInactivePage] = useState(1);
  const [inactiveItemsPerPage] = useState(5);
  
  // API state for reports
  const [reportedCommunities, setReportedCommunities] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  
  // API state for inactive communities
  const [inactiveCommunities, setInactiveCommunities] = useState<any[]>([]);
  const [isLoadingInactive, setIsLoadingInactive] = useState(true);

  // Report detail dialog state
  const [reportDetailPage, setReportDetailPage] = useState(1);
  const [reportDetailItemsPerPage] = useState(5);

  // Ad requests state
  const [adRequests, setAdRequests] = useState<any[]>([]);
  const [isLoadingAdRequests, setIsLoadingAdRequests] = useState(true);
  const [selectedAdRequest, setSelectedAdRequest] = useState<any>(null);
  const [isAdRequestDialogOpen, setIsAdRequestDialogOpen] = useState(false);
  const [adRequestFilter, setAdRequestFilter] = useState<"unread" | "all">("unread");
  const [adRequestSort, setAdRequestSort] = useState<"desc" | "asc">("desc");

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

  // Filter reported communities based on search query
  const filteredReportedCommunities = reportedCommunities.filter(
    (report) => {
      const matchesSearch =
        reportSearchQuery === "" ||
        report.communityName
          .toLowerCase()
          .includes(reportSearchQuery.toLowerCase()) ||
        report.category.toLowerCase().includes(reportSearchQuery.toLowerCase());

      return matchesSearch;
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

  // Sort inactive communities by inactive days (longest first)
  // Filter and sort inactive communities
  const filteredInactiveCommunities = inactiveCommunities.filter(
    (community) =>
      community.communityName
        .toLowerCase()
        .includes(inactiveSearchQuery.toLowerCase()) ||
      community.admin.name
        .toLowerCase()
        .includes(inactiveSearchQuery.toLowerCase())
  );

  const sortedInactiveCommunities = [...filteredInactiveCommunities].sort(
    (a, b) => b.inactiveDays - a.inactiveDays
  );

  // Pagination for inactive communities
  const totalInactivePages = Math.ceil(
    sortedInactiveCommunities.length / inactiveItemsPerPage
  );
  const inactiveStartIndex = (currentInactivePage - 1) * inactiveItemsPerPage;
  const inactiveEndIndex = inactiveStartIndex + inactiveItemsPerPage;
  const paginatedInactiveCommunities = sortedInactiveCommunities.slice(
    inactiveStartIndex,
    inactiveEndIndex
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

  // Handle report actions (suspend, dismiss, resolve, reactivate)
  const handleReportAction = async (
    communityId: string,
    action: "suspend" | "dismiss" | "resolve" | "reactivate",
    reportIds?: string[]
  ) => {
    setIsProcessingAction(true);
    try {
      const response = await fetch(`/api/superadmin/reports/${communityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          reportIds: reportIds || [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process action");
      }

      const data = await response.json();
      toast.success(`Community ${action}ed successfully`);

      // Refresh reports if action was on a reported community
      if (action === "suspend" || action === "dismiss" || action === "resolve") {
        const refreshResponse = await fetch("/api/superadmin/reports");
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setReportedCommunities(refreshData.reports || []);
        }
      }

      // Refresh inactive communities if action was reactivate
      if (action === "reactivate") {
        fetchInactiveCommunities();
      }

      // Close dialog if open
      if (isReportDetailOpen) {
        setIsReportDetailOpen(false);
      }
    } catch (error: any) {
      console.error("Error processing report action:", error);
      toast.error(error.message || "Failed to process action");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Fetch ad requests
  useEffect(() => {
    const fetchAdRequests = async () => {
      setIsLoadingAdRequests(true);
      try {
        const response = await fetch("/api/superadmin/ads-requests");
        if (!response.ok) {
          throw new Error("Failed to fetch ad requests");
        }
        const result = await response.json();
        setAdRequests(result.data || []);
      } catch (error) {
        console.error("Error fetching ad requests:", error);
        // Fallback to empty array if fetch fails
        setAdRequests([]);
      } finally {
        setIsLoadingAdRequests(false);
      }
    };

    fetchAdRequests();
  }, []);

  // Filter and sort ad requests
  const filteredAdRequests = adRequests
    .filter((req) => {
      if (adRequestFilter === "unread") {
        return !req.is_read;
      }
      return true; // "all"
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      if (adRequestSort === "desc") {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

  // Calculate ad request statistics
  const unreadAdRequests = adRequests.filter((req) => !req.is_read);
  const readAdRequests = adRequests.filter((req) => req.is_read);

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
      case "suspend":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 flex items-center gap-1 w-fit text-xs px-2 py-1">
            <Ban className="h-3 w-3" />
            Suspended
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
      case "suspended":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
            Suspended
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
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
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
            <TabsList className="grid w-full grid-cols-2 glass-effect border-0 p-2 rounded-2xl mb-8 h-14">
              <TabsTrigger
                value="reports"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 flex items-center justify-center gap-2 h-10 px-4"
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Reports</span>
              </TabsTrigger>
              <TabsTrigger
                value="ads"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 flex items-center justify-center gap-2 h-10 px-4"
              >
                <Megaphone className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Ads</span>
              </TabsTrigger>
            </TabsList>

            {/* Reports Tab - Community Reports & Inactive Communities */}
            <TabsContent value="reports" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                  Community Reports & Moderation
                </h3>
                <div className="text-sm text-gray-600">
                  Total Reports: {reportedCommunities.length} | Inactive:{" "}
                  {inactiveCommunities.length}
                </div>
              </div>

              {/* Reported Communities Section */}
              <AnimatedCard variant="glass" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Ban className="h-5 w-5 text-red-600" />
                    Reported Communities
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      {reportedCommunities.length} Reports
                    </Badge>
                  </h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search reported communities..."
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>

                {isLoadingReports ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Community
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Members
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Reports
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Last Report
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
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
                              No reported communities found
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
                                  <div className="text-xs text-gray-500">
                                    {report.communityDetails.admin.name}
                                  </div>
                                </div>
                                {report.communityStatus === "suspended" && (
                                  <Badge className="bg-red-500 text-white text-xs">
                                    <Ban className="h-3 w-3 mr-1" />
                                    Suspended
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-700">
                                {report.communityDetails.memberCount}
                              </div>
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
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </AnimatedButton>
                                {report.communityStatus === "suspended" ? (
                                  <AnimatedButton
                                    variant="glass"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleReportAction(report.communityId, "reactivate")}
                                    disabled={isProcessingAction}
                                  >
                                    {isProcessingAction ? (
                                      <Spinner size="sm" />
                                    ) : (
                                      <>
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        Reactivate
                                      </>
                                    )}
                                  </AnimatedButton>
                                ) : (
                                  <AnimatedButton
                                    variant="glass"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleReportAction(report.communityId, "suspend")}
                                    disabled={isProcessingAction}
                                  >
                                    {isProcessingAction ? (
                                      <Spinner size="sm" />
                                    ) : (
                                      <>
                                        <Ban className="h-4 w-4 mr-1" />
                                        Suspend
                                      </>
                                    )}
                                  </AnimatedButton>
                                )}
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

              {/* Inactive Communities Section */}
              <AnimatedCard variant="glass" className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      Inactive Communities (Auto-Suspended)
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                        {sortedInactiveCommunities.length} Suspended
                      </Badge>
                      {sortedInactiveCommunities.filter(
                        (c: any) => c.reactivationRequested
                      ).length > 0 && (
                        <Badge className="bg-blue-500 text-white">
                          <Bell className="h-3 w-3 mr-1" />
                          {
                            sortedInactiveCommunities.filter(
                              (c: any) => c.reactivationRequested
                            ).length
                          }{" "}
                          Pending
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Communities automatically suspended due to no activity
                      (events or announcements) for more than 30 days
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search inactive communities..."
                      value={inactiveSearchQuery}
                      onChange={(e) => setInactiveSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Community
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Members
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Inactive Status
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Last Activity
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Reactivation
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingInactive ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-12"
                          >
                            <div className="flex items-center justify-center">
                              <Spinner size="lg" />
                            </div>
                          </td>
                        </tr>
                      ) : paginatedInactiveCommunities.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-8 text-gray-500"
                          >
                            No inactive communities found
                          </td>
                        </tr>
                      ) : (
                        paginatedInactiveCommunities.map((community) => (
                          <tr
                            key={community.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {community.communityName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {community.admin.name}
                                  </div>
                                </div>
                                {community.reactivationRequested && (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                    <Bell className="h-3 w-3 mr-1 inline" />
                                    Request
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-700">
                                {community.memberCount}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-1">
                                <Badge className="bg-orange-500 text-white w-fit">
                                  {community.inactiveDays} days
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {community.lastActivityType === "event"
                                    ? "📅 Event"
                                    : "📢 Announcement"}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-700">
                                {new Date(
                                  community.lastActivity
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                {community.reactivationRequested ? (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-yellow-600 border-yellow-300"
                                  >
                                    Reactivation Requested
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-gray-400"
                                  >
                                    No request
                                  </Badge>
                                )}
                                <AnimatedButton
                                  variant="glass"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleReportAction(community.id, "reactivate")}
                                  disabled={isProcessingAction}
                                >
                                  {isProcessingAction ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    <>
                                      <RotateCcw className="h-4 w-4 mr-1" />
                                      Reactivate
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

                {/* Pagination for Inactive Communities */}
                {totalInactivePages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {inactiveStartIndex + 1} to{" "}
                      {Math.min(
                        inactiveEndIndex,
                        sortedInactiveCommunities.length
                      )}{" "}
                      of {sortedInactiveCommunities.length} communities
                    </div>
                    <div className="flex items-center gap-2">
                      <AnimatedButton
                        variant="glass"
                        size="sm"
                        onClick={() =>
                          setCurrentInactivePage((prev) =>
                            Math.max(1, prev - 1)
                          )
                        }
                        disabled={currentInactivePage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </AnimatedButton>
                      <span className="text-sm text-gray-600">
                        Page {currentInactivePage} of {totalInactivePages}
                      </span>
                      <AnimatedButton
                        variant="glass"
                        size="sm"
                        onClick={() =>
                          setCurrentInactivePage((prev) =>
                            Math.min(totalInactivePages, prev + 1)
                          )
                        }
                        disabled={currentInactivePage === totalInactivePages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </AnimatedButton>
                    </div>
                  </div>
                )}
              </AnimatedCard>
            </TabsContent>

            {/* Ads Tab */}
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
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              View detailed information about this reported community
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Community Header */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedReport.communityName}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-500 text-white">
                        {selectedReport.reportCount} Reports
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Admin: {selectedReport.communityDetails.admin.name} (
                      {selectedReport.communityDetails.admin.email})
                    </div>
                    <div className="text-sm text-gray-600">
                      Members: {selectedReport.communityDetails.memberCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Reasons Statistics */}
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
                              {reason}
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

              {/* Report List with Pagination */}
              <div>
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    User Reports
                  </h4>
                </div>

                {(() => {
                  // All reports without filter
                  const filteredReports = selectedReport.reports;

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
                              <div>
                                <div className="font-medium text-gray-900 mb-2">
                                  {report.reporterName}
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-orange-50 border-orange-300 text-orange-700"
                                >
                                  {report.reason}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(report.reportDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </div>

                            {/* Notes/Description from User */}
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
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2">
            <AnimatedButton
              variant="glass"
              onClick={() => setIsReportDetailOpen(false)}
            >
              Close
            </AnimatedButton>
            <AnimatedButton className="bg-red-600 hover:bg-red-700 text-white">
              <Ban className="h-4 w-4 mr-2" />
              Suspend Community
            </AnimatedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <DialogDescription>
              View and manage all communities in the platform
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

      {/* Ad Request Detail Dialog */}
      <Dialog open={isAdRequestDialogOpen} onOpenChange={setIsAdRequestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Ad Request Details
            </DialogTitle>
            <DialogDescription>
              View the details of this ad request
            </DialogDescription>
          </DialogHeader>
          
          {selectedAdRequest && (
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">User Name</Label>
                <p className="text-base text-gray-900">{selectedAdRequest.user_name || "Unknown User"}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Email</Label>
                <p className="text-base text-gray-900 break-all">{selectedAdRequest.email || "No email provided"}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Message</Label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-base text-gray-700 whitespace-pre-wrap">
                    {selectedAdRequest.message || "No message provided"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Request Date</Label>
                <p className="text-base text-gray-900">{formatDate(selectedAdRequest.created_at)}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Status</Label>
                <div>
                  {selectedAdRequest.is_read ? (
                    <Badge className="bg-green-500 text-white">Read</Badge>
                  ) : (
                    <Badge className="bg-yellow-500 text-white">Unread</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAdRequestDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
