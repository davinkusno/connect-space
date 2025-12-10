// Base controller and error classes
export {
  BaseController,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  ConflictError,
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
} from "./base.controller";

// Domain controllers
export { EventController, eventController } from "./event.controller";
export { CommunityController, communityController } from "./community.controller";
export { UserController, userController } from "./user.controller";
export { ReportController, reportController } from "./report.controller";
export { AdsController, adsController } from "./ads.controller";
export { AIController, aiController } from "./ai.controller";
export { PostController, postController } from "./post.controller";
export { AdminController, adminController } from "./admin.controller";
export { StorageController, storageController } from "./storage.controller";

