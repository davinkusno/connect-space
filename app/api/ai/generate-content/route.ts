import { type NextRequest, NextResponse } from "next/server"
import { aiClient } from "@/lib/ai-client"
import { z } from "zod"

const CommunityDescriptionSchema = z.object({
  description: z.string(),
  alternativeDescriptions: z.array(z.string()).optional(),
  suggestedTags: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
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
    const body = await request.json()
    const { type, params } = body

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
  } catch (error) {
    console.error("Content generation error:", error)
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
  }
}

async function generateCommunityDescription(params: any) {
  const prompt = `Generate a compelling community description for:
  
  Name: ${params.name}
  Category: ${params.category}
  Meeting Type: ${params.locationType}
  Location: ${params.location || "Not specified"}
  
  Create a description that:
  - Explains what the community is about
  - Describes activities and benefits
  - Attracts the right members
  - Is engaging and welcoming
  - Is 100-300 words
  
  Also provide 2-3 alternative shorter descriptions and suggest relevant tags.`

  const result = await aiClient.generateObject(prompt, CommunityDescriptionSchema, {
    systemPrompt:
      "You are an expert community builder who creates compelling descriptions that attract engaged members.",
  })

  return NextResponse.json(result)
}

async function generateCommunityTags(params: any) {
  const prompt = `Generate 5-8 relevant tags for this community:
  
  Name: ${params.name}
  Category: ${params.category}
  Description: ${params.description}
  
  Tags should be:
  - Specific and relevant
  - Help with discoverability
  - Mix of broad and niche terms
  - Popular in the community space`

  const result = await aiClient.generateObject(prompt, CommunityTagsSchema, {
    systemPrompt: "You are an expert in community tagging and SEO optimization.",
  })

  return NextResponse.json(result)
}

async function generateCommunityRules(params: any) {
  const prompt = `Generate 4-6 community rules for:
  
  Name: ${params.name}
  Category: ${params.category}
  Privacy: ${params.privacy}
  
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
}

async function generateEventDescription(params: any) {
  const prompt = `Generate a compelling event description for:
  
  Title: ${params.title}
  Category: ${params.category}
  Duration: ${params.duration}
  Location: ${params.location || "Not specified"}
  
  Create a description that:
  - Explains what attendees will learn/experience
  - Highlights key benefits and outcomes
  - Attracts the right audience
  - Is engaging and informative
  - Is 150-400 words
  
  Also identify the target audience and expected outcomes.`

  const result = await aiClient.generateObject(prompt, EventDescriptionSchema, {
    systemPrompt:
      "You are an expert event organizer who creates compelling event descriptions that drive registrations.",
  })

  return NextResponse.json(result)
}

async function generateEventAgenda(params: any) {
  const prompt = `Generate a detailed agenda for this event:
  
  Title: ${params.title}
  Category: ${params.category}
  Duration: ${params.duration}
  Description: ${params.description}
  
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
}
