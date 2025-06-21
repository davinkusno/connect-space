import { aiClient } from "../ai-client"
import { z } from "zod"

// Schema definitions for structured AI responses
const CommunityPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  category: z.string(),
  tone: z.enum(["professional", "casual", "enthusiastic", "informative"]),
})

const EventDescriptionSchema = z.object({
  title: z.string(),
  description: z.string(),
  agenda: z.array(z.string()),
  targetAudience: z.string(),
  expectedOutcomes: z.array(z.string()),
})

const CommunityGuidelinesSchema = z.object({
  rules: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      examples: z.array(z.string()),
    }),
  ),
  welcomeMessage: z.string(),
  codeOfConduct: z.array(z.string()),
})

export class ContentGenerator {
  async generateCommunityPost(params: {
    topic: string
    communityType: string
    tone?: "professional" | "casual" | "enthusiastic" | "informative"
    targetAudience?: string
    keywords?: string[]
  }) {
    const { topic, communityType, tone = "casual", targetAudience, keywords } = params

    const prompt = `Generate an engaging community post for a ${communityType} community about "${topic}".
    
    Requirements:
    - Tone: ${tone}
    - Target audience: ${targetAudience || "general community members"}
    - Include relevant keywords: ${keywords?.join(", ") || "none specified"}
    - Make it engaging and encourage discussion
    - Include 3-5 relevant hashtags
    - Keep it between 150-300 words
    
    The post should spark conversation and provide value to the community.`

    return aiClient.generateObject(prompt, CommunityPostSchema, {
      systemPrompt:
        "You are an expert community manager who creates engaging, valuable content that builds connections and encourages meaningful discussions.",
    })
  }

  async generateEventDescription(params: {
    eventType: string
    topic: string
    duration: string
    format: "online" | "offline" | "hybrid"
    skillLevel: "beginner" | "intermediate" | "advanced" | "all"
  }) {
    const { eventType, topic, duration, format, skillLevel } = params

    const prompt = `Create a compelling event description for a ${eventType} about "${topic}".
    
    Event details:
    - Duration: ${duration}
    - Format: ${format}
    - Skill level: ${skillLevel}
    
    Include:
    - Engaging title and description
    - Detailed agenda with time slots
    - Clear target audience
    - Expected learning outcomes
    - Call-to-action for registration`

    return aiClient.generateObject(prompt, EventDescriptionSchema, {
      systemPrompt:
        "You are an expert event organizer who creates compelling, detailed event descriptions that attract the right audience and set clear expectations.",
    })
  }

  async generateCommunityGuidelines(params: {
    communityName: string
    communityType: string
    values: string[]
    specificRules?: string[]
  }) {
    const { communityName, communityType, values, specificRules } = params

    const prompt = `Create comprehensive community guidelines for "${communityName}", a ${communityType} community.
    
    Community values: ${values.join(", ")}
    ${specificRules ? `Specific rules to include: ${specificRules.join(", ")}` : ""}
    
    Generate:
    - 5-8 clear, actionable community rules with examples
    - A warm welcome message for new members
    - A code of conduct that reflects the community values
    - Make it friendly but clear about expectations`

    return aiClient.generateObject(prompt, CommunityGuidelinesSchema, {
      systemPrompt:
        "You are an expert community builder who creates clear, welcoming guidelines that foster positive interactions while maintaining community standards.",
    })
  }

  async generateDiscussionStarters(params: {
    communityType: string
    recentTopics?: string[]
    memberInterests?: string[]
    count?: number
  }) {
    const { communityType, recentTopics, memberInterests, count = 5 } = params

    const prompt = `Generate ${count} engaging discussion starter questions for a ${communityType} community.
    
    Context:
    - Recent topics discussed: ${recentTopics?.join(", ") || "none provided"}
    - Member interests: ${memberInterests?.join(", ") || "general"}
    
    Requirements:
    - Questions should be open-ended and thought-provoking
    - Encourage sharing experiences and opinions
    - Avoid controversial or divisive topics
    - Make them relevant to the community type
    - Include a mix of light and deeper discussion topics`

    return aiClient.generateText(prompt, {
      systemPrompt:
        "You are an expert facilitator who creates engaging discussion questions that bring communities together and encourage meaningful conversations.",
    })
  }

  async improveContent(content: string, improvementType: "clarity" | "engagement" | "professionalism" | "brevity") {
    const prompts = {
      clarity: "Rewrite this content to be clearer and easier to understand while maintaining the original meaning",
      engagement: "Rewrite this content to be more engaging and likely to generate responses and discussions",
      professionalism: "Rewrite this content to be more professional and polished while keeping the core message",
      brevity: "Rewrite this content to be more concise while preserving all important information",
    }

    const prompt = `${prompts[improvementType]}:\n\n"${content}"`

    return aiClient.generateText(prompt, {
      systemPrompt: "You are an expert editor who improves content while preserving the author's voice and intent.",
    })
  }

  async generateHashtags(content: string, maxCount = 5) {
    const prompt = `Generate ${maxCount} relevant hashtags for this content: "${content}". 
    Return only the hashtags, one per line, without the # symbol.`

    return aiClient.generateText(prompt, {
      systemPrompt: "You are an expert social media strategist who creates relevant, discoverable hashtags.",
    })
  }
}

export const contentGenerator = new ContentGenerator()
