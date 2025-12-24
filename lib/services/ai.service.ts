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


// ==================== AI Service Class ====================

/**
 * Service for AI-powered features
 * Handles content generation, chat, and content enhancement
 */
export class AIService extends BaseService {
  private static instance: AIService;

  private constructor() {
    super();
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
   * Generate community description using AI (GitHub Models API)
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
    const prompt: string = this.buildCommunityDescriptionPrompt(
      communityName, 
      category, 
      keywords
    );

    try {
      const generatedText = await aiClient.generateText(prompt, {
        systemPrompt: "You are a helpful assistant that writes engaging community descriptions. Keep descriptions concise (2-3 sentences), welcoming, and highlight the community's purpose.",
        maxTokens: 200,
        temperature: 0.7,
      });

      return ApiResponse.success<string>(generatedText);
    } catch (error: any) {
      console.error("[AIService] Failed to generate community description:", error);
      return ApiResponse.error("AI service unavailable", 503);
    }
  }

  /**
   * Generate event description using AI (GitHub Models API)
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
    const prompt: string = this.buildEventDescriptionPrompt(eventTitle, eventType, details);

    try {
      const generatedText = await aiClient.generateText(prompt, {
        systemPrompt: "You are a helpful assistant that writes engaging event descriptions. Keep descriptions informative, exciting, and include key details about what attendees can expect.",
        maxTokens: 300,
        temperature: 0.7,
      });

      return ApiResponse.success<string>(generatedText);
    } catch (error: any) {
      console.error("[AIService] Failed to generate event description:", error);
      return ApiResponse.error("AI service unavailable", 503);
    }
  }

  /**
   * Chat with AI assistant (GitHub Models API)
   * @param messages - The conversation history
   * @param systemPrompt - Optional custom system prompt
   * @returns ServiceResult containing AI response
   */
  public async chat(
    messages: ChatMessage[],
    systemPrompt?: string
  ): Promise<ServiceResult<string>> {
    const defaultSystemPrompt = "You are a helpful assistant for a community platform called ConnectSpace. Help users find communities, events, and answer questions about the platform.";
    
    try {
      console.log("[AIService] Sending chat request to GitHub Models API");
      
      // Convert ChatMessage[] to format needed for aiClient
      // Get the last user message as the prompt
      const userMessages = messages.filter(m => m.role === "user");
      const lastUserMessage = userMessages[userMessages.length - 1];
      
      if (!lastUserMessage) {
        return ApiResponse.error("No user message provided", 400);
      }

      // Build context from previous messages
      const contextMessages = messages.slice(0, -1);
      let contextPrompt = "";
      if (contextMessages.length > 0) {
        contextPrompt = "Previous conversation:\n" + 
          contextMessages.map(m => `${m.role}: ${m.content}`).join("\n") + 
          "\n\nCurrent question: ";
      }

      const fullPrompt = contextPrompt + lastUserMessage.content;

      const responseText = await aiClient.generateText(fullPrompt, {
        systemPrompt: systemPrompt || defaultSystemPrompt,
        maxTokens: 500,
        temperature: 0.7,
      });

      console.log("[AIService] Chat response received successfully");
      return ApiResponse.success<string>(responseText);
    } catch (error: any) {
      console.error("[AIService] Chat error:", error);
      return ApiResponse.error(`AI service unavailable: ${error.message}`, 503);
    }
  }

  /**
   * Enhance or improve content using AI (GitHub Models API)
   * @param content - The content to enhance
   * @param type - The type of enhancement
   * @returns ServiceResult containing enhanced content
   */
  public async enhanceContent(
    content: string,
    type: ContentEnhanceType
  ): Promise<ServiceResult<string>> {
    const instructions: Record<ContentEnhanceType, string> = {
      grammar: "Fix grammar and spelling errors while maintaining the original meaning.",
      style: "Improve the writing style to be more engaging and professional.",
      expand: "Expand this content with more details while keeping the same tone.",
      summarize: "Summarize this content to be more concise.",
    };

    try {
      const enhancedText = await aiClient.generateText(content, {
        systemPrompt: instructions[type],
        maxTokens: 500,
        temperature: 0.5,
      });

      return ApiResponse.success<string>(enhancedText);
    } catch (error: any) {
      console.error("[AIService] Failed to enhance content:", error);
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

    const originalDescription = String(params.description || "").trim();
    const hasOriginalDescription = originalDescription.length > 0;

    const prompt = hasOriginalDescription 
      ? `Enhance and improve this community description while preserving ALL the original information and key points:

ORIGINAL DESCRIPTION:
${originalDescription}

Community context:
- Name: ${safeName}
- Category: ${safeCategory}
${safeTags ? `- Topics: ${safeTags}` : ""}
${safeLocation ? `- Location: ${safeLocation}` : ""}

IMPORTANT REQUIREMENTS:
1. PRESERVE all information from the original description - do not remove or ignore any details
2. Keep all specific mentions (e.g., company names, locations, topics mentioned)
3. Improve grammar, clarity, and flow while keeping the same meaning
4. Make it more engaging and professional
5. Keep it concise - aim for similar length or slightly longer (max 50% longer), NOT 500 words
6. Maintain the original tone and style

Return JSON with:
- description: string (enhanced version that preserves all original content)
- alternativeDescriptions: array of strings (optional)
- suggestedTags: array of strings (optional)
- targetAudience: string (optional, NOT an array)`
      : `Create a community description.

Community details:
- Name: ${safeName}
- Category: ${safeCategory}
- Topics: ${safeTags || "General"}
- Location: ${safeLocation}

Write a concise description (100-200 words) that:
1. Explains the community purpose
2. Covers the topics: ${safeTags || "general interests"}
3. Describes activities
4. Uses professional language

Return JSON with:
- description: string (required)
- alternativeDescriptions: array of strings (optional)
- suggestedTags: array of strings (optional)
- targetAudience: string (optional, NOT an array)`;

    try {
      const systemPrompt = hasOriginalDescription
        ? "You are a content editor who enhances descriptions while preserving all original information. Never remove or ignore details from the original text. Improve clarity, grammar, and flow while keeping the same meaning and all specific mentions. Keep enhancements concise - similar length or slightly longer, not verbose."
        : "You are a content writer creating factual community descriptions. Write only appropriate, professional content. Always return targetAudience as a string, not an array. Keep descriptions concise (100-200 words).";

      const result = await aiClient.generateObject(prompt, CommunityDescriptionSchema, {
        systemPrompt,
        temperature: 0.6,
        maxTokens: hasOriginalDescription ? 800 : 1500,
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
      // Support both 'title' and 'name' for event title (for backward compatibility)
      const safeTitle = String(params.title || params.name || "").trim().substring(0, 200);
      const safeCategory = String(params.category || "").trim().substring(0, 50);
      const safeDuration = String(params.duration || "").trim().substring(0, 100);
      const safeLocation = String(params.location || "Not specified").trim().substring(0, 200);

      const originalDescription = String(params.description || "").trim();
      const hasOriginalDescription = originalDescription.length > 0;

      const prompt = hasOriginalDescription
        ? `Enhance this event description to make it more complete, engaging, and professional while preserving ALL the original information.

ORIGINAL DESCRIPTION:
${originalDescription}

Event context:
- Title: ${safeTitle}
${safeCategory ? `- Category: ${safeCategory}` : ""}
${safeDuration ? `- Duration: ${safeDuration}` : ""}
${safeLocation ? `- Location: ${safeLocation}` : ""}

Your task:
1. PRESERVE all information from the original - keep every detail, mention, and fact
2. Improve grammar, spelling, and sentence structure
3. Add natural, relevant wording to make it more complete and engaging (expand where it makes sense)
4. Make it flow better and sound more professional
5. Keep similar length or slightly longer (up to 50% longer if needed for clarity and completeness)
6. Maintain the original tone and style

Return ONLY the enhanced description text.`
        : `Generate a compelling event description for:

Title: ${safeTitle}
Category: ${safeCategory}
${safeDuration ? `Duration: ${safeDuration}` : ""}
${safeLocation ? `Location: ${safeLocation}` : ""}

Create a concise description (100-200 words) that:
- Explains what attendees will learn/experience
- Highlights key benefits and outcomes
- Attracts the right audience
- Is engaging and informative

Also identify the target audience and expected outcomes.`;

      const truncateToWords = (text: string, maxWords: number = 500): string => {
        const words = text.trim().split(/\s+/);
        if (words.length <= maxWords) return text;
        return words.slice(0, maxWords).join(" ") + "...";
      };

      try {
        if (hasOriginalDescription) {
          // For enhancement, use generateText to get just the enhanced description
          // This ensures the AI focuses on improving the text, not generating structured data
          const systemPrompt = "You are a content editor who enhances event descriptions. You improve grammar, spelling, and sentence structure while preserving all original information. You can add natural, relevant wording to make descriptions more complete and engaging, but you must keep all original details, mentions, and facts. Never remove or change the meaning of the original content. Return only the enhanced description text.";
          
          const enhancedDescription = await aiClient.generateText(prompt, {
            systemPrompt,
            maxTokens: 1000, // Allow more tokens for expansion
            temperature: 0.5, // Slightly higher for more creative expansion while still preserving content
          });

          const validatedResult: EventDescriptionResult = {
            description: enhancedDescription ? truncateToWords(String(enhancedDescription).trim(), 500) : originalDescription,
            targetAudience: `People interested in ${params.category || "general events"}`,
            expectedOutcomes: ["Learn new skills", "Network with professionals", "Gain insights"],
            alternativeDescriptions: []
          };

          return ApiResponse.success(validatedResult);
        } else {
          // For generation (no original description), use generateObject for structured output
          const systemPrompt = "You are an expert event organizer who creates compelling event descriptions that drive registrations. Keep descriptions concise (100-200 words).";

          const result = await aiClient.generateObject(prompt, EventDescriptionSchema, {
            systemPrompt,
            maxTokens: 1000,
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
        }
      } catch (error) {
        console.error("[AIService] Event description generation error:", error);
        // If enhancement fails, return the original description instead of a generic fallback
        if (hasOriginalDescription) {
          const validatedResult: EventDescriptionResult = {
            description: originalDescription,
            targetAudience: `People interested in ${params.category || "general events"}`,
            expectedOutcomes: ["Learn new skills", "Network with professionals", "Gain insights"],
            alternativeDescriptions: []
          };
          return ApiResponse.success(validatedResult);
        }
        
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
