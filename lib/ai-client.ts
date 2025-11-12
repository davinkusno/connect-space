// GitHub Models AI Client Implementation
import { z } from "zod";
import { AI_CONFIG } from "./ai-config";
import OpenAI from "openai";

class AIClient {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = AI_CONFIG.github.apiKey;
      
      if (!apiKey) {
        throw new Error(
          "GitHub Models API key not configured. Please set GITHUB_MODELS_API_KEY, GITHUB_PERSONAL_ACCESS_TOKEN, or GITHUB_TOKEN environment variable."
        );
      }

      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: AI_CONFIG.github.baseURL,
      });
    }

    return this.client;
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
      const client = this.getClient();
      
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
      
      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      
      messages.push({ role: "user", content: prompt });

      // Log request to GitHub Models
      console.log("=".repeat(80));
      console.log("📤 GitHub Models Request (generateText):");
      console.log("=".repeat(80));
      console.log("Model:", AI_CONFIG.github.model);
      console.log("Messages:", JSON.stringify(messages, null, 2));
      console.log("=".repeat(80));

      const response = await client.chat.completions.create({
        model: AI_CONFIG.github.model,
        messages: messages,
        max_tokens: options?.maxTokens || AI_CONFIG.github.maxTokens,
        temperature: options?.temperature ?? AI_CONFIG.github.temperature,
      });

      const content = response.choices[0]?.message?.content || "";
      
      // Log response from GitHub Models
      console.log("=".repeat(80));
      console.log("📥 GitHub Models Response (generateText):");
      console.log("=".repeat(80));
      console.log(content);
      console.log("=".repeat(80));

      return content;
    } catch (error: any) {
      console.error("GitHub Models generateText error:", {
        error: error?.message || error,
        status: error?.status,
        statusText: error?.statusText,
        response: error?.response?.data || error?.response,
      });
      if (error instanceof Error) {
        throw new Error(`GitHub Models API error: ${error.message}`);
      }
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

      // Log request to GitHub Models
      console.log("=".repeat(80));
      console.log("📤 GitHub Models Request (generateObject):");
      console.log("=".repeat(80));
      console.log("Model:", AI_CONFIG.github.model);
      console.log("Messages:", JSON.stringify(messages, null, 2));
      console.log("=".repeat(80));

      const response = await client.chat.completions.create({
        model: AI_CONFIG.github.model,
        messages: messages,
        max_tokens: options?.maxTokens || 2000,
        temperature: options?.temperature ?? 0.5,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response content received from GitHub Models");
      }

      // Log raw response from GitHub Models
      console.log("=".repeat(80));
      console.log("🔵 GitHub Models Raw Response:");
      console.log("=".repeat(80));
      console.log(JSON.stringify(content, null, 2));
      console.log("=".repeat(80));

      try {
        const parsed = JSON.parse(content);
        
        // Log parsed JSON before auto-fixes
        console.log("📋 Parsed JSON (before auto-fixes):");
        console.log(JSON.stringify(parsed, null, 2));
        
        // Auto-fix common mistakes
        const hadFixes = {
          messageToResponse: false,
          objectToString: false,
          nullToUndefined: false,
          targetAudienceArrayToString: false,
        };
        
        // Helper function to convert null to undefined for optional fields
        const convertNullToUndefined = (obj: any): any => {
          if (obj === null) {
            return undefined;
          }
          if (Array.isArray(obj)) {
            return obj.map(convertNullToUndefined);
          }
          if (typeof obj === 'object') {
            const result: any = {};
            for (const key in obj) {
              if (obj[key] === null) {
                result[key] = undefined;
              } else {
                result[key] = convertNullToUndefined(obj[key]);
              }
            }
            return result;
          }
          return obj;
        };
        
        // Helper function to check if object has null values
        const hasNullValues = (obj: any): boolean => {
          if (obj === null) return true;
          if (Array.isArray(obj)) {
            return obj.some(hasNullValues);
          }
          if (typeof obj === 'object') {
            return Object.values(obj).some(hasNullValues);
          }
          return false;
        };
        
        if (parsed && typeof parsed === 'object') {
          // Fix: "message" instead of "response"
          if (parsed.message && !parsed.response) {
            parsed.response = typeof parsed.message === 'string' 
              ? parsed.message 
              : JSON.stringify(parsed.message);
            delete parsed.message;
            hadFixes.messageToResponse = true;
            console.log("🔧 Auto-fix applied: Renamed 'message' to 'response'");
          }
          
          // Fix: "response" is an object instead of a string
          if (parsed.response && typeof parsed.response === 'object') {
            // Try to extract message from the object
            if (parsed.response.message) {
              parsed.response = parsed.response.message;
              hadFixes.objectToString = true;
              console.log("🔧 Auto-fix applied: Extracted 'message' from response object");
            } else if (parsed.response.text) {
              parsed.response = parsed.response.text;
              hadFixes.objectToString = true;
              console.log("🔧 Auto-fix applied: Extracted 'text' from response object");
            } else {
              // Convert object to string
              parsed.response = JSON.stringify(parsed.response);
              hadFixes.objectToString = true;
              console.log("🔧 Auto-fix applied: Converted response object to string");
            }
          }
          
          // Fix: Convert array to string for targetAudience field (before validation)
          if (parsed.targetAudience && Array.isArray(parsed.targetAudience)) {
            parsed.targetAudience = parsed.targetAudience.join(", ");
            hadFixes.targetAudienceArrayToString = true;
            console.log("🔧 Auto-fix applied: Converted targetAudience array to string");
          }
          
          // Fix: Ensure description is a string
          if (parsed.description && typeof parsed.description !== 'string') {
            parsed.description = String(parsed.description);
            console.log("🔧 Auto-fix applied: Converted description to string");
          }
          
          // Fix: Ensure alternativeDescriptions is an array of strings
          if (parsed.alternativeDescriptions && !Array.isArray(parsed.alternativeDescriptions)) {
            parsed.alternativeDescriptions = [];
            console.log("🔧 Auto-fix applied: Fixed alternativeDescriptions to array");
          }
          
          // Fix: Ensure suggestedTags is an array of strings
          if (parsed.suggestedTags && !Array.isArray(parsed.suggestedTags)) {
            if (typeof parsed.suggestedTags === 'string') {
              parsed.suggestedTags = parsed.suggestedTags.split(",").map((t: string) => t.trim()).filter(Boolean);
            } else {
              parsed.suggestedTags = [];
            }
            console.log("🔧 Auto-fix applied: Fixed suggestedTags to array");
          }
          
          // Fix: Convert null values to undefined for optional fields
          if (hasNullValues(parsed)) {
            // Convert null to undefined recursively
            for (const key in parsed) {
              if (parsed[key] === null) {
                parsed[key] = undefined;
                hadFixes.nullToUndefined = true;
              } else if (typeof parsed[key] === 'object' && parsed[key] !== null) {
                // Recursively fix nested objects
                const fixed = convertNullToUndefined(parsed[key]);
                if (JSON.stringify(parsed[key]) !== JSON.stringify(fixed)) {
                  parsed[key] = fixed;
                  hadFixes.nullToUndefined = true;
                }
              }
            }
            if (hadFixes.nullToUndefined) {
              console.log("🔧 Auto-fix applied: Converted null values to undefined for optional fields");
            }
          }
        }
        
        // Log parsed JSON after auto-fixes (if any were applied)
        if (hadFixes.messageToResponse || hadFixes.objectToString || hadFixes.nullToUndefined || hadFixes.targetAudienceArrayToString) {
          console.log("📋 Parsed JSON (after auto-fixes):");
          console.log(JSON.stringify(parsed, null, 2));
        }
        
        // Try validation with better error handling
        let validated;
        try {
          validated = schema.parse(parsed);
        } catch (validationError) {
          // If validation fails, try to fix common issues
          if (validationError instanceof z.ZodError) {
            console.warn("⚠️ Validation errors detected, attempting fixes...");
            
            // Fix missing required fields
            if (!parsed.description || typeof parsed.description !== 'string') {
              parsed.description = "A community for like-minded individuals to connect and share interests.";
              console.log("🔧 Auto-fix applied: Added default description");
            }
            
            // Try validation again
            try {
              validated = schema.parse(parsed);
              console.log("✅ Validation successful after fixes");
            } catch (retryError) {
              // If still fails, throw with more context
              throw validationError;
            }
          } else {
            throw validationError;
          }
        }
        
        // Log successful validation
        console.log("✅ Validation successful!");
        console.log("=".repeat(80));
        
        return validated;
      } catch (parseError) {
        // If it's a Zod validation error, provide more context
        if (parseError instanceof z.ZodError) {
          console.error("❌ Zod validation error:");
          console.error(JSON.stringify(parseError.errors, null, 2));
          console.error("📥 Original raw content:");
          console.error(content);
          console.error("=".repeat(80));
          // Re-throw with more detailed error message
          throw new Error(
            `Failed to parse AI response: ${JSON.stringify(parseError.errors, null, 2)}`
          );
        }
        console.error("❌ Failed to parse GitHub Models JSON response:");
        console.error("📥 Content:", content);
        console.error("🔴 Parse error:", parseError);
        console.error("=".repeat(80));
        throw new Error(
          `Failed to parse AI response: ${
            parseError instanceof Error ? parseError.message : String(parseError)
          }`
        );
      }
    } catch (error: any) {
      console.error("GitHub Models generateObject error:", {
        error: error?.message || error,
        status: error?.status,
        statusText: error?.statusText,
        response: error?.response?.data || error?.response,
      });
      if (error instanceof Error) {
        throw new Error(`GitHub Models API error: ${error.message}`);
      }
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
