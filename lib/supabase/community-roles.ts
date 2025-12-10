import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "./server";

/**
 * Check if a user is admin of any community (server-side)
 * Uses service role for reliable checks in API routes
 */
export async function isCommunityAdmin(userId: string): Promise<boolean> {
  // Use service role client for API routes to bypass RLS if needed
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data, error } = await supabase
    .from("community_members")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error checking community admin status:", error);
    return false;
  }

  return !!data;
}

/**
 * Check if a user is admin of a specific community (server-side)
 */
export async function isAdminOfCommunity(
  userId: string,
  communityId: string
): Promise<boolean> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from("community_members")
    .select("id")
    .eq("user_id", userId)
    .eq("community_id", communityId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("Error checking community admin status:", error);
    return false;
  }

  return !!data;
}

/**
 * Check if a user is creator or admin of a specific community
 * @param useServiceClient - If true, uses service role client (for middleware/API routes)
 */
export async function isCreatorOrAdminOfCommunity(
  userId: string,
  communityId: string,
  useServiceClient: boolean = false
): Promise<boolean> {
  let supabase;
  
  if (useServiceClient) {
    // Use service role client for middleware to bypass RLS
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  } else {
    supabase = await createServerClient();
  }
  
  // Check if user is creator
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("creator_id")
    .eq("id", communityId)
    .single();

  if (communityError) {
    console.error("Error checking community creator:", communityError);
    return false;
  }

  if (community?.creator_id === userId) {
    return true;
  }

  // Check if user is admin
  if (useServiceClient) {
    // Use service client for admin check too
    const { data: membership, error: membershipError } = await supabase
      .from("community_members")
      .select("id")
      .eq("user_id", userId)
      .eq("community_id", communityId)
      .eq("role", "admin")
      .maybeSingle();

    if (membershipError) {
      console.error("Error checking community admin status:", membershipError);
      return false;
    }

    return !!membership;
  } else {
    return isAdminOfCommunity(userId, communityId);
  }
}

/**
 * Get all communities where user is admin
 */
export async function getUserAdminCommunities(userId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from("community_members")
    .select(`
      community_id,
      communities (
        id,
        name,
        description,
        logo_url,
        banner_url,
        created_at
      )
    `)
    .eq("user_id", userId)
    .eq("role", "admin")
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin communities:", error);
    return [];
  }

  return data?.map((item: any) => ({
    id: item.community_id,
    ...item.communities,
  })) || [];
}

/**
 * Get all communities where user is a member (any role)
 */
export async function getUserCommunities(userId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from("community_members")
    .select(`
      community_id,
      role,
      joined_at,
      communities (
        id,
        name,
        description,
        logo_url,
        banner_url,
        created_at
      )
    `)
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Error fetching user communities:", error);
    return [];
  }

  return data?.map((item: any) => ({
    id: item.community_id,
    role: item.role,
    joinedAt: item.joined_at,
    ...item.communities,
  })) || [];
}

/**
 * Get user's role in a specific community
 */
export async function getUserCommunityRole(
  userId: string,
  communityId: string
): Promise<"admin" | "moderator" | "member" | null> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from("community_members")
    .select("role")
    .eq("user_id", userId)
    .eq("community_id", communityId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.role as "admin" | "moderator" | "member";
}

/**
 * Client-side version: Check if current user is admin of any community
 */
export async function isCommunityAdminClient(): Promise<boolean> {
  const { getSupabaseBrowser, getClientSession } = await import("./client");
  const supabase = getSupabaseBrowser();
  const session = await getClientSession();
  
  if (!session?.user) {
    return false;
  }
  
  const { data, error } = await supabase
    .from("community_members")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error checking community admin status:", error);
    return false;
  }

  return !!data;
}

/**
 * Client-side version: Get all communities where current user is admin
 */
export async function getUserAdminCommunitiesClient() {
  const { getSupabaseBrowser, getClientSession } = await import("./client");
  const supabase = getSupabaseBrowser();
  const session = await getClientSession();
  
  if (!session?.user) {
    return [];
  }
  
  const { data, error } = await supabase
    .from("community_members")
    .select(`
      community_id,
      communities (
        id,
        name,
        description,
        logo_url,
        banner_url,
        created_at
      )
    `)
    .eq("user_id", session.user.id)
    .eq("role", "admin")
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin communities:", error);
    return [];
  }

  return data?.map((item: any) => ({
    id: item.community_id,
    ...item.communities,
  })) || [];
}

