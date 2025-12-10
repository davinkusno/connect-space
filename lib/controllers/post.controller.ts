import { NextRequest, NextResponse } from "next/server";
import { BaseController } from "./base.controller";
import { postService } from "@/lib/services";

/**
 * Controller for post-related API endpoints
 */
export class PostController extends BaseController {
  /**
   * GET /api/posts
   * Get posts with filters
   */
  async getAll(request: NextRequest): Promise<NextResponse> {
    try {
      const communityId = this.getQueryParam(request, "community_id") || undefined;
      const authorId = this.getQueryParam(request, "author_id") || undefined;
      const type = this.getQueryParam(request, "type") as any || undefined;
      const page = parseInt(this.getQueryParam(request, "page") || "1");
      const pageSize = parseInt(this.getQueryParam(request, "pageSize") || "20");

      const result = await postService.getAll({
        communityId,
        authorId,
        type,
        page,
        pageSize,
      });

      return this.json(
        result.success
          ? { posts: result.data?.posts, total: result.data?.total }
          : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/posts/create
   * Create a new post
   */
  async create(request: NextRequest): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const { title, content, community_id, type } = await this.parseBody<{
        title: string;
        content: string;
        community_id: string;
        type?: string;
      }>(request);

      if (!title || !content || !community_id) {
        return this.badRequest("Title, content, and community_id are required");
      }

      const result = await postService.create(user.id, {
        title,
        content,
        community_id,
        type: type as any,
      });

      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/posts/[id]
   * Get post by ID
   */
  async getById(request: NextRequest, postId: string): Promise<NextResponse> {
    try {
      const result = await postService.getById(postId);
      return this.json(
        result.success ? result.data : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/posts/[id]
   * Delete a post
   */
  async delete(request: NextRequest, postId: string): Promise<NextResponse> {
    try {
      const user = await this.requireAuth();
      const result = await postService.delete(postId, user.id);
      return this.json(
        result.success ? { message: "Post deleted" } : { error: result.error?.message },
        result.status === 204 ? 200 : result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const postController = new PostController();

