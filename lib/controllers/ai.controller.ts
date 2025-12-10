import { NextRequest, NextResponse } from "next/server";
import { BaseController } from "./base.controller";
import { aiService } from "@/lib/services";

/**
 * Controller for AI-related API endpoints
 */
export class AIController extends BaseController {
  /**
   * POST /api/ai/generate-community-description
   * Generate community description using AI
   */
  async generateCommunityDescription(request: NextRequest): Promise<NextResponse> {
    try {
      await this.requireAuth();
      const { communityName, category, keywords } = await this.parseBody<{
        communityName: string;
        category: string;
        keywords?: string[];
      }>(request);

      if (!communityName || !category) {
        return this.badRequest("Community name and category are required");
      }

      const result = await aiService.generateCommunityDescription(
        communityName,
        category,
        keywords
      );

      return this.json(
        result.success ? { description: result.data } : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/ai/chatbot
   * Chat with AI assistant
   */
  async chat(request: NextRequest): Promise<NextResponse> {
    try {
      await this.requireAuth();
      const { messages, systemPrompt } = await this.parseBody<{
        messages: Array<{ role: string; content: string }>;
        systemPrompt?: string;
      }>(request);

      if (!messages || !Array.isArray(messages)) {
        return this.badRequest("Messages array is required");
      }

      const result = await aiService.chat(messages as any, systemPrompt);

      return this.json(
        result.success ? { message: result.data } : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/ai/generate-content
   * Generate or enhance content
   */
  async enhanceContent(request: NextRequest): Promise<NextResponse> {
    try {
      await this.requireAuth();
      const { content, type } = await this.parseBody<{
        content: string;
        type: "grammar" | "style" | "expand" | "summarize";
      }>(request);

      if (!content || !type) {
        return this.badRequest("Content and type are required");
      }

      const result = await aiService.enhanceContent(content, type);

      return this.json(
        result.success ? { content: result.data } : { error: result.error?.message },
        result.status
      );
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const aiController = new AIController();

