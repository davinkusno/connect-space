/**
 * AI Configuration
 * 
 * Uses GitHub Models API (OpenAI-compatible endpoint)
 * 
 * Required Environment Variables:
 * - GITHUB_MODELS_API_KEY or GITHUB_PERSONAL_ACCESS_TOKEN or GITHUB_TOKEN
 */

export interface AIProviderConfig {
  apiKey: string | undefined;
  model: string;
  baseURL: string;
  maxTokens: number;
  temperature: number;
}

export interface AIFeatureFlags {
  contentGeneration: boolean;
  smartSearch: boolean;
  recommendations: boolean;
  sentimentAnalysis: boolean;
  autoModeration: boolean;
  smartNotifications: boolean;
}

export interface AIRateLimits {
  contentGeneration: number;
  recommendations: number;
  search: number;
}

export interface AIConfiguration {
  github: AIProviderConfig;
  features: AIFeatureFlags;
  rateLimits: AIRateLimits;
}

export const AI_CONFIG: AIConfiguration = {
  github: {
    apiKey: process.env.GITHUB_MODELS_API_KEY || 
            process.env.GITHUB_PERSONAL_ACCESS_TOKEN || 
            process.env.GITHUB_TOKEN,
    model: "openai/gpt-4o",
    baseURL: "https://models.github.ai/inference",
    maxTokens: 2000,
    temperature: 0.7,
  },
  features: {
    contentGeneration: true,
    smartSearch: true,
    recommendations: true,
    sentimentAnalysis: true,
    autoModeration: true,
    smartNotifications: true,
  },
  rateLimits: {
    contentGeneration: 10,
    recommendations: 50,
    search: 100,
  },
};

export type AIProvider = "github";
export type AIFeature = keyof AIFeatureFlags;





