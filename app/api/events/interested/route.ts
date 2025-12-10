import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/lib/services";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/events/interested
 * Get events the user is interested in (RSVP'd)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await eventService.getUserInterestedEvents(user.id);
    
    return NextResponse.json(
      result.success ? { events: result.data } : { error: result.error?.message },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
