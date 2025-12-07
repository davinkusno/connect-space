import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/superadmin/inactive-communities
 * Fetch all inactive/suspended communities for superadmin
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is super admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (userError || userData?.user_type !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      );
    }

    // Get all communities that are suspended or have been inactive for 30+ days
    // First, get all communities with their last activity
    const { data: communities, error: communitiesError } = await supabase
      .from("communities")
      .select(`
        id,
        name,
        description,
        category_id,
        categories(name),
        member_count,
        created_at,
        creator_id,
        status,
        last_activity_date,
        last_activity_type,
        suspended_at,
        suspension_reason
      `)
      .order("created_at", { ascending: false });

    if (communitiesError) {
      console.error("Error fetching communities:", communitiesError);
      return NextResponse.json(
        { error: "Failed to fetch communities" },
        { status: 500 }
      );
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Process each community to find inactive ones
    const inactiveCommunities = [];

    for (const community of communities || []) {
      // Get last event for this community
      let lastEvent = null;
      try {
        const { data } = await supabase
          .from("events")
          .select("created_at, title")
          .eq("community_id", community.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        lastEvent = data;
      } catch (error) {
        // Events table might not exist or have different structure
        console.log(`Error fetching events for community ${community.id}:`, error);
      }

      // Get last announcement/post for this community
      let lastPost = null;
      try {
        const { data } = await supabase
          .from("posts")
          .select("created_at, title")
          .eq("community_id", community.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        lastPost = data;
      } catch (error) {
        // Posts table might not exist or have different structure
        console.log(`Error fetching posts for community ${community.id}:`, error);
      }

      // Determine last activity
      let lastActivity: Date | null = null;
      let lastActivityType: "event" | "announcement" | null = null;
      let lastActivityTitle: string | null = null;

      if (lastEvent && lastPost) {
        const eventDate = new Date(lastEvent.created_at);
        const postDate = new Date(lastPost.created_at);
        if (eventDate > postDate) {
          lastActivity = eventDate;
          lastActivityType = "event";
          lastActivityTitle = lastEvent.title;
        } else {
          lastActivity = postDate;
          lastActivityType = "announcement";
          lastActivityTitle = lastPost.title;
        }
      } else if (lastEvent) {
        lastActivity = new Date(lastEvent.created_at);
        lastActivityType = "event";
        lastActivityTitle = lastEvent.title;
      } else if (lastPost) {
        lastActivity = new Date(lastPost.created_at);
        lastActivityType = "announcement";
        lastActivityTitle = lastPost.title;
      } else {
        // No activity at all, use created_at
        lastActivity = new Date(community.created_at);
      }

      // Calculate inactive days
      const inactiveDays = lastActivity
        ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((now.getTime() - new Date(community.created_at).getTime()) / (1000 * 60 * 60 * 24));

      // Include if suspended or inactive for 30+ days
      const communityStatus = (community as any).status;
      const isSuspended = communityStatus === "suspended" || communityStatus === "inactive";
      const isInactive = inactiveDays >= 30;

      if (isSuspended || isInactive) {
        // Get creator/admin details
        const { data: creator } = await supabase
          .from("users")
          .select("id, full_name, email, avatar_url")
          .eq("id", community.creator_id)
          .single();

        // Check for reactivation requests (if table exists)
        let reactivationRequest = null;
        try {
          const { data } = await supabase
            .from("community_reactivation_requests")
            .select("id, created_at, request_message, status")
            .eq("community_id", community.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          reactivationRequest = data;
        } catch (error) {
          // Table might not exist yet, ignore error
          console.log("Reactivation requests table not available");
        }

        inactiveCommunities.push({
          id: `inactive-${community.id}`,
          communityId: community.id,
          communityName: community.name,
          category: (community.categories as any)?.name || "General",
          memberCount: community.member_count || 0,
          lastActivity: lastActivity?.toISOString() || community.created_at,
          lastActivityType: lastActivityType || "event",
          inactiveDays,
          createdAt: community.created_at,
          status: isSuspended ? (communityStatus || "suspended") : "inactive",
          suspendedAt: (community as any).suspended_at || null,
          suspensionReason: (community as any).suspension_reason || null,
          reactivationRequested: !!reactivationRequest,
          requestedAt: reactivationRequest?.created_at || null,
          admin: {
            name: creator?.full_name || "Unknown",
            email: creator?.email || "",
          },
          lastEvent: lastEvent ? {
            title: lastEvent.title,
            date: lastEvent.created_at,
          } : null,
          lastAnnouncement: lastPost ? {
            title: lastPost.title,
            date: lastPost.created_at,
          } : null,
        });
      }
    }

    // Sort by inactive days (longest first)
    inactiveCommunities.sort((a, b) => b.inactiveDays - a.inactiveDays);

    return NextResponse.json({
      communities: inactiveCommunities,
      total: inactiveCommunities.length,
    });
  } catch (error) {
    console.error("Error in GET /api/superadmin/inactive-communities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

