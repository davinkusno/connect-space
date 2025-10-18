import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const eventId = params.id;

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status = "going" } = body;

    // Validate status
    if (!["going", "maybe", "not_going"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if event exists and is not cancelled
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`
        *,
        communities!inner(
          id,
          is_private,
          community_members!inner(
            user_id
          )
        )
      `)
      .eq("id", eventId)
      .eq("is_cancelled", false)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user can access this event (public communities or if user is a member)
    if (event.communities.is_private) {
      const isMember = event.communities.community_members?.some(
        (member: any) => member.user_id === user.id
      );

      if (!isMember) {
        return NextResponse.json({ error: "You must be a member of this community to attend events" }, { status: 403 });
      }
    }

    // Check if event has capacity
    if (event.max_attendees && status === "going") {
      const { data: currentAttendees } = await supabase
        .from("event_attendees")
        .select("id")
        .eq("event_id", eventId)
        .eq("status", "going");

      if (currentAttendees && currentAttendees.length >= event.max_attendees) {
        return NextResponse.json({ error: "Event is at full capacity" }, { status: 400 });
      }
    }

    // Upsert attendance record
    const { data: attendance, error: attendanceError } = await supabase
      .from("event_attendees")
      .upsert({
        event_id: eventId,
        user_id: user.id,
        status,
        registered_at: new Date().toISOString(),
      }, {
        onConflict: "event_id,user_id"
      })
      .select()
      .single();

    if (attendanceError) {
      console.error("Error creating/updating attendance:", attendanceError);
      return NextResponse.json({ error: "Failed to register attendance" }, { status: 500 });
    }

    return NextResponse.json({ 
      attendance,
      message: `Successfully ${status === "going" ? "registered for" : status === "maybe" ? "marked as maybe for" : "marked as not going to"} the event`
    });

  } catch (error) {
    console.error("Error in attend event API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const eventId = params.id;

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove attendance record
    const { error: deleteError } = await supabase
      .from("event_attendees")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error removing attendance:", deleteError);
      return NextResponse.json({ error: "Failed to remove attendance" }, { status: 500 });
    }

    return NextResponse.json({ message: "Successfully removed attendance" });

  } catch (error) {
    console.error("Error in remove attendance API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
