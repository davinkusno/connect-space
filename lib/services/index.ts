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
export { AdminService, adminService } from "./admin.service";
export { AdsService, adsService } from "./ads.service";
export { AuthService, authService } from "./auth.service";
export { CommunityService, communityService } from "./community.service";
export { EventService, eventService } from "./event.service";
export { PostService, postService } from "./post.service";
export { ReportService, reportService } from "./report.service";
export { UserService, userService } from "./user.service";

// Infrastructure services (external integrations)
export { AIService, aiService } from "./ai.service";
export { StorageService, storageService } from "./storage.service";



