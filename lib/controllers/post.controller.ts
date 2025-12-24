import { postService, PostService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { Post, PostType } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, BaseController } from "./base.controller";

// ==================== Request Body Types ====================

interface CreatePostBody {
  title: string;
  content: string;
  community_id: string;
  type?: PostType;
}

// ==================== Response Types ====================

interface PostsListResponse {
  posts: any[];  // Using any to allow PostWithRelations from service
  total: number;
}

interface MessageResponse {
  message: string;
}

// ==================== Post Controller Class ====================

/**
 * Controller for post-related API endpoints
 * Handles HTTP requests and delegates to PostService
 */
export class PostController extends BaseController {
  private readonly service: PostService;

  constructor() {
    super();
    this.service = postService;
  }

  /**
   * GET /api/posts
   * Get posts with filters and pagination
   * @param request - The incoming request with query params
   * @returns NextResponse with array of posts
   */
  public async getAll(
    request: NextRequest
  ): Promise<NextResponse<PostsListResponse | ApiErrorResponse>> {
    try {
      const communityId: string | null = this.getQueryParam(request, "community_id");
      const authorId: string | null = this.getQueryParam(request, "author_id");
      const eventId: string | null = this.getQueryParam(request, "event_id");
      const type: string | null = this.getQueryParam(request, "type");
      const page: number = this.getQueryParamAsNumber(request, "page", 1);
      const pageSize: number = this.getQueryParamAsNumber(request, "pageSize", 20);

      const result = await this.service.getAll({
        communityId: communityId || undefined,
        authorId: authorId || undefined,
        eventId: eventId || undefined,
        type: type as PostType | undefined,
        page,
        pageSize,
      });

      if (result.success && result.data) {
        return this.json<PostsListResponse>(
          { posts: result.data.posts, total: result.data.total }, 
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to fetch posts", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/posts/create
   * Create a new post
   * @param request - The incoming request with post data
   * @returns NextResponse with created post
   */
  public async create(
    request: NextRequest
  ): Promise<NextResponse<Post | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body: CreatePostBody = await this.parseBody<CreatePostBody>(request);

      if (!body.title || !body.content || !body.community_id) {
        return this.badRequest("Title, content, and community_id are required");
      }

      const result: ServiceResult<Post> = await this.service.create(user.id, {
        title: body.title,
        content: body.content,
        community_id: body.community_id,
        type: body.type,
      });

      if (result.success) {
        return this.json<Post>(result.data as Post, result.status);
      }
      
      return this.error(result.error?.message || "Failed to create post", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/posts/[id]
   * Get post by ID
   * @param request - The incoming request
   * @param postId - The post ID to fetch
   * @returns NextResponse with post data
   */
  public async getById(
    request: NextRequest, 
    postId: string
  ): Promise<NextResponse<Post | ApiErrorResponse>> {
    try {
      const result = await this.service.getById(postId);

      if (result.success) {
        return this.json<Post>(result.data as Post, result.status);
      }
      
      return this.error(result.error?.message || "Post not found", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/posts/[id]
   * Delete a post
   * @param request - The incoming request
   * @param postId - The post ID to delete
   * @returns NextResponse indicating success
   */
  public async delete(
    request: NextRequest, 
    postId: string
  ): Promise<NextResponse<MessageResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<void> = await this.service.delete(postId, user.id);

      if (result.success) {
        return this.json<MessageResponse>({ message: "Post deleted" }, 200);
      }
      
      return this.error(result.error?.message || "Failed to delete post", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const postController: PostController = new PostController();
