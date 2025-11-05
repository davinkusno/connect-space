// GitHub Models AI Client Implementation
import { z } from "zod";
import { AI_CONFIG } from "./ai-config";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GitHubModelsResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
  };
}

class AIClient {
  private async makeRequest(messages: ChatMessage[], options?: {
    maxTokens?: number;
    temperature?: number;
    responseFormat?: { type: "json_object" };
  }): Promise<GitHubModelsResponse> {
    const apiKey = AI_CONFIG.github.apiKey;
    
    if (!apiKey) {
      throw new Error(
        "GitHub Models API key not configured. Please set GITHUB_MODELS_API_KEY, GITHUB_PERSONAL_ACCESS_TOKEN, or GITHUB_TOKEN environment variable."
      );
    }

    const url = `${AI_CONFIG.github.baseURL}/chat/completions`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model: AI_CONFIG.github.model,
        messages: messages,
        max_tokens: options?.maxTokens || AI_CONFIG.github.maxTokens,
        temperature: options?.temperature ?? AI_CONFIG.github.temperature,
        ...(options?.responseFormat && { response_format: options.responseFormat }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(
        `GitHub Models API error: ${errorData.message || response.statusText} (${response.status})`
      );
    }

    return await response.json();
  }

  async generateText(
    prompt: string,
    options?: {
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<string> {
    try {
      const messages: ChatMessage[] = [];
      
      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      
      messages.push({ role: "user", content: prompt });

      const response = await this.makeRequest(messages, {
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("GitHub Models generateText error:", error);
      throw error;
    }
  }

  async generateObject<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: {
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<T> {
    try {
      const messages: ChatMessage[] = [];
      
      const systemPrompt = options?.systemPrompt || 
        "You are a helpful AI assistant that responds with valid JSON.";
      
      messages.push({ role: "system", content: systemPrompt });
      messages.push({ 
        role: "user", 
        content: `${prompt}\n\nRespond with valid JSON only, no additional text.` 
      });

      const response = await this.makeRequest(messages, {
        maxTokens: options?.maxTokens || 2000,
        temperature: options?.temperature ?? 0.5,
        responseFormat: { type: "json_object" },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response content received from GitHub Models");
      }

      try {
        const parsed = JSON.parse(content);
        return schema.parse(parsed);
      } catch (parseError) {
        console.error("Failed to parse GitHub Models JSON response. Content:", content);
        throw new Error(
          `Failed to parse AI response: ${
            parseError instanceof Error ? parseError.message : String(parseError)
          }`
        );
      }
    } catch (error) {
      console.error("GitHub Models generateObject error:", error);
      throw error;
    }
  }

  async analyzeContent(
    content: string,
    analysisType: "sentiment" | "toxicity" | "quality"
  ) {
    const prompts = {
      sentiment: `Analyze the sentiment of this content and return a JSON object with:
- score: a number from -1 (very negative) to 1 (very positive)
- reasoning: a brief explanation
- confidence: a number from 0 to 1

Content: "${content}"`,
      toxicity: `Analyze this content for toxicity, harassment, or inappropriate material. Return a JSON object with:
- score: a number from 0 (safe) to 1 (toxic)
- reasoning: a brief explanation
- confidence: a number from 0 to 1

Content: "${content}"`,
      quality: `Analyze the quality of this content considering clarity, usefulness, and engagement. Return a JSON object with:
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
        systemPrompt:
          "You are an expert content analyst. Provide accurate, unbiased analysis in JSON format.",
        temperature: 0.3,
      });
    } catch (error) {
      console.error("Content analysis error:", error);
      // Return fallback analysis on error
      return {
        score: analysisType === "sentiment" ? 0 : 0.5,
        reasoning: "Analysis unavailable due to error.",
        confidence: 0,
      };
    }
  }
}

export const aiClient = new AIClient();
