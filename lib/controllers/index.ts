// Base controller and error classes
export {
  BadRequestError,
  BaseController,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
} from "./base.controller";

// Domain controllers
export { AdminController, adminController } from "./admin.controller";
export { AdsController, adsController } from "./ads.controller";
export { AIController, aiController } from "./ai.controller";
export { AuthController, authController } from "./auth.controller";
export { CommunityController, communityController } from "./community.controller";
export { EventController, eventController } from "./event.controller";
export { MessageController, messageController } from "./message.controller";
export { NotificationController, notificationController } from "./notification.controller";
export { RecommendationController, recommendationController } from "./recommendation.controller";
export { ReportController, reportController } from "./report.controller";
export { StorageController, storageController } from "./storage.controller";
export { UserController, userController } from "./user.controller";



