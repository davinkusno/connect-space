import { aiClient } from "../ai-client"
import { z } from "zod"

const ModerationResultSchema = z.object({
  decision: z.enum(["approve", "flag", "reject"]),
  confidence: z.number(),
  reasons: z.array(z.string()),
  categories: z.array(
    z.enum([
      "spam",
      "harassment",
      "hate_speech",
      "inappropriate_content",
      "misinformation",
      "off_topic",
      "low_quality",
      "promotional",
    ]),
  ),
  suggestedActions: z.array(z.string()),
  severity: z.enum(["low", "medium", "high", "critical"]),
  requiresHumanReview: z.boolean(),
})

const ContentAnalysisSchema = z.object({
  sentiment: z.object({
    score: z.number(),
    label: z.enum(["positive", "neutral", "negative"]),
    confidence: z.number(),
  }),
  toxicity: z.object({
    score: z.number(),
    categories: z.array(z.string()),
    confidence: z.number(),
  }),
  topics: z.array(
    z.object({
      topic: z.string(),
      relevance: z.number(),
      category: z.string(),
    }),
  ),
  quality: z.object({
    score: z.number(),
    factors: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
})

export class ContentModerationService {
  async moderateContent(
    content: string,
    context: {
      type: "post" | "comment" | "message" | "profile"
      communityGuidelines?: string[]
      userHistory?: any
      reportCount?: number
    },
  ) {
    const { type, communityGuidelines, userHistory, reportCount } = context

    const prompt = `Moderate this ${type} content according to community standards:
    
    Content: "${content}"
    
    Community Guidelines:
    ${communityGuidelines?.join("\n") || "Standard community guidelines apply"}
    
    User Context:
    - Previous violations: ${userHistory?.violations || 0}
    - Account age: ${userHistory?.accountAge || "unknown"}
    - Community standing: ${userHistory?.standing || "good"}
    - Report count for this content: ${reportCount || 0}
    
    Evaluate for:
    1. Compliance with community guidelines
    2. Potential harm or toxicity
    3. Spam or promotional content
    4. Quality and relevance
    5. Need for human review
    
    Provide decision, confidence level, and detailed reasoning.`

    return aiClient.generateObject(prompt, ModerationResultSchema, {
      systemPrompt:
        "You are an expert content moderator who maintains community safety while preserving free expression. You are thorough, fair, and consistent in your evaluations.",
    })
  }

  async analyzeContentQuality(content: string, contentType: "post" | "comment" | "article") {
    const prompt = `Analyze the quality of this ${contentType}:
    
    Content: "${content}"
    
    Evaluate:
    1. Clarity and coherence
    2. Value to the community
    3. Engagement potential
    4. Factual accuracy (if applicable)
    5. Writing quality
    6. Relevance to topic/community
    
    Provide scores, identified issues, and improvement suggestions.`

    return aiClient.generateObject(prompt, ContentAnalysisSchema, {
      systemPrompt:
        "You are an expert content analyst who evaluates content quality objectively and provides constructive feedback.",
    })
  }

  async detectSpam(
    content: string,
    userContext: {
      postFrequency?: number
      linkCount?: number
      duplicateContent?: boolean
      newAccount?: boolean
    },
  ) {
    const { postFrequency, linkCount, duplicateContent, newAccount } = userContext

    const prompt = `Analyze this content for spam characteristics:
    
    Content: "${content}"
    
    User Context:
    - Posts in last hour: ${postFrequency || 0}
    - Links in content: ${linkCount || 0}
    - Similar content posted before: ${duplicateContent ? "yes" : "no"}
    - New account (< 7 days): ${newAccount ? "yes" : "no"}
    
    Look for:
    1. Promotional language patterns
    2. Irrelevant or off-topic content
    3. Repetitive messaging
    4. Suspicious link patterns
    5. Generic or template-like content
    
    Provide spam probability and specific indicators.`

    return aiClient.generateText(prompt, {
      systemPrompt:
        "You are an expert spam detector who identifies promotional, irrelevant, or repetitive content while avoiding false positives.",
    })
  }

  async generateModerationSummary(moderationResults: any[], timeframe: string) {
    const prompt = `Generate a moderation summary for the ${timeframe}:
    
    Moderation Results:
    - Total items reviewed: ${moderationResults.length}
    - Approved: ${moderationResults.filter((r) => r.decision === "approve").length}
    - Flagged: ${moderationResults.filter((r) => r.decision === "flag").length}
    - Rejected: ${moderationResults.filter((r) => r.decision === "reject").length}
    
    Common Issues:
    ${moderationResults
      .filter((r) => r.decision !== "approve")
      .map((r) => r.categories.join(", "))
      .join("; ")}
    
    Provide:
    1. Key trends and patterns
    2. Most common violation types
    3. Recommendations for community guidelines
    4. Suggested preventive measures
    5. Areas needing human moderator attention`

    return aiClient.generateText(prompt, {
      systemPrompt:
        "You are an expert community safety analyst who identifies patterns and provides actionable insights for improving community health.",
    })
  }

  async suggestCommunityGuidelines(communityType: string, existingIssues: string[]) {
    const prompt = `Suggest community guidelines for a ${communityType} community:
    
    Current Issues to Address:
    ${existingIssues.join("\n")}
    
    Create guidelines that:
    1. Address specific issues
    2. Are clear and actionable
    3. Promote positive behavior
    4. Are appropriate for the community type
    5. Include enforcement procedures
    
    Provide 5-8 specific guidelines with explanations.`

    return aiClient.generateText(prompt, {
      systemPrompt:
        "You are an expert community builder who creates effective guidelines that foster healthy, engaged communities.",
    })
  }
}

export const contentModerationService = new ContentModerationService()
