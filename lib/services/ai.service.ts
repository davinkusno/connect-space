import { aiClient } from "@/lib/ai";
import { ChatMessage } from "@/lib/types";
import { z } from "zod";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";

// ==================== AI Service Types ====================

type ContentEnhanceType = "grammar" | "style" | "expand" | "summarize";

type ContentGenerationType = 
  | "community-description" 
  | "community-tags" 
  | "community-rules" 
  | "event-description" 
  | "event-agenda";

// Zod Schemas for structured AI outputs
const CommunityDescriptionSchema = z.object({
  description: z.string(),
  alternativeDescriptions: z.array(z.string()).optional(),
  suggestedTags: z.array(z.string()).optional(),
  targetAudience: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
    if (Array.isArray(val)) {
      return val.join(", ");
    }
    return val;
  }),
});

const CommunityTagsSchema = z.object({
  tags: z.array(z.string()),
});

const CommunityRulesSchema = z.object({
  rules: z.array(z.string()),
});

const EventDescriptionSchema = z.object({
  description: z.string(),
  targetAudience: z.string(),
  expectedOutcomes: z.array(z.string()),
  alternativeDescriptions: z.array(z.string()).optional(),
});

const EventAgendaSchema = z.object({
  agenda: z.array(z.string()),
});

export interface ContentGenerationParams {
  name?: string;
  category?: string;
  tags?: string;
  location?: string;
  description?: string;
  privacy?: string;
  title?: string;
  duration?: string;
}

export interface CommunityDescriptionResult {
  description: string;
  alternativeDescriptions: string[];
  suggestedTags: string[];
  targetAudience: string;
}

export interface CommunityTagsResult {
  tags: string[];
}

export interface CommunityRulesResult {
  rules: string[];
}

export interface EventDescriptionResult {
  description: string;
  targetAudience: string;
  expectedOutcomes: string[];
  alternativeDescriptions: string[];
}

export interface EventAgendaResult {
  agenda: string[];
}

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
      console.error("[AIService] OpenAI API key not configured");
      return ApiResponse.error("OpenAI API key not configured", 500);
    }

    const systemMessage: ChatMessage = {
      role: "system",
      content: systemPrompt || "You are a helpful assistant for a community platform called ConnectSpace. Help users find communities, events, and answer questions about the platform.",
    };

    try {
      console.log("[AIService] Sending chat request to OpenAI");
      
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
        const errorData = await response.json().catch(() => ({}));
        console.error("[AIService] OpenAI API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Return specific error message
        const errorMessage = errorData.error?.message || errorData.message || "Failed to get response from OpenAI";
        return ApiResponse.error(errorMessage, response.status);
      }

      const data: OpenAIResponse = await response.json();
      const responseText: string = data.choices?.[0]?.message?.content?.trim() || "";

      console.log("[AIService] Chat response received successfully");
      return ApiResponse.success<string>(responseText);
    } catch (error: any) {
      console.error("[AIService] Chat error:", error);
      return ApiResponse.error(`AI service unavailable: ${error.message}`, 503);
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

  // ==================== Content Generation Methods ====================

  /**
   * Generate content based on type (community description, tags, rules, event description, agenda)
   * @param type - The type of content to generate
   * @param params - Parameters for content generation
   * @returns ServiceResult containing generated content
   */
  public async generateContent(
    type: ContentGenerationType,
    params: ContentGenerationParams
  ): Promise<ServiceResult<unknown>> {
    try {
      switch (type) {
        case "community-description":
          return await this.generateCommunityDescriptionFull(params);
        case "community-tags":
          return await this.generateCommunityTags(params);
        case "community-rules":
          return await this.generateCommunityRules(params);
        case "event-description":
          return await this.generateEventDescriptionFull(params);
        case "event-agenda":
          return await this.generateEventAgenda(params);
        default:
          return ApiResponse.error("Invalid content type", 400);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a content filter error
      if (errorMessage.includes("content management policy") || 
          errorMessage.includes("content filtering") ||
          errorMessage.includes("content policy")) {
        return ApiResponse.error(
          "Content generation was blocked by content policy. Please try with different information.", 
          400, 
          "CONTENT_FILTERED"
        );
      }
      
      // Check if it's a validation/parse error
      if (errorMessage.includes("Failed to parse") || 
          errorMessage.includes("validation") ||
          errorMessage.includes("Zod")) {
        return ApiResponse.error(
          "Failed to process AI response. Please try again.", 
          500, 
          "VALIDATION_ERROR"
        );
      }
      
      return ApiResponse.error("Failed to generate content. Please try again later.", 500);
    }
  }

  /**
   * Generate full community description with alternatives and suggestions
   */
  private async generateCommunityDescriptionFull(
    params: ContentGenerationParams
  ): Promise<ServiceResult<CommunityDescriptionResult>> {
    if (!params.name) {
      return ApiResponse.error("Community name is required", 400);
    }

    // Sanitize inputs
    const safeName = String(params.name || "").trim().substring(0, 100);
    const safeCategory = String(params.category || "General").trim().substring(0, 50);
    const safeTags = String(params.tags || "").trim().substring(0, 200);
    const safeLocation = String(params.location || "Various locations").trim().substring(0, 100);

    // Create fallback description
    const createFallback = (): CommunityDescriptionResult => {
      const tagsList = safeTags ? safeTags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
      const tagsText = tagsList.length > 0 ? tagsList.join(", ") : "various topics";
      
      return {
        description: `${safeName} is a ${safeCategory} community focused on ${tagsText}. Join us to connect with like-minded individuals, share knowledge, and participate in activities related to our community interests.`,
        alternativeDescriptions: [],
        suggestedTags: tagsList.length > 0 ? tagsList : [safeCategory],
        targetAudience: `People interested in ${safeCategory}${tagsList.length > 0 ? ` and ${tagsText}` : ""}`,
      };
    };

    const prompt = `Create a community description.

Community details:
- Name: ${safeName}
- Category: ${safeCategory}
- Topics: ${safeTags || "General"}
- Location: ${safeLocation}

Write a description that:
1. Explains the community purpose
2. Covers the topics: ${safeTags || "general interests"}
3. Describes activities
4. Is EXACTLY 100-500 words (MUST NOT exceed 500 words)
5. Uses professional language

IMPORTANT: The description MUST be 500 words or less.

Return JSON with:
- description: string (required)
- alternativeDescriptions: array of strings (optional)
- suggestedTags: array of strings (optional)
- targetAudience: string (optional, NOT an array)`;

    try {
      const result = await aiClient.generateObject(prompt, CommunityDescriptionSchema, {
        systemPrompt: "You are a content writer creating factual community descriptions. Write only appropriate, professional content. Always return targetAudience as a string, not an array.",
        temperature: 0.6,
        maxTokens: 1500,
      });

      if (!result || !result.description) {
        return ApiResponse.success(createFallback());
      }

      // Truncate to 500 words
      const truncateToWords = (text: string, maxWords: number = 500): string => {
        const words = text.trim().split(/\s+/);
        if (words.length <= maxWords) return text;
        return words.slice(0, maxWords).join(" ") + "...";
      };

      const validatedResult: CommunityDescriptionResult = {
        description: truncateToWords(String(result.description), 500),
        alternativeDescriptions: Array.isArray(result.alternativeDescriptions) 
          ? result.alternativeDescriptions.map((alt: string) => truncateToWords(String(alt), 500))
          : [],
        suggestedTags: Array.isArray(result.suggestedTags) 
          ? result.suggestedTags.map(String) 
          : safeTags ? safeTags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        targetAudience: result.targetAudience 
          ? (Array.isArray(result.targetAudience) 
              ? result.targetAudience.join(", ") 
              : String(result.targetAudience))
          : `People interested in ${safeCategory}`,
      };

      return ApiResponse.success(validatedResult);
    } catch {
      return ApiResponse.success(createFallback());
    }
  }

  /**
   * Generate community tags
   */
  private async generateCommunityTags(
    params: ContentGenerationParams
  ): Promise<ServiceResult<CommunityTagsResult>> {
    try {
      const safeName = String(params.name || "").trim().substring(0, 100);
      const safeCategory = String(params.category || "").trim().substring(0, 50);
      const safeDescription = String(params.description || "").trim().substring(0, 500);

      const prompt = `Generate 5-8 relevant tags for this community:

Name: ${safeName}
Category: ${safeCategory}
Description: ${safeDescription}

Tags should be:
- Specific and relevant
- Help with discoverability
- Mix of broad and niche terms
- Popular in the community space`;

      const result = await aiClient.generateObject(prompt, CommunityTagsSchema, {
        systemPrompt: "You are an expert in community tagging and SEO optimization.",
      });

      return ApiResponse.success(result);
    } catch {
      const fallbackTags = params.category ? [params.category] : ["General"];
      return ApiResponse.success({ tags: fallbackTags });
    }
  }

  /**
   * Generate community rules
   */
  private async generateCommunityRules(
    params: ContentGenerationParams
  ): Promise<ServiceResult<CommunityRulesResult>> {
    try {
      const safeName = String(params.name || "").trim().substring(0, 100);
      const safeCategory = String(params.category || "").trim().substring(0, 50);
      const safePrivacy = String(params.privacy || "public").trim();

      const prompt = `Generate 4-6 community rules for:

Name: ${safeName}
Category: ${safeCategory}
Privacy: ${safePrivacy}

Rules should:
- Promote positive interactions
- Be clear and specific
- Cover key areas (respect, content, behavior)
- Be enforceable
- Match the community type`;

      const result = await aiClient.generateObject(prompt, CommunityRulesSchema, {
        systemPrompt: "You are an expert community moderator who creates effective, fair community guidelines.",
      });

      return ApiResponse.success(result);
    } catch {
      const fallbackRules = [
        "Be respectful and kind to all members",
        "No spam or self-promotion without permission",
        "Stay on topic and relevant to the community",
        "Follow community guidelines and platform terms"
      ];
      return ApiResponse.success({ rules: fallbackRules });
    }
  }

  /**
   * Generate full event description with alternatives
   */
  private async generateEventDescriptionFull(
    params: ContentGenerationParams
  ): Promise<ServiceResult<EventDescriptionResult>> {
    try {
      const safeTitle = String(params.title || "").trim().substring(0, 200);
      const safeCategory = String(params.category || "").trim().substring(0, 50);
      const safeDuration = String(params.duration || "").trim().substring(0, 100);
      const safeLocation = String(params.location || "Not specified").trim().substring(0, 200);

      const prompt = `Generate a compelling event description for:

Title: ${safeTitle}
Category: ${safeCategory}
Duration: ${safeDuration}
Location: ${safeLocation}

Create a description that:
- Explains what attendees will learn/experience
- Highlights key benefits and outcomes
- Attracts the right audience
- Is engaging and informative
- Is EXACTLY 150-500 words (MUST NOT exceed 500 words)

Also identify the target audience and expected outcomes.`;

      const truncateToWords = (text: string, maxWords: number = 500): string => {
        const words = text.trim().split(/\s+/);
        if (words.length <= maxWords) return text;
        return words.slice(0, maxWords).join(" ") + "...";
      };

      try {
        const result = await aiClient.generateObject(prompt, EventDescriptionSchema, {
          systemPrompt: "You are an expert event organizer who creates compelling event descriptions that drive registrations. Always keep descriptions under 500 words.",
        });

        const validatedResult: EventDescriptionResult = {
          description: result.description ? truncateToWords(String(result.description), 500) : "",
          targetAudience: result.targetAudience || `People interested in ${params.category || "general events"}`,
          expectedOutcomes: result.expectedOutcomes || ["Learn new skills", "Network with professionals", "Gain insights"],
          alternativeDescriptions: result.alternativeDescriptions 
            ? result.alternativeDescriptions.map((alt: string) => truncateToWords(String(alt), 500))
            : [],
        };

        return ApiResponse.success(validatedResult);
      } catch {
        const fallbackResult: EventDescriptionResult = {
          description: `${params.title || "This event"} is a ${params.category || "general"} event. Join us for an engaging experience.`,
          targetAudience: `People interested in ${params.category || "general events"}`,
          expectedOutcomes: ["Learn new skills", "Network with professionals", "Gain insights"],
          alternativeDescriptions: []
        };
        return ApiResponse.success(fallbackResult);
      }
    } catch {
      const fallbackResult: EventDescriptionResult = {
        description: `${params.title || "This event"} is a ${params.category || "general"} event. Join us for an engaging experience.`,
        targetAudience: `People interested in ${params.category || "general events"}`,
        expectedOutcomes: ["Learn new skills", "Network with professionals", "Gain insights"],
        alternativeDescriptions: []
      };
      return ApiResponse.success(fallbackResult);
    }
  }

  /**
   * Generate event agenda
   */
  private async generateEventAgenda(
    params: ContentGenerationParams
  ): Promise<ServiceResult<EventAgendaResult>> {
    try {
      const safeTitle = String(params.title || "").trim().substring(0, 200);
      const safeCategory = String(params.category || "").trim().substring(0, 50);
      const safeDuration = String(params.duration || "").trim().substring(0, 100);
      const safeDescription = String(params.description || "").trim().substring(0, 1000);

      const prompt = `Generate a detailed agenda for this event:

Title: ${safeTitle}
Category: ${safeCategory}
Duration: ${safeDuration}
Description: ${safeDescription}

Create 4-8 agenda items that:
- Flow logically from start to finish
- Include time estimates
- Cover key topics thoroughly
- Include breaks if needed
- Match the event duration and type`;

      const result = await aiClient.generateObject(prompt, EventAgendaSchema, {
        systemPrompt: "You are an expert event planner who creates well-structured, engaging event agendas.",
      });

      return ApiResponse.success(result);
    } catch {
      const fallbackAgenda = [
        "Welcome and Introduction (15 minutes)",
        "Main Session (60 minutes)",
        "Break (15 minutes)",
        "Q&A and Discussion (30 minutes)",
        "Closing Remarks (10 minutes)"
      ];
      return ApiResponse.success({ agenda: fallbackAgenda });
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
