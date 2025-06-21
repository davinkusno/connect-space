import { type NextRequest, NextResponse } from "next/server"
import { aiClient } from "@/lib/ai-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, contentType, enhancementType, customPrompt, tone, context } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    let prompt = ""
    let systemPrompt = ""

    // Set up system prompt based on content type
    switch (contentType) {
      case "description":
        systemPrompt =
          "You are an expert content writer who specializes in creating engaging and compelling descriptions."
        break
      case "title":
        systemPrompt = "You are an expert copywriter who creates attention-grabbing, concise titles."
        break
      case "rules":
        systemPrompt =
          "You are an expert community manager who creates clear, fair, and effective community guidelines."
        break
      case "agenda":
        systemPrompt = "You are an expert event planner who creates well-structured, engaging event agendas."
        break
      case "requirements":
        systemPrompt = "You are an expert in creating clear, comprehensive requirement lists."
        break
      default:
        systemPrompt = "You are an expert content writer who improves text while maintaining the original intent."
    }

    // Build the main prompt based on enhancement type
    if (enhancementType === "custom" && customPrompt) {
      prompt = `${customPrompt}\n\nOriginal content:\n"${content}"`
    } else {
      const contextInfo = context
        ? `
Context:
${context.name ? `- Name/Title: ${context.name}` : ""}
${context.category ? `- Category: ${context.category}` : ""}
${context.type ? `- Type: ${context.type}` : ""}`
        : ""

      switch (enhancementType) {
        case "improve":
          prompt = `Improve this ${contentType} to make it more engaging and effective.${contextInfo}\n\nUse a ${tone} tone.\n\nOriginal content:\n"${content}"`
          break
        case "expand":
          prompt = `Expand this ${contentType} with more details and information while maintaining its core message.${contextInfo}\n\nUse a ${tone} tone.\n\nOriginal content:\n"${content}"`
          break
        case "simplify":
          prompt = `Make this ${contentType} more concise while preserving all important information.${contextInfo}\n\nUse a ${tone} tone.\n\nOriginal content:\n"${content}"`
          break
        case "professional":
          prompt = `Rewrite this ${contentType} to be more professional and polished while keeping the core message.${contextInfo}\n\nOriginal content:\n"${content}"`
          break
        case "friendly":
          prompt = `Rewrite this ${contentType} to be more friendly and approachable while keeping the core message.${contextInfo}\n\nOriginal content:\n"${content}"`
          break
        case "persuasive":
          prompt = `Rewrite this ${contentType} to be more persuasive and compelling while keeping the core message.${contextInfo}\n\nOriginal content:\n"${content}"`
          break
        default:
          prompt = `Improve this ${contentType} while maintaining its original intent.${contextInfo}\n\nUse a ${tone} tone.\n\nOriginal content:\n"${content}"`
      }
    }

    // Add specific instructions based on content type
    switch (contentType) {
      case "description":
        prompt += "\n\nFocus on making the description engaging, clear, and informative."
        break
      case "title":
        prompt += "\n\nEnsure the title is concise, attention-grabbing, and accurately represents the content."
        break
      case "rules":
        prompt += "\n\nEnsure rules are clear, fair, and enforceable."
        break
      case "agenda":
        prompt += "\n\nEnsure the agenda is well-structured, logical, and includes appropriate time allocations."
        break
      case "requirements":
        prompt += "\n\nEnsure requirements are clear, specific, and comprehensive."
        break
    }

    // Add final instruction to return only the enhanced content
    prompt += "\n\nReturn only the enhanced content without any explanations, introductions, or quotation marks."

    const enhancedContent = await aiClient.generateText(prompt, {
      systemPrompt,
    })

    return NextResponse.json({ enhancedContent })
  } catch (error) {
    console.error("Content enhancement error:", error)
    return NextResponse.json({ error: "Failed to enhance content" }, { status: 500 })
  }
}
