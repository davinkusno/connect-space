// Base classes and utilities
// Infrastructure services (no database tables - external integrations)
export { AdminService, adminService } from "./admin.service"; // Uses existing tables
export { AdsService, adsService } from "./ads.service";
export { AIService, aiService } from "./ai.service"; // External API (OpenAI)
export {
    ApiResponse, AuthenticationError,
    AuthorizationError, BaseService, ConflictError, NotFoundError,
    ValidationError, type ServiceResult
} from "./base.service";
export { CommunityService, communityService } from "./community.service";
// Domain services (with database tables)
export { EventService, eventService } from "./event.service";
export { PostService, postService } from "./post.service";
export { ReportService, reportService } from "./report.service";
export { StorageService, storageService } from "./storage.service"; // File storage (Supabase Storage)
export { UserService, userService } from "./user.service";



