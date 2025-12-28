import { messageService, MessageService } from "@/lib/services/message.service";
import { NextRequest } from "next/server";
import { BaseController } from "./base.controller";

// ==================== Request Body Types ====================

interface CreateThreadBody {
  content: string;
  community_id: string;
  media_type?: string;
  media_url?: string;
  media_size?: number;
  media_mime_type?: string;
}

interface CreateReplyBody {
  content: string;
  community_id: string;
  parent_id: string;
}

// ==================== Message Controller Class ====================

/**
 * Controller for message (discussion) operations
 * Handles HTTP requests for threads and replies
 */
export class MessageController extends BaseController {
  private service: MessageService;

  constructor(service: MessageService) {
    super();
    this.service = service;
  }

  /**
   * Create a new thread
   * POST /api/messages/threads
   */
  async createThread(request: NextRequest) {
    const user = await this.authenticateRequest(request);
    if (!user) {
      return this.unauthorized();
    }

    const body: CreateThreadBody = await request.json();

    // Validate required fields
    if (!body.content?.trim()) {
      return this.badRequest("Content is required");
    }

    if (!body.community_id) {
      return this.badRequest("Community ID is required");
    }

    const result = await this.service.createThread(user.id, body);

    if (result.success) {
      return this.json(result.data!, result.status);
    }

    return this.handleServiceError(result);
  }

  /**
   * Create a reply to a message
   * POST /api/messages/replies
   */
  async createReply(request: NextRequest) {
    const user = await this.authenticateRequest(request);
    if (!user) {
      return this.unauthorized();
    }

    const body: CreateReplyBody = await request.json();

    // Validate required fields
    if (!body.content?.trim()) {
      return this.badRequest("Content is required");
    }

    if (!body.community_id) {
      return this.badRequest("Community ID is required");
    }

    if (!body.parent_id) {
      return this.badRequest("Parent message ID is required");
    }

    const result = await this.service.createReply(user.id, body);

    if (result.success) {
      return this.json(result.data!, result.status);
    }

    return this.handleServiceError(result);
  }

  /**
   * Get threads for a community
   * GET /api/messages/threads?community_id=xxx
   */
  async getThreads(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("community_id");

    if (!communityId) {
      return this.badRequest("Community ID is required");
    }

    const result = await this.service.getThreads(communityId);

    if (result.success) {
      return this.json(result.data!, result.status);
    }

    return this.handleServiceError(result);
  }

  /**
   * Get replies for a thread
   * GET /api/messages/replies?thread_id=xxx
   */
  async getReplies(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("thread_id");

    if (!threadId) {
      return this.badRequest("Thread ID is required");
    }

    const result = await this.service.getReplies(threadId);

    if (result.success) {
      return this.json(result.data!, result.status);
    }

    return this.handleServiceError(result);
  }

  /**
   * Delete a message
   * DELETE /api/messages/:id
   */
  async deleteMessage(request: NextRequest, messageId: string) {
    const user = await this.authenticateRequest(request);
    if (!user) {
      return this.unauthorized();
    }

    const result = await this.service.deleteMessage(messageId, user.id);

    if (result.success) {
      return this.noContent();
    }

    return this.handleServiceError(result);
  }
}

// Export singleton instance
export const messageController = new MessageController(messageService);

