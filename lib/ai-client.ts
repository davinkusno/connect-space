import { generateObject, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"

class AIClient {
  private defaultModel = openai("gpt-4o-mini")
  private fallbackModel = anthropic("claude-3-haiku-20240307")

  async generateText(
    prompt: string,
    options?: {
      systemPrompt?: string
      maxTokens?: number
      temperature?: number
      model?: "openai" | "anthropic"
    },
  ) {
    const {
      systemPrompt = "You are a helpful AI assistant.",
      maxTokens = 1000,
      temperature = 0.7,
      model = "openai",
    } = options || {}

    try {
      const selectedModel = model === "anthropic" ? this.fallbackModel : this.defaultModel

      const { text } = await generateText({
        model: selectedModel,
        prompt,
        system: systemPrompt,
        maxTokens,
        temperature,
      })

      return text
    } catch (error) {
      console.error("AI text generation error:", error)

      // Fallback to alternative model
      if (model === "openai") {
        return this.generateText(prompt, { ...options, model: "anthropic" })
      }

      throw error
    }
  }

  async generateObject<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: {
      systemPrompt?: string
      maxTokens?: number
      temperature?: number
      model?: "openai" | "anthropic"
    },
  ): Promise<T> {
    const {
      systemPrompt = "You are a helpful AI assistant that responds with valid JSON.",
      maxTokens = 1000,
      temperature = 0.7,
      model = "openai",
    } = options || {}

    try {
      const selectedModel = model === "anthropic" ? this.fallbackModel : this.defaultModel

      const { object } = await generateObject({
        model: selectedModel,
        prompt,
        system: systemPrompt,
        schema,
        maxTokens,
        temperature,
      })

      return object
    } catch (error) {
      console.error("AI object generation error:", error)

      // Fallback to alternative model
      if (model === "openai") {
        return this.generateObject(prompt, schema, { ...options, model: "anthropic" })
      }

      throw error
    }
  }

  async analyzeContent(content: string, analysisType: "sentiment" | "toxicity" | "quality") {
    const prompts = {
      sentiment: `Analyze the sentiment of this content and return a score from -1 (very negative) to 1 (very positive): "${content}"`,
      toxicity: `Analyze this content for toxicity, harassment, or inappropriate material. Return a score from 0 (safe) to 1 (toxic): "${content}"`,
      quality: `Analyze the quality of this content considering clarity, usefulness, and engagement. Return a score from 0 (poor) to 1 (excellent): "${content}"`,
    }

    const schema = z.object({
      score: z.number(),
      reasoning: z.string(),
      confidence: z.number(),
    })

    return this.generateObject(prompts[analysisType], schema, {
      systemPrompt: "You are an expert content analyst. Provide accurate, unbiased analysis.",
    })
  }
}

export const aiClient = new AIClient()
