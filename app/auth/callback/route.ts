import { createServerClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabase = await createServerClient();

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
        );
      }

      if (data.session) {
        console.log("Auth callback success:", data.user?.email);

        // Update user metadata for OAuth providers
        if (data.user && data.user.app_metadata.provider === "google") {
          const updateData = {
            full_name:
              data.user.user_metadata.full_name || data.user.user_metadata.name,
            avatar_url:
              data.user.user_metadata.avatar_url ||
              data.user.user_metadata.picture,
          };

          const { error: updateError } = await supabase.auth.updateUser({
            data: updateData,
          });

          if (updateError) {
            console.error("Error updating user metadata:", updateError);
          }
        }

        // Check user role and redirect accordingly
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("user_type")
          .eq("id", data.user.id)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
          // Default to homepage if we can't fetch user data
          return NextResponse.redirect(`${origin}/`);
        }

        // Check user status and determine effective role
        const { data: userStatus } = await supabase
          .from("users")
          .select("user_type, onboarding_completed, role_selected")
          .eq("id", data.user.id)
          .single();

        const userType = userStatus?.user_type;
        const onboardingCompleted = userStatus?.onboarding_completed;
        const roleSelected = userStatus?.role_selected;

        // Check if user is admin of any community (new way)
        const { data: adminCommunities } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .limit(1);

        const isAdminOfAnyCommunity = adminCommunities && adminCommunities.length > 0;

        // Determine effective role
        let effectiveRole = userType || "user";
        if (effectiveRole !== "super_admin" && isAdminOfAnyCommunity) {
          effectiveRole = "community_admin";
        }

        // Super admin always goes to superadmin
        if (effectiveRole === "super_admin") {
          return NextResponse.redirect(`${origin}/superadmin`);
        }

        // If user is admin of any community, check onboarding
        if (isAdminOfAnyCommunity) {
          // Check if they have completed community registration
          const { data: communities } = await supabase
            .from("communities")
            .select("id")
            .eq("creator_id", data.user.id)
            .limit(1);

          const hasCreatedCommunity = communities && communities.length > 0;
          
          if (!hasCreatedCommunity && !onboardingCompleted) {
            return NextResponse.redirect(`${origin}/create-community`);
          }
          
          return NextResponse.redirect(`${origin}/home`);
        }

        // Regular users: check onboarding
        if (!onboardingCompleted) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // Default to dashboard
        return NextResponse.redirect(`${origin}/`);
      }
    } catch (error) {
      console.error("Unexpected auth callback error:", error);
      return NextResponse.redirect(
        `${origin}/auth/login?error=unexpected_error`
      );
    }
  }

  // If no code or other issues, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`);
}
