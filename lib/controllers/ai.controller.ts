import { aiService, AIService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { ContentGenerationParams } from "@/lib/services/ai.service";
import { ChatMessage } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, BaseController } from "./base.controller";

// ==================== Request Body Types ====================

interface GenerateCommunityDescriptionBody {
  communityName: string;
  category: string;
  keywords?: string[];
}

interface ChatBody {
  messages: ChatMessage[];
  systemPrompt?: string;
}

interface EnhanceContentBody {
  content: string;
  type: "grammar" | "style" | "expand" | "summarize";
}

interface GenerateContentBody {
  type: "community-description" | "community-tags" | "community-rules" | "event-description" | "event-agenda";
  params: ContentGenerationParams;
}

// ==================== Response Types ====================

interface DescriptionResponse {
  description: string;
}

interface ChatResponse {
  message: string;
}

interface ContentResponse {
  content: string;
}

// ==================== AI Controller Class ====================

/**
 * Controller for AI-related API endpoints
 * Handles HTTP requests and delegates to AIService
 */
export class AIController extends BaseController {
  private readonly service: AIService;

  constructor() {
    super();
    this.service = aiService;
  }

  /**
   * POST /api/ai/generate-community-description
   * Generate community description using AI
   * @param request - The incoming request with community details
   * @returns NextResponse with generated description
   */
  public async generateCommunityDescription(
    request: NextRequest
  ): Promise<NextResponse<DescriptionResponse | ApiErrorResponse>> {
    try {
      await this.requireAuth();
      const body: GenerateCommunityDescriptionBody = 
        await this.parseBody<GenerateCommunityDescriptionBody>(request);

      if (!body.communityName || !body.category) {
        return this.badRequest("Community name and category are required");
      }

      const result: ServiceResult<string> = await this.service.generateCommunityDescription(
        body.communityName,
        body.category,
        body.keywords
      );

      if (result.success) {
        return this.json<DescriptionResponse>(
          { description: result.data || "" }, 
          result.status
        );
      }
      
      return this.error(result.error?.message || "Failed to generate", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/ai/chatbot
   * Chat with AI assistant
   * @param request - The incoming request with messages
   * @returns NextResponse with AI response
   */
  public async chat(
    request: NextRequest
  ): Promise<NextResponse<ChatResponse | ApiErrorResponse>> {
    try {
      await this.requireAuth();
      const body: ChatBody = await this.parseBody<ChatBody>(request);

      if (!body.messages || !Array.isArray(body.messages)) {
        return this.badRequest("Messages array is required");
      }

      const result: ServiceResult<string> = await this.service.chat(
        body.messages, 
        body.systemPrompt
      );

      if (result.success) {
        return this.json<ChatResponse>({ message: result.data || "" }, result.status);
      }
      
      return this.error(result.error?.message || "Failed to get response", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/ai/enhance-content
   * Enhance content using AI (grammar, style, expand, summarize)
   * @param request - The incoming request with content and type
   * @returns NextResponse with enhanced content
   */
  public async enhanceContent(
    request: NextRequest
  ): Promise<NextResponse<ContentResponse | ApiErrorResponse>> {
    try {
      await this.requireAuth();
      const body: EnhanceContentBody = await this.parseBody<EnhanceContentBody>(request);

      if (!body.content || !body.type) {
        return this.badRequest("Content and type are required");
      }

      const validTypes: EnhanceContentBody["type"][] = ["grammar", "style", "expand", "summarize"];
      if (!validTypes.includes(body.type)) {
        return this.badRequest("Invalid type. Must be 'grammar', 'style', 'expand', or 'summarize'");
      }

      const result: ServiceResult<string> = await this.service.enhanceContent(
        body.content, 
        body.type
      );

      if (result.success) {
        return this.json<ContentResponse>({ content: result.data || "" }, result.status);
      }
      
      return this.error(result.error?.message || "Failed to enhance", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/ai/generate-content
   * Generate content using AI (community description, tags, rules, event description, agenda)
   * @param request - The incoming request with type and params
   * @returns NextResponse with generated content
   */
  public async generateContent(
    request: NextRequest
  ): Promise<NextResponse<unknown | ApiErrorResponse>> {
    try {
      const body: GenerateContentBody = await this.parseBody<GenerateContentBody>(request);

      if (!body.type || !body.params) {
        return this.badRequest("Missing required fields: type and params");
      }

      const validTypes: GenerateContentBody["type"][] = [
        "community-description", 
        "community-tags", 
        "community-rules", 
        "event-description", 
        "event-agenda"
      ];
      
      if (!validTypes.includes(body.type)) {
        return this.badRequest("Invalid content type");
      }

      const result: ServiceResult<unknown> = await this.service.generateContent(
        body.type,
        body.params
      );

      if (result.success) {
        return this.json(result.data, result.status);
      }
      
      return this.error(
        result.error?.message || "Failed to generate content", 
        result.status,
        result.error?.code
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const aiController: AIController = new AIController();
