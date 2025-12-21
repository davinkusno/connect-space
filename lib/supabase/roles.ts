import { createServerClient } from "@/lib/supabase/server";

/**
 * Check if the current user is a superadmin
 * @returns Promise<boolean>
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single();

    return data?.user_type === "super_admin";
  } catch (error) {
    console.error("Error checking superadmin status:", error);
    return false;
  }
}

/**
 * Get user role for the current authenticated user
 * @returns Promise<'user' | 'super_admin' | null>
 */
export async function getUserRole(): Promise<"user" | "super_admin" | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single();

    return (data?.user_type as "user" | "super_admin") || "user";
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}



