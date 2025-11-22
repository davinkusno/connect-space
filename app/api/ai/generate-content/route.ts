import { type NextRequest, NextResponse } from "next/server"
import { aiClient } from "@/lib/ai-client"
import { z } from "zod"

const CommunityDescriptionSchema = z.object({
  description: z.string(),
  alternativeDescriptions: z.array(z.string()).optional(),
  suggestedTags: z.array(z.string()).optional(),
  targetAudience: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
    // Convert array to string if needed
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
  } catch (error: any) {
    console.error("Content generation error:", error)
    
    // Check if it's a content filter error
    if (error?.message?.includes("content management policy") || 
        error?.message?.includes("content filtering") ||
        error?.message?.includes("content policy")) {
      return NextResponse.json({ 
        error: "Content generation was blocked by content policy. Please try with different community information.",
        code: "CONTENT_FILTERED"
      }, { status: 400 })
    }
    
    // Check if it's a validation/parse error
    if (error?.message?.includes("Failed to parse") || 
        error?.message?.includes("validation") ||
        error?.message?.includes("Zod")) {
      return NextResponse.json({ 
        error: "Failed to process AI response. Please try again.",
        code: "VALIDATION_ERROR"
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: "Failed to generate content. Please try again later.",
      code: "GENERAL_ERROR",
      details: process.env.NODE_ENV === "development" ? error?.message : undefined
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
4. Is 100-300 words
5. Uses professional language

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
      console.warn("AI returned invalid result, using fallback")
      return NextResponse.json(createFallbackDescription())
    }

    // Ensure all fields are properly formatted
    const validatedResult = {
      description: String(result.description || ""),
      alternativeDescriptions: Array.isArray(result.alternativeDescriptions) 
        ? result.alternativeDescriptions.map(String) 
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
  } catch (error: any) {
    console.error("Error generating community description:", error)
    
    // Always return a fallback instead of throwing
    // This ensures the API never fails completely
    const fallback = createFallbackDescription()
    
    // Log the error but still return fallback
    if (error?.message?.includes("content management policy") || 
        error?.message?.includes("content filtering") ||
        error?.message?.includes("content policy")) {
      console.warn("Content filter triggered, using fallback description")
    } else if (error?.message?.includes("parse") || 
               error?.message?.includes("validation") ||
               error?.message?.includes("Zod")) {
      console.warn("Validation error, using fallback description")
    } else {
      console.warn("Unknown error, using fallback description:", error?.message)
    }
    
    return NextResponse.json(fallback)
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
  } catch (error: any) {
    console.error("Error generating tags:", error)
    // Fallback tags
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
  } catch (error: any) {
    console.error("Error generating rules:", error)
    // Fallback rules
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
  - Is 150-400 words
  
  Also identify the target audience and expected outcomes.`

    try {
    const result = await aiClient.generateObject(prompt, EventDescriptionSchema, {
      systemPrompt:
        "You are an expert event organizer who creates compelling event descriptions that drive registrations.",
    })
    return NextResponse.json(result)
    } catch (aiError: any) {
      // If AI generation fails, return fallback immediately without throwing
      console.warn("AI generation failed, using fallback:", aiError?.message || aiError)
      const fallbackDescription = `${params?.title || "This event"} is a ${params?.category || "general"} event. Join us for an engaging experience where you'll learn, network, and connect with like-minded individuals.`
      return NextResponse.json({
        description: fallbackDescription,
        targetAudience: `People interested in ${params?.category || "general events"}`,
        expectedOutcomes: [
          "Learn new skills and knowledge",
          "Network with professionals",
          "Gain valuable insights"
        ],
        alternativeDescriptions: []
      }, { status: 200 }) // Always return 200 with fallback
    }
  } catch (error: any) {
    console.error("Error generating event description:", error)
    // Fallback description
    const fallbackDescription = `${params?.title || "This event"} is a ${params?.category || "general"} event. Join us for an engaging experience where you'll learn, network, and connect with like-minded individuals.`
    return NextResponse.json({
      description: fallbackDescription,
      targetAudience: `People interested in ${params?.category || "general events"}`,
      expectedOutcomes: [
        "Learn new skills and knowledge",
        "Network with professionals",
        "Gain valuable insights"
      ],
      alternativeDescriptions: []
    }, { status: 200 }) // Always return 200 with fallback
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
  } catch (error: any) {
    console.error("Error generating agenda:", error)
    // Fallback agenda
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
