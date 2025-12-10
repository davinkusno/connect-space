import {
  BaseService,
  ApiResponse,
  ServiceResult,
} from "./base.service";

interface GenerateContentInput {
  type: "description" | "event" | "post" | "announcement";
  context: Record<string, any>;
  maxLength?: number;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Service for AI-powered features
 */
export class AIService extends BaseService {
  private static instance: AIService;
  private openaiApiKey: string;
  private anthropicApiKey: string;

  private constructor() {
    super();
    this.openaiApiKey = process.env.OPENAI_API_KEY || "";
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || "";
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Generate community description
   */
  async generateCommunityDescription(
    communityName: string,
    category: string,
    keywords?: string[]
  ): Promise<ServiceResult<string>> {
    if (!this.openaiApiKey) {
      return ApiResponse.error("OpenAI API key not configured", 500);
    }

    const prompt = this.buildCommunityDescriptionPrompt(communityName, category, keywords);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
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

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content?.trim() || "";

      return ApiResponse.success(generatedText);
    } catch {
      return ApiResponse.error("AI service unavailable", 503);
    }
  }

  /**
   * Generate event description
   */
  async generateEventDescription(
    eventTitle: string,
    eventType: string,
    details?: Record<string, any>
  ): Promise<ServiceResult<string>> {
    if (!this.openaiApiKey) {
      return ApiResponse.error("OpenAI API key not configured", 500);
    }

    const prompt = this.buildEventDescriptionPrompt(eventTitle, eventType, details);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
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

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content?.trim() || "";

      return ApiResponse.success(generatedText);
    } catch {
      return ApiResponse.error("AI service unavailable", 503);
    }
  }

  /**
   * Chat with AI assistant
   */
  async chat(
    messages: ChatMessage[],
    systemPrompt?: string
  ): Promise<ServiceResult<string>> {
    if (!this.openaiApiKey) {
      return ApiResponse.error("OpenAI API key not configured", 500);
    }

    const systemMessage = {
      role: "system" as const,
      content: systemPrompt || "You are a helpful assistant for a community platform called ConnectSpace. Help users find communities, events, and answer questions about the platform.",
    };

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [systemMessage, ...messages],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        return ApiResponse.error("Failed to get response", 500);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content?.trim() || "";

      return ApiResponse.success(responseText);
    } catch {
      return ApiResponse.error("AI service unavailable", 503);
    }
  }

  /**
   * Enhance/improve content
   */
  async enhanceContent(
    content: string,
    type: "grammar" | "style" | "expand" | "summarize"
  ): Promise<ServiceResult<string>> {
    if (!this.openaiApiKey) {
      return ApiResponse.error("OpenAI API key not configured", 500);
    }

    const instructions: Record<string, string> = {
      grammar: "Fix grammar and spelling errors while maintaining the original meaning.",
      style: "Improve the writing style to be more engaging and professional.",
      expand: "Expand this content with more details while keeping the same tone.",
      summarize: "Summarize this content to be more concise.",
    };

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
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

      const data = await response.json();
      const enhancedText = data.choices?.[0]?.message?.content?.trim() || "";

      return ApiResponse.success(enhancedText);
    } catch {
      return ApiResponse.error("AI service unavailable", 503);
    }
  }

  // Private helper methods

  private buildCommunityDescriptionPrompt(
    name: string,
    category: string,
    keywords?: string[]
  ): string {
    let prompt = `Write a welcoming description for a community called "${name}" in the ${category} category.`;
    if (keywords?.length) {
      prompt += ` Key themes: ${keywords.join(", ")}.`;
    }
    return prompt;
  }

  private buildEventDescriptionPrompt(
    title: string,
    type: string,
    details?: Record<string, any>
  ): string {
    let prompt = `Write an engaging description for an event called "${title}" (type: ${type}).`;
    if (details?.location) {
      prompt += ` Location: ${details.location}.`;
    }
    if (details?.date) {
      prompt += ` Date: ${details.date}.`;
    }
    return prompt;
  }
}

export const aiService = AIService.getInstance();

