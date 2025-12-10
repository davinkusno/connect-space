// Base classes and utilities
export {
  BaseService,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError,
  ApiResponse,
  type ServiceResult,
} from "./base.service";

// Domain services
export { EventService, eventService } from "./event.service";
export { CommunityService, communityService } from "./community.service";
export { UserService, userService } from "./user.service";
export { ReportService, reportService } from "./report.service";
export { AdsService, adsService } from "./ads.service";
export { AIService, aiService } from "./ai.service";
export { PostService, postService } from "./post.service";
export { AdminService, adminService } from "./admin.service";

