/**
 * User Points/Reputation System
 * Handles awarding and tracking user points for various activities
 */

export type PointType =
  | "post_created"
  | "post_liked"
  | "event_joined"
  | "event_created"
  | "community_joined"
  | "community_created"
  | "daily_active"
  | "report_received"
  | "report_resolved";

export interface PointTransaction {
  user_id: string;
  points: number;
  point_type: PointType;
  related_id?: string;
  related_type?: "post" | "event" | "community" | "report";
  description?: string;
}

export interface UserReputation {
  activity_points: number;
  report_points: number;
  report_count: number;
  posts_created: number;
  events_joined: number;
  communities_joined: number;
  active_days: number;
  last_activity_at: string | null;
  reputation_score: number;
}

// Point values for different activities
export const POINT_VALUES = {
  post_created: 10,
  post_liked: 2,
  event_joined: 15,
  event_created: 20,
  community_joined: 25,
  community_created: 50,
  daily_active: 5,
  report_received: -50, // Negative points for reports
  report_resolved: 10, // Points if report was resolved in their favor
} as const;

/**
 * Award points to a user
 */
export async function awardPoints(transaction: PointTransaction): Promise<boolean> {
  try {
    const response = await fetch("/api/user/points", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      console.error("Failed to award points:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error awarding points:", error);
    return false;
  }
}

/**
 * Get user reputation
 */
export async function getUserReputation(userId: string): Promise<UserReputation | null> {
  try {
    const response = await fetch(`/api/user/${userId}/reputation`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.reputation;
  } catch (error) {
    console.error("Error fetching user reputation:", error);
    return null;
  }
}

/**
 * Helper functions to award points for specific activities
 */
export const PointsHelper = {
  async onPostCreated(userId: string, postId: string) {
    return awardPoints({
      user_id: userId,
      points: POINT_VALUES.post_created,
      point_type: "post_created",
      related_id: postId,
      related_type: "post",
      description: "Created a post",
    });
  },

  async onEventJoined(userId: string, eventId: string) {
    return awardPoints({
      user_id: userId,
      points: POINT_VALUES.event_joined,
      point_type: "event_joined",
      related_id: eventId,
      related_type: "event",
      description: "Joined an event",
    });
  },

  async onEventCreated(userId: string, eventId: string) {
    return awardPoints({
      user_id: userId,
      points: POINT_VALUES.event_created,
      point_type: "event_created",
      related_id: eventId,
      related_type: "event",
      description: "Created an event",
    });
  },

  async onCommunityJoined(userId: string, communityId: string) {
    return awardPoints({
      user_id: userId,
      points: POINT_VALUES.community_joined,
      point_type: "community_joined",
      related_id: communityId,
      related_type: "community",
      description: "Joined a community",
    });
  },

  async onCommunityCreated(userId: string, communityId: string) {
    return awardPoints({
      user_id: userId,
      points: POINT_VALUES.community_created,
      point_type: "community_created",
      related_id: communityId,
      related_type: "community",
      description: "Created a community",
    });
  },

  async onReportReceived(userId: string, reportId: string) {
    return awardPoints({
      user_id: userId,
      points: POINT_VALUES.report_received,
      point_type: "report_received",
      related_id: reportId,
      related_type: "report",
      description: "Received a report",
    });
  },

  async onDailyActive(userId: string) {
    // Check if user already got daily active points today
    const today = new Date().toISOString().split("T")[0];
    // This check should be done server-side to prevent duplicates
    return awardPoints({
      user_id: userId,
      points: POINT_VALUES.daily_active,
      point_type: "daily_active",
      description: `Active on ${today}`,
    });
  },
};

