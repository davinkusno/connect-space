import { type NextRequest, NextResponse } from "next/server"
import { contentModerationService } from "@/lib/ai-services/content-moderation"

export async function POST(request: NextRequest) {
  try {
    const { content, contentType, context } = await request.json()

    const result = await contentModerationService.moderateContent(content, {
      type: contentType,
      communityGuidelines: context?.communityGuidelines,
      userHistory: context?.userHistory,
      reportCount: context?.reportCount,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("Content moderation error:", error)
    return NextResponse.json({ error: "Failed to moderate content" }, { status: 500 })
  }
}
