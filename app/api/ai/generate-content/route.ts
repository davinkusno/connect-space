import { aiClient } from "@/lib/ai"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

const CommunityDescriptionSchema = z.object({
  description: z.string(),
  alternativeDescriptions: z.array(z.string()).optional(),
  suggestedTags: z.array(z.string()).optional(),
  targetAudience: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {

    if (Array.isArray(val)) {
      return val.join(", ")
    }
    return val
  }),
})

const CommunityTagsSchema = z.object({
  tags: z.array(z.string()),
})

const CommunityRulesSchema = z.object({
  rules: z.array(z.string()),
})

const EventDescriptionSchema = z.object({
  description: z.string(),
  targetAudience: z.string(),
  expectedOutcomes: z.array(z.string()),
  alternativeDescriptions: z.array(z.string()).optional(),
})

const EventAgendaSchema = z.object({
  agenda: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { type, params } = body || {}

    if (!type || !params) {
      return NextResponse.json({ error: "Missing required fields: type and params" }, { status: 400 })
    }

    switch (type) {
      case "community-description":
        return await generateCommunityDescription(params)
      case "community-tags":
        return await generateCommunityTags(params)
      case "community-rules":
        return await generateCommunityRules(params)
      case "event-description":
        return await generateEventDescription(params)
      case "event-agenda":
        return await generateEventAgenda(params)
      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a content filter error
    if (errorMessage.includes("content management policy") || 
        errorMessage.includes("content filtering") ||
        errorMessage.includes("content policy")) {
      return NextResponse.json({ 
        error: "Content generation was blocked by content policy. Please try with different information.",
        code: "CONTENT_FILTERED"
      }, { status: 400 })
    }
    
    // Check if it's a validation/parse error
    if (errorMessage.includes("Failed to parse") || 
        errorMessage.includes("validation") ||
        errorMessage.includes("Zod")) {
      return NextResponse.json({ 
        error: "Failed to process AI response. Please try again.",
        code: "VALIDATION_ERROR"
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: "Failed to generate content. Please try again later.",
      code: "GENERAL_ERROR",
    }, { status: 500 })
  }
}

async function generateCommunityDescription(params: any) {
  // Validate required params
  if (!params || !params.name) {
    throw new Error("Community name is required")
  }

  // Sanitize inputs to avoid content filter issues
  const safeName = String(params.name || "").trim().substring(0, 100)
  const safeCategory = String(params.category || "General").trim().substring(0, 50)
  const safeTags = String(params.tags || "").trim().substring(0, 200)
  const safeLocation = String(params.location || "Various locations").trim().substring(0, 100)

  // Create fallback description function
  const createFallbackDescription = () => {
    const tagsList = safeTags ? safeTags.split(",").map((t: string) => t.trim()).filter(Boolean) : []
    const tagsText = tagsList.length > 0 ? tagsList.join(", ") : "various topics"
    
    return {
      description: `${safeName} is a ${safeCategory} community focused on ${tagsText}. Join us to connect with like-minded individuals, share knowledge, and participate in activities related to our community interests.`,
      alternativeDescriptions: [],
      suggestedTags: tagsList.length > 0 ? tagsList : [safeCategory],
      targetAudience: `People interested in ${safeCategory}${tagsList.length > 0 ? ` and ${tagsText}` : ""}`,
    }
  }

  const prompt = `Create a community description.

Community details:
- Name: ${safeName}
- Category: ${safeCategory}
- Topics: ${safeTags || "General"}
- Location: ${safeLocation}

Write a description that:
1. Explains the community purpose
2. Covers the topics: ${safeTags || "general interests"}
3. Describes activities
4. Is EXACTLY 100-500 words (MUST NOT exceed 500 words)
5. Uses professional language

IMPORTANT: The description MUST be 500 words or less. If it exceeds 500 words, truncate it to exactly 500 words.

Return JSON with:
- description: string (required)
- alternativeDescriptions: array of strings (optional)
- suggestedTags: array of strings (optional)
- targetAudience: string (optional, NOT an array)`

  try {
    const result = await aiClient.generateObject(prompt, CommunityDescriptionSchema, {
      systemPrompt:
        "You are a content writer creating factual community descriptions. Write only appropriate, professional content. Always return targetAudience as a string, not an array.",
      temperature: 0.6,
      maxTokens: 1500,
    })

    // Validate result has required fields
    if (!result || !result.description) {
      return NextResponse.json(createFallbackDescription())
    }

    // Helper function to count words and truncate to 500 words
    const truncateToWords = (text: string, maxWords: number = 500): string => {
      const words = text.trim().split(/\s+/);
      if (words.length <= maxWords) {
        return text;
      }
      return words.slice(0, maxWords).join(" ") + "...";
    };

    // Ensure all fields are properly formatted and truncate description to 500 words
    const description = String(result.description || "");
    const truncatedDescription = truncateToWords(description, 500);
    
    const validatedResult = {
      description: truncatedDescription,
      alternativeDescriptions: Array.isArray(result.alternativeDescriptions) 
        ? result.alternativeDescriptions.map((alt: string) => truncateToWords(String(alt), 500))
        : [],
      suggestedTags: Array.isArray(result.suggestedTags) 
        ? result.suggestedTags.map(String) 
        : safeTags ? safeTags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      targetAudience: result.targetAudience 
        ? (Array.isArray(result.targetAudience) 
            ? result.targetAudience.join(", ") 
            : String(result.targetAudience))
        : `People interested in ${safeCategory}`,
    }

    return NextResponse.json(validatedResult)
  } catch {
    return NextResponse.json(createFallbackDescription())
  }
}

async function generateCommunityTags(params: any) {
  try {
    const safeName = String(params?.name || "").trim().substring(0, 100)
    const safeCategory = String(params?.category || "").trim().substring(0, 50)
    const safeDescription = String(params?.description || "").trim().substring(0, 500)

    const prompt = `Generate 5-8 relevant tags for this community:
  
  Name: ${safeName}
  Category: ${safeCategory}
  Description: ${safeDescription}
  
  Tags should be:
  - Specific and relevant
  - Help with discoverability
  - Mix of broad and niche terms
  - Popular in the community space`

    const result = await aiClient.generateObject(prompt, CommunityTagsSchema, {
      systemPrompt: "You are an expert in community tagging and SEO optimization.",
    })

    return NextResponse.json(result)
  } catch {
    const fallbackTags = params?.category ? [params.category] : ["General"]
    return NextResponse.json({ tags: fallbackTags })
  }
}

async function generateCommunityRules(params: any) {
  try {
    const safeName = String(params?.name || "").trim().substring(0, 100)
    const safeCategory = String(params?.category || "").trim().substring(0, 50)
    const safePrivacy = String(params?.privacy || "public").trim()

    const prompt = `Generate 4-6 community rules for:
  
  Name: ${safeName}
  Category: ${safeCategory}
  Privacy: ${safePrivacy}
  
  Rules should:
  - Promote positive interactions
  - Be clear and specific
  - Cover key areas (respect, content, behavior)
  - Be enforceable
  - Match the community type`

    const result = await aiClient.generateObject(prompt, CommunityRulesSchema, {
      systemPrompt: "You are an expert community moderator who creates effective, fair community guidelines.",
    })

    return NextResponse.json(result)
  } catch {
    const fallbackRules = [
      "Be respectful and kind to all members",
      "No spam or self-promotion without permission",
      "Stay on topic and relevant to the community",
      "Follow community guidelines and platform terms"
    ]
    return NextResponse.json({ rules: fallbackRules })
  }
}

async function generateEventDescription(params: any) {
  try {
    const safeTitle = String(params?.title || "").trim().substring(0, 200)
    const safeCategory = String(params?.category || "").trim().substring(0, 50)
    const safeDuration = String(params?.duration || "").trim().substring(0, 100)
    const safeLocation = String(params?.location || "Not specified").trim().substring(0, 200)

    const prompt = `Generate a compelling event description for:
  
  Title: ${safeTitle}
  Category: ${safeCategory}
  Duration: ${safeDuration}
  Location: ${safeLocation}
  
  Create a description that:
  - Explains what attendees will learn/experience
  - Highlights key benefits and outcomes
  - Attracts the right audience
  - Is engaging and informative
  - Is EXACTLY 150-500 words (MUST NOT exceed 500 words)
  
  IMPORTANT: The description MUST be 500 words or less. If it exceeds 500 words, truncate it to exactly 500 words.
  
  Also identify the target audience and expected outcomes.`

    // Helper function to count words and truncate to 500 words
    const truncateToWords = (text: string, maxWords: number = 500): string => {
      const words = text.trim().split(/\s+/);
      if (words.length <= maxWords) {
        return text;
      }
      return words.slice(0, maxWords).join(" ") + "...";
    };

    try {
    const result = await aiClient.generateObject(prompt, EventDescriptionSchema, {
      systemPrompt:
        "You are an expert event organizer who creates compelling event descriptions that drive registrations. Always keep descriptions under 500 words.",
    })
    
    // Truncate description to 500 words if it exceeds
    const description = result.description ? truncateToWords(String(result.description), 500) : "";
    const truncatedResult = {
      ...result,
      description,
      alternativeDescriptions: result.alternativeDescriptions 
        ? result.alternativeDescriptions.map((alt: string) => truncateToWords(String(alt), 500))
        : [],
    };
    
    return NextResponse.json(truncatedResult)
    } catch {
      const fallbackDescription = `${params?.title || "This event"} is a ${params?.category || "general"} event. Join us for an engaging experience.`
      return NextResponse.json({
        description: fallbackDescription,
        targetAudience: `People interested in ${params?.category || "general events"}`,
        expectedOutcomes: ["Learn new skills", "Network with professionals", "Gain insights"],
        alternativeDescriptions: []
      })
    }
  } catch {
    const fallbackDescription = `${params?.title || "This event"} is a ${params?.category || "general"} event. Join us for an engaging experience.`
    return NextResponse.json({
      description: fallbackDescription,
      targetAudience: `People interested in ${params?.category || "general events"}`,
        expectedOutcomes: ["Learn new skills", "Network with professionals", "Gain insights"],
        alternativeDescriptions: []
    })
  }
}

async function generateEventAgenda(params: any) {
  try {
    const safeTitle = String(params?.title || "").trim().substring(0, 200)
    const safeCategory = String(params?.category || "").trim().substring(0, 50)
    const safeDuration = String(params?.duration || "").trim().substring(0, 100)
    const safeDescription = String(params?.description || "").trim().substring(0, 1000)

    const prompt = `Generate a detailed agenda for this event:
  
  Title: ${safeTitle}
  Category: ${safeCategory}
  Duration: ${safeDuration}
  Description: ${safeDescription}
  
  Create 4-8 agenda items that:
  - Flow logically from start to finish
  - Include time estimates
  - Cover key topics thoroughly
  - Include breaks if needed
  - Match the event duration and type`

    const result = await aiClient.generateObject(prompt, EventAgendaSchema, {
      systemPrompt: "You are an expert event planner who creates well-structured, engaging event agendas.",
    })

    return NextResponse.json(result)
  } catch {
    const fallbackAgenda = [
      "Welcome and Introduction (15 minutes)",
      "Main Session (60 minutes)",
      "Break (15 minutes)",
      "Q&A and Discussion (30 minutes)",
      "Closing Remarks (10 minutes)"
    ]
    return NextResponse.json({ agenda: fallbackAgenda })
  }
}
