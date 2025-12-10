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

// Domain services (with database tables)
export { EventService, eventService } from "./event.service";
export { CommunityService, communityService } from "./community.service";
export { UserService, userService } from "./user.service";
export { ReportService, reportService } from "./report.service";
export { AdsService, adsService } from "./ads.service";
export { PostService, postService } from "./post.service";

// Infrastructure services (no database tables - external integrations)
export { AdminService, adminService } from "./admin.service"; // Uses existing tables
export { AIService, aiService } from "./ai.service"; // External API (OpenAI)
export { StorageService, storageService } from "./storage.service"; // File storage (Supabase Storage)

