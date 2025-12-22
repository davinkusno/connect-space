/**
 * AI Client
 * 
 * Provides AI text generation and structured output using GitHub Models API
 */

import OpenAI from "openai";
import { z } from "zod";
import { AI_CONFIG } from "./config";

class AIClient {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = AI_CONFIG.github.apiKey;
      
      if (!apiKey) {
        throw new Error(
          "GitHub Models API key not configured. Set GITHUB_MODELS_API_KEY environment variable."
        );
      }

      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: AI_CONFIG.github.baseURL,
      });
    }

    return this.client;
  }

  /**
   * Generate text from a prompt
   */
  async generateText(
    prompt: string,
    options?: {
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<string> {
    const client = this.getClient();
    
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
    
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    
    messages.push({ role: "user", content: prompt });

    const response = await client.chat.completions.create({
      model: AI_CONFIG.github.model,
      messages: messages,
      max_tokens: options?.maxTokens || AI_CONFIG.github.maxTokens,
      temperature: options?.temperature ?? AI_CONFIG.github.temperature,
    });

    return response.choices[0]?.message?.content || "";
  }

  /**
   * Generate a structured object from a prompt using Zod schema validation
   */
  async generateObject<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: {
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<T> {
    const client = this.getClient();
    
    const systemPrompt = options?.systemPrompt || 
      "You are a helpful AI assistant that responds with valid JSON.";
    
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `${prompt}\n\nRespond with valid JSON only, no additional text.` 
      }
    ];

    const response = await client.chat.completions.create({
      model: AI_CONFIG.github.model,
      messages: messages,
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature ?? 0.5,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content received from AI");
    }

    const parsed = JSON.parse(content);
    const fixed = this.autoFixCommonIssues(parsed);
    
    return schema.parse(fixed);
  }

  /**
   * Analyze content for sentiment, toxicity, or quality
   */
  async analyzeContent(
    content: string,
    analysisType: "sentiment" | "toxicity" | "quality"
  ): Promise<{ score: number; reasoning: string; confidence: number }> {
    const prompts: Record<string, string> = {
      sentiment: `Analyze the sentiment of this content and return a JSON object with:
- score: a number from -1 (very negative) to 1 (very positive)
- reasoning: a brief explanation
- confidence: a number from 0 to 1

Content: "${content}"`,
      toxicity: `Analyze this content for toxicity. Return a JSON object with:
- score: a number from 0 (safe) to 1 (toxic)
- reasoning: a brief explanation
- confidence: a number from 0 to 1

Content: "${content}"`,
      quality: `Analyze the quality of this content. Return a JSON object with:
- score: a number from 0 (poor) to 1 (excellent)
- reasoning: a brief explanation
- confidence: a number from 0 to 1

Content: "${content}"`,
    };

    const schema = z.object({
      score: z.number(),
      reasoning: z.string(),
      confidence: z.number().min(0).max(1),
    });

    try {
      return await this.generateObject(prompts[analysisType], schema, {
        systemPrompt: "You are an expert content analyst. Provide accurate, unbiased analysis in JSON format.",
        temperature: 0.3,
      });
    } catch {
      return {
        score: analysisType === "sentiment" ? 0 : 0.5,
        reasoning: "Analysis unavailable.",
        confidence: 0,
      };
    }
  }

  /**
   * Auto-fix common AI response issues
   */
  private autoFixCommonIssues(parsed: Record<string, unknown>): Record<string, unknown> {
    if (!parsed || typeof parsed !== 'object') return parsed;

    // Fix: "message" instead of "response"
    if ('message' in parsed && !('response' in parsed)) {
      parsed.response = typeof parsed.message === 'string' 
        ? parsed.message 
        : JSON.stringify(parsed.message);
      delete parsed.message;
    }
    
    // Fix: "response" is an object instead of a string
    if (parsed.response && typeof parsed.response === 'object') {
      const resp = parsed.response as Record<string, unknown>;
      if (resp.message) {
        parsed.response = resp.message;
      } else if (resp.text) {
        parsed.response = resp.text;
      } else {
        parsed.response = JSON.stringify(resp);
      }
    }
    
    // Fix: targetAudience array to string
    if (Array.isArray(parsed.targetAudience)) {
      parsed.targetAudience = (parsed.targetAudience as string[]).join(", ");
    }
    
    // Fix: Ensure description is a string
    if (parsed.description && typeof parsed.description !== 'string') {
      parsed.description = String(parsed.description);
    }
    
    // Fix: Ensure arrays are arrays
    if (parsed.alternativeDescriptions && !Array.isArray(parsed.alternativeDescriptions)) {
      parsed.alternativeDescriptions = [];
    }
    
    if (parsed.suggestedTags && !Array.isArray(parsed.suggestedTags)) {
      if (typeof parsed.suggestedTags === 'string') {
        parsed.suggestedTags = (parsed.suggestedTags as string).split(",").map(t => t.trim()).filter(Boolean);
      } else {
        parsed.suggestedTags = [];
      }
    }
    
    // Fix: Convert null values to undefined
    for (const key in parsed) {
      if (parsed[key] === null) {
        delete parsed[key];
      }
    }

    return parsed;
  }
}

export const aiClient = new AIClient();







