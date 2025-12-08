import { type NextRequest, NextResponse } from "next/server";
import { aiClient } from "@/lib/ai-client";
import { createServerClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are ConnectSpace Assistant, a helpful chatbot for a community-finding platform.

Your role is to help users find communities and events through natural conversation.

Guidelines:
1. Be conversational and friendly
2. Ask clarifying questions when the user's request is vague
3. When recommending communities/events, explain WHY they might be a good fit
4. Focus on understanding what the user really wants (social connection, learning, hobbies, etc.)
5. If you can't help with something, politely explain you only help with finding communities and events

Keep responses concise but helpful.`;

// Fetch communities from database
async function fetchCommunities(limit: number = 10) {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from("communities")
      .select(`*, members:community_members(count)`)
      .or("status.is.null,status.eq.active")
      .limit(limit);
    
    if (error) {
      console.error("Error fetching communities:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchCommunities:", error);
    return [];
  }
}

// Fetch events from database
async function fetchEvents(limit: number = 10) {
  try {
    const supabase = await createServerClient();
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("events")
      .select(`*, community:community_id(id, name)`)
      .gte("start_time", now)
      .order("start_time", { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching events:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchEvents:", error);
    return [];
  }
}

// Format community data for AI context
function formatCommunitiesForAI(communities: any[]): string {
  if (communities.length === 0) return "No communities available.";
  
  return communities.map(c => {
    const memberCount = c.members?.[0]?.count || c.member_count || 0;
    return `- "${c.name}" (${memberCount} members, ${c.location || "Online"}): ${c.description?.substring(0, 200) || "No description"}`;
  }).join("\n");
}

// Format event data for AI context
function formatEventsForAI(events: any[]): string {
  if (events.length === 0) return "No upcoming events.";
  
  return events.map(e => {
    const date = new Date(e.start_time);
    const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    let location = "TBD";
    if (e.is_online) {
      location = "Online";
    } else if (e.location) {
      try {
        const loc = typeof e.location === "string" ? JSON.parse(e.location) : e.location;
        location = loc.venue || loc.city || loc.address || "TBD";
      } catch {
        location = e.location;
      }
    }
    return `- "${e.title}" on ${dateStr} at ${location} (Community: ${e.community?.name || "Unknown"}): ${e.description?.substring(0, 150) || "No description"}`;
  }).join("\n");
}

// Detect if user wants communities or events
function detectIntent(message: string): "community" | "event" | "general" {
  const lowerMessage = message.toLowerCase();
  
  const eventKeywords = ["event", "happening", "going on", "this week", "weekend", "today", "tomorrow", "meetup", "workshop", "attend"];
  const communityKeywords = ["community", "communities", "group", "join", "find", "looking for", "interested in", "recommend", "suggest"];
  
  const hasEventIntent = eventKeywords.some(k => lowerMessage.includes(k));
  const hasCommunityIntent = communityKeywords.some(k => lowerMessage.includes(k));
  
  if (hasEventIntent && !hasCommunityIntent) return "event";
  if (hasCommunityIntent) return "community";
  
  // Check for interest-based queries (likely community)
  const interestPatterns = /i (like|love|enjoy|want|need|am into|'m into)/i;
  if (interestPatterns.test(lowerMessage)) return "community";
  
  return "general";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const intent = detectIntent(message);
    
    // Build conversation context
    let conversationContext = "";
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      conversationContext = conversationHistory.slice(-6).map(
        (msg: { role: string; content: string }) => 
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      ).join("\n") + "\n";
    }

    // Fetch data based on intent
    let dataContext = "";
    
    if (intent === "community" || intent === "general") {
      const communities = await fetchCommunities(15);
      if (communities.length > 0) {
        dataContext += `\n\nAvailable communities on ConnectSpace:\n${formatCommunitiesForAI(communities)}`;
      }
    }
    
    if (intent === "event" || intent === "general") {
      const events = await fetchEvents(10);
      if (events.length > 0) {
        dataContext += `\n\nUpcoming events on ConnectSpace:\n${formatEventsForAI(events)}`;
      }
    }

    // Create the prompt for AI
    const userPrompt = `${conversationContext}User: ${message}

${dataContext ? `Here is the current data from ConnectSpace:${dataContext}` : ""}

Based on the user's message and the available data:
1. If they're looking for communities/events, recommend 2-3 SPECIFIC ones from the data above that match their interests. Explain WHY each one might be good for them.
2. If their request is vague, ask a clarifying question to better understand what they're looking for.
3. If they're asking a general question about the platform, answer helpfully.
4. If they're asking something unrelated to communities/events, politely redirect them.

Respond naturally and conversationally. Don't just list communities - explain your recommendations.`;

    const response = await aiClient.generateText(userPrompt, {
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 500,
    });

    // Determine suggested actions based on intent
    let suggestedActions: string[] = [];
    if (intent === "community") {
      suggestedActions = ["Show me events instead", "Tell me more about one"];
    } else if (intent === "event") {
      suggestedActions = ["Find communities instead", "What else is happening?"];
    } else {
      suggestedActions = ["Find communities for me", "Show upcoming events"];
    }

    return NextResponse.json({
      response: response || "I'm here to help you find communities and events! What are you interested in?",
      suggestedActions,
    });
  } catch (error: any) {
    console.error("Chatbot error:", error);
    
    return NextResponse.json({
      response: "I'd love to help you find the perfect community or event! Tell me a bit about your interests - what do you enjoy doing, or what kind of people would you like to meet?",
      suggestedActions: ["I like technology", "Show me social events"],
    });
  }
}
