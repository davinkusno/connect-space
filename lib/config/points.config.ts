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
  // Community Activities (only way to earn points)
  COMMUNITY_JOINED: 3,      // Join a community (3 points per community, locked for 3 days)
} as const;

// ==================== Point Type Mapping ====================

/**
 * Maps point_type from database to display information
 */
export const POINT_TYPE_INFO = {
  community_joined: {
    points: POINTS_EARNING.COMMUNITY_JOINED,
    label: 'Joined Community'
  },
  report_received: {
    points: 0,
    label: 'Report Received'
  },
  report_resolved: {
    points: 0,
    label: 'Report Resolved'
  }
} as const;

// ==================== Helper Functions ====================

/**
 * Get point information for a specific point type
 * @param pointType - The point type from database
 * @returns Point information including value and label
 */
export function getPointInfo(pointType: string) {
  return POINT_TYPE_INFO[pointType as keyof typeof POINT_TYPE_INFO] || {
    points: 1,
    label: pointType
  };
}

/**
 * Get display text for earning points
 * @param pointType - The point type
 * @returns User-friendly message
 */
export function getPointEarningMessage(pointType: keyof typeof POINTS_EARNING): string {
  const points = POINTS_EARNING[pointType];
  
  return `You'll receive ${points} ${points === 1 ? 'point' : 'points'}`;
}


