import {
  BaseService,
  ApiResponse,
  ServiceResult,
} from "./base.service";
import { ChatMessage } from "@/lib/types";

// ==================== AI Service Types ====================

type ContentEnhanceType = "grammar" | "style" | "expand" | "summarize";

interface EventDetails {
  location?: string;
  date?: string;
  time?: string;
  isOnline?: boolean;
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

// ==================== AI Service Class ====================

/**
 * Service for AI-powered features
 * Handles content generation, chat, and content enhancement
 */
export class AIService extends BaseService {
  private static instance: AIService;
  private readonly openaiApiKey: string;
  private readonly anthropicApiKey: string;
  private readonly OPENAI_API_URL: string = "https://api.openai.com/v1/chat/completions";
  private readonly DEFAULT_MODEL: string = "gpt-3.5-turbo";

  private constructor() {
    super();
    this.openaiApiKey = process.env.OPENAI_API_KEY || "";
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || "";
  }

  /**
   * Get singleton instance of AIService
   */
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Generate community description using AI
   * @param communityName - The name of the community
   * @param category - The community category
   * @param keywords - Optional keywords to include
   * @returns ServiceResult containing generated description
   */
  public async generateCommunityDescription(
    communityName: string,
    category: string,
    keywords?: string[]
  ): Promise<ServiceResult<string>> {
    if (!this.openaiApiKey) {
      return ApiResponse.error("OpenAI API key not configured", 500);
    }

    const prompt: string = this.buildCommunityDescriptionPrompt(
      communityName, 
      category, 
      keywords
    );

    try {
      const response: Response = await fetch(this.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.DEFAULT_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that writes engaging community descriptions. Keep descriptions concise (2-3 sentences), welcoming, and highlight the community's purpose.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        return ApiResponse.error("Failed to generate description", 500);
      }

      const data: OpenAIResponse = await response.json();
      const generatedText: string = data.choices?.[0]?.message?.content?.trim() || "";

      return ApiResponse.success<string>(generatedText);
    } catch {
      return ApiResponse.error("AI service unavailable", 503);
    }
  }

  /**
   * Generate event description using AI
   * @param eventTitle - The event title
   * @param eventType - The type of event
   * @param details - Optional event details
   * @returns ServiceResult containing generated description
   */
  public async generateEventDescription(
    eventTitle: string,
    eventType: string,
    details?: EventDetails
  ): Promise<ServiceResult<string>> {
    if (!this.openaiApiKey) {
      return ApiResponse.error("OpenAI API key not configured", 500);
    }

    const prompt: string = this.buildEventDescriptionPrompt(eventTitle, eventType, details);

    try {
      const response: Response = await fetch(this.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.DEFAULT_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that writes engaging event descriptions. Keep descriptions informative, exciting, and include key details about what attendees can expect.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        return ApiResponse.error("Failed to generate description", 500);
      }

      const data: OpenAIResponse = await response.json();
      const generatedText: string = data.choices?.[0]?.message?.content?.trim() || "";

      return ApiResponse.success<string>(generatedText);
    } catch {
      return ApiResponse.error("AI service unavailable", 503);
    }
  }

  /**
   * Chat with AI assistant
   * @param messages - The conversation history
   * @param systemPrompt - Optional custom system prompt
   * @returns ServiceResult containing AI response
   */
  public async chat(
    messages: ChatMessage[],
    systemPrompt?: string
  ): Promise<ServiceResult<string>> {
    if (!this.openaiApiKey) {
      return ApiResponse.error("OpenAI API key not configured", 500);
    }

    const systemMessage: ChatMessage = {
      role: "system",
      content: systemPrompt || "You are a helpful assistant for a community platform called ConnectSpace. Help users find communities, events, and answer questions about the platform.",
    };

    try {
      const response: Response = await fetch(this.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.DEFAULT_MODEL,
          messages: [systemMessage, ...messages],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        return ApiResponse.error("Failed to get response", 500);
      }

      const data: OpenAIResponse = await response.json();
      const responseText: string = data.choices?.[0]?.message?.content?.trim() || "";

      return ApiResponse.success<string>(responseText);
    } catch {
      return ApiResponse.error("AI service unavailable", 503);
    }
  }

  /**
   * Enhance or improve content using AI
   * @param content - The content to enhance
   * @param type - The type of enhancement
   * @returns ServiceResult containing enhanced content
   */
  public async enhanceContent(
    content: string,
    type: ContentEnhanceType
  ): Promise<ServiceResult<string>> {
    if (!this.openaiApiKey) {
      return ApiResponse.error("OpenAI API key not configured", 500);
    }

    const instructions: Record<ContentEnhanceType, string> = {
      grammar: "Fix grammar and spelling errors while maintaining the original meaning.",
      style: "Improve the writing style to be more engaging and professional.",
      expand: "Expand this content with more details while keeping the same tone.",
      summarize: "Summarize this content to be more concise.",
    };

    try {
      const response: Response = await fetch(this.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.DEFAULT_MODEL,
          messages: [
            {
              role: "system",
              content: instructions[type],
            },
            { role: "user", content },
          ],
          max_tokens: 500,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        return ApiResponse.error("Failed to enhance content", 500);
      }

      const data: OpenAIResponse = await response.json();
      const enhancedText: string = data.choices?.[0]?.message?.content?.trim() || "";

      return ApiResponse.success<string>(enhancedText);
    } catch {
      return ApiResponse.error("AI service unavailable", 503);
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Build prompt for community description generation
   */
  private buildCommunityDescriptionPrompt(
    name: string,
    category: string,
    keywords?: string[]
  ): string {
    let prompt: string = `Write a welcoming description for a community called "${name}" in the ${category} category.`;
    if (keywords?.length) {
      prompt += ` Key themes: ${keywords.join(", ")}.`;
    }
    return prompt;
  }

  /**
   * Build prompt for event description generation
   */
  private buildEventDescriptionPrompt(
    title: string,
    type: string,
    details?: EventDetails
  ): string {
    let prompt: string = `Write an engaging description for an event called "${title}" (type: ${type}).`;
    if (details?.location) {
      prompt += ` Location: ${details.location}.`;
    }
    if (details?.date) {
      prompt += ` Date: ${details.date}.`;
    }
    return prompt;
  }
}

// Export singleton instance
export const aiService: AIService = AIService.getInstance();
