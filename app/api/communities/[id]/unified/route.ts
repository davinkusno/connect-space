import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Unified Community Detail Endpoint
 * 
 * Consolidates multiple API calls into one:
 * - Community data
 * - Creator info
 * - User role & membership status
 * - Member count
 * - Initial tab data (discussions/members/events)
 * 
 * Reduces ~5-6 sequential API calls to 1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Fetch community with creator info in one query
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select(`
        *,
        creator:creator_id(
          id,
          email,
          full_name,
          avatar_url,
          username
        ),
        categories:category_id(
          id,
          name
        )
      `)
      .eq("id", id)
      .single();

    if (communityError || !community) {
      return NextResponse.json(
        { success: false, error: "Community not found" },
        { status: 404 }
      );
    }

    // 2. Get member count
    const { count: memberCount } = await supabase
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("community_id", id)
      .eq("status", "approved");

    // 3. Get user context (role, membership, permissions) if logged in
    let userContext = null;
    if (user) {
      const isCreator = community.creator_id === user.id;
      
      // Get user type for superadmin check
      const { data: userData } = await supabase
        .from("users")
        .select("user_type")
        .eq("id", user.id)
        .single();
      
      const isSuperAdmin = userData?.user_type === "super_admin";
      
      // Get membership status
      let membershipStatus = null;
      let userRole = null;
      let isMember = false;
      
      if (isCreator) {
        membershipStatus = "approved";
        userRole = "creator";
        isMember = true;
      } else if (!isSuperAdmin) {
        const { data: membership } = await supabase
          .from("community_members")
          .select("status, role")
          .eq("community_id", id)
          .eq("user_id", user.id)
          .single();
        
        if (membership) {
          membershipStatus = membership.status;
          userRole = membership.role;
          isMember = membership.status === "approved";
        }
      }
      
      userContext = {
        isCreator,
        isSuperAdmin,
        isMember,
        membershipStatus,
        userRole,
      };
    }

    // 4. Get initial tab data based on query param
    const searchParams = request.nextUrl.searchParams;
    const includeTab = searchParams.get("tab") || searchParams.get("includeTabData");
    
    let tabData = null;
    if (includeTab === "discussions") {
      // Fetch discussions with replies
      const { data: threads } = await supabase
        .from("messages")
        .select(`
          *,
          users:sender_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("community_id", id)
        .is("parent_id", null)
        .order("created_at", { ascending: false });
      
      // Get all replies for these threads
      if (threads && threads.length > 0) {
        const threadIds = threads.map(t => t.id);
        const { data: replies } = await supabase
          .from("messages")
          .select(`
            *,
            users:sender_id(
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .in("parent_id", threadIds)
          .order("created_at", { ascending: true });
        
        // Group replies by thread
        const repliesByThread: Record<string, any[]> = {};
        (replies || []).forEach(reply => {
          if (!repliesByThread[reply.parent_id]) {
            repliesByThread[reply.parent_id] = [];
          }
          repliesByThread[reply.parent_id].push(reply);
        });
        
        // Attach replies to threads
        const threadsWithReplies = threads.map(thread => ({
          ...thread,
          replies: repliesByThread[thread.id] || [],
        }));
        
        tabData = { discussions: threadsWithReplies };
      } else {
        tabData = { discussions: [] };
      }
    } else if (includeTab === "members") {
      // Fetch members
      const { data: members } = await supabase
        .from("community_members")
        .select(`
          *,
          user:user_id(
            id,
            email,
            full_name,
            avatar_url,
            username
          )
        `)
        .eq("community_id", id)
        .eq("status", "approved")
        .order("joined_at", { ascending: false });
      
      tabData = { members: members || [] };
    } else if (includeTab === "events") {
      // Fetch events
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("community_id", id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });
      
      tabData = { events: events || [] };
    }

    // 5. Build response
    const response = {
      success: true,
      data: {
        community: {
          ...community,
          member_count: memberCount || 0,
        },
        creator: community.creator,
        userContext,
        tabData,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Unified Community API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
