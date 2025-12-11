import { createServerClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const communityQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(["created_at", "name", "member_count"]).optional().default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

const createCommunitySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.string().optional(),
  location: z.string().optional(),
  logo_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const parsed = communityQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid query parameters" } },
        { status: 400 }
      );
    }

    const { page = 1, pageSize = 10, search, category, sortBy = "created_at", sortOrder = "desc" } = parsed.data;
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let queryBuilder = supabase
      .from("communities")
      .select(`*, creator:creator_id(id, username, avatar_url), members:community_members(count)`, { count: "exact" })
      .or("status.is.null,status.eq.active");

    if (search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category) {
      queryBuilder = queryBuilder.eq("category", category);
    }

    if (sortBy === "member_count") {
      const { data: communities, count, error } = await queryBuilder.range(from, to);
      if (error) {
        return NextResponse.json({ success: false, error: { code: "DATABASE_ERROR", message: "Failed to fetch communities" } }, { status: 500 });
      }

      const sortedCommunities = communities?.sort((a, b) => {
        const countA = a.members?.length || 0;
        const countB = b.members?.length || 0;
        return sortOrder === "desc" ? countB - countA : countA - countB;
      });

      return NextResponse.json({
        success: true,
        data: sortedCommunities,
        meta: { page, pageSize, totalCount: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
      });
    } else {
      queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === "asc" });
      const { data: communities, count, error } = await queryBuilder.range(from, to);
      if (error) {
        return NextResponse.json({ success: false, error: { code: "DATABASE_ERROR", message: "Failed to fetch communities" } }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: communities,
        meta: { page, pageSize, totalCount: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
      });
    }
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createCommunitySchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid request data" } }, { status: 400 });
    }

    const { data: community, error: createError } = await supabase
      .from("communities")
      .insert({ ...parsed.data, creator_id: session.user.id })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ success: false, error: { code: "DATABASE_ERROR", message: "Failed to create community" } }, { status: 500 });
    }

    await supabase.from("community_members").insert({
      community_id: community.id,
      user_id: session.user.id,
      role: "admin",
      status: "approved",
    });

    return NextResponse.json({ success: true, data: community }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } }, { status: 500 });
  }
}
