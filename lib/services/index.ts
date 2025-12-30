// Base classes and utilities
export {
  ApiResponse,
  AuthenticationError,
  AuthorizationError,
  BaseService,
  ConflictError,
  NotFoundError,
  ValidationError,
  type ServiceResult,
} from "./base.service";

// Domain services (with database tables)
export { AdsService, adsService } from "./ads.service";
export {
  AuthService,
  authService,
  // Authorization exports (RBAC)
  ROUTE_ACCESS_RULES,
  ROLE_HIERARCHY,
  DEFAULT_REDIRECT_PATHS,
  hasAccess,
  getRedirectPath,
  needsOnboarding,
  type UserRole,
  type RouteConfig,
  type AccessCheckResult,
  type CommunityAccessResult,
} from "./auth.service";
export { CommunityService, communityService } from "./community.service";
export { EventService, eventService } from "./event.service";
export { MessageService, messageService } from "./message.service";
export { NotificationService, notificationService, type NotificationType, type CreateNotificationInput } from "./notification.service";
export { PointsService, pointsService, POINT_VALUES, PointsHelper, type PointType, type PointTransaction, type UserPointsSummary } from "./points.service";
export { ReportService, reportService } from "./report.service";
export { UserService, userService } from "./user.service";

// Recommendation service
export { RecommendationService, recommendationService } from "./recommendation.service";

// Infrastructure services (external integrations)
export { AIService, aiService } from "./ai.service";
export { StorageService, storageService } from "./storage.service";



