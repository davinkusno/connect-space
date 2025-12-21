/**
 * Points System Configuration
 * Centralized configuration for all point-related features
 */

// ==================== Community Creation Points ====================

export const COMMUNITY_CREATION_POINTS = {
  FIRST: 0,
  SECOND: 50,
  THIRD: 100,
  FOURTH: 200,
  FIFTH_PLUS: 500
} as const;

/**
 * Calculate required points to create a new community
 * @param communitiesOwned - Number of communities already owned
 * @returns Required points for next community
 */
export function calculateRequiredPoints(communitiesOwned: number): number {
  const progression = [
    COMMUNITY_CREATION_POINTS.FIRST,
    COMMUNITY_CREATION_POINTS.SECOND,
    COMMUNITY_CREATION_POINTS.THIRD,
    COMMUNITY_CREATION_POINTS.FOURTH,
    COMMUNITY_CREATION_POINTS.FIFTH_PLUS
  ];
  
  return progression[Math.min(communitiesOwned, progression.length - 1)];
}

// ==================== Points Earning System ====================

export const POINTS_EARNING = {
  // Community Activities
  COMMUNITY_JOINED: 2,      // Join a community
  COMMUNITY_CREATED: 25,    // Create a new community
  
  // Content Creation
  POST_CREATED: 5,          // Create a post/thread
  POST_LIKED: 1,            // Receive a like on your post
  
  // Events
  EVENT_CREATED: 15,        // Create an event
  EVENT_JOINED: 10,         // Join an event
  
  // Engagement
  DAILY_ACTIVE: 1,          // Daily login/activity
  COMMENT_CREATED: 3,       // Create a comment/reply
  
  // Milestones
  FIRST_POST: 10,           // Bonus for first post
  FIRST_EVENT: 20,          // Bonus for first event created
} as const;

// ==================== Point Type Mapping ====================

/**
 * Maps point_type from database to display information
 */
export const POINT_TYPE_INFO = {
  community_joined: {
    points: POINTS_EARNING.COMMUNITY_JOINED,
    label: 'Joined Community',
    icon: '🏘️'
  },
  community_created: {
    points: POINTS_EARNING.COMMUNITY_CREATED,
    label: 'Created Community',
    icon: '🎉'
  },
  post_created: {
    points: POINTS_EARNING.POST_CREATED,
    label: 'Created Post',
    icon: '📝'
  },
  post_liked: {
    points: POINTS_EARNING.POST_LIKED,
    label: 'Post Liked',
    icon: '❤️'
  },
  event_created: {
    points: POINTS_EARNING.EVENT_CREATED,
    label: 'Created Event',
    icon: '📅'
  },
  event_joined: {
    points: POINTS_EARNING.EVENT_JOINED,
    label: 'Joined Event',
    icon: '✅'
  },
  daily_active: {
    points: POINTS_EARNING.DAILY_ACTIVE,
    label: 'Daily Activity',
    icon: '⭐'
  },
  comment_created: {
    points: POINTS_EARNING.COMMENT_CREATED,
    label: 'Created Comment',
    icon: '💬'
  },
  report_received: {
    points: 0,
    label: 'Report Received',
    icon: '⚠️'
  },
  report_resolved: {
    points: 0,
    label: 'Report Resolved',
    icon: '✓'
  }
} as const;

// ==================== Helper Functions ====================

/**
 * Get point information for a specific point type
 * @param pointType - The point type from database
 * @returns Point information including value, label, and icon
 */
export function getPointInfo(pointType: string) {
  return POINT_TYPE_INFO[pointType as keyof typeof POINT_TYPE_INFO] || {
    points: 1,
    label: pointType,
    icon: '⭐'
  };
}

/**
 * Get display text for earning points
 * @param pointType - The point type
 * @returns User-friendly message
 */
export function getPointEarningMessage(pointType: keyof typeof POINTS_EARNING): string {
  const points = POINTS_EARNING[pointType];
  const info = getPointInfo(pointType.toLowerCase());
  
  return `You'll receive ${points} ${points === 1 ? 'point' : 'points'} ${info.icon}`;
}


