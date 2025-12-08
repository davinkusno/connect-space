import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const eventId = id;

    // Check if already saved
    const { data: existingSave, error: fetchError } = await supabase
      .from("event_save")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingSave) {
      return NextResponse.json({ message: "Already saved" }, { status: 200 });
    }

    // Insert new save record
    const { data, error } = await supabase
      .from("event_save")
      .insert({
        event_id: eventId,
        user_id: user.id,
        saved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Event saved", data }, { status: 201 });
  } catch (error: any) {
    console.error("Error saving event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const eventId = id;

    // Delete save record
    const { error } = await supabase
      .from("event_save")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ message: "Event unsaved" }, { status: 200 });
  } catch (error: any) {
    console.error("Error unsaving event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unsave event" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isSaved: false }, { status: 200 });
    }

    const { id } = await params;
    const eventId = id;

    // Check if event is saved
    const { data, error } = await supabase
      .from("event_save")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ isSaved: !!data }, { status: 200 });
  } catch (error: any) {
    console.error("Error checking save status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check save status" },
      { status: 500 }
    );
  }
}


