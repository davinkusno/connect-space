// AI Configuration - GitHub Models integration
// 
// Required Environment Variables:
// - GITHUB_MODELS_API_KEY or GITHUB_PERSONAL_ACCESS_TOKEN or GITHUB_TOKEN: Your GitHub Personal Access Token
//   To create one: https://github.com/settings/tokens
//   Required scopes: models:read (for fine-grained tokens) or models (for classic tokens)
//
export const AI_CONFIG = {
  // GitHub Models Configuration
  github: {
    apiKey: process.env.GITHUB_MODELS_API_KEY || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN,
    model: "openai/gpt-4o", // GitHub Models format for GPT-4o
    baseURL: "https://models.github.ai/inference", // GitHub Models API endpoint (correct endpoint from GitHub docs)
    maxTokens: 2000,
    temperature: 0.7,
  },

  // Feature flags - all enabled with GitHub Models
  features: {
    contentGeneration: true,
    smartSearch: true,
    recommendations: true,
    sentimentAnalysis: true,
    autoModeration: true,
    smartNotifications: true,
  },

  // Rate limiting
  rateLimits: {
    contentGeneration: 10, // per hour
    recommendations: 50, // per hour
    search: 100, // per hour
  },
};

export type AIProvider = "github";
export type AIFeature = keyof typeof AI_CONFIG.features;
