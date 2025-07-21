import OpenAI from "openai"
import { z } from "zod"
import { AI_CONFIG, AIProvider } from "./ai-config"
import { createOpenAI } from "@ai-sdk/openai"

let openAIClient: OpenAI | undefined
if (AI_CONFIG.openai.apiKey) {
  openAIClient = new OpenAI({
    apiKey: AI_CONFIG.openai.apiKey,
  })
}

// Helper to get the current AI provider
function getProvider(): AIProvider {
  if (AI_CONFIG.local.enabled) {
    return "local"
  }
  if (AI_CONFIG.openai.apiKey) {
    return "openai"
  }
  if (AI_CONFIG.anthropic.apiKey) {
    return "anthropic"
  }
  throw new Error(
    "No AI provider configured. Please set LOCAL_AI_ENABLED or an API key for OpenAI/Anthropic.",
  )
}

// Unified AI Client
class AIClient {
  private client: OpenAI

  constructor() {
    const provider = getProvider()

    switch (provider) {
      case "local":
        this.client = new OpenAI({
          baseURL: AI_CONFIG.local.endpoint,
          apiKey: "ollama", // Ollama doesn't require an API key
        })
        break
      case "openai":
        if (!openAIClient) {
          throw new Error("OpenAI API key not configured.")
        }
        this.client = openAIClient
        break
      case "anthropic":
        // The 'openai' package can now be used for Anthropic as well
        // by setting the baseURL and apiKey appropriately.
        // Assuming a compatible API structure.
        this.client = new OpenAI({
          baseURL: "https://api.anthropic.com/v1", // Example, adjust if needed
          apiKey: AI_CONFIG.anthropic.apiKey,
        })
        break
      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }
  }

  private getModel(provider: AIProvider): string {
    switch (provider) {
      case "local":
        return AI_CONFIG.local.model
      case "openai":
        return AI_CONFIG.openai.model
      case "anthropic":
        return AI_CONFIG.anthropic.model
      default:
        return "gpt-4" // Fallback
    }
  }

  async generateText(
    prompt: string,
    options?: {
      systemPrompt?: string
      maxTokens?: number
      temperature?: number
    },
  ) {
    const {
      systemPrompt = "You are a helpful AI assistant.",
      maxTokens = 1000,
      temperature = 0.7,
    } = options || {}

    const provider = getProvider()
    const model = this.getModel(provider)

    const response = await this.client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    })

    return response.choices[0]?.message?.content || ""
  }

  async generateObject<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: {
      systemPrompt?: string
      maxTokens?: number
      temperature?: number
    },
  ): Promise<T> {
    const {
      systemPrompt = "You are a helpful AI assistant that responds with valid JSON.",
      maxTokens = 2000, // Increased for potentially larger JSON
      temperature = 0.5, // Lowered for more deterministic JSON output
    } = options || {}

    const provider = getProvider()
    const model = this.getModel(provider)

    const response = await this.client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: temperature,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response content received")
    }

    try {
      const parsed = JSON.parse(content)
      return schema.parse(parsed)
    } catch (error) {
      // Add more context to the error
      console.error("Failed to parse AI JSON response. Content:", content)
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async analyzeContent(
    content: string,
    analysisType: "sentiment" | "toxicity" | "quality",
  ) {
    const prompts = {
      sentiment: `Analyze the sentiment of this content and return a score from -1 (very negative) to 1 (very positive): "${content}"`,
      toxicity: `Analyze this content for toxicity, harassment, or inappropriate material. Return a score from 0 (safe) to 1 (toxic): "${content}"`,
      quality: `Analyze the quality of this content considering clarity, usefulness, and engagement. Return a score from 0 (poor) to 1 (excellent): "${content}"`,
    }

    const schema = z.object({
      score: z.number(),
      reasoning: z.string(),
      confidence: z.number().min(0).max(1),
    })

    return this.generateObject(prompts[analysisType], schema, {
      systemPrompt:
        "You are an expert content analyst. Provide accurate, unbiased analysis in JSON format.",
    })
  }
}

export const aiClient = new AIClient()
