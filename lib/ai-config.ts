// AI Configuration and API setup
export const AI_CONFIG = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-3.5-turbo",
    maxTokens: 1000,
    temperature: 0.7,
  },

  // Anthropic Configuration
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: "claude-3-sonnet-20240229",
    maxTokens: 1000,
  },

  // Local AI Configuration (for privacy-sensitive operations)
  local: {
    enabled: process.env.LOCAL_AI_ENABLED === "true",
    endpoint: process.env.LOCAL_AI_ENDPOINT || "http://localhost:11434",
    model: "llama2",
  },

  // Feature flags
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

export type AIProvider = "openai" | "anthropic" | "local";
export type AIFeature = keyof typeof AI_CONFIG.features;
