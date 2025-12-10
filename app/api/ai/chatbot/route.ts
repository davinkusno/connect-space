import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/ai/chatbot
 * Chat with AI assistant
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, systemPrompt } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const result = await aiService.chat(messages, systemPrompt);

    return NextResponse.json(
      result.success
        ? { message: result.data }
        : { error: result.error?.message },
      { status: result.status }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
