"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTransition } from "@/components/ui/page-transition";
import { FloatingElements } from "@/components/ui/floating-elements";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
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
  BarChart3,
  Globe,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  MessageCircle,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { ActivityLogsTable } from "@/components/superadmin/activity-logs-table";
import { RecentActivities } from "@/components/superadmin/recent-activities";
import { BadgeForm } from "@/components/superadmin/badge-form";
import { format, subMonths } from "date-fns";

// Badge data types
export interface StoreBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "achievement" | "cosmetic" | "special" | "seasonal";
  rarity: "common" | "rare" | "epic" | "legendary";
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

// Analytics data types
interface AnalyticsData {
  date: string;
  communities: number;
  users: number;
  posts: number;
  events: number;
  engagement: number;
}

interface CommunityPerformance {
  id: string;
  name: string;
  members: number;
  growth: number;
  engagement: number;
  posts: number;
  events: number;
  rating: number;
  category: string;
}

interface GeographicData {
  country: string;
  users: number;
  communities: number;
  percentage: number;
  [key: string]: string | number;
}

interface ContentMetrics {
  type: string;
  count: number;
  engagement: number;
  growth: number;
}

// Mock analytics data
const mockAnalyticsData: AnalyticsData[] = [
  {
    date: "2024-01",
    communities: 45,
    users: 1200,
    posts: 890,
    events: 23,
    engagement: 72,
  },
  {
    date: "2024-02",
    communities: 52,
    users: 1450,
    posts: 1120,
    events: 31,
    engagement: 75,
  },
  {
    date: "2024-03",
    communities: 61,
    users: 1680,
    posts: 1340,
    events: 28,
    engagement: 78,
  },
  {
    date: "2024-04",
    communities: 58,
    users: 1590,
    posts: 1180,
    events: 25,
    engagement: 74,
  },
  {
    date: "2024-05",
    communities: 67,
    users: 1820,
    posts: 1520,
    events: 35,
    engagement: 81,
  },
  {
    date: "2024-06",
    communities: 73,
    users: 2100,
    posts: 1780,
    events: 42,
    engagement: 84,
  },
  {
    date: "2024-07",
    communities: 79,
    users: 2350,
    posts: 1950,
    events: 38,
    engagement: 82,
  },
  {
    date: "2024-08",
    communities: 85,
    users: 2580,
    posts: 2140,
    events: 45,
    engagement: 85,
  },
  {
    date: "2024-09",
    communities: 91,
    users: 2820,
    posts: 2380,
    events: 52,
    engagement: 87,
  },
  {
    date: "2024-10",
    communities: 98,
    users: 3100,
    posts: 2650,
    events: 48,
    engagement: 89,
  },
  {
    date: "2024-11",
    communities: 105,
    users: 3420,
    posts: 2890,
    events: 55,
    engagement: 91,
  },
  {
    date: "2024-12",
    communities: 112,
    users: 3750,
    posts: 3120,
    events: 62,
    engagement: 93,
  },
];

const mockCommunityPerformance: CommunityPerformance[] = [
  {
    id: "1",
    name: "Tech Innovators Hub",
    members: 450,
    growth: 15.2,
    engagement: 89,
    posts: 1250,
    events: 45,
    rating: 4.8,
    category: "Technology",
  },
  {
    id: "2",
    name: "Fitness & Wellness",
    members: 320,
    growth: 12.8,
    engagement: 82,
    posts: 1100,
    events: 35,
    rating: 4.7,
    category: "Health",
  },
  {
    id: "3",
    name: "Global Writers Circle",
    members: 230,
    growth: 8.7,
    engagement: 65,
    posts: 890,
    events: 22,
    rating: 4.6,
    category: "Writing",
  },
  {
    id: "4",
    name: "Travel Adventures",
    members: 180,
    growth: 10.3,
    engagement: 71,
    posts: 650,
    events: 18,
    rating: 4.5,
    category: "Travel",
  },
  {
    id: "5",
    name: "Sustainable Living",
    members: 120,
    growth: -2.1,
    engagement: 26,
    posts: 340,
    events: 8,
    rating: 4.2,
    category: "Environment",
  },
];

const mockGeographicData: GeographicData[] = [
  { country: "Jakarta", users: 1250, communities: 35, percentage: 33.3 },
  { country: "Surabaya", users: 680, communities: 18, percentage: 18.1 },
  { country: "Bali", users: 520, communities: 15, percentage: 13.9 },
  { country: "Medan", users: 380, communities: 12, percentage: 10.1 },
  { country: "IKN", users: 290, communities: 8, percentage: 7.7 },
  { country: "Others", users: 1130, communities: 32, percentage: 16.9 },
];

const mockContentMetrics: ContentMetrics[] = [
  { type: "Discussion Posts", count: 2840, engagement: 78, growth: 12.5 },
  { type: "Events", count: 156, engagement: 85, growth: 18.2 },
  { type: "Resources", count: 420, engagement: 65, growth: 8.7 },
  { type: "Announcements", count: 89, engagement: 92, growth: 15.3 },
];

const chartColors = {
  primary: "#8b5cf6",
  secondary: "#06b6d4",
  tertiary: "#10b981",
  quaternary: "#f59e0b",
  danger: "#ef4444",
  success: "#22c55e",
};

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
    priority: "high",
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
    priority: "medium",
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
    priority: "low",
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
    priority: "urgent",
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
    priority: "medium",
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
    priority: "medium",
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
    priority: "low",
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
    rating: 4.8,
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

export default function SuperadminPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Analytics state
  const [analyticsDateRange, setAnalyticsDateRange] = useState({
    from: subMonths(new Date(), 6),
    to: new Date(),
  });
  const [analyticsFilter, setAnalyticsFilter] = useState("all");
  const [analyticsMetric, setAnalyticsMetric] = useState("communities");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Badge management state
  const [badgeSearchQuery, setBadgeSearchQuery] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<StoreBadge | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [badgeActiveTab, setBadgeActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filterRarity, setFilterRarity] = useState("all");
  const [badgeViewMode, setBadgeViewMode] = useState<"grid" | "list">("grid");

  // Community requests state
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [requestSortBy, setRequestSortBy] = useState("priority");
  const [requestFilterCategory, setRequestFilterCategory] = useState("all");

  // Community management state
  const [communitySearchQuery, setCommunitySearchQuery] = useState("");
  const [communityFilterStatus, setCommunityFilterStatus] = useState("all");
  const [communitySortBy, setCommunitySortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);
  const [isCommunityDetailOpen, setIsCommunityDetailOpen] = useState(false);
  const [communityDetailTab, setCommunityDetailTab] = useState("overview");

  // Mock badges data with enhanced information
  const [badges, setBadges] = useState<StoreBadge[]>([
    {
      id: "1",
      name: "Tech Guru",
      description:
        "Awarded to members who consistently provide valuable technical insights and help others solve complex problems.",
      icon: "Trophy",
      category: "achievement",
      rarity: "epic",
      price: 1000,
      image: "/placeholder.svg?height=200&width=200",
      isActive: true,
      createdAt: "2023-05-15T10:30:00Z",
      updatedAt: "2023-05-15T10:30:00Z",
      purchaseCount: 145,
      revenue: 145000,
    },
    {
      id: "2",
      name: "Event Master",
      description:
        "For those who have attended at least 20 community events and actively participate in discussions.",
      icon: "Star",
      category: "achievement",
      rarity: "rare",
      price: 500,
      image: "/placeholder.svg?height=200&width=200",
      isActive: true,
      createdAt: "2023-06-20T14:15:00Z",
      updatedAt: "2023-06-20T14:15:00Z",
      purchaseCount: 289,
      revenue: 144500,
    },
    {
      id: "3",
      name: "Community Champion",
      description:
        "Reserved for members who have made exceptional contributions to the community and helped it grow.",
      icon: "Award",
      category: "achievement",
      rarity: "legendary",
      price: 2000,
      image: "/placeholder.svg?height=200&width=200",
      isActive: true,
      createdAt: "2023-04-10T09:45:00Z",
      updatedAt: "2023-07-05T11:20:00Z",
      purchaseCount: 67,
      revenue: 134000,
    },
    {
      id: "4",
      name: "Holiday Special 2023",
      description:
        "Limited edition badge available only during the holiday season. Features exclusive winter-themed design.",
      icon: "Gift",
      category: "seasonal",
      rarity: "epic",
      price: 1200,
      image: "/placeholder.svg?height=200&width=200",
      isActive: true,
      isLimited: true,
      limitedQuantity: 50,
      limitedRemaining: 12,
      expiresAt: "2024-01-01T00:00:00Z",
      createdAt: "2023-11-25T08:30:00Z",
      updatedAt: "2023-11-25T08:30:00Z",
      purchaseCount: 38,
      revenue: 45600,
    },
    {
      id: "5",
      name: "Founding Member",
      description:
        "Exclusive badge for the first 100 members who joined the platform. A mark of true community pioneers.",
      icon: "Crown",
      category: "special",
      rarity: "legendary",
      price: 3000,
      image: "/placeholder.svg?height=200&width=200",
      isActive: false,
      isLimited: true,
      limitedQuantity: 100,
      limitedRemaining: 0,
      createdAt: "2023-01-05T12:00:00Z",
      updatedAt: "2023-03-10T15:45:00Z",
      purchaseCount: 100,
      revenue: 300000,
    },
    {
      id: "6",
      name: "Creative Spark",
      description:
        "For members who consistently share creative content and inspire others with their artistic vision.",
      icon: "Sparkles",
      category: "cosmetic",
      rarity: "rare",
      price: 750,
      image: "/placeholder.svg?height=200&width=200",
      isActive: true,
      createdAt: "2023-08-12T16:20:00Z",
      updatedAt: "2023-08-12T16:20:00Z",
      purchaseCount: 203,
      revenue: 152250,
    },
  ]);

  // Calculate request statistics
  const pendingRequests = mockCommunityRequests.filter(
    (req) => req.status === "pending"
  );
  const approvedRequests = mockCommunityRequests.filter(
    (req) => req.status === "approved"
  );
  const rejectedRequests = mockCommunityRequests.filter(
    (req) => req.status === "rejected"
  );
  const urgentRequests = pendingRequests.filter(
    (req) => req.priority === "urgent"
  );

  // Filter and sort pending requests
  const filteredPendingRequests = pendingRequests
    .filter((req) => {
      const matchesSearch =
        requestSearchQuery === "" ||
        req.name.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
        req.description
          .toLowerCase()
          .includes(requestSearchQuery.toLowerCase()) ||
        req.requestedBy.name
          .toLowerCase()
          .includes(requestSearchQuery.toLowerCase());

      const matchesCategory =
        requestFilterCategory === "all" ||
        req.category === requestFilterCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (requestSortBy) {
        case "priority":
          const priorityOrder: Record<string, number> = {
            urgent: 4,
            high: 3,
            medium: 2,
            low: 1,
          };
          return (
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

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

  // Filter badges based on search query, tab, and filters
  const filteredBadges = badges.filter((badge) => {
    const matchesSearch =
      badgeSearchQuery === "" ||
      badge.name.toLowerCase().includes(badgeSearchQuery.toLowerCase()) ||
      badge.description.toLowerCase().includes(badgeSearchQuery.toLowerCase());

    const matchesTab =
      badgeActiveTab === "all" ||
      (badgeActiveTab === "active" && badge.isActive) ||
      (badgeActiveTab === "inactive" && !badge.isActive) ||
      (badgeActiveTab === "limited" && badge.isLimited);

    const matchesRarity =
      filterRarity === "all" || badge.rarity === filterRarity;

    return matchesSearch && matchesTab && matchesRarity;
  });

  // Sort badges
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "price-high":
        return b.price - a.price;
      case "price-low":
        return a.price - b.price;
      case "popularity":
        return (b.purchaseCount || 0) - (a.purchaseCount || 0);
      case "revenue":
        return (b.revenue || 0) - (a.revenue || 0);
      default:
        return 0;
    }
  });

  // Analytics calculations
  const totalCommunities =
    mockAnalyticsData[mockAnalyticsData.length - 1]?.communities || 0;
  const totalUsers =
    mockAnalyticsData[mockAnalyticsData.length - 1]?.users || 0;
  const avgEngagement =
    mockAnalyticsData[mockAnalyticsData.length - 1]?.engagement || 0;

  const previousMonth =
    mockAnalyticsData[mockAnalyticsData.length - 2] ||
    mockAnalyticsData[mockAnalyticsData.length - 1];
  const communityGrowth = previousMonth
    ? ((totalCommunities - previousMonth.communities) /
        previousMonth.communities) *
      100
    : 0;
  const userGrowth = previousMonth
    ? ((totalUsers - previousMonth.users) / previousMonth.users) * 100
    : 0;

  // CRUD operations for badges
  const handleCreateBadge = (
    badge: Omit<StoreBadge, "id" | "createdAt" | "updatedAt">
  ) => {
    setIsLoading(true);
    setTimeout(() => {
      const newBadge: StoreBadge = {
        ...badge,
        id: `${badges.length + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        purchaseCount: 0,
        revenue: 0,
      };
      setBadges([...badges, newBadge]);
      setIsLoading(false);
      setIsCreateDialogOpen(false);
    }, 1000);
  };

  const handleUpdateBadge = (
    badge: Omit<StoreBadge, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!selectedBadge) return;
    setIsLoading(true);
    setTimeout(() => {
      const updatedBadges = badges.map((b) =>
        b.id === selectedBadge.id
          ? {
              ...badge,
              id: selectedBadge.id,
              createdAt: selectedBadge.createdAt,
              updatedAt: new Date().toISOString(),
            }
          : b
      );
      setBadges(updatedBadges);
      setIsLoading(false);
      setIsEditDialogOpen(false);
    }, 1000);
  };

  const handleDeleteBadge = () => {
    if (!selectedBadge) return;
    setIsLoading(true);
    setTimeout(() => {
      const updatedBadges = badges.filter((b) => b.id !== selectedBadge.id);
      setBadges(updatedBadges);
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setSelectedBadge(null);
    }, 1000);
  };

  const handleViewBadge = (badge: StoreBadge) => {
    setSelectedBadge(badge);
    setIsViewDialogOpen(true);
  };

  const handleEditBadge = (badge: StoreBadge) => {
    setSelectedBadge(badge);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirmation = (badge: StoreBadge) => {
    setSelectedBadge(badge);
    setIsDeleteDialogOpen(true);
  };

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

  const formatPercentage = (num: number) => {
    return `${num > 0 ? "+" : ""}${num.toFixed(1)}%`;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
            Urgent
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0">
            Low
          </Badge>
        );
      default:
        return <Badge>{priority}</Badge>;
    }
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

  const getCommunityStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
            Inactive
          </Badge>
        );
      case "under review":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
            Under Review
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getActivityLevelBadge = (level: string) => {
    switch (level) {
      case "high":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            High Activity
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Medium Activity
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Low Activity
          </Badge>
        );
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "from-gray-400 to-gray-600";
      case "rare":
        return "from-blue-400 to-blue-600";
      case "epic":
        return "from-purple-400 to-purple-600";
      case "legendary":
        return "from-yellow-400 to-yellow-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500";
      case "rare":
        return "bg-blue-500";
      case "epic":
        return "bg-purple-500";
      case "legendary":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />

      {/* Navigation */}
      <nav className="glass-effect sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link
              href="/"
              className="text-2xl font-bold text-gradient flex items-center gap-2"
            >
              <Sparkles className="w-8 h-8 text-purple-600" />
              ConnectSpace
            </Link>
            <div className="flex items-center space-x-4">
              <AnimatedButton variant="glass" size="sm">
                <Bell className="h-4 w-4" />
              </AnimatedButton>
              <AnimatedButton variant="glass" size="sm">
                <Settings className="h-4 w-4" />
              </AnimatedButton>
              <Avatar className="ring-2 ring-purple-200">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  SA
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </nav>

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
            <TabsList className="grid w-full grid-cols-5 glass-effect border-0 p-2 rounded-2xl mb-8">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Requests
                {pendingRequests.length > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 ml-1">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger
                value="badges"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                Badges
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <AnimatedCard variant="glass" className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        All Communities
                        <Badge variant="outline" className="ml-2 bg-gray-100">
                          {filteredCommunities.length}
                        </Badge>
                      </h3>
                      <div className="flex gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search communities..."
                            value={communitySearchQuery}
                            onChange={(e) =>
                              setCommunitySearchQuery(e.target.value)
                            }
                            className="pl-10 w-64 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                          />
                        </div>
                        <select
                          value={communityFilterStatus}
                          onChange={(e) =>
                            setCommunityFilterStatus(e.target.value)
                          }
                          className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-purple-300 focus:ring-purple-200"
                        >
                          <option value="all">All Statuses</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="under review">Under Review</option>
                        </select>
                        <select
                          value={communitySortBy}
                          onChange={(e) => setCommunitySortBy(e.target.value)}
                          className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-purple-300 focus:ring-purple-200"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="name">Name</option>
                          <option value="member-count">Member Count</option>
                        </select>
                      </div>
                    </div>

                    {/* Community Listings */}
                    <div className="space-y-4">
                      {paginatedCommunities.map((community) => (
                        <div
                          key={community.id}
                          className="p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md border-gray-200 bg-white"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="text-lg font-semibold text-gray-900">
                                  {community.name}
                                </h5>
                                <Badge variant="outline" className="text-xs">
                                  {community.category}
                                </Badge>
                                {getCommunityStatusBadge(community.status)}
                                {getActivityLevelBadge(community.activityLevel)}
                              </div>
                              <p className="text-gray-600 mb-3 line-clamp-2">
                                {community.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{community.memberCount} members</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{community.totalPosts} posts</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4" />
                                  <span>{community.rating}</span>
                                </div>
                                <span>•</span>
                                <span>
                                  Created:{" "}
                                  {formatDateShort(community.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <AnimatedButton
                                variant="glass"
                                size="sm"
                                onClick={() => handleViewCommunity(community)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </AnimatedButton>
                              <AnimatedButton variant="glass" size="sm">
                                <Settings className="h-4 w-4 mr-1" />
                                Edit
                              </AnimatedButton>
                              {community.status === "inactive" ? (
                                <AnimatedButton
                                  variant="glass"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Reactivate
                                </AnimatedButton>
                              ) : (
                                <AnimatedButton
                                  variant="glass"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Suspend
                                </AnimatedButton>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                          Showing {startIndex + 1} to{" "}
                          {Math.min(endIndex, filteredCommunities.length)} of{" "}
                          {filteredCommunities.length} communities
                        </div>
                        <div className="flex items-center gap-2">
                          <AnimatedButton
                            variant="glass"
                            size="sm"
                            onClick={() =>
                              setCurrentPage(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </AnimatedButton>
                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: totalPages },
                              (_, i) => i + 1
                            ).map((page) => (
                              <AnimatedButton
                                key={page}
                                variant={
                                  currentPage === page ? "default" : "glass"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={
                                  currentPage === page
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-600 hover:text-purple-600"
                                }
                              >
                                {page}
                              </AnimatedButton>
                            ))}
                          </div>
                          <AnimatedButton
                            variant="glass"
                            size="sm"
                            onClick={() =>
                              setCurrentPage(
                                Math.min(totalPages, currentPage + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </AnimatedButton>
                        </div>
                      </div>
                    )}
                  </AnimatedCard>
                </div>

                <div>
                  <RecentActivities />
                </div>
              </div>
            </TabsContent>

            {/* Analytics Tab - New Comprehensive Dashboard */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Community Analytics Dashboard
                </h3>
                <div className="flex gap-2">
                  <Popover
                    open={isDatePickerOpen}
                    onOpenChange={setIsDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <AnimatedButton variant="glass" size="sm">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {analyticsDateRange.from && analyticsDateRange.to
                          ? `${format(
                              analyticsDateRange.from,
                              "MMM dd"
                            )} - ${format(analyticsDateRange.to, "MMM dd")}`
                          : "Select Date Range"}
                      </AnimatedButton>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-white border border-gray-200 shadow-lg"
                      align="end"
                    >
                      <Calendar
                        mode="range"
                        selected={analyticsDateRange}
                        onSelect={(range) => {
                          if (range?.from && range?.to) {
                            setAnalyticsDateRange({
                              from: range.from,
                              to: range.to,
                            });
                            setIsDatePickerOpen(false);
                          }
                        }}
                        numberOfMonths={2}
                        className="rounded-md"
                      />
                    </PopoverContent>
                  </Popover>
                  <select
                    value={analyticsFilter}
                    onChange={(e) => setAnalyticsFilter(e.target.value)}
                    className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-purple-300 focus:ring-purple-200"
                  >
                    <option value="all">All Categories</option>
                    <option value="technology">Technology</option>
                    <option value="health">Health & Fitness</option>
                    <option value="writing">Writing</option>
                    <option value="travel">Travel</option>
                    <option value="environment">Environment</option>
                  </select>
                  <AnimatedButton variant="glass" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </AnimatedButton>
                  <AnimatedButton variant="glass" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </AnimatedButton>
                </div>
              </div>

              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatedCard variant="glass" className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Communities
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatNumber(totalCommunities)}
                      </p>
                      <div className="flex items-center mt-2">
                        {communityGrowth >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            communityGrowth >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatPercentage(communityGrowth)}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          vs last month
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard variant="glass" className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Users
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatNumber(totalUsers)}
                      </p>
                      <div className="flex items-center mt-2">
                        {userGrowth >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            userGrowth >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatPercentage(userGrowth)}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          vs last month
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <UserPlus className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </AnimatedCard>
              </div>

              {/* Charts Section */}
              <div className="w-full">
                {/* User Growth Chart */}
                <AnimatedCard variant="glass" className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-semibold text-gray-900">
                      User Growth
                    </h4>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      +12.5% this month
                    </Badge>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-full max-w-4xl">
                      <ChartContainer
                        config={{
                          users: {
                            label: "Users",
                            color: chartColors.primary,
                          },
                        }}
                        className="h-[400px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={mockAnalyticsData}>
                            <defs>
                              <linearGradient
                                id="colorGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor={chartColors.primary}
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor={chartColors.primary}
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis dataKey="date" stroke="#666" fontSize={12} />
                            <YAxis stroke="#666" fontSize={12} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                              type="monotone"
                              dataKey="users"
                              stroke={chartColors.primary}
                              fillOpacity={1}
                              fill="url(#colorGradient)"
                              strokeWidth={3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </div>
                </AnimatedCard>
              </div>

              {/* Community Performance and Geographic Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Performing Communities */}
                <div className="lg:col-span-2">
                  <AnimatedCard variant="glass" className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Top Performing Communities
                      </h4>
                      <AnimatedButton variant="glass" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View All
                      </AnimatedButton>
                    </div>
                    <div className="space-y-4">
                      {mockCommunityPerformance.map((community, index) => (
                        <div
                          key={community.id}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">
                                {community.name}
                              </h5>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span>
                                  {formatNumber(community.members)} members
                                </span>
                                <span>•</span>
                                <span>{community.posts} posts</span>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {community.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <div className="text-sm text-gray-600">
                                Rating
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="font-semibold">
                                  {community.rating}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AnimatedCard>
                </div>

                {/* Geographic Distribution */}
                <AnimatedCard variant="glass" className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Top 5 Cities
                    </h4>
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <ChartContainer
                    config={{
                      users: {
                        label: "Users",
                        color: chartColors.tertiary,
                      },
                    }}
                    className="h-[200px] mb-4"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mockGeographicData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="percentage"
                        >
                          {mockGeographicData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === 0
                                  ? "#8B5CF6" // Jakarta - Purple
                                  : index === 1
                                  ? "#06B6D4" // Surabaya - Cyan
                                  : index === 2
                                  ? "#10B981" // Bali - Green
                                  : index === 3
                                  ? "#F59E0B" // Medan - Orange
                                  : index === 4
                                  ? "#EF4444" // IKN - Red
                                  : "#6B7280" // Others - Gray
                              }
                            />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="space-y-2">
                    {mockGeographicData.map((country, index) => (
                      <div
                        key={country.country}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                index === 0
                                  ? "#8B5CF6" // Jakarta - Purple
                                  : index === 1
                                  ? "#06B6D4" // Surabaya - Cyan
                                  : index === 2
                                  ? "#10B981" // Bali - Green
                                  : index === 3
                                  ? "#F59E0B" // Medan - Orange
                                  : index === 4
                                  ? "#EF4444" // IKN - Red
                                  : "#6B7280", // Others - Gray
                            }}
                          ></div>
                          <span className="text-gray-700">
                            {country.country}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {formatNumber(country.users)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {country.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AnimatedCard>
              </div>

              {/* Content Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Content Types Performance */}
                <AnimatedCard variant="glass" className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Content Performance
                    </h4>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Last 30 days
                    </Badge>
                  </div>
                  <ChartContainer
                    config={{
                      count: {
                        label: "Count",
                        color: chartColors.quaternary,
                      },
                    }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockContentMetrics} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" stroke="#666" fontSize={12} />
                        <YAxis
                          dataKey="type"
                          type="category"
                          stroke="#666"
                          fontSize={12}
                          width={100}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="count"
                          fill={chartColors.quaternary}
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </AnimatedCard>

                {/* Engagement Metrics */}
                <AnimatedCard variant="glass" className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">
                    Engagement Metrics
                  </h4>
                  <div className="space-y-4">
                    {mockContentMetrics.map((metric, index) => (
                      <div
                        key={metric.type}
                        className="p-4 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-gray-900">
                            {metric.type}
                          </h5>
                          <div className="flex items-center gap-2">
                            {metric.growth >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                metric.growth >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatPercentage(metric.growth)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {formatNumber(metric.count)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Total items
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-blue-600">
                              {metric.engagement}%
                            </div>
                            <div className="text-sm text-gray-600">
                              Engagement
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress value={metric.engagement} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </AnimatedCard>
              </div>
            </TabsContent>

            {/* Community Requests Tab - Simplified */}
            <TabsContent value="requests" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  Community Creation Requests
                </h3>
                <div className="flex gap-2">
                  <AnimatedButton variant="glass" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </AnimatedButton>
                  <AnimatedButton variant="glass" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </AnimatedButton>
                </div>
              </div>

              {/* Request Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <AnimatedCard variant="glass" className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending Review
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {pendingRequests.length}
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  {urgentRequests.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      {urgentRequests.length} urgent
                    </div>
                  )}
                </AnimatedCard>

                <AnimatedCard variant="glass" className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Approved
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {approvedRequests.length}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard variant="glass" className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Rejected
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {rejectedRequests.length}
                      </p>
                    </div>
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard variant="glass" className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Requests
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {mockCommunityRequests.length}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                </AnimatedCard>
              </div>

              {/* Priority Section - Pending Requests */}
              <AnimatedCard variant="glass" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-red-500" />
                    Pending Requests - Requires Action
                    <Badge className="bg-red-500 text-white">
                      {pendingRequests.length}
                    </Badge>
                  </h4>

                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search pending requests..."
                        value={requestSearchQuery}
                        onChange={(e) => setRequestSearchQuery(e.target.value)}
                        className="pl-10 w-64 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>

                    <select
                      value={requestFilterCategory}
                      onChange={(e) => setRequestFilterCategory(e.target.value)}
                      className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-purple-300 focus:ring-purple-200"
                    >
                      <option value="all">All Categories</option>
                      <option value="Technology">Technology</option>
                      <option value="Health & Fitness">Health & Fitness</option>
                      <option value="Books & Literature">
                        Books & Literature
                      </option>
                      <option value="Environment">Environment</option>
                      <option value="Travel & Work">Travel & Work</option>
                      <option value="Food & Cooking">Food & Cooking</option>
                      <option value="Photography">Photography</option>
                    </select>

                    <select
                      value={requestSortBy}
                      onChange={(e) => setRequestSortBy(e.target.value)}
                      className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-purple-300 focus:ring-purple-200"
                    >
                      <option value="priority">Priority</option>
                      <option value="oldest">Oldest First</option>
                      <option value="newest">Newest First</option>
                      <option value="name">Name</option>
                    </select>
                  </div>
                </div>

                {filteredPendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4 text-gray-400">
                      <CheckCircle2 className="h-12 w-12 mx-auto" />
                    </div>
                    <h5 className="text-xl font-medium text-gray-900 mb-2">
                      All caught up!
                    </h5>
                    <p className="text-gray-500">
                      {requestSearchQuery
                        ? `No pending requests match "${requestSearchQuery}"`
                        : "No pending requests require your attention at this time."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                          request.priority === "urgent"
                            ? "border-red-200 bg-red-50"
                            : request.priority === "high"
                            ? "border-orange-200 bg-orange-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="text-lg font-semibold text-gray-900">
                                {request.name}
                              </h5>
                              {getPriorityBadge(request.priority)}
                              <Badge variant="outline" className="text-xs">
                                {request.category}
                              </Badge>
                            </div>

                            <p className="text-gray-600 mb-3 line-clamp-2">
                              {request.description}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={
                                      request.requestedBy.avatar ||
                                      "/placeholder.svg"
                                    }
                                    alt={request.requestedBy.name}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {request.requestedBy.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{request.requestedBy.name}</span>
                              </div>
                              <span>•</span>
                              <span>{formatDate(request.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <AnimatedButton variant="glass" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </AnimatedButton>
                            <AnimatedButton
                              variant="glass"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Approve
                            </AnimatedButton>
                            <AnimatedButton
                              variant="glass"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Reject
                            </AnimatedButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AnimatedCard>
            </TabsContent>

            {/* Activity Logs Tab */}
            <TabsContent value="activity" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  System Activity Logs
                </h3>
                <div className="flex gap-2">
                  <AnimatedButton variant="glass" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Date Range
                  </AnimatedButton>
                  <AnimatedButton variant="glass" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Logs
                  </AnimatedButton>
                </div>
              </div>

              <AnimatedCard variant="glass" className="p-6">
                <ActivityLogsTable />
              </AnimatedCard>
            </TabsContent>

            {/* Store Badges Tab - Redesigned CRUD Interface */}
            <TabsContent value="badges" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-purple-600" />
                  Store Badge Management
                </h3>
                <AnimatedButton
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Badge
                </AnimatedButton>
              </div>

              {/* Badge Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <AnimatedCard variant="glass" className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Badges
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {badges.length}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <ShoppingBag className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard variant="glass" className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Badges
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {badges.filter((b) => b.isActive).length}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard variant="glass" className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Sales
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {badges.reduce(
                          (sum, b) => sum + (b.purchaseCount || 0),
                          0
                        )}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </AnimatedCard>
              </div>

              {/* Enhanced Filters and Search */}
              <AnimatedCard variant="glass" className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search badges by name, description, or category..."
                      value={badgeSearchQuery}
                      onChange={(e) => setBadgeSearchQuery(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-violet-300 focus:ring-violet-200 glass-effect"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterRarity}
                      onChange={(e) => setFilterRarity(e.target.value)}
                      className="w-[140px] glass-effect border-gray-200 focus:border-violet-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="all">All Rarities</option>
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-[160px] glass-effect border-gray-200 focus:border-violet-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                      <option value="price-high">Price (High-Low)</option>
                      <option value="price-low">Price (Low-High)</option>
                      <option value="popularity">Most Popular</option>
                      <option value="revenue">Highest Revenue</option>
                    </select>

                    <div className="flex border border-gray-200 rounded-md overflow-hidden">
                      <button
                        onClick={() => setBadgeViewMode("grid")}
                        className={`px-3 py-2 text-sm ${
                          badgeViewMode === "grid"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-white text-gray-600"
                        }`}
                      >
                        <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                          <div className="bg-current rounded-sm"></div>
                          <div className="bg-current rounded-sm"></div>
                          <div className="bg-current rounded-sm"></div>
                          <div className="bg-current rounded-sm"></div>
                        </div>
                      </button>
                      <button
                        onClick={() => setBadgeViewMode("list")}
                        className={`px-3 py-2 text-sm ${
                          badgeViewMode === "list"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-white text-gray-600"
                        }`}
                      >
                        <div className="space-y-1 w-4 h-4">
                          <div className="bg-current h-0.5 rounded"></div>
                          <div className="bg-current h-0.5 rounded"></div>
                          <div className="bg-current h-0.5 rounded"></div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Badge Sub-tabs */}
                <Tabs
                  value={badgeActiveTab}
                  onValueChange={setBadgeActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-4 glass-effect border-0 p-2 rounded-2xl mb-6">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
                    >
                      All Badges ({badges.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="active"
                      className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
                    >
                      Active ({badges.filter((b) => b.isActive).length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="inactive"
                      className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
                    >
                      Inactive ({badges.filter((b) => !b.isActive).length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="limited"
                      className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
                    >
                      Limited ({badges.filter((b) => b.isLimited).length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Badge Display */}
                {sortedBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4 text-gray-400">
                      <Search className="h-12 w-12 mx-auto" />
                    </div>
                    <h5 className="text-xl font-medium text-gray-900 mb-2">
                      No badges found
                    </h5>
                    <p className="text-gray-500 mb-6">
                      {badgeSearchQuery
                        ? `No results for "${badgeSearchQuery}"`
                        : badgeActiveTab !== "all"
                        ? `No ${badgeActiveTab} badges found.`
                        : "No badges have been created yet."}
                    </p>
                    <AnimatedButton
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Badge
                    </AnimatedButton>
                  </div>
                ) : badgeViewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedBadges.map((badge, index) => (
                      <div
                        key={badge.id}
                        className="group relative bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg overflow-hidden"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        {/* Badge Header with Gradient */}
                        <div
                          className={`h-24 bg-gradient-to-br ${getRarityColor(
                            badge.rarity
                          )} relative`}
                        >
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="absolute top-2 right-2 flex gap-1">
                            {badge.isActive ? (
                              <Badge className="bg-green-500 text-white text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-500 text-white text-xs">
                                Inactive
                              </Badge>
                            )}
                            {badge.isLimited && (
                              <Badge className="bg-red-500 text-white text-xs">
                                Limited
                              </Badge>
                            )}
                          </div>
                          <div className="absolute bottom-2 left-2">
                            <Badge
                              className={`${getRarityBadgeColor(
                                badge.rarity
                              )} text-white text-xs capitalize`}
                            >
                              {badge.rarity}
                            </Badge>
                          </div>
                        </div>

                        {/* Badge Image */}
                        <div className="relative -mt-8 flex justify-center">
                          <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                            <img
                              src={
                                badge.image ||
                                "/placeholder.svg?height=48&width=48"
                              }
                              alt={badge.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Badge Content */}
                        <div className="p-4 pt-2">
                          <div className="text-center mb-3">
                            <h4 className="font-bold text-gray-900 text-lg mb-1">
                              {badge.name}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {badge.description}
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                              <span className="font-medium">
                                {badge.price} points
                              </span>
                              <span>•</span>
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {badge.category}
                              </Badge>
                            </div>
                          </div>

                          {/* Badge Stats */}
                          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                            <div className="bg-blue-50 rounded-lg p-2 text-center">
                              <div className="font-semibold text-blue-700">
                                {badge.purchaseCount || 0}
                              </div>
                              <div className="text-blue-600">Sales</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2 text-center">
                              <div className="font-semibold text-green-700">
                                {formatCurrency(badge.revenue || 0)}
                              </div>
                              <div className="text-green-600">Revenue</div>
                            </div>
                          </div>

                          {/* Limited Edition Info */}
                          {badge.isLimited && (
                            <div className="mb-4 p-2 bg-red-50 rounded-lg border border-red-200">
                              <div className="text-xs text-red-700 font-medium mb-1">
                                Limited Edition
                              </div>
                              <div className="flex justify-between text-xs text-red-600">
                                <span>Remaining: {badge.limitedRemaining}</span>
                                <span>Total: {badge.limitedQuantity}</span>
                              </div>
                              <Progress
                                value={
                                  badge.limitedQuantity &&
                                  badge.limitedRemaining !== undefined
                                    ? ((badge.limitedQuantity -
                                        badge.limitedRemaining) /
                                        badge.limitedQuantity) *
                                      100
                                    : 0
                                }
                                className="h-1 mt-1"
                              />
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-1">
                            <AnimatedButton
                              variant="glass"
                              size="sm"
                              onClick={() => handleViewBadge(badge)}
                              className="flex-1 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </AnimatedButton>
                            <AnimatedButton
                              variant="glass"
                              size="sm"
                              onClick={() => handleEditBadge(badge)}
                              className="flex-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </AnimatedButton>
                            <AnimatedButton
                              variant="glass"
                              size="sm"
                              onClick={() => handleDeleteConfirmation(badge)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </AnimatedButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedBadges.map((badge, index) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-all duration-200 hover:shadow-md"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        {/* Badge Image and Icon */}
                        <div className="relative">
                          <img
                            src={
                              badge.image ||
                              "/placeholder.svg?height=48&width=48"
                            }
                            alt={badge.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                            <div
                              className={`w-4 h-4 rounded-full ${getRarityBadgeColor(
                                badge.rarity
                              )}`}
                            ></div>
                          </div>
                        </div>

                        {/* Badge Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {badge.name}
                            </h4>
                            <Badge
                              className={`${getRarityBadgeColor(
                                badge.rarity
                              )} text-white text-xs capitalize`}
                            >
                              {badge.rarity}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {badge.category}
                            </Badge>
                            {badge.isActive ? (
                              <Badge className="bg-green-500 text-white text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-500 text-white text-xs">
                                Inactive
                              </Badge>
                            )}
                            {badge.isLimited && (
                              <Badge className="bg-red-500 text-white text-xs">
                                Limited
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                            {badge.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="font-medium">
                              {badge.price} points
                            </span>
                            <span>{badge.purchaseCount || 0} sales</span>
                            <span>
                              {formatCurrency(badge.revenue || 0)} revenue
                            </span>
                            <span>
                              Created {formatDateShort(badge.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <AnimatedButton
                            variant="glass"
                            size="sm"
                            onClick={() => handleViewBadge(badge)}
                          >
                            <Eye className="h-4 w-4" />
                          </AnimatedButton>
                          <AnimatedButton
                            variant="glass"
                            size="sm"
                            onClick={() => handleEditBadge(badge)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </AnimatedButton>
                          <AnimatedButton
                            variant="glass"
                            size="sm"
                            onClick={() => handleDeleteConfirmation(badge)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </AnimatedButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AnimatedCard>
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>

      {/* Enhanced Community Detail Dialog with Fixed Background */}
      <Dialog
        open={isCommunityDetailOpen}
        onOpenChange={setIsCommunityDetailOpen}
      >
        <DialogContent className="max-w-6xl bg-white border border-gray-200 shadow-xl max-h-[90vh] overflow-hidden">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                  <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    {selectedCommunity.growthRate > 0 ? "+" : ""}
                    {selectedCommunity.growthRate}% this month
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      Engagement
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-800">
                    {selectedCommunity.engagementRate}%
                  </div>
                  <div className="text-xs text-green-600">
                    Weekly active: {selectedCommunity.weeklyActiveUsers}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                      Content
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-purple-800">
                    {selectedCommunity.totalPosts}
                  </div>
                  <div className="text-xs text-purple-600">
                    {selectedCommunity.totalEvents} events hosted
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                      Rating
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-800">
                    {selectedCommunity.rating}
                  </div>
                  <div className="text-xs text-yellow-600">
                    Community satisfaction
                  </div>
                </div>
              </div>

              {/* Tabbed Content */}
              <Tabs
                value={communityDetailTab}
                onValueChange={setCommunityDetailTab}
                className="flex-1 flex flex-col"
              >
                <TabsList className="grid w-full grid-cols-5 bg-gray-100 border-0 p-1 rounded-xl mb-4">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="members"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg"
                  >
                    Members
                  </TabsTrigger>
                  <TabsTrigger
                    value="content"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg"
                  >
                    Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="moderation"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg"
                  >
                    Moderation
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg"
                  >
                    Settings
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="overview" className="space-y-4 mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Community Information */}
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Community Information
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              Description
                            </label>
                            <p className="text-gray-800 mt-1">
                              {selectedCommunity.description}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Category
                              </label>
                              <p className="text-gray-800 mt-1">
                                {selectedCommunity.category}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Status
                              </label>
                              <div className="mt-1">
                                {getCommunityStatusBadge(
                                  selectedCommunity.status
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Created
                              </label>
                              <p className="text-gray-800 mt-1">
                                {formatDateShort(selectedCommunity.createdAt)}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Last Activity
                              </label>
                              <p className="text-gray-800 mt-1">
                                {formatDateShort(
                                  selectedCommunity.lastActivity
                                )}
                              </p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              Tags
                            </label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedCommunity.tags?.map(
                                (tag: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Admin and Moderators */}
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Administration
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">
                              Community Admin
                            </label>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={
                                    selectedCommunity.admin?.avatar ||
                                    "/placeholder.svg"
                                  }
                                />
                                <AvatarFallback>
                                  {selectedCommunity.admin?.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {selectedCommunity.admin?.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {selectedCommunity.admin?.email}
                                </div>
                              </div>
                              <Badge className="bg-blue-600 text-white">
                                Admin
                              </Badge>
                            </div>
                          </div>

                          {selectedCommunity.moderators?.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-gray-600 mb-2 block">
                                Moderators
                              </label>
                              <div className="space-y-2">
                                {selectedCommunity.moderators.map(
                                  (mod: any) => (
                                    <div
                                      key={mod.id}
                                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={mod.avatar || "/placeholder.svg"}
                                        />
                                        <AvatarFallback>
                                          {mod.name?.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                          {mod.name}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {mod.actionsThisMonth} actions this
                                          month
                                        </div>
                                      </div>
                                      <Badge variant="outline">Moderator</Badge>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity and Top Contributors */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Recent Activity
                        </h4>
                        <div className="space-y-3">
                          {selectedCommunity.recentActivity?.map(
                            (activity: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm text-gray-700 capitalize">
                                    {activity.type}s
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-gray-900">
                                    {activity.count}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {activity.period}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Top Contributors
                        </h4>
                        <div className="space-y-3">
                          {selectedCommunity.topContributors?.map(
                            (contributor: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold">
                                  {index + 1}
                                </div>
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={
                                      contributor.avatar || "/placeholder.svg"
                                    }
                                  />
                                  <AvatarFallback>
                                    {contributor.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {contributor.name}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {contributor.posts} posts
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Community Rules and Guidelines */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Community Rules & Guidelines
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-gray-800 mb-3">
                            Community Rules
                          </h5>
                          <ul className="space-y-2">
                            {selectedCommunity.rules?.map(
                              (rule: string, index: number) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-sm text-gray-700"
                                >
                                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                  {rule}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 mb-3">
                            Guidelines
                          </h5>
                          <p className="text-sm text-gray-700">
                            {selectedCommunity.guidelines}
                          </p>
                          {selectedCommunity.inactiveReason && (
                            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                              <div className="text-sm font-medium text-red-800 mb-1">
                                Inactive Reason
                              </div>
                              <div className="text-sm text-red-700">
                                {selectedCommunity.inactiveReason}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="members" className="mt-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Member Management
                      </h4>
                      <p className="text-gray-600">
                        Member management interface would be implemented here.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="mt-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Content Management
                      </h4>
                      <p className="text-gray-600">
                        Content management interface would be implemented here.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="moderation" className="mt-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Moderation Tools
                      </h4>
                      <p className="text-gray-600">
                        Moderation tools interface would be implemented here.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Community Settings
                      </h4>
                      <p className="text-gray-600">
                        Community settings interface would be implemented here.
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Badge View Dialog with Fixed Background */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Badge Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              View comprehensive information about this badge
            </DialogDescription>
          </DialogHeader>

          {selectedBadge && (
            <div className="space-y-6">
              {/* Badge Header */}
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div
                    className={`w-24 h-24 rounded-xl bg-gradient-to-br ${getRarityColor(
                      selectedBadge.rarity
                    )} p-1`}
                  >
                    <img
                      src={
                        selectedBadge.image ||
                        "/placeholder.svg?height=88&width=88"
                      }
                      alt={selectedBadge.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  </div>
                  <Badge
                    className={`absolute -bottom-2 -right-2 ${getRarityBadgeColor(
                      selectedBadge.rarity
                    )} text-white text-xs capitalize`}
                  >
                    {selectedBadge.rarity}
                  </Badge>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedBadge.name}
                    </h3>
                    {selectedBadge.isActive ? (
                      <Badge className="bg-green-500 text-white">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-500 text-white">Inactive</Badge>
                    )}
                    {selectedBadge.isLimited && (
                      <Badge className="bg-red-500 text-white">
                        Limited Edition
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">
                    {selectedBadge.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="capitalize">
                      {selectedBadge.category}
                    </Badge>
                    <span className="text-gray-500">•</span>
                    <span className="font-medium text-purple-600">
                      {selectedBadge.price} points
                    </span>
                  </div>
                </div>
              </div>

              {/* Badge Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">
                    {selectedBadge.purchaseCount || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total Sales</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(selectedBadge.revenue || 0)}
                  </div>
                  <div className="text-sm text-green-600">Revenue</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-700">
                    {selectedBadge.price}
                  </div>
                  <div className="text-sm text-purple-600">Price (Points)</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700 capitalize">
                    {selectedBadge.rarity}
                  </div>
                  <div className="text-sm text-yellow-600">Rarity</div>
                </div>
              </div>

              {/* Limited Edition Details */}
              {selectedBadge.isLimited && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-3">
                    Limited Edition Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-red-600">Total Quantity</div>
                      <div className="text-lg font-bold text-red-800">
                        {selectedBadge.limitedQuantity}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-red-600">Remaining</div>
                      <div className="text-lg font-bold text-red-800">
                        {selectedBadge.limitedRemaining}
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-red-600 mb-1">
                      <span>Sold</span>
                      <span>
                        {selectedBadge.limitedQuantity &&
                        selectedBadge.limitedRemaining !== undefined
                          ? ((selectedBadge.limitedQuantity -
                              selectedBadge.limitedRemaining) /
                              selectedBadge.limitedQuantity) *
                            100
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        selectedBadge.limitedQuantity &&
                        selectedBadge.limitedRemaining !== undefined
                          ? ((selectedBadge.limitedQuantity -
                              selectedBadge.limitedRemaining) /
                              selectedBadge.limitedQuantity) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                  {selectedBadge.expiresAt && (
                    <div className="text-sm text-red-600">
                      Expires: {formatDate(selectedBadge.expiresAt)}
                    </div>
                  )}
                </div>
              )}

              {/* Badge Metadata */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Badge Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Created</div>
                    <div className="font-medium text-gray-900">
                      {formatDate(selectedBadge.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Last Updated</div>
                    <div className="font-medium text-gray-900">
                      {formatDate(selectedBadge.updatedAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Badge ID</div>
                    <div className="font-medium text-gray-900 font-mono">
                      {selectedBadge.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Status</div>
                    <div className="font-medium text-gray-900">
                      {selectedBadge.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-gray-200">
            <AnimatedButton
              variant="glass"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </AnimatedButton>
            <AnimatedButton
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedBadge) {
                  handleEditBadge(selectedBadge);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Badge
            </AnimatedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Create Badge Dialog with Fixed Background */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Create New Badge
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Design and configure a new badge for the community store
            </DialogDescription>
          </DialogHeader>

          <BadgeForm
            onSubmit={handleCreateBadge}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit Badge Dialog with Fixed Background */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Edit Badge
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Update badge information and settings
            </DialogDescription>
          </DialogHeader>

          {selectedBadge && (
            <BadgeForm
              badge={selectedBadge}
              onSubmit={handleUpdateBadge}
              onCancel={() => setIsEditDialogOpen(false)}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Delete Confirmation Dialog with Fixed Background */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white border border-gray-200 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Badge
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              {selectedBadge && (
                <>
                  Are you sure you want to delete the badge{" "}
                  <strong>"{selectedBadge.name}"</strong>? This action cannot be
                  undone.
                  {(selectedBadge.purchaseCount || 0) > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-sm text-yellow-800">
                        <strong>Warning:</strong> This badge has been purchased{" "}
                        {selectedBadge.purchaseCount} times. Deleting it may
                        affect users who own this badge.
                      </div>
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 border-t border-gray-200">
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBadge}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Badge
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
