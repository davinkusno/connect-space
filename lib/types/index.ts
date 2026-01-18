/**
 * Shared TypeScript types for the ConnectSpace application
 * Used across services, controllers, and components
 */

// ==================== User Types ====================

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  user_type: UserType;
  onboarding_completed: boolean;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
  moderation_strikes?: number;
}

export type UserType = "regular" | "super_admin";
export type UserStatus = "active" | "suspended" | "banned";

export interface UserPoints {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  source: PointSource;
  created_at: string;
}

export type PointSource =
  | "community_joined"
  | "event_attended"
  | "post_created"
  | "community_created"
  | "event_created"
  | "report_penalty"
  | "admin_warning"
  | "referral";

export interface UserPointsSummary {
  activity_count: number;    // Count of positive activities (+1 each)
  report_count: number;      // Count of reports received (separate, not combined)
  posts_created: number;
  events_joined: number;
  communities_joined: number;
  active_days: number;
  last_activity_at: string | null;
  total_points: number;      // Total points (including locked)
  usable_points: number;     // Usable points (unlocked)
  locked_points: number;     // Locked points (not yet usable)
}

export interface UserTransaction {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  source: PointSource;
  created_at: string;
}

// ==================== Community Types ====================

export interface Community {
  id: string;
  name: string;
  description?: string;
  category: CommunityCategory;
  logo_url?: string;
  cover_url?: string;
  location?: CommunityLocation | string;
  creator_id: string;
  member_count: number;
  status: CommunityStatus;
  is_private: boolean;
  created_at: string;
  updated_at?: string;
}

export type CommunityCategory =
  | "technology"
  | "sports"
  | "music"
  | "art"
  | "gaming"
  | "education"
  | "business"
  | "health"
  | "social"
  | "other";

export type CommunityStatus = "active" | "suspended" | "archived";

export interface CommunityLocation {
  address?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
  user?: User;
}

export type MemberRole = "member" | "moderator" | "admin" | "creator";
export type MemberStatus = "pending" | "approved" | "rejected" | "banned";

export interface JoinRequest {
  id: string;
  community_id: string;
  user_id: string;
  status: MemberStatus;
  message?: string;
  created_at: string;
  user?: User;
  activity_count?: number;  // Count of positive activities
  report_count?: number;    // Count of reports received (separate from activities)
}

// ==================== Event Types ====================

export interface Event {
  id: string;
  title: string;
  description?: string;
  community_id: string;
  creator_id: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: EventLocation | string;
  is_online: boolean;
  max_attendees?: number;
  attendee_count: number;
  image_url?: string;
  status: EventStatus;
  created_at: string;
  updated_at?: string;
  community?: Community;
}

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export interface EventLocation {
  venue?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  isOnline?: boolean;
  meetingLink?: string;
  platform?: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  user?: User;
}

export interface SavedEvent {
  id: string;
  event_id: string;
  user_id: string;
  saved_at: string;
  event?: Event;
}

// ==================== Post Types ====================

export interface Post {
  id: string;
  community_id: string;
  author_id: string;
  title: string;
  content: string;
  type: PostType;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;
  author?: User;
  community?: Community;
}

export type PostType = "discussion" | "announcement" | "question" | "poll";

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at?: string;
  author?: User;
}

// ==================== Report Types ====================

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  reported_community_id?: string;
  reported_event_id?: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolution?: string;
  created_at: string;
  reporter?: User;
  reported_user?: User;
  reported_community?: Community;
  reported_event?: Event;
}

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "misinformation"
  | "hate_speech"
  | "violence"
  | "other";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

// ==================== Ad Types ====================

export interface Ad {
  id: string;
  advertiser_id: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  target_url: string;
  type: AdType;
  status: AdStatus;
  target_audience?: AdTargetAudience;
  impressions: number;
  clicks: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
}

export type AdType = "banner" | "video" | "sponsored_post";
export type AdStatus = "pending" | "approved" | "rejected" | "active" | "paused" | "completed";

export interface AdTargetAudience {
  categories?: CommunityCategory[];
  locations?: string[];
  age_range?: { min: number; max: number };
}

export interface AdTracking {
  id: string;
  ad_id: string;
  user_id?: string;
  type: "impression" | "click";
  created_at: string;
}

// ==================== AI Types ====================

export interface AIGenerateRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIGenerateResponse {
  content: string;
  tokensUsed: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: string;
}

export interface ChatResponse {
  message: string;
  tokensUsed: number;
}

// ==================== Admin Types ====================

export interface AdminStats {
  totalUsers: number;
  totalCommunities: number;
  totalEvents: number;
  pendingReports: number;
  inactiveCommunities: number;
}

export interface InactiveCommunity extends Community {
  days_inactive: number;
}

// ==================== API Response Types ====================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ==================== Request Body Types ====================

export interface CreateCommunityRequest {
  name: string;
  description?: string;
  category: CommunityCategory;
  location?: CommunityLocation;
  is_private?: boolean;
}

export interface UpdateCommunityRequest {
  name?: string;
  description?: string;
  category?: CommunityCategory;
  location?: CommunityLocation;
  is_private?: boolean;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  community_id: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: EventLocation;
  is_online?: boolean;
  max_attendees?: number;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: EventLocation;
  is_online?: boolean;
  max_attendees?: number;
  status?: EventStatus;
}

export interface JoinCommunityRequest {
  communityId: string;
  message?: string;
}

export interface UpdateMemberRoleRequest {
  role: MemberRole;
}

export interface CreateReportRequest {
  reported_user_id?: string;
  reported_community_id?: string;
  reported_event_id?: string;
  reason: ReportReason;
  description?: string;
}

export interface ResolveReportRequest {
  action: "resolve" | "dismiss";
  resolution?: string;
  userAction?: "warn" | "suspend" | "ban" | "none";
}

export interface CreateAdRequest {
  title: string;
  description?: string;
  target_url: string;
  type: AdType;
  target_audience?: AdTargetAudience;
  start_date?: string;
  end_date?: string;
}

export interface CreatePostRequest {
  community_id: string;
  title: string;
  content: string;
  type?: PostType;
}

export interface UpdateUserProfileRequest {
  full_name?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  avatar_url?: string;
}

