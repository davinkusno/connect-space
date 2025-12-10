import { createServerClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const updateCommunitySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  logo_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const { data: community, error: fetchError } = await supabase
      .from("communities")
      .select(`*, creator:creator_id(id, username, avatar_url), members:community_members(count), events:events(count), is_member:community_members!inner(id)`)
      .eq("id", params.id)
      .eq(userId ? "community_members.user_id" : "id", userId || params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        const { data: privateComm, error: privateError } = await supabase
          .from("communities")
          .select(`*, creator:creator_id(id, username, avatar_url), members:community_members(count), events:events(count)`)
          .eq("id", params.id)
          .single();

        if (privateError) {
          return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Community not found" } }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: { ...privateComm, is_member: false } });
      }

      return NextResponse.json({ success: false, error: { code: "DATABASE_ERROR", message: "Failed to fetch community details" } }, { status: 500 });
    }

    const [memberCount, eventCount] = await Promise.all([
      supabase.from("community_members").select("id", { count: "exact" }).eq("community_id", params.id).then((res) => res.count || 0),
      supabase.from("events").select("id", { count: "exact" }).eq("community_id", params.id).then((res) => res.count || 0),
    ]);

    return NextResponse.json({
      success: true,
      data: { ...community, member_count: memberCount, event_count: eventCount, is_member: Boolean(community.is_member) },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateCommunitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid request data" } }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", params.id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "You don't have permission to update this community" } }, { status: 403 });
    }

    const { data: updatedCommunity, error: updateError } = await supabase
      .from("communities")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, error: { code: "DATABASE_ERROR", message: "Failed to update community" } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedCommunity });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("creator_id")
      .eq("id", params.id)
      .single();

    if (communityError) {
      if (communityError.code === "PGRST116") {
        return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Community not found" } }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: { code: "DATABASE_ERROR", message: "Failed to fetch community" } }, { status: 500 });
    }

    if (community.creator_id !== session.user.id) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Only the community creator can delete the community" } }, { status: 403 });
    }

    const { error: deleteError } = await supabase.from("communities").delete().eq("id", params.id);

    if (deleteError) {
      return NextResponse.json({ success: false, error: { code: "DATABASE_ERROR", message: "Failed to delete community" } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } }, { status: 500 });
  }
}
